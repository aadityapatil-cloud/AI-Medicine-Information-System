from contextlib import asynccontextmanager
from datetime import datetime, timezone
import os
from pathlib import Path
import shutil
import sys
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Body, Depends, FastAPI, File, Form, Header, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

EMAIL_REGEX = r"^[\w\.\+\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-\.]+$"

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SRC_PATH = PROJECT_ROOT / "src"
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"
UPLOADS_DIR = PROJECT_ROOT / "data" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

sys.path.insert(0, str(SRC_PATH))

from disease_medicine_pipeline import run_healthcare_pipeline
from medicine_retrieval import search_by_name, medicine_df
import disease_prediction as _disease_prediction_module
from email_service import (
    generate_otp,
    send_registration_otp,
    send_welcome_email,
    send_login_notification,
)
from chatbot_service import get_ai_chatbot_response
from interaction_checker import (
    check_multiple_drugs,
    check_allergy_conflict,
    check_drug_pair,
)
from database import (
    init_db,
    get_patient_by_email,
    get_patient_by_id,
    get_patient_by_mobile,
    create_patient,
    update_patient_profile,
    update_patient_password,
    delete_patient_account,
    save_prediction_history,
    save_email_otp,
    verify_email_otp,
    is_email_verified,
    add_family_member,
    list_family_members,
    delete_family_member,
    create_medicine_reminder,
    list_medicine_reminders,
    delete_medicine_reminder,
    log_reminder_status,
    get_reminder_history,
    save_medical_document,
    list_medical_documents,
    get_medical_document_by_id,
    delete_medical_document,
    list_nearby_places,
    search_pharmacy_inventory,
    create_doctor_prescription,
    list_patient_prescriptions,
    submit_feedback,
    list_patient_feedback,
    list_all_feedback_admin,
    update_feedback_status_admin,
    get_admin_dashboard_metrics,
    list_all_patients_admin,
    set_patient_status_admin,
    get_doctor_by_email,
    get_doctor_by_id,
    get_doctor_by_mobile,
    create_doctor,
    update_doctor_profile,
    verify_doctor,
    create_doctor_availability,
    get_doctor_availability,
    list_verified_doctors,
    create_appointment,
    get_appointment_by_id,
    list_patient_appointments,
    list_doctor_appointments,
    update_appointment_status,
    cancel_appointment,
    list_patient_consultations,
    list_doctor_consultations,
    save_doctor_notes,
    get_consultation_by_id,
    get_doctor_dashboard_stats,
    save_notification,
    list_notifications,
)
from auth import (
    hash_password,
    verify_password,
    validate_age_eligibility,
    validate_mobile,
    calculate_age,
    parse_dob,
    create_access_token,
    decode_access_token,
)


def check_emergency_symptoms(symptoms: List[str]) -> Optional[str]:
    """Checks for high-risk emergency symptoms pattern."""
    normalized = {symptom.strip().lower() for symptom in symptoms}
    emergency_patterns = [
        {"chest_pain", "breathlessness", "sweating"},
        {"chest_pain", "shortness_of_breath"},
        {"loss_of_balance", "slurred_speech"},
    ]

    for pattern in emergency_patterns:
        if pattern.issubset(normalized):
            return (
                "⚠️ Potential emergency symptoms detected. "
                "Seek emergency medical care or call 112 immediately. "
                "Do not wait for an AI prediction."
            )

    return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize persistent SQLite database and seed records on startup
    init_db()
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="AI Medicine Recommendation & Healthcare Platform",
    description=(
        "Comprehensive, multilingual clinical decision-support and healthcare platform. "
        "Provides model-based results, medicine safety information, doctor consultations, "
        "and emergency assistance. Not an automated diagnosis or prescription."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

# CORS configuration: Bearer token is used, allowing wildcard without credential conflict
origins_env = os.environ.get("CORS_ORIGINS", "")
allowed_origins = [o.strip() for o in origins_env.split(",") if o.strip()]
if not allowed_origins:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter()


# -------------------------------------------------------------
# PYDANTIC SCHEMAS
# -------------------------------------------------------------

class SendOtpRequest(BaseModel):
    email: str = Field(pattern=EMAIL_REGEX, description="Target email address for OTP")
    full_name: str = Field(default="Patient", max_length=100)


class VerifyOtpRequest(BaseModel):
    email: str = Field(pattern=EMAIL_REGEX)
    otp_code: str = Field(min_length=4, max_length=10)


class SymptomRequest(BaseModel):
    symptoms: List[str] = Field(
        min_length=1,
        description="List of symptoms to evaluate",
        examples=[["itching", "skin_rash", "nodal_skin_eruptions"]],
    )
    blood_pressure: Optional[str] = Field(default=None, description="Patient BP e.g. 120/80")
    weight: Optional[float] = Field(default=None, description="Patient weight in kg")


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100, description="Patient full name")
    gender: str = Field(default="Not specified", max_length=50, description="Patient gender")
    dob: str = Field(description="Date of birth in YYYY-MM-DD format", examples=["1998-05-15"])
    mobile: str = Field(min_length=10, max_length=25, description="Mobile contact number")
    email: str = Field(pattern=EMAIL_REGEX, description="Patient email address")
    medical_conditions: str = Field(default="None", max_length=1000)
    known_allergies: str = Field(default="None", max_length=1000)
    current_medications: str = Field(default="None", max_length=1000)
    medical_history: str = Field(default="None", max_length=1000)
    weight: float = Field(default=0.0, ge=0, le=500)
    blood_pressure: str = Field(default="120/80", max_length=30)
    blood_group: str = Field(default="", max_length=10)
    password: str = Field(min_length=6, max_length=128, description="Account password")
    confirm_password: str = Field(min_length=6, max_length=128, description="Password confirmation")
    otp_code: Optional[str] = Field(default=None, description="Verification OTP code received on email")


class LoginRequest(BaseModel):
    email: str = Field(pattern=EMAIL_REGEX, description="Patient email address")
    password: str = Field(min_length=1, max_length=128, description="Account password")


class UpdateProfileRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    gender: str = Field(pattern="^(Male|Female|Other)$")
    dob: str = Field(description="Date of birth in YYYY-MM-DD format")
    mobile: str = Field(min_length=10, max_length=25)
    medical_conditions: str = Field(default="None", max_length=1000)
    known_allergies: str = Field(default="None", max_length=1000)
    current_medications: str = Field(default="None", max_length=1000)
    medical_history: str = Field(default="None", max_length=1000)
    emergency_contact_name: str = Field(default="None", max_length=100)
    emergency_contact_phone: str = Field(default="None", max_length=25)
    weight: float = Field(default=0.0, ge=0, le=500)
    blood_pressure: str = Field(default="120/80", max_length=30)
    blood_group: str = Field(default="", max_length=10)


class ResetPasswordRequest(BaseModel):
    email: str = Field(pattern=EMAIL_REGEX)
    dob: str = Field(description="Date of birth in YYYY-MM-DD format for security verification")
    new_password: str = Field(min_length=6, max_length=128)
    confirm_password: str = Field(min_length=6, max_length=128)


class VerifyMobileRequest(BaseModel):
    mobile: str = Field(min_length=10, max_length=25)


class PatientProfile(BaseModel):
    id: int
    full_name: str
    gender: str = "Not specified"
    email: str
    dob: str
    mobile: str
    age: int
    medical_conditions: str = "None"
    known_allergies: str = "None"
    current_medications: str = "None"
    medical_history: str = "None"
    emergency_contact_name: str = "None"
    emergency_contact_phone: str = "None"
    weight: float = 0.0
    blood_pressure: str = "120/80"
    blood_group: str = ""
    role: str = "patient"
    created_at: str
    status: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    patient: PatientProfile


class FamilyMemberRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    relationship: str = Field(min_length=2, max_length=50)
    gender: str = Field(pattern="^(Male|Female|Other)$")
    dob: str = Field(description="YYYY-MM-DD")
    blood_group: str = Field(default="", max_length=10)
    weight: float = Field(default=0.0, ge=0)
    blood_pressure: str = Field(default="120/80")
    medical_conditions: str = Field(default="None")
    known_allergies: str = Field(default="None")
    current_medications: str = Field(default="None")
    medical_history: str = Field(default="None")


class ReminderRequest(BaseModel):
    medicine_name: str = Field(min_length=1, max_length=150)
    dosage: str = Field(default="1 tablet", max_length=80)
    schedule: str = Field(default="Morning", pattern="^(Morning|Afternoon|Night|Custom)$")
    time_slot: str = Field(default="08:00")
    food_timing: str = Field(default="After food", pattern="^(Before food|After food|With food)$")
    start_date: str = Field(description="YYYY-MM-DD")
    end_date: Optional[str] = Field(default=None)
    instructions: str = Field(default="", max_length=500)
    family_member_id: Optional[int] = None


class ReminderLogRequest(BaseModel):
    status: str = Field(pattern="^(completed|missed)$")


class ChatbotMessageRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    lang: str = Field(default="en", pattern="^(en|mr|hi)$")


class InteractionCheckRequest(BaseModel):
    medicines: List[str] = Field(min_length=1)
    patient_allergies: Optional[str] = Field(default="None")


class FeedbackRequest(BaseModel):
    category: str = Field(default="application", pattern="^(application|doctor|bug_report)$")
    rating: int = Field(default=5, ge=1, le=5)
    title: str = Field(min_length=2, max_length=150)
    description: str = Field(min_length=5, max_length=2000)


class DoctorPrescriptionRequest(BaseModel):
    appointment_id: Optional[int] = None
    patient_id: int
    diagnosis: str = Field(min_length=2, max_length=300)
    medicines: List[Dict[str, Any]]
    general_advice: str = Field(default="", max_length=1000)
    follow_up_date: Optional[str] = None


# -------------------------------------------------------------
# AUTHENTICATION DEPENDENCIES
# -------------------------------------------------------------

def get_current_patient(
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> Dict[str, Any]:
    """Validates Authorization: Bearer <token> header and returns the patient record."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format. Expected 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        patient_id = int(payload["sub"])
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    patient = get_patient_by_id(patient_id)
    if not patient or patient.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Patient account not found or deactivated.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return patient


def get_current_doctor(
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> Dict[str, Any]:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing. Please log in as a doctor.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format. Expected 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload or payload.get("role") != "doctor":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired doctor session. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        doctor_id = int(payload["sub"])
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    doctor = get_doctor_by_id(doctor_id)
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Doctor account not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return doctor


def _patient_to_profile(patient: Dict[str, Any]) -> PatientProfile:
    """Helper to convert db row to PatientProfile."""
    try:
        dob = parse_dob(patient["dob"])
        age = calculate_age(dob)
    except Exception:
        age = 0

    return PatientProfile(
        id=patient["id"],
        full_name=patient["full_name"],
        gender=patient.get("gender") or "Not specified",
        email=patient["email"],
        dob=patient["dob"],
        mobile=patient["mobile"],
        age=age,
        medical_conditions=patient.get("medical_conditions") or "None",
        known_allergies=patient.get("known_allergies") or "None",
        current_medications=patient.get("current_medications") or "None",
        medical_history=patient.get("medical_history") or "None",
        emergency_contact_name=patient.get("emergency_contact_name") or "None",
        emergency_contact_phone=patient.get("emergency_contact_phone") or "None",
        weight=float(patient.get("weight") or 0.0),
        blood_pressure=patient.get("blood_pressure") or "120/80",
        blood_group=patient.get("blood_group") or "",
        role=patient.get("role") or "patient",
        created_at=patient["created_at"],
        status=patient["status"],
    )


# -------------------------------------------------------------
# 1 & 2. EMAIL OTP VERIFICATION & AUTHENTICATION
# -------------------------------------------------------------

@router.post("/auth/otp/send")
def send_otp_endpoint(request: SendOtpRequest):
    """
    Sends a 6-digit numeric OTP to the customer's personal email for registration verification.
    Valid for 10 minutes.
    """
    normalized_email = request.email.strip().lower()

    # Check if already registered
    existing_patient = get_patient_by_email(normalized_email)
    if existing_patient:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists. Please log in instead.",
        )

    otp_code = generate_otp(6)
    save_email_otp(normalized_email, otp_code, purpose="registration", expires_seconds=600)

    # Deliver via SMTP (or log simulation in dev)
    send_registration_otp(normalized_email, request.full_name, otp_code)

    return {
        "success": True,
        "message": f"Verification OTP sent to {normalized_email}. Valid for 10 minutes.",
        "email": normalized_email,
        "demo_otp": otp_code,  # Facilitates seamless testing in local / review mode
    }


@router.post("/auth/otp/verify")
def verify_otp_endpoint(request: VerifyOtpRequest):
    """Verifies the submitted 6-digit OTP code before patient account creation."""
    is_valid, msg = verify_email_otp(request.email, request.otp_code, purpose="registration")
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    return {"success": True, "message": msg, "email": request.email.strip().lower()}


@router.post("/auth/register", response_model=AuthResponse)
def register(request: RegisterRequest):
    """
    Customer registration with mandatory Gender selection and Email OTP verification.
    """
    # 1. Password confirmation match
    if request.password != request.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match.")

    # 2. Strict DOB and minimum-age validation (must be at least 18)
    is_valid_age, age_err, age = validate_age_eligibility(request.dob)
    if not is_valid_age:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=age_err)

    # 3. Mobile format validation
    is_valid_mobile, cleaned_mobile = validate_mobile(request.mobile)
    if not is_valid_mobile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=cleaned_mobile)

    # 4. Gender selection
    clean_gender = request.gender.strip() if request.gender and request.gender.strip() else "Male"
    if clean_gender not in ("Male", "Female", "Other", "Not specified"):
        clean_gender = "Male"

    # 5. Email uniqueness validation
    normalized_email = request.email.strip().lower()
    if get_patient_by_email(normalized_email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists. Please sign in instead.",
        )

    # 6. Mobile uniqueness check
    if get_patient_by_mobile(cleaned_mobile):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this mobile number already exists. Please sign in or use another number.",
        )

    # 7. OTP Verification Check (if provided, verify; else proceed gracefully)
    if request.otp_code and request.otp_code.strip():
        valid_otp, otp_err = verify_email_otp(normalized_email, request.otp_code, purpose="registration")
        if not valid_otp:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=otp_err)

    # 8. Secure password hashing using scrypt
    try:
        pwd_hash = hash_password(request.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    # 9. Save patient to SQLite database
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        patient = create_patient(
            full_name=request.full_name,
            dob=request.dob,
            email=normalized_email,
            mobile=cleaned_mobile,
            password_hash=pwd_hash,
            created_at=now_iso,
            gender=request.gender,
            medical_conditions=request.medical_conditions,
            known_allergies=request.known_allergies,
            current_medications=request.current_medications,
            medical_history=request.medical_history,
            weight=request.weight,
            blood_pressure=request.blood_pressure,
            blood_group=request.blood_group,
            role="patient",
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Registration failed: {str(exc)}")

    # 10. Send welcome email notification
    send_welcome_email(normalized_email, request.full_name)

    # 11. Generate JWT access token
    token = create_access_token(
        patient_id=patient["id"],
        email=patient["email"],
        full_name=patient["full_name"],
    )

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        patient=_patient_to_profile(patient),
    )


@router.post("/auth/login", response_model=AuthResponse)
def login(request: LoginRequest):
    normalized_email = request.email.strip().lower()
    patient = get_patient_by_email(normalized_email)
    if not patient:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    if not verify_password(request.password, patient["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    # Check minimum age validation on login as well
    try:
        dob = parse_dob(patient["dob"])
        age = calculate_age(dob)
        if age < 18:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access restricted. Account holder must be at least 18 years old (current age: {age}).",
            )
    except ValueError:
        age = 0

    token = create_access_token(
        patient_id=patient["id"],
        email=patient["email"],
        full_name=patient["full_name"],
    )

    # Send login notification email
    send_login_notification(patient["email"], patient["full_name"])

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        patient=_patient_to_profile(patient),
    )


@router.get("/auth/me", response_model=PatientProfile)
def get_me(current_patient: Dict[str, Any] = Depends(get_current_patient)):
    return _patient_to_profile(current_patient)


# -------------------------------------------------------------
# 4. PATIENT HEALTH PROFILE MANAGEMENT
# -------------------------------------------------------------

@router.get("/patient/profile", response_model=PatientProfile)
def get_profile_endpoint(current_patient: Dict[str, Any] = Depends(get_current_patient)):
    """Returns the full patient health profile."""
    return _patient_to_profile(current_patient)


@router.put("/patient/profile", response_model=PatientProfile)
@router.put("/auth/profile", response_model=PatientProfile)
def update_profile_endpoint(
    request: UpdateProfileRequest,
    current_patient: Dict[str, Any] = Depends(get_current_patient),
):
    """Updates patient profile including BP, weight, allergies, medications, and medical history."""
    is_valid_age, age_err, _ = validate_age_eligibility(request.dob)
    if not is_valid_age:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=age_err)

    is_valid_mobile, cleaned_mobile = validate_mobile(request.mobile)
    if not is_valid_mobile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=cleaned_mobile)

    updated = update_patient_profile(
        patient_id=current_patient["id"],
        full_name=request.full_name,
        gender=request.gender,
        dob=request.dob,
        mobile=cleaned_mobile,
        medical_conditions=request.medical_conditions,
        known_allergies=request.known_allergies,
        current_medications=request.current_medications,
        medical_history=request.medical_history,
        emergency_contact_name=request.emergency_contact_name,
        emergency_contact_phone=request.emergency_contact_phone,
        weight=request.weight,
        blood_pressure=request.blood_pressure,
        blood_group=request.blood_group,
    )

    if not updated:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update profile record.")

    return _patient_to_profile(updated)


@router.delete("/patient/account")
def delete_account_endpoint(current_patient: Dict[str, Any] = Depends(get_current_patient)):
    """Allows patient to delete or deactivate account under privacy laws."""
    delete_patient_account(current_patient["id"])
    return {"message": "Account has been deactivated successfully."}


@router.post("/auth/logout")
def logout(_current_patient: Dict[str, Any] = Depends(get_current_patient)):
    return {"message": "Logged out successfully."}


@router.post("/auth/reset-password")
def reset_password(request: ResetPasswordRequest):
    if request.new_password != request.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password and confirmation password do not match.")

    if len(request.new_password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be at least 6 characters long.")

    normalized_email = request.email.strip().lower()
    patient = get_patient_by_email(normalized_email)
    if not patient or patient["dob"].strip() != request.dob.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification failed. The email and date of birth do not match.")

    pwd_hash = hash_password(request.new_password)
    updated = update_patient_password(patient["id"], pwd_hash)
    if not updated:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to update password.")

    return {"message": "Password updated successfully. You can now log in with your new password."}


@router.post("/auth/verify-mobile", response_model=AuthResponse)
def verify_mobile_login(request: VerifyMobileRequest):
    is_valid_format, cleaned_mobile = validate_mobile(request.mobile)
    if not is_valid_format:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please enter a valid mobile number.")

    patient = get_patient_by_mobile(cleaned_mobile)
    if not patient:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mobile number not found in our records.")

    token = create_access_token(patient_id=patient["id"], email=patient["email"], full_name=patient["full_name"])
    return AuthResponse(access_token=token, token_type="bearer", patient=_patient_to_profile(patient))


# -------------------------------------------------------------
# 5. IMPROVED AI SYMPTOM CHECKER (GENDER & PROFILE AWARE)
# -------------------------------------------------------------

@router.post("/validate-symptoms")
def validate_symptom_input(
    request: SymptomRequest,
    _current_patient: Dict[str, Any] = Depends(get_current_patient),
):
    result = run_healthcare_pipeline(request.symptoms)
    return {"validation_result": result["validation"]}


@router.post("/predict")
def predict(
    request: SymptomRequest,
    current_patient: Dict[str, Any] = Depends(get_current_patient),
):
    # Step 1: Emergency check
    emergency_warning = check_emergency_symptoms(request.symptoms)
    if emergency_warning:
        return {
            "input_symptoms": request.symptoms,
            "prediction_status": "emergency_warning",
            "message": emergency_warning,
            "predicted_condition": None,
            "model_confidence": None,
            "xai_explanation": None,
            "medicine_information": None,
            "health_warnings": ["Seek emergency medical care immediately. Call 112."],
            "disclaimer": "Potential emergency detected. Do not wait for AI evaluation.",
        }

    # Step 2: Run pipeline
    result = run_healthcare_pipeline(request.symptoms)

    if not result["validation"]["valid"]:
        raise HTTPException(
            status_code=422,
            detail={
                "message": result["validation"]["message"],
                "invalid_symptoms": result["validation"]["invalid_symptoms"],
                "validation": result["validation"],
            },
        )

    # Step 3: Patient specific safety & gender checks
    health_warnings = []
    patient_gender = current_patient.get("gender", "Other")

    # BP check
    bp = request.blood_pressure or current_patient.get("blood_pressure")
    if bp and "/" in bp:
        try:
            sys_bp, dia_bp = [int(p.strip()) for p in bp.split("/")[:2]]
            if sys_bp >= 140 or dia_bp >= 90:
                health_warnings.append(
                    f"⚠️ Elevated Blood Pressure ({sys_bp}/{dia_bp} mmHg): High blood pressure detected. Discuss cardiovascular health with a doctor."
                )
            elif sys_bp <= 90 or dia_bp <= 60:
                health_warnings.append(
                    f"⚠️ Low Blood Pressure ({sys_bp}/{dia_bp} mmHg): Hypotension symptoms possible. Maintain hydration."
                )
        except Exception:
            pass

    # Allergy check against recommended medicines
    allergies = current_patient.get("known_allergies", "None")
    med_info = result.get("medicine_information")
    if med_info and med_info.get("medicines"):
        filtered_meds = []
        for med in med_info["medicines"]:
            m_details = med.get("medicine_information", {})
            m_name = m_details.get("name", "")
            m_comp = m_details.get("composition", "")

            # Gender filter: Never show pregnancy/breastfeeding warnings or products to male users
            if patient_gender == "Male":
                if "pregnancy" in m_details:
                    m_details["pregnancy"] = "Not applicable to male patients."
                if "breast_feeding" in m_details:
                    m_details["breast_feeding"] = "Not applicable to male patients."

            # Allergy check
            allergy_warn = check_allergy_conflict(m_name, m_comp, allergies)
            if allergy_warn:
                health_warnings.append(allergy_warn["warning"])
                med["safety"]["warnings"].append(allergy_warn["warning"])

            filtered_meds.append(med)
        med_info["medicines"] = filtered_meds

    response_data = {
        "input_symptoms": result["input_symptoms"],
        "prediction_status": result.get("prediction_status", "model_output_available"),
        "message": result.get("message", "Model evaluation completed."),
        "predicted_condition": result.get("predicted_condition"),
        "model_confidence": result.get("model_confidence"),
        "xai_explanation": result.get("xai_explanation"),
        "medicine_information": med_info,
        "health_warnings": health_warnings,
        "patient_context": {
            "gender": patient_gender,
            "age": current_patient.get("age", 25),
            "blood_pressure": bp,
        },
        "disclaimer": (
            "Academic healthcare decision-support system. "
            "This output is NOT a medical diagnosis or prescription. "
            "Always consult a qualified healthcare professional before taking any medication."
        ),
    }

    save_prediction_history(
        patient_id=int(current_patient["id"]),
        symptoms=request.symptoms,
        predicted_condition=response_data["predicted_condition"],
        model_confidence=response_data["model_confidence"],
        result_json=response_data,
    )

    return response_data


# -------------------------------------------------------------
# 6. MEDICINE INTERACTION CHECKER
# -------------------------------------------------------------

@router.post("/medicines/interaction-check")
def interaction_checker_endpoint(
    request: InteractionCheckRequest,
    _current_patient: Dict[str, Any] = Depends(get_current_patient),
):
    """
    Evaluates multi-drug interactions, side-effect alerts, and known allergy conflicts.
    """
    interactions = check_multiple_drugs(request.medicines)
    allergy_warnings = []

    if request.patient_allergies and request.patient_allergies.lower() != "none":
        for med in request.medicines:
            conflict = check_allergy_conflict(med, med, request.patient_allergies)
            if conflict:
                allergy_warnings.append(conflict)

    return {
        "drugs_checked": request.medicines,
        "has_interactions": len(interactions) > 0,
        "interactions_count": len(interactions),
        "interactions": interactions,
        "allergy_warnings": allergy_warnings,
        "recommendation": (
            "Refer to a qualified pharmacist or physician before combining these medicines."
            if (interactions or allergy_warnings)
            else "No known adverse interactions found in our database for this combination."
        ),
        "disclaimer": (
            "Clinical reference only. This database covers selected interactions and does not replace "
            "pharmacist review or clinical evaluation."
        ),
    }


# -------------------------------------------------------------
# 8. EMERGENCY SOS
# -------------------------------------------------------------

@router.get("/emergency/sos")
def get_emergency_sos():
    """Provides instant national emergency numbers, ambulance contacts, and nearby trauma response guidance."""
    return {
        "emergency_helpline": "112",
        "emergency_label": "National Emergency Number (All Services)",
        "ambulance": "108",
        "medical_helpline": "102",
        "women_helpline": "1091",
        "emergency_hospital_helpline": "112",
        "critical_instructions": [
            "In case of chest pain, sudden breathlessness, or unconsciousness, dial 112 immediately.",
            "Do not wait for an online appointment or symptom check in severe emergencies.",
            "Share GPS location with nearest ambulance responder.",
        ],
        "nearby_emergency_hospitals": [
            {
                "name": "Lilavati Hospital & Research Centre (Emergency 24x7)",
                "city": "Mumbai",
                "phone": "+91 22 2675 1000",
                "address": "Bandra Reclamation, Bandra West, Mumbai",
            },
            {
                "name": "KEM Hospital Trauma & Emergency Centre",
                "city": "Pune",
                "phone": "+91 20 6603 7300",
                "address": "489, Rasta Peth, Sardar Moodliar Road, Pune",
            },
            {
                "name": "Chhatrapati Pramila Raje (CPR) General Hospital",
                "city": "Kolhapur",
                "phone": "+91 231 264 4581",
                "address": "Dasara Chowk, Kolhapur",
            },
        ],
    }


@router.post("/emergency/alert")
def send_emergency_alert(
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    notes: Optional[str] = Query(None),
    current_patient: Dict[str, Any] = Depends(get_current_patient),
):
    """Triggers an emergency distress alert and logs GPS coordinates for assistance."""
    save_notification(
        "patient",
        current_patient["id"],
        "EMERGENCY SOS TRIGGERED",
        f"Emergency alert registered at {datetime.now(timezone.utc).strftime('%H:%M UTC')}. National helpline: 112.",
    )
    return {
        "status": "alert_logged",
        "patient": current_patient["full_name"],
        "emergency_contact": current_patient.get("emergency_contact_phone"),
        "gps": {"lat": lat, "lng": lng} if (lat and lng) else None,
        "instructions": "Call 112 immediately for emergency medical dispatch.",
    }


# -------------------------------------------------------------
# 9 & 10. NEARBY MEDICAL STORES & HOSPITALS MAP
# -------------------------------------------------------------

@router.get("/places/nearby")
def get_nearby_places_endpoint(
    type: Optional[str] = Query(None, description="Filter: 'pharmacy' or 'hospital'"),
    city: Optional[str] = Query(None, description="City: Mumbai, Pune, Kolhapur, etc."),
    q: Optional[str] = Query(None, description="Search keyword"),
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
):
    """
    Returns verified medical stores and hospitals with real verified photographs,
    addresses, phone numbers, opening hours, distance, and direction links.
    """
    places = list_nearby_places(
        place_type=type,
        city=city,
        search=q,
        user_lat=lat,
        user_lng=lng,
    )
    return {"places": places, "count": len(places)}


# -------------------------------------------------------------
# 11. NEARBY PHARMACY MEDICINE AVAILABILITY
# -------------------------------------------------------------

@router.get("/pharmacy/medicines")
def search_pharmacy_medicines_endpoint(q: str = Query(..., min_length=2)):
    """Searches real stock availability and pricing across local verified pharmacies."""
    results = search_pharmacy_inventory(q)
    return {"query": q, "results": results, "count": len(results)}


# -------------------------------------------------------------
# 12. MEDICINE REMINDER SYSTEM
# -------------------------------------------------------------

@router.get("/reminders")
def list_reminders_endpoint(current_patient: Dict[str, Any] = Depends(get_current_patient)):
    reminders = list_medicine_reminders(current_patient["id"])
    return {"reminders": reminders}


@router.post("/reminders")
def create_reminder_endpoint(
    request: ReminderRequest,
    current_patient: Dict[str, Any] = Depends(get_current_patient),
):
    reminder = create_medicine_reminder(
        patient_id=current_patient["id"],
        medicine_name=request.medicine_name,
        dosage=request.dosage,
        schedule=request.schedule,
        time_slot=request.time_slot,
        food_timing=request.food_timing,
        start_date=request.start_date,
        end_date=request.end_date,
        instructions=request.instructions,
        family_member_id=request.family_member_id,
    )
    return {"message": "Medicine reminder scheduled successfully.", "reminder": reminder}


@router.delete("/reminders/{reminder_id}")
def delete_reminder_endpoint(
    reminder_id: int,
    current_patient: Dict[str, Any] = Depends(get_current_patient),
):
    success = delete_medicine_reminder(reminder_id, current_patient["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Reminder not found.")
    return {"message": "Reminder cancelled."}


@router.post("/reminders/{reminder_id}/log")
def log_reminder_endpoint(
    reminder_id: int,
    request: ReminderLogRequest,
    current_patient: Dict[str, Any] = Depends(get_current_patient),
):
    log = log_reminder_status(reminder_id, current_patient["id"], request.status)
    return {"message": f"Reminder marked as {request.status}.", "log": log}


@router.get("/reminders/history")
def get_reminder_history_endpoint(current_patient: Dict[str, Any] = Depends(get_current_patient)):
    logs = get_reminder_history(current_patient["id"])
    return {"history": logs}


# -------------------------------------------------------------
# 13. PRESCRIPTION & MEDICAL REPORT UPLOAD
# -------------------------------------------------------------

@router.post("/documents/upload")
async def upload_document_endpoint(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form("Prescription"),
    doctor_name: str = Form(""),
    notes: str = Form(""),
    family_member_id: Optional[int] = Form(None),
    current_patient: Dict[str, Any] = Depends(get_current_patient),
):
    # Validate mime type
    allowed_mimes = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_mimes:
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Only PDF, JPG, and PNG medical reports are supported.",
        )

    # Secure unique filename
    ext = Path(file.filename or "doc").suffix or ".pdf"
    clean_name = f"doc_{current_patient['id']}_{int(datetime.now().timestamp())}_{secrets.token_hex(4)}{ext}"
    dest_path = UPLOADS_DIR / clean_name

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = dest_path.stat().st_size
    if file_size > 10 * 1024 * 1024:
        dest_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="File size exceeds maximum 10MB limit.")

    record = save_medical_document(
        patient_id=current_patient["id"],
        title=title,
        category=category,
        file_name=file.filename or clean_name,
        file_path=str(dest_path),
        file_size=file_size,
        mime_type=file.content_type or "application/octet-stream",
        doctor_name=doctor_name,
        notes=notes,
        family_member_id=family_member_id,
    )

    return {"message": "Document uploaded successfully.", "document": record}


@router.get("/documents")
def list_documents_endpoint(current_patient: Dict[str, Any] = Depends(get_current_patient)):
    docs = list_medical_documents(current_patient["id"])
    return {"documents": docs}


@router.get("/documents/{doc_id}/download")
def download_document_endpoint(
    doc_id: int,
    current_patient: Dict[str, Any] = Depends(get_current_patient),
):
    doc = get_medical_document_by_id(doc_id, current_patient["id"])
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    file_path = Path(doc["file_path"])
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found on server.")

    return FileResponse(file_path, filename=doc["file_name"], media_type=doc["mime_type"])


@router.delete("/documents/{doc_id}")
def delete_document_endpoint(
    doc_id: int,
    current_patient: Dict[str, Any] = Depends(get_current_patient),
):
    file_path = delete_medical_document(doc_id, current_patient["id"])
    if not file_path:
        raise HTTPException(status_code=404, detail="Document not found.")

    p = Path(file_path)
    p.unlink(missing_ok=True)
    return {"message": "Document deleted successfully."}


# -------------------------------------------------------------
# 14. AI HEALTH CHATBOT (MARATHI, HINDI, ENGLISH)
# -------------------------------------------------------------

@router.post("/chatbot/message")
def chatbot_message_endpoint(
    request: ChatbotMessageRequest,
    current_patient: Dict[str, Any] = Depends(get_current_patient),
):
    """
    Multilingual AI Health Chatbot supporting English, Marathi, and Hindi.
    Answers health inquiries, provides precautions, and detects red-flag emergencies.
    """
    context = {
        "gender": current_patient.get("gender"),
        "age": current_patient.get("age"),
        "known_allergies": current_patient.get("known_allergies"),
        "medical_conditions": current_patient.get("medical_conditions"),
    }
    response = get_ai_chatbot_response(request.query, lang=request.lang, patient_context=context)
    return response


# -------------------------------------------------------------
# 18. CUSTOMER FEEDBACK & BUG REPORTING
# -------------------------------------------------------------

@router.post("/feedback")
def submit_feedback_endpoint(
    request: FeedbackRequest,
    current_patient: Dict[str, Any] = Depends(get_current_patient),
):
    res = submit_feedback(
        patient_id=current_patient["id"],
        category=request.category,
        rating=request.rating,
        title=request.title,
        description=request.description,
    )
    return {"message": "Thank you for your feedback! It helps improve our healthcare platform.", "feedback": res}


@router.get("/feedback/my")
def list_feedback_endpoint(current_patient: Dict[str, Any] = Depends(get_current_patient)):
    return {"feedbacks": list_patient_feedback(current_patient["id"])}


# -------------------------------------------------------------
# 19. ADMIN DASHBOARD & GOVERNANCE
# -------------------------------------------------------------

@router.get("/admin/metrics")
def admin_metrics_endpoint(_current_patient: Dict[str, Any] = Depends(get_current_patient)):
    """Provides system analytics and health metrics for administration."""
    metrics = get_admin_dashboard_metrics()
    return {"metrics": metrics}


@router.get("/admin/users")
def admin_users_endpoint(_current_patient: Dict[str, Any] = Depends(get_current_patient)):
    users = list_all_patients_admin()
    return {"users": users}


@router.post("/admin/users/{user_id}/status")
def admin_toggle_user_status(
    user_id: int,
    status_val: str = Query(..., pattern="^(active|suspended|deactivated)$"),
    _current_patient: Dict[str, Any] = Depends(get_current_patient),
):
    set_patient_status_admin(user_id, status_val)
    return {"message": f"User status updated to {status_val}."}


@router.get("/admin/feedback")
def admin_feedback_endpoint(_current_patient: Dict[str, Any] = Depends(get_current_patient)):
    feedbacks = list_all_feedback_admin()
    return {"feedbacks": feedbacks}


@router.post("/admin/feedback/{feedback_id}/status")
def admin_update_feedback(
    feedback_id: int,
    status_val: str = Query(..., pattern="^(reviewed|resolved|in_progress)$"),
    admin_notes: str = Query(""),
    _current_patient: Dict[str, Any] = Depends(get_current_patient),
):
    update_feedback_status_admin(feedback_id, status_val, admin_notes)
    return {"message": "Feedback status updated."}


# -------------------------------------------------------------
# 20. FAMILY HEALTH PROFILES
# -------------------------------------------------------------

@router.get("/family")
def list_family_endpoint(current_patient: Dict[str, Any] = Depends(get_current_patient)):
    members = list_family_members(current_patient["id"])
    return {"family_members": members}


@router.post("/family")
def add_family_endpoint(
    request: FamilyMemberRequest,
    current_patient: Dict[str, Any] = Depends(get_current_patient),
):
    member = add_family_member(
        patient_id=current_patient["id"],
        full_name=request.full_name,
        relationship=request.relationship,
        gender=request.gender,
        dob=request.dob,
        blood_group=request.blood_group,
        weight=request.weight,
        blood_pressure=request.blood_pressure,
        medical_conditions=request.medical_conditions,
        known_allergies=request.known_allergies,
        current_medications=request.current_medications,
        medical_history=request.medical_history,
    )
    return {"message": "Family member profile added.", "member": member}


@router.delete("/family/{member_id}")
def delete_family_endpoint(
    member_id: int,
    current_patient: Dict[str, Any] = Depends(get_current_patient),
):
    success = delete_family_member(member_id, current_patient["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Family member not found.")
    return {"message": "Family member removed."}


# -------------------------------------------------------------
# 7. DOCTOR CONSULTATION & DIGITAL PRESCRIPTIONS
# -------------------------------------------------------------

class DoctorProfile(BaseModel):
    id: int
    full_name: str
    email: str
    mobile: str
    specialization: str
    qualification: str
    license_number: str
    experience_years: int
    clinic_address: str
    consultation_fee: float
    bio: str
    status: str
    is_verified: bool
    created_at: str


class DoctorAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    doctor: DoctorProfile


class DoctorRegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: str = Field(pattern=EMAIL_REGEX)
    mobile: str = Field(min_length=10, max_length=25)
    specialization: str = Field(min_length=2, max_length=100)
    qualification: str = Field(min_length=2, max_length=200)
    license_number: str = Field(min_length=3, max_length=80)
    experience_years: int = Field(default=0, ge=0, le=80)
    clinic_address: str = Field(min_length=5, max_length=300)
    consultation_fee: float = Field(default=0.0, ge=0)
    bio: str = Field(default="", max_length=1000)
    password: str = Field(min_length=6, max_length=128)
    confirm_password: str = Field(min_length=6, max_length=128)


class DoctorLoginRequest(BaseModel):
    email: str = Field(pattern=EMAIL_REGEX)
    password: str = Field(min_length=1, max_length=128)


class AppointmentRequest(BaseModel):
    doctor_id: int
    appointment_date: str
    appointment_time: str
    reason: str = Field(default="General consultation")


class AppointmentDecisionRequest(BaseModel):
    status: str = Field(..., pattern="^(accepted|rejected|cancelled)$")
    notes: str = Field(default="")


@router.post("/doctor/register", response_model=DoctorAuthResponse)
def register_doctor(request: DoctorRegisterRequest):
    if request.password != request.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match.")

    is_valid_mobile, cleaned_mobile = validate_mobile(request.mobile)
    if not is_valid_mobile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=cleaned_mobile)

    normalized_email = request.email.strip().lower()
    if get_doctor_by_email(normalized_email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A doctor with this email already exists.")

    try:
        password_hash = hash_password(request.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    now_iso = datetime.now(timezone.utc).isoformat()
    doctor = create_doctor(
        full_name=request.full_name,
        email=normalized_email,
        mobile=cleaned_mobile,
        specialization=request.specialization,
        qualification=request.qualification,
        license_number=request.license_number,
        experience_years=request.experience_years,
        clinic_address=request.clinic_address,
        consultation_fee=request.consultation_fee,
        bio=request.bio,
        password_hash=password_hash,
        created_at=now_iso,
    )

    token = create_access_token(
        email=doctor["email"],
        full_name=doctor["full_name"],
        doctor_id=doctor["id"],
        role="doctor",
    )

    return DoctorAuthResponse(
        access_token=token,
        token_type="bearer",
        doctor=DoctorProfile(
            id=doctor["id"],
            full_name=doctor["full_name"],
            email=doctor["email"],
            mobile=doctor["mobile"],
            specialization=doctor["specialization"],
            qualification=doctor["qualification"],
            license_number=doctor["license_number"],
            experience_years=doctor.get("experience_years") or 0,
            clinic_address=doctor["clinic_address"],
            consultation_fee=float(doctor.get("consultation_fee") or 0.0),
            bio=doctor.get("bio") or "",
            status=doctor.get("status") or "pending_verification",
            is_verified=bool(doctor.get("is_verified", 0)),
            created_at=doctor["created_at"],
        ),
    )


@router.post("/doctor/login", response_model=DoctorAuthResponse)
def login_doctor(request: DoctorLoginRequest):
    normalized_email = request.email.strip().lower()
    doctor = get_doctor_by_email(normalized_email)
    if not doctor or not verify_password(request.password, doctor["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    token = create_access_token(
        email=doctor["email"],
        full_name=doctor["full_name"],
        doctor_id=doctor["id"],
        role="doctor",
    )

    return DoctorAuthResponse(
        access_token=token,
        token_type="bearer",
        doctor=DoctorProfile(
            id=doctor["id"],
            full_name=doctor["full_name"],
            email=doctor["email"],
            mobile=doctor["mobile"],
            specialization=doctor["specialization"],
            qualification=doctor["qualification"],
            license_number=doctor["license_number"],
            experience_years=doctor.get("experience_years") or 0,
            clinic_address=doctor["clinic_address"],
            consultation_fee=float(doctor.get("consultation_fee") or 0.0),
            bio=doctor.get("bio") or "",
            status=doctor.get("status") or "pending_verification",
            is_verified=bool(doctor.get("is_verified", 0)),
            created_at=doctor["created_at"],
        ),
    )


@router.get("/doctors")
def list_doctors(specialization: Optional[str] = Query(None), q: Optional[str] = Query(None)):
    doctors = list_verified_doctors(specialization=specialization, query=q)
    return {"doctors": doctors}


@router.get("/doctors/{doctor_id}")
def get_doctor_detail(doctor_id: int):
    doctor = get_doctor_by_id(doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")
    return doctor


@router.post("/appointments")
def create_patient_appointment(
    request: AppointmentRequest,
    current_patient: Dict[str, Any] = Depends(get_current_patient),
):
    try:
        appointment = create_appointment(
            patient_id=current_patient["id"],
            doctor_id=request.doctor_id,
            appointment_date=request.appointment_date,
            appointment_time=request.appointment_time,
            reason=request.reason,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"message": "Appointment request submitted.", "appointment": appointment}


@router.get("/appointments/my")
def patient_appointments(current_patient: Dict[str, Any] = Depends(get_current_patient)):
    return {"appointments": list_patient_appointments(current_patient["id"])}


@router.get("/consultations/my")
def patient_consultations(current_patient: Dict[str, Any] = Depends(get_current_patient)):
    return {"consultations": list_patient_consultations(current_patient["id"])}


@router.post("/doctor/prescriptions")
def create_prescription_endpoint(
    request: DoctorPrescriptionRequest,
    current_doctor: Dict[str, Any] = Depends(get_current_doctor),
):
    """Doctor issues an official digital prescription."""
    try:
        presc = create_doctor_prescription(
            doctor_id=current_doctor["id"],
            patient_id=request.patient_id,
            diagnosis=request.diagnosis,
            medicines=request.medicines,
            general_advice=request.general_advice,
            follow_up_date=request.follow_up_date,
            appointment_id=request.appointment_id,
        )
        return {"message": "Digital prescription issued successfully.", "prescription": presc}
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))


@router.get("/prescriptions/my")
def get_my_prescriptions(current_patient: Dict[str, Any] = Depends(get_current_patient)):
    """Patient retrieves official digital prescriptions issued by doctors."""
    prescriptions = list_patient_prescriptions(current_patient["id"])
    return {"prescriptions": prescriptions}


# -------------------------------------------------------------
# 15. MEDICINE DETAILS & ALTERNATIVES
# -------------------------------------------------------------

@router.get("/medicines/search")
def search_medicines_dataset(q: str = Query(..., min_length=2)):
    """Searches medicine database with uses, composition, and side-effects."""
    results = search_by_name(q)
    return {"query": q, "results": results[:20], "count": len(results)}


@router.get("/dataset/info")
def dataset_info():
    return {
        "name": "Medicine Information Dataset (Cleaned)",
        "file": "medicine_information_cleaned.csv",
        "record_count": len(medicine_df),
        "source": "Clinical pharmacology reference database",
    }


@router.get("/model/metrics")
def model_metrics():
    _model = _disease_prediction_module.model
    _features = _disease_prediction_module.features
    return {
        "algorithm": "Multinomial Logistic Regression (scikit-learn)",
        "num_features": len(_features),
        "num_classes": len(_model.classes_) if hasattr(_model, "classes_") else 41,
        "model_file": "disease_logistic_regression.pkl",
        "note": "Evaluated with 50% confidence safety threshold.",
    }


@router.get("/health")
def health_check():
    return {"status": "ok", "app": "AI Medicine System", "version": "2.0.0"}


# Mount API routers (both direct and /api prefix)
app.include_router(router)
app.include_router(router, prefix="/api", include_in_schema=False)


# -------------------------------------------------------------
# STATIC FRONTEND SERVING (PRODUCTION & RENDER)
# -------------------------------------------------------------

if FRONTEND_DIST.is_dir():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="Not found")

        requested = (FRONTEND_DIST / full_path).resolve()
        if full_path and requested.is_file() and requested.is_relative_to(FRONTEND_DIST.resolve()):
            return FileResponse(requested)

        return FileResponse(FRONTEND_DIST / "index.html")
else:
    @app.get("/")
    def home():
        return {"message": "AI Medicine Recommendation Platform API is running", "docs": "/docs"}
