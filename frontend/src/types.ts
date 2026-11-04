export interface XAIContribution {
  symptom: string
  contribution: number
}

export interface XAIExplanation {
  positive_contributions: XAIContribution[]
  negative_contributions: XAIContribution[]
}

export interface MedicineDetails {
  name: string
  uses: string
  composition: string
  side_effects: string
  how_to_use: string
  alcohol: string
  pregnancy: string
  breast_feeding: string
  driving: string
  kidney: string
  liver: string
  manufacturer: string
}

export interface SafetyCheck {
  safety_available: boolean
  safety_information: {
    alcohol?: string
    pregnancy?: string
    breast_feeding?: string
    driving?: string
    kidney?: string
    liver?: string
    [key: string]: string | undefined
  }
  warnings: string[]
}

export interface MedicineRecord {
  medicine_information: MedicineDetails
  safety: SafetyCheck
}

export interface MedicineInformationResponse {
  condition: string
  match_found: boolean
  medicines: MedicineRecord[]
}

export interface PredictionSuccessResponse {
  input_symptoms: string[]
  prediction_status?: "model_output_available" | "insufficient_input" | "uncertain" | "emergency_warning" | string
  message?: string
  predicted_condition: string | null
  model_confidence: number | null
  xai_explanation: XAIExplanation | null
  medicine_information: MedicineInformationResponse | null
  health_warnings?: string[]
  patient_context?: {
    gender?: string
    age?: number
    blood_pressure?: string
  }
  disclaimer: string
}

export interface ApiValidationErrorDetail {
  message: string
  invalid_symptoms: string[]
  validation?: {
    valid: boolean
    message: string
    valid_symptoms: string[]
    invalid_symptoms: string[]
  }
}

export type ApiErrorType = "validation" | "connection" | "server" | "client"

export interface ApiError {
  type: ApiErrorType
  message: string
  invalidSymptoms?: string[]
  statusCode?: number
}

// -------------------------------------------------------------
// PATIENT AUTHENTICATION & HEALTH PROFILE TYPES
// -------------------------------------------------------------

export interface PatientUser {
  id: number
  full_name: string
  gender: "Male" | "Female" | "Other" | string
  email: string
  dob: string
  mobile: string
  age: number
  medical_conditions: string
  known_allergies?: string
  current_medications?: string
  medical_history?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  weight?: number
  blood_pressure?: string
  blood_group?: string
  role?: string
  created_at: string
  status: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  patient: PatientUser
}

export interface RegisterPayload {
  full_name: string
  gender: "Male" | "Female" | "Other" | string
  dob: string
  mobile: string
  email: string
  password: string
  confirm_password: string
  otp_code?: string
  medical_conditions?: string
  known_allergies?: string
  current_medications?: string
  medical_history?: string
  weight?: number
  blood_pressure?: string
  blood_group?: string
}

export interface UpdateProfilePayload {
  full_name: string
  gender: string
  dob: string
  mobile: string
  medical_conditions: string
  known_allergies: string
  current_medications: string
  medical_history: string
  emergency_contact_name: string
  emergency_contact_phone: string
  weight: number
  blood_pressure: string
  blood_group: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface ResetPasswordPayload {
  email: string
  dob: string
  new_password: string
  confirm_password: string
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  timestamp: string
  isRead: boolean
  type: "system" | "guidance" | "security"
}

// -------------------------------------------------------------
// DOCTOR CONSULTATION & DIGITAL PRESCRIPTION TYPES
// -------------------------------------------------------------

export interface DoctorUser {
  id: number
  full_name: string
  email: string
  mobile: string
  specialization: string
  qualification: string
  license_number: string
  experience_years: number
  clinic_address: string
  consultation_fee: number
  bio: string
  status: string
  is_verified: boolean
  created_at: string
}

export interface DoctorAuthResponse {
  access_token: string
  token_type: string
  doctor: DoctorUser
}

export interface AppointmentRecord {
  id: number
  patient_id: number
  doctor_id: number
  appointment_date: string
  appointment_time: string
  status: string
  reason: string
  notes: string
  meeting_room?: string | null
  created_at: string
  updated_at: string
  doctor_name?: string
  specialization?: string
  consultation_fee?: number
  patient_name?: string
}

export interface ConsultationRecord {
  id: number
  appointment_id: number
  patient_id: number
  doctor_id: number
  room_name: string
  meeting_url: string
  status: string
  doctor_notes: string
  created_at: string
  updated_at: string
  doctor_name?: string
  patient_name?: string
  appointment_date?: string
  appointment_time?: string
}

export interface PrescriptionMedicine {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

export interface PrescriptionRecord {
  id: number
  appointment_id?: number
  doctor_id: number
  patient_id: number
  doctor_name: string
  doctor_qualification: string
  license_number: string
  clinic_address: string
  diagnosis: string
  medicines: PrescriptionMedicine[]
  general_advice: string
  follow_up_date?: string | null
  doctor_signature: string
  created_at: string
}

// -------------------------------------------------------------
// MEDICINE REMINDER TYPES
// -------------------------------------------------------------

export interface MedicineReminder {
  id: number
  patient_id: number
  family_member_id?: number | null
  family_member_name?: string
  medicine_name: string
  dosage: string
  schedule: "Morning" | "Afternoon" | "Night" | "Custom"
  time_slot: string
  food_timing: "Before food" | "After food" | "With food"
  start_date: string
  end_date?: string | null
  doctor_approved: number
  instructions: string
  is_active: number
  created_at: string
}

export interface ReminderLog {
  id: number
  reminder_id: number
  log_date: string
  time_slot: string
  status: "completed" | "missed"
  logged_at: string
  medicine_name?: string
  dosage?: string
  schedule?: string
}

// -------------------------------------------------------------
// MEDICAL DOCUMENT TYPES
// -------------------------------------------------------------

export interface MedicalDocument {
  id: number
  patient_id: number
  family_member_id?: number | null
  family_member_name?: string
  title: string
  category: "Prescription" | "Lab Report" | "Discharge Summary" | "Other"
  file_name: string
  file_size: number
  mime_type: string
  doctor_name: string
  notes: string
  uploaded_at: string
}

// -------------------------------------------------------------
// PHARMACIES & HOSPITALS MAP TYPES
// -------------------------------------------------------------

export interface NearbyPlace {
  id: number
  name: string
  place_type: "pharmacy" | "hospital"
  license_number: string
  address: string
  city: string
  state: string
  postal_code: string
  latitude: number
  longitude: number
  phone: string
  opening_hours: string
  photo_url: string
  is_verified: number
  distance_km?: number
  directions_url?: string
}

export interface PharmacyMedicine {
  id: number
  pharmacy_id: number
  pharmacy_name: string
  medicine_name: string
  composition: string
  stock_status: "In Stock" | "Limited" | "Out of Stock"
  price: number
  unit: string
  phone: string
  address: string
  city: string
  opening_hours: string
  photo_url: string
}

// -------------------------------------------------------------
// AI HEALTH CHATBOT & INTERACTION CHECKER TYPES
// -------------------------------------------------------------

export interface ChatbotResponse {
  response: string
  is_emergency: boolean
  detected_language: "en" | "mr" | "hi" | string
  topic?: string
  recommendation: string
  disclaimer: string
}

export interface ClinicalInteraction {
  drugs: string[]
  severity: "Severe" | "Moderate" | "Minor" | string
  description: string
  action?: string | null
}

export interface AllergyWarning {
  category: string
  matched_term: string
  warning: string
  severity: string
}

export interface InteractionResult {
  drugs_checked: string[]
  has_interactions: boolean
  interactions_count: number
  interactions: ClinicalInteraction[]
  allergy_warnings: AllergyWarning[]
  recommendation: string
  disclaimer: string
}

// -------------------------------------------------------------
// FAMILY PROFILES & FEEDBACK TYPES
// -------------------------------------------------------------

export interface FamilyMember {
  id: number
  patient_id: number
  full_name: string
  relationship: string
  gender: string
  dob: string
  blood_group?: string
  weight?: number
  blood_pressure?: string
  medical_conditions?: string
  known_allergies?: string
  current_medications?: string
  medical_history?: string
  created_at: string
}

export interface FeedbackRecord {
  id: number
  patient_id: number
  patient_name?: string
  patient_email?: string
  category: "application" | "doctor" | "bug_report"
  rating: number
  title: string
  description: string
  status: string
  admin_notes?: string
  created_at: string
}

// -------------------------------------------------------------
// ADMIN METRICS & EMERGENCY SOS
// -------------------------------------------------------------

export interface AdminMetrics {
  total_registered_users: number
  active_users: number
  total_doctors: number
  verified_doctors: number
  pending_doctor_approvals: number
  total_appointments: number
  active_consultations: number
  symptom_checker_runs: number
  verified_pharmacies: number
  registered_hospitals: number
  customer_feedbacks: number
  open_bug_reports: number
}

export interface EmergencyHospitalInfo {
  name: string
  city: string
  phone: string
  address: string
}

export interface EmergencyInfo {
  emergency_helpline: string
  emergency_label: string
  ambulance: string
  medical_helpline: string
  women_helpline: string
  emergency_hospital_helpline: string
  critical_instructions: string[]
  nearby_emergency_hospitals: EmergencyHospitalInfo[]
}
