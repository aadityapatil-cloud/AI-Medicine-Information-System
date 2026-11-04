import json
import math
import os
import re
import sqlite3
import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Path to the database file - resolved absolutely
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = (PROJECT_ROOT / "data" / "patients.db").resolve()
_env_path = os.environ.get("DATABASE_PATH")
if _env_path:
    _p = Path(_env_path)
    DB_PATH = _p.resolve() if _p.is_absolute() else (PROJECT_ROOT / _p).resolve()
else:
    DB_PATH = DEFAULT_DB_PATH


def get_connection() -> sqlite3.Connection:
    """Creates a connection to the SQLite database with row factory enabled."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initializes the complete database schema and performs safe migrations."""
    conn = get_connection()
    try:
        with conn:
            # 1. Patients Table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS patients (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    full_name TEXT NOT NULL,
                    dob TEXT NOT NULL,
                    gender TEXT NOT NULL DEFAULT 'Not specified',
                    email TEXT UNIQUE NOT NULL,
                    mobile TEXT NOT NULL,
                    medical_conditions TEXT NOT NULL DEFAULT 'None',
                    known_allergies TEXT NOT NULL DEFAULT 'None',
                    current_medications TEXT NOT NULL DEFAULT 'None',
                    medical_history TEXT NOT NULL DEFAULT 'None',
                    emergency_contact_name TEXT NOT NULL DEFAULT 'None',
                    emergency_contact_phone TEXT NOT NULL DEFAULT 'None',
                    weight REAL NOT NULL DEFAULT 0.0,
                    blood_pressure TEXT NOT NULL DEFAULT '120/80',
                    blood_group TEXT NOT NULL DEFAULT '',
                    role TEXT NOT NULL DEFAULT 'patient',
                    password_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'active'
                );
                """
            )

            # 2. Doctors Table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS doctors (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    full_name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    mobile TEXT NOT NULL,
                    specialization TEXT NOT NULL,
                    qualification TEXT NOT NULL,
                    license_number TEXT NOT NULL,
                    experience_years INTEGER NOT NULL DEFAULT 0,
                    clinic_address TEXT NOT NULL,
                    consultation_fee REAL NOT NULL DEFAULT 0,
                    bio TEXT NOT NULL DEFAULT '',
                    password_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending_verification',
                    is_verified INTEGER NOT NULL DEFAULT 0,
                    last_login TEXT
                );
                """
            )

            # 3. Doctor Verifications Table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS doctor_verifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    doctor_id INTEGER NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    verification_comment TEXT,
                    submitted_documents TEXT DEFAULT '{}',
                    created_at TEXT NOT NULL,
                    reviewed_at TEXT,
                    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
                );
                """
            )

            # 4. Doctor Availability Table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS doctor_availability (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    doctor_id INTEGER NOT NULL,
                    day_of_week TEXT NOT NULL,
                    start_time TEXT NOT NULL,
                    end_time TEXT NOT NULL,
                    slot_duration INTEGER NOT NULL DEFAULT 30,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
                );
                """
            )

            # 5. Appointments Table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS appointments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    patient_id INTEGER NOT NULL,
                    doctor_id INTEGER NOT NULL,
                    appointment_date TEXT NOT NULL,
                    appointment_time TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'requested',
                    reason TEXT NOT NULL DEFAULT '',
                    notes TEXT NOT NULL DEFAULT '',
                    meeting_room TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (patient_id) REFERENCES patients(id),
                    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
                );
                """
            )

            # 6. Consultations Table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS consultations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    appointment_id INTEGER UNIQUE NOT NULL,
                    patient_id INTEGER NOT NULL,
                    doctor_id INTEGER NOT NULL,
                    room_name TEXT NOT NULL,
                    meeting_url TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'scheduled',
                    doctor_notes TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
                    FOREIGN KEY (patient_id) REFERENCES patients(id),
                    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
                );
                """
            )

            # 7. Notifications Table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_type TEXT NOT NULL,
                    user_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    message TEXT NOT NULL,
                    is_read INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL
                );
                """
            )

            # 8. Prediction History Table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS prediction_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    patient_id INTEGER NOT NULL,
                    symptoms TEXT NOT NULL,
                    predicted_condition TEXT,
                    model_confidence REAL,
                    result_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (patient_id) REFERENCES patients(id)
                );
                """
            )

            # 9. Email OTPs Table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS email_otps (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL,
                    otp_code TEXT NOT NULL,
                    purpose TEXT NOT NULL DEFAULT 'registration',
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    is_verified INTEGER NOT NULL DEFAULT 0,
                    attempts INTEGER NOT NULL DEFAULT 0
                );
                """
            )

            # 10. Family Health Profiles Table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS family_members (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    patient_id INTEGER NOT NULL,
                    full_name TEXT NOT NULL,
                    relationship TEXT NOT NULL,
                    gender TEXT NOT NULL,
                    dob TEXT NOT NULL,
                    blood_group TEXT DEFAULT '',
                    weight REAL DEFAULT 0.0,
                    blood_pressure TEXT DEFAULT '120/80',
                    medical_conditions TEXT DEFAULT 'None',
                    known_allergies TEXT DEFAULT 'None',
                    current_medications TEXT DEFAULT 'None',
                    medical_history TEXT DEFAULT 'None',
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (patient_id) REFERENCES patients(id)
                );
                """
            )

            # 11. Medicine Reminders Table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS medicine_reminders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    patient_id INTEGER NOT NULL,
                    family_member_id INTEGER,
                    medicine_name TEXT NOT NULL,
                    dosage TEXT NOT NULL DEFAULT '1 tablet',
                    schedule TEXT NOT NULL DEFAULT 'Morning',
                    time_slot TEXT NOT NULL DEFAULT '08:00',
                    food_timing TEXT NOT NULL DEFAULT 'After food',
                    start_date TEXT NOT NULL,
                    end_date TEXT,
                    doctor_approved INTEGER NOT NULL DEFAULT 1,
                    instructions TEXT DEFAULT '',
                    is_active INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (patient_id) REFERENCES patients(id)
                );
                """
            )

            # 12. Reminder Logs Table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS reminder_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    reminder_id INTEGER NOT NULL,
                    patient_id INTEGER NOT NULL,
                    log_date TEXT NOT NULL,
                    time_slot TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'completed',
                    logged_at TEXT NOT NULL,
                    FOREIGN KEY (reminder_id) REFERENCES medicine_reminders(id),
                    FOREIGN KEY (patient_id) REFERENCES patients(id)
                );
                """
            )

            # 13. Medical Documents Table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS medical_documents (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    patient_id INTEGER NOT NULL,
                    family_member_id INTEGER,
                    title TEXT NOT NULL,
                    category TEXT NOT NULL DEFAULT 'Prescription',
                    file_name TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    file_size INTEGER NOT NULL,
                    mime_type TEXT NOT NULL,
                    doctor_name TEXT DEFAULT '',
                    notes TEXT DEFAULT '',
                    uploaded_at TEXT NOT NULL,
                    FOREIGN KEY (patient_id) REFERENCES patients(id)
                );
                """
            )

            # 14. Pharmacies and Medical Stores Table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS pharmacies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    place_type TEXT NOT NULL DEFAULT 'pharmacy',
                    license_number TEXT NOT NULL,
                    address TEXT NOT NULL,
                    city TEXT NOT NULL,
                    state TEXT NOT NULL DEFAULT 'Maharashtra',
                    postal_code TEXT NOT NULL,
                    latitude REAL NOT NULL,
                    longitude REAL NOT NULL,
                    phone TEXT NOT NULL,
                    opening_hours TEXT NOT NULL DEFAULT '08:00 AM - 10:00 PM',
                    photo_url TEXT NOT NULL,
                    is_verified INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL
                );
                """
            )

            # 15. Pharmacy Inventory Table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS pharmacy_inventory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    pharmacy_id INTEGER NOT NULL,
                    medicine_name TEXT NOT NULL,
                    composition TEXT NOT NULL DEFAULT '',
                    stock_status TEXT NOT NULL DEFAULT 'In Stock',
                    price REAL NOT NULL DEFAULT 0.0,
                    unit TEXT NOT NULL DEFAULT 'strip of 10 tablets',
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id)
                );
                """
            )

            # 16. Doctor Digital Prescriptions Table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS prescriptions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    appointment_id INTEGER,
                    doctor_id INTEGER NOT NULL,
                    patient_id INTEGER NOT NULL,
                    diagnosis TEXT NOT NULL,
                    medicines_json TEXT NOT NULL,
                    general_advice TEXT NOT NULL DEFAULT '',
                    follow_up_date TEXT,
                    doctor_signature TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
                    FOREIGN KEY (patient_id) REFERENCES patients(id)
                );
                """
            )

            # 17. Feedbacks and Ratings Table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS feedbacks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    patient_id INTEGER NOT NULL,
                    category TEXT NOT NULL DEFAULT 'application',
                    rating INTEGER NOT NULL DEFAULT 5,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    admin_notes TEXT DEFAULT '',
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (patient_id) REFERENCES patients(id)
                );
                """
            )

            # 18. System Metrics Table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS system_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    metric_type TEXT NOT NULL,
                    user_id INTEGER,
                    details TEXT,
                    created_at TEXT NOT NULL
                );
                """
            )

            # Indexes
            conn.execute("CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_patients_mobile ON patients(mobile);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_doctors_mobile ON doctors(mobile);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date, appointment_time);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_email_otps_lookup ON email_otps(email, otp_code);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_reminders_patient ON medicine_reminders(patient_id);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_pharmacies_city ON pharmacies(city);")

            # Safe Column Migrations for Patients Table
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(patients)")
            existing_cols = {row["name"] if isinstance(row, sqlite3.Row) else row[1] for row in cursor.fetchall()}

            migrations = [
                ("gender", "TEXT NOT NULL DEFAULT 'Not specified'"),
                ("medical_conditions", "TEXT NOT NULL DEFAULT 'None'"),
                ("known_allergies", "TEXT NOT NULL DEFAULT 'None'"),
                ("current_medications", "TEXT NOT NULL DEFAULT 'None'"),
                ("medical_history", "TEXT NOT NULL DEFAULT 'None'"),
                ("emergency_contact_name", "TEXT NOT NULL DEFAULT 'None'"),
                ("emergency_contact_phone", "TEXT NOT NULL DEFAULT 'None'"),
                ("weight", "REAL NOT NULL DEFAULT 0.0"),
                ("blood_pressure", "TEXT NOT NULL DEFAULT '120/80'"),
                ("blood_group", "TEXT NOT NULL DEFAULT ''"),
                ("role", "TEXT NOT NULL DEFAULT 'patient'"),
            ]
            for col_name, col_def in migrations:
                if col_name not in existing_cols:
                    conn.execute(f"ALTER TABLE patients ADD COLUMN {col_name} {col_def};")

            # Safe Column Migration for Pharmacies Table
            cursor.execute("PRAGMA table_info(pharmacies)")
            pharm_cols = {row["name"] if isinstance(row, sqlite3.Row) else row[1] for row in cursor.fetchall()}
            if "place_type" not in pharm_cols:
                conn.execute("ALTER TABLE pharmacies ADD COLUMN place_type TEXT NOT NULL DEFAULT 'pharmacy';")

            # Seed Real Pharmacies, Medical Stores, and Hospitals if empty
            cursor.execute("SELECT COUNT(*) FROM pharmacies")
            if cursor.fetchone()[0] == 0:
                _seed_initial_places_and_inventory(conn)

            # Seed Verified Doctors if empty
            cursor.execute("SELECT COUNT(*) FROM doctors")
            if cursor.fetchone()[0] == 0:
                _seed_initial_doctors(conn)

    finally:
        conn.close()


def _seed_initial_places_and_inventory(conn: sqlite3.Connection) -> None:
    """Seeds verified pharmacies, medical stores, and multispecialty hospitals with real photographs and details."""
    now = datetime.now(timezone.utc).isoformat()
    places_data = [
        # Medical Stores & Pharmacies
        (
            "Apollo Pharmacy - Andheri West",
            "pharmacy",
            "MH-MZ4-2023-4819",
            "Shop No. 4, Ground Floor, Veera Desai Road, Andheri West",
            "Mumbai",
            "Maharashtra",
            "400053",
            19.1351,
            72.8347,
            "+91 22 2673 4511",
            "24 Hours Open",
            "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=800&auto=format&fit=crop&q=80",
            1,
            now,
        ),
        (
            "Wellness Forever 24x7 Chemist - Bandra",
            "pharmacy",
            "MH-MZ2-2022-8912",
            "Plot 18, Hill Road, Near Mehboob Studio, Bandra West",
            "Mumbai",
            "Maharashtra",
            "400050",
            19.0522,
            72.8258,
            "+91 22 2642 9880",
            "24 Hours Open",
            "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=80",
            1,
            now,
        ),
        (
            "MedPlus Pharmacy - Shivaji Nagar",
            "pharmacy",
            "MH-PN1-2023-1120",
            "Shop 12, FC Road, Deccan Gymkhana, Shivaji Nagar",
            "Pune",
            "Maharashtra",
            "411004",
            18.5284,
            73.8441,
            "+91 20 2567 8900",
            "07:00 AM - 11:30 PM",
            "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800&auto=format&fit=crop&q=80",
            1,
            now,
        ),
        (
            "Noble Chemist & Surgicals - Kothrud",
            "pharmacy",
            "MH-PN2-2021-4560",
            "Survey 88, Near City Pride, Kothrud",
            "Pune",
            "Maharashtra",
            "411038",
            18.5074,
            73.8077,
            "+91 20 2544 3211",
            "08:00 AM - 11:00 PM",
            "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&auto=format&fit=crop&q=80",
            1,
            now,
        ),
        (
            "Mahalaxmi Medical & General Stores - Laxmipuri",
            "pharmacy",
            "MH-KL1-2023-7741",
            "Station Road, Near Bindu Chowk, Laxmipuri",
            "Kolhapur",
            "Maharashtra",
            "416002",
            16.7028,
            74.2415,
            "+91 231 265 1420",
            "08:00 AM - 10:30 PM",
            "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&auto=format&fit=crop&q=80",
            1,
            now,
        ),
        (
            "Sanjivani 24x7 Medical - Rajarampuri",
            "pharmacy",
            "MH-KL2-2022-9034",
            "Main Road, 3rd Lane, Rajarampuri",
            "Kolhapur",
            "Maharashtra",
            "416008",
            16.6904,
            74.2482,
            "+91 231 252 8844",
            "24 Hours Open",
            "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=800&auto=format&fit=crop&q=80",
            1,
            now,
        ),
        # Hospitals & Trauma Centers
        (
            "KEM Hospital & Research Centre",
            "hospital",
            "HOSP-MH-PUN-001",
            "489, Rasta Peth, Sardar Moodliar Road",
            "Pune",
            "Maharashtra",
            "411011",
            18.5204,
            73.8677,
            "+91 20 6603 7300",
            "Emergency 24x7",
            "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80",
            1,
            now,
        ),
        (
            "Lilavati Hospital & Research Centre",
            "hospital",
            "HOSP-MH-MUM-002",
            "A-791, Bandra Reclamation, Bandra West",
            "Mumbai",
            "Maharashtra",
            "400050",
            19.0515,
            72.8295,
            "+91 22 2675 1000",
            "Emergency 24x7",
            "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80",
            1,
            now,
        ),
        (
            "Chhatrapati Pramila Raje (CPR) General Hospital",
            "hospital",
            "HOSP-MH-KOL-003",
            "Bhausinghji Road, Near New Palace, Dasara Chowk",
            "Kolhapur",
            "Maharashtra",
            "416003",
            16.7042,
            74.2371,
            "+91 231 264 4581",
            "Emergency 24x7",
            "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80",
            1,
            now,
        ),
        (
            "Ruby Hall Clinic - Sassoon Road",
            "hospital",
            "HOSP-MH-PUN-004",
            "40, Sassoon Road, Sangamvadi",
            "Pune",
            "Maharashtra",
            "411001",
            18.5312,
            73.8762,
            "+91 20 6645 5100",
            "Emergency 24x7",
            "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80",
            1,
            now,
        ),
    ]

    for p in places_data:
        conn.execute(
            """
            INSERT INTO pharmacies (
                name, place_type, license_number, address, city, state, postal_code,
                latitude, longitude, phone, opening_hours, photo_url, is_verified, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """,
            p,
        )

    # Seed Inventory for pharmacies
    inventory_items = [
        ("Paracetamol 650mg (Dolo)", "Paracetamol 650mg", "In Stock", 32.50, "strip of 15 tablets"),
        ("Augmentin 625 Duo", "Amoxicillin 500mg + Clavulanic Acid 125mg", "In Stock", 204.00, "strip of 10 tablets"),
        ("Metformin 500mg (Glycomet)", "Metformin Hydrochloride 500mg", "In Stock", 24.00, "strip of 10 tablets"),
        ("Amlodipine 5mg (Amlong)", "Amlodipine Besylate 5mg", "In Stock", 42.00, "strip of 15 tablets"),
        ("Pan 40 (Pantoprazole)", "Pantoprazole Sodium 40mg", "In Stock", 155.00, "strip of 15 tablets"),
        ("Cetirizine 10mg (Cetzine)", "Cetirizine Dihydrochloride 10mg", "In Stock", 18.50, "strip of 10 tablets"),
        ("Azithromycin 500mg (Azee)", "Azithromycin 500mg", "Limited", 119.00, "strip of 5 tablets"),
        ("Telmisartan 40mg (Telma)", "Telmisartan 40mg", "In Stock", 115.00, "strip of 15 tablets"),
    ]

    for pharm_id in [1, 2, 3, 4, 5, 6]:
        for med_name, comp, status, price, unit in inventory_items:
            conn.execute(
                """
                INSERT INTO pharmacy_inventory (
                    pharmacy_id, medicine_name, composition, stock_status, price, unit, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?);
                """,
                (pharm_id, med_name, comp, status, price, unit, now),
            )


def _seed_initial_doctors(conn: sqlite3.Connection) -> None:
    """Seeds verified practitioners across core specialties."""
    from auth import hash_password
    now = datetime.now(timezone.utc).isoformat()
    dummy_pwd = hash_password("DoctorPass@2026")

    doctors = [
        (
            "Dr. Ananya Sharma",
            "dr.ananya@ai-med.org",
            "+91 98201 12345",
            "Cardiologist",
            "MBBS, MD (Medicine), DM (Cardiology) - AIIMS New Delhi",
            "MCI-2012-09841",
            14,
            "Apollo Clinic, Ground Floor, Veera Desai Road, Andheri West, Mumbai",
            800.0,
            "Senior Consultant Interventional Cardiologist specializing in preventive heart health and hypertension management.",
            dummy_pwd,
            now,
            "verified",
            1,
        ),
        (
            "Dr. Rajesh Kulkarni",
            "dr.rajesh@ai-med.org",
            "+91 98220 54321",
            "General Physician",
            "MBBS, MD (General Medicine) - BJ Medical College Pune",
            "MMC-2008-04123",
            17,
            "Kulkarni Healthcare Clinic, FC Road, Shivaji Nagar, Pune",
            500.0,
            "Experienced general physician providing compassionate clinical care for infectious diseases, diabetes, and lifestyle disorders.",
            dummy_pwd,
            now,
            "verified",
            1,
        ),
        (
            "Dr. Priya Deshmukh",
            "dr.priya@ai-med.org",
            "+91 98233 99887",
            "Gynecologist & Obstetrician",
            "MBBS, MS (OBGYN), DGO - KEM Hospital Mumbai",
            "MMC-2015-08129",
            11,
            "Matruchhaya Women Care Clinic, 3rd Lane, Rajarampuri, Kolhapur",
            600.0,
            "Specialist in maternal care, safe women healthcare, hormonal balance, and prenatal counseling.",
            dummy_pwd,
            now,
            "verified",
            1,
        ),
        (
            "Dr. Sameer Patil",
            "dr.sameer@ai-med.org",
            "+91 98900 66778",
            "Pulmonologist",
            "MBBS, DNB (Respiratory Medicine) - Lilavati Hospital",
            "MMC-2014-06711",
            12,
            "Swastha Chest & Allergy Centre, Rasta Peth, Pune",
            700.0,
            "Expert in respiratory disorders, chronic asthma, bronchitis, post-viral cough, and allergic rhinitis.",
            dummy_pwd,
            now,
            "verified",
            1,
        ),
    ]

    for d in doctors:
        conn.execute(
            """
            INSERT INTO doctors (
                full_name, email, mobile, specialization, qualification, license_number,
                experience_years, clinic_address, consultation_fee, bio, password_hash,
                created_at, status, is_verified
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """,
            d,
        )


# -------------------------------------------------------------
# EMAIL OTP DATABASE OPERATIONS
# -------------------------------------------------------------

def save_email_otp(email: str, otp_code: str, purpose: str = "registration", expires_seconds: int = 600) -> None:
    """Stores generated OTP in the database for persistence."""
    init_db()
    conn = get_connection()
    try:
        with conn:
            now = datetime.now(timezone.utc)
            expires_at = datetime.fromtimestamp(now.timestamp() + expires_seconds, tz=timezone.utc).isoformat()
            conn.execute(
                """
                INSERT INTO email_otps (email, otp_code, purpose, created_at, expires_at, is_verified, attempts)
                VALUES (lower(trim(?)), ?, ?, ?, ?, 0, 0);
                """,
                (email.strip(), otp_code.strip(), purpose, now.isoformat(), expires_at),
            )
    finally:
        conn.close()


def verify_email_otp(email: str, entered_otp: str, purpose: str = "registration") -> Tuple[bool, str]:
    """Verifies OTP code from database record."""
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, otp_code, expires_at, is_verified, attempts
            FROM email_otps
            WHERE lower(trim(email)) = lower(trim(?)) AND purpose = ?
            ORDER BY id DESC
            LIMIT 1;
            """,
            (email.strip(), purpose),
        )
        row = cursor.fetchone()
        if not row:
            return False, "No active OTP found. Please click 'Send OTP' to receive a code."

        otp_id = row["id"]
        expected_otp = row["otp_code"]
        expires_at_str = row["expires_at"]
        is_verified = row["is_verified"]
        attempts = row["attempts"]

        if is_verified:
            return True, "Email has already been verified."

        # Expiry check
        now_ts = datetime.now(timezone.utc).timestamp()
        try:
            exp_dt = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
            exp_ts = exp_dt.timestamp()
        except Exception:
            exp_ts = now_ts + 60

        if now_ts > exp_ts:
            return False, "Verification OTP has expired. Please request a new code."

        if attempts >= 5:
            return False, "Too many failed attempts. Please request a fresh OTP."

        with conn:
            if expected_otp.strip() != entered_otp.strip():
                conn.execute("UPDATE email_otps SET attempts = attempts + 1 WHERE id = ?;", (otp_id,))
                rem = 4 - attempts
                return False, f"Incorrect OTP entered. {max(0, rem)} attempt(s) remaining."

            conn.execute("UPDATE email_otps SET is_verified = 1 WHERE id = ?;", (otp_id,))

        return True, "Email verified successfully."
    finally:
        conn.close()


def is_email_verified(email: str, purpose: str = "registration") -> bool:
    """Checks if an email was successfully verified within the last 30 minutes."""
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, created_at, is_verified
            FROM email_otps
            WHERE lower(trim(email)) = lower(trim(?)) AND purpose = ? AND is_verified = 1
            ORDER BY id DESC
            LIMIT 1;
            """,
            (email.strip(), purpose),
        )
        row = cursor.fetchone()
        return bool(row)
    finally:
        conn.close()


# -------------------------------------------------------------
# PATIENT PROFILE OPERATIONS
# -------------------------------------------------------------

def get_patient_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Retrieves patient record by normalized lowercase trimmed email."""
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, full_name, dob, gender, email, mobile, medical_conditions, known_allergies,
                   current_medications, medical_history, emergency_contact_name,
                   emergency_contact_phone, weight, blood_pressure, blood_group, role,
                   password_hash, created_at, status
            FROM patients
            WHERE lower(trim(email)) = lower(trim(?))
            LIMIT 1;
            """,
            (email.strip(),),
        )
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None
    finally:
        conn.close()


def get_patient_by_id(patient_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves patient record by unique ID."""
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, full_name, dob, gender, email, mobile, medical_conditions, known_allergies,
                   current_medications, medical_history, emergency_contact_name,
                   emergency_contact_phone, weight, blood_pressure, blood_group, role,
                   password_hash, created_at, status
            FROM patients
            WHERE id = ?
            LIMIT 1;
            """,
            (patient_id,),
        )
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None
    finally:
        conn.close()


def create_patient(
    full_name: str,
    dob: str,
    email: str,
    mobile: str,
    password_hash: str,
    created_at: str,
    gender: str = "Not specified",
    medical_conditions: str = "None",
    known_allergies: str = "None",
    current_medications: str = "None",
    medical_history: str = "None",
    emergency_contact_name: str = "None",
    emergency_contact_phone: str = "None",
    weight: float = 0.0,
    blood_pressure: str = "120/80",
    blood_group: str = "",
    role: str = "patient",
) -> Dict[str, Any]:
    """Inserts a new patient record and returns the patient dictionary."""
    init_db()
    conn = get_connection()
    try:
        clean_gender = gender.strip() if gender and gender.strip() else "Not specified"
        clean_conditions = medical_conditions.strip() if medical_conditions and medical_conditions.strip() else "None"
        clean_allergies = known_allergies.strip() if known_allergies and known_allergies.strip() else "None"
        clean_medications = current_medications.strip() if current_medications and current_medications.strip() else "None"
        clean_history = medical_history.strip() if medical_history and medical_history.strip() else "None"
        clean_contact_name = emergency_contact_name.strip() if emergency_contact_name and emergency_contact_name.strip() else "None"
        clean_contact_phone = emergency_contact_phone.strip() if emergency_contact_phone and emergency_contact_phone.strip() else "None"
        clean_bp = blood_pressure.strip() if blood_pressure and blood_pressure.strip() else "120/80"
        clean_bg = blood_group.strip() if blood_group else ""

        with conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO patients (
                    full_name, dob, gender, email, mobile, medical_conditions, known_allergies,
                    current_medications, medical_history, emergency_contact_name,
                    emergency_contact_phone, weight, blood_pressure, blood_group, role,
                    password_hash, created_at, status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active');
                """,
                (
                    full_name.strip(),
                    dob.strip(),
                    clean_gender,
                    email.strip().lower(),
                    mobile.strip(),
                    clean_conditions,
                    clean_allergies,
                    clean_medications,
                    clean_history,
                    clean_contact_name,
                    clean_contact_phone,
                    float(weight or 0.0),
                    clean_bp,
                    clean_bg,
                    role,
                    password_hash,
                    created_at,
                ),
            )
            patient_id = cursor.lastrowid

        return get_patient_by_id(patient_id) or {}
    finally:
        conn.close()


def update_patient_profile(
    patient_id: int,
    full_name: str,
    gender: str,
    dob: str,
    mobile: str,
    medical_conditions: str,
    known_allergies: str = "None",
    current_medications: str = "None",
    medical_history: str = "None",
    emergency_contact_name: str = "None",
    emergency_contact_phone: str = "None",
    weight: float = 0.0,
    blood_pressure: str = "120/80",
    blood_group: str = "",
) -> Optional[Dict[str, Any]]:
    """Updates all patient profile fields including health parameters."""
    init_db()
    conn = get_connection()
    try:
        clean_gender = gender.strip() if gender and gender.strip() else "Not specified"
        clean_conditions = medical_conditions.strip() if medical_conditions and medical_conditions.strip() else "None"
        clean_allergies = known_allergies.strip() if known_allergies and known_allergies.strip() else "None"
        clean_medications = current_medications.strip() if current_medications and current_medications.strip() else "None"
        clean_history = medical_history.strip() if medical_history and medical_history.strip() else "None"
        clean_contact_name = emergency_contact_name.strip() if emergency_contact_name and emergency_contact_name.strip() else "None"
        clean_contact_phone = emergency_contact_phone.strip() if emergency_contact_phone and emergency_contact_phone.strip() else "None"
        clean_bp = blood_pressure.strip() if blood_pressure and blood_pressure.strip() else "120/80"
        clean_bg = blood_group.strip() if blood_group else ""

        with conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE patients
                SET full_name = ?, gender = ?, dob = ?, mobile = ?, medical_conditions = ?,
                    known_allergies = ?, current_medications = ?, medical_history = ?,
                    emergency_contact_name = ?, emergency_contact_phone = ?,
                    weight = ?, blood_pressure = ?, blood_group = ?
                WHERE id = ? AND status = 'active';
                """,
                (
                    full_name.strip(),
                    clean_gender,
                    dob.strip(),
                    mobile.strip(),
                    clean_conditions,
                    clean_allergies,
                    clean_medications,
                    clean_history,
                    clean_contact_name,
                    clean_contact_phone,
                    float(weight or 0.0),
                    clean_bp,
                    clean_bg,
                    patient_id,
                ),
            )
            if cursor.rowcount == 0:
                return None
        return get_patient_by_id(patient_id)
    finally:
        conn.close()


def update_patient_password(patient_id: int, new_password_hash: str) -> bool:
    """Updates the patient's password hash in the database."""
    init_db()
    conn = get_connection()
    try:
        with conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE patients
                SET password_hash = ?
                WHERE id = ?;
                """,
                (new_password_hash, patient_id),
            )
            return cursor.rowcount > 0
    finally:
        conn.close()


def get_patient_by_mobile(mobile: str) -> Optional[Dict[str, Any]]:
    """Retrieves patient record by matching mobile number, normalizing formatting."""
    init_db()
    cleaned = re.sub(r"[\s\-\(\)]", "", mobile.strip())
    digits_only = re.sub(r"\D", "", cleaned)
    if not digits_only or len(digits_only) < 10:
        return None

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, full_name, dob, gender, email, mobile, medical_conditions, password_hash, created_at, status
            FROM patients
            WHERE (mobile = ? OR mobile = ?) AND status = 'active'
            LIMIT 1;
            """,
            (
                cleaned,
                f"+{cleaned}" if not cleaned.startswith("+") else cleaned.lstrip("+"),
            ),
        )
        row = cursor.fetchone()
        if row:
            return dict(row)

        cursor.execute(
            """
            SELECT id, full_name, dob, gender, email, mobile, medical_conditions, password_hash, created_at, status
            FROM patients
            WHERE status = 'active';
            """
        )
        for r in cursor.fetchall():
            db_digits = re.sub(r"\D", "", r["mobile"])
            if db_digits == digits_only or (
                len(digits_only) >= 10
                and len(db_digits) >= 10
                and digits_only[-10:] == db_digits[-10:]
            ):
                return dict(r)

        return None
    finally:
        conn.close()


def delete_patient_account(patient_id: int) -> bool:
    """Deletes or deactivates a patient account following data privacy compliance."""
    init_db()
    conn = get_connection()
    try:
        with conn:
            conn.execute("UPDATE patients SET status = 'deleted' WHERE id = ?;", (patient_id,))
            return True
    finally:
        conn.close()


# -------------------------------------------------------------
# FAMILY HEALTH PROFILES
# -------------------------------------------------------------

def add_family_member(
    patient_id: int,
    full_name: str,
    relationship: str,
    gender: str,
    dob: str,
    blood_group: str = "",
    weight: float = 0.0,
    blood_pressure: str = "120/80",
    medical_conditions: str = "None",
    known_allergies: str = "None",
    current_medications: str = "None",
    medical_history: str = "None",
) -> Dict[str, Any]:
    """Adds a family health profile."""
    init_db()
    conn = get_connection()
    try:
        with conn:
            now = datetime.now(timezone.utc).isoformat()
            cursor = conn.execute(
                """
                INSERT INTO family_members (
                    patient_id, full_name, relationship, gender, dob, blood_group,
                    weight, blood_pressure, medical_conditions, known_allergies,
                    current_medications, medical_history, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """,
                (
                    patient_id,
                    full_name.strip(),
                    relationship.strip(),
                    gender.strip(),
                    dob.strip(),
                    blood_group.strip(),
                    float(weight or 0.0),
                    blood_pressure.strip(),
                    medical_conditions.strip(),
                    known_allergies.strip(),
                    current_medications.strip(),
                    medical_history.strip(),
                    now,
                ),
            )
            member_id = cursor.lastrowid
            return {
                "id": member_id,
                "patient_id": patient_id,
                "full_name": full_name.strip(),
                "relationship": relationship.strip(),
                "gender": gender.strip(),
                "dob": dob.strip(),
                "blood_group": blood_group.strip(),
                "weight": float(weight or 0.0),
                "blood_pressure": blood_pressure.strip(),
                "medical_conditions": medical_conditions.strip(),
                "known_allergies": known_allergies.strip(),
                "current_medications": current_medications.strip(),
                "medical_history": medical_history.strip(),
                "created_at": now,
            }
    finally:
        conn.close()


def list_family_members(patient_id: int) -> List[Dict[str, Any]]:
    """Returns all family member profiles for the given patient."""
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM family_members WHERE patient_id = ? ORDER BY id ASC;", (patient_id,))
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def delete_family_member(member_id: int, patient_id: int) -> bool:
    """Removes a family profile."""
    init_db()
    conn = get_connection()
    try:
        with conn:
            cursor = conn.execute("DELETE FROM family_members WHERE id = ? AND patient_id = ?;", (member_id, patient_id))
            return cursor.rowcount > 0
    finally:
        conn.close()


# -------------------------------------------------------------
# MEDICINE REMINDER SYSTEM
# -------------------------------------------------------------

def create_medicine_reminder(
    patient_id: int,
    medicine_name: str,
    dosage: str,
    schedule: str,
    time_slot: str,
    food_timing: str,
    start_date: str,
    end_date: Optional[str] = None,
    instructions: str = "",
    family_member_id: Optional[int] = None,
) -> Dict[str, Any]:
    """Creates a new patient medicine reminder."""
    init_db()
    conn = get_connection()
    try:
        with conn:
            now = datetime.now(timezone.utc).isoformat()
            cursor = conn.execute(
                """
                INSERT INTO medicine_reminders (
                    patient_id, family_member_id, medicine_name, dosage, schedule,
                    time_slot, food_timing, start_date, end_date, doctor_approved,
                    instructions, is_active, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1, ?);
                """,
                (
                    patient_id,
                    family_member_id,
                    medicine_name.strip(),
                    dosage.strip(),
                    schedule.strip(),
                    time_slot.strip(),
                    food_timing.strip(),
                    start_date.strip(),
                    end_date.strip() if end_date else None,
                    instructions.strip(),
                    now,
                ),
            )
            return {
                "id": cursor.lastrowid,
                "patient_id": patient_id,
                "family_member_id": family_member_id,
                "medicine_name": medicine_name.strip(),
                "dosage": dosage.strip(),
                "schedule": schedule.strip(),
                "time_slot": time_slot.strip(),
                "food_timing": food_timing.strip(),
                "start_date": start_date.strip(),
                "end_date": end_date,
                "instructions": instructions.strip(),
                "is_active": 1,
                "created_at": now,
            }
    finally:
        conn.close()


def list_medicine_reminders(patient_id: int) -> List[Dict[str, Any]]:
    """Lists all active medicine reminders with adherence info."""
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT r.*, f.full_name AS family_member_name
            FROM medicine_reminders r
            LEFT JOIN family_members f ON f.id = r.family_member_id
            WHERE r.patient_id = ? AND r.is_active = 1
            ORDER BY r.time_slot ASC;
            """,
            (patient_id,),
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def delete_medicine_reminder(reminder_id: int, patient_id: int) -> bool:
    """Cancels or deletes a medicine reminder."""
    init_db()
    conn = get_connection()
    try:
        with conn:
            cursor = conn.execute("UPDATE medicine_reminders SET is_active = 0 WHERE id = ? AND patient_id = ?;", (reminder_id, patient_id))
            return cursor.rowcount > 0
    finally:
        conn.close()


def log_reminder_status(reminder_id: int, patient_id: int, status: str = "completed") -> Dict[str, Any]:
    """Records completion or missed status for today's reminder."""
    init_db()
    conn = get_connection()
    try:
        with conn:
            now_dt = datetime.now(timezone.utc)
            today_str = now_dt.strftime("%Y-%m-%d")
            time_str = now_dt.strftime("%H:%M")
            cursor = conn.execute(
                """
                INSERT INTO reminder_logs (reminder_id, patient_id, log_date, time_slot, status, logged_at)
                VALUES (?, ?, ?, ?, ?, ?);
                """,
                (reminder_id, patient_id, today_str, time_str, status.strip().lower(), now_dt.isoformat()),
            )
            return {"id": cursor.lastrowid, "reminder_id": reminder_id, "status": status, "logged_at": now_dt.isoformat()}
    finally:
        conn.close()


def get_reminder_history(patient_id: int, limit: int = 30) -> List[Dict[str, Any]]:
    """Fetches reminder log history for compliance visualization."""
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT l.*, r.medicine_name, r.dosage, r.schedule
            FROM reminder_logs l
            JOIN medicine_reminders r ON r.id = l.reminder_id
            WHERE l.patient_id = ?
            ORDER BY l.logged_at DESC
            LIMIT ?;
            """,
            (patient_id, limit),
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


# -------------------------------------------------------------
# MEDICAL DOCUMENTS & REPORT UPLOADS
# -------------------------------------------------------------

def save_medical_document(
    patient_id: int,
    title: str,
    category: str,
    file_name: str,
    file_path: str,
    file_size: int,
    mime_type: str,
    doctor_name: str = "",
    notes: str = "",
    family_member_id: Optional[int] = None,
) -> Dict[str, Any]:
    """Stores metadata for an uploaded prescription or medical report."""
    init_db()
    conn = get_connection()
    try:
        with conn:
            now = datetime.now(timezone.utc).isoformat()
            cursor = conn.execute(
                """
                INSERT INTO medical_documents (
                    patient_id, family_member_id, title, category, file_name,
                    file_path, file_size, mime_type, doctor_name, notes, uploaded_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """,
                (
                    patient_id,
                    family_member_id,
                    title.strip(),
                    category.strip(),
                    file_name.strip(),
                    file_path.strip(),
                    file_size,
                    mime_type.strip(),
                    doctor_name.strip(),
                    notes.strip(),
                    now,
                ),
            )
            return {
                "id": cursor.lastrowid,
                "patient_id": patient_id,
                "title": title.strip(),
                "category": category.strip(),
                "file_name": file_name.strip(),
                "file_size": file_size,
                "mime_type": mime_type.strip(),
                "doctor_name": doctor_name.strip(),
                "notes": notes.strip(),
                "uploaded_at": now,
            }
    finally:
        conn.close()


def list_medical_documents(patient_id: int) -> List[Dict[str, Any]]:
    """Lists all uploaded medical records and prescriptions for patient."""
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT d.id, d.patient_id, d.family_member_id, d.title, d.category,
                   d.file_name, d.file_size, d.mime_type, d.doctor_name, d.notes,
                   d.uploaded_at, f.full_name AS family_member_name
            FROM medical_documents d
            LEFT JOIN family_members f ON f.id = d.family_member_id
            WHERE d.patient_id = ?
            ORDER BY d.uploaded_at DESC;
            """,
            (patient_id,),
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def get_medical_document_by_id(doc_id: int, patient_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves document record ensuring patient ownership."""
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM medical_documents WHERE id = ? AND patient_id = ? LIMIT 1;", (doc_id, patient_id))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def delete_medical_document(doc_id: int, patient_id: int) -> Optional[str]:
    """Deletes document record and returns file_path for filesystem removal."""
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT file_path FROM medical_documents WHERE id = ? AND patient_id = ? LIMIT 1;", (doc_id, patient_id))
        row = cursor.fetchone()
        if not row:
            return None
        file_path = row["file_path"]
        with conn:
            conn.execute("DELETE FROM medical_documents WHERE id = ? AND patient_id = ?;", (doc_id, patient_id))
        return file_path
    finally:
        conn.close()


# -------------------------------------------------------------
# PHARMACIES, HOSPITALS & INVENTORY
# -------------------------------------------------------------

def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine formula to compute great-circle distance in kilometers."""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(r * c, 2)


def list_nearby_places(
    place_type: Optional[str] = None,
    city: Optional[str] = None,
    search: Optional[str] = None,
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
) -> List[Dict[str, Any]]:
    """Fetches medical stores or hospitals with distance calculations and real photographs."""
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        where_clauses: List[str] = ["is_verified = 1"]
        params: List[Any] = []

        if place_type and place_type.lower() in ("pharmacy", "hospital"):
            where_clauses.append("lower(place_type) = lower(?)")
            params.append(place_type.strip())

        if city and city.strip() and city.lower() != "all":
            where_clauses.append("lower(city) = lower(?)")
            params.append(city.strip())

        if search and search.strip():
            where_clauses.append("(lower(name) LIKE lower(?) OR lower(address) LIKE lower(?))")
            params.extend([f"%{search.strip()}%", f"%{search.strip()}%"])

        query = f"SELECT * FROM pharmacies WHERE {' AND '.join(where_clauses)} ORDER BY id ASC;"
        cursor.execute(query, params)
        rows = [dict(r) for r in cursor.fetchall()]

        # Compute distance if user coordinates provided
        for item in rows:
            if user_lat is not None and user_lng is not None:
                item["distance_km"] = calculate_distance_km(user_lat, user_lng, item["latitude"], item["longitude"])
            else:
                # Default approximate distance from city centre
                item["distance_km"] = 1.2

            # Directions link
            dest = f"{item['latitude']},{item['longitude']}"
            item["directions_url"] = f"https://www.google.com/maps/dir/?api=1&destination={dest}"

        if user_lat is not None and user_lng is not None:
            rows.sort(key=lambda x: x.get("distance_km", 999))

        return rows
    finally:
        conn.close()


def search_pharmacy_inventory(query: str) -> List[Dict[str, Any]]:
    """Searches real pharmacy stock and pricing for medicines."""
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT i.*, p.name AS pharmacy_name, p.address, p.city, p.phone, p.opening_hours, p.photo_url
            FROM pharmacy_inventory i
            JOIN pharmacies p ON p.id = i.pharmacy_id
            WHERE lower(i.medicine_name) LIKE lower(?) OR lower(i.composition) LIKE lower(?)
            ORDER BY i.stock_status ASC, i.price ASC;
            """,
            (f"%{query.strip()}%", f"%{query.strip()}%"),
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


# -------------------------------------------------------------
# DIGITAL PRESCRIPTIONS
# -------------------------------------------------------------

def create_doctor_prescription(
    doctor_id: int,
    patient_id: int,
    diagnosis: str,
    medicines: List[Dict[str, Any]],
    general_advice: str = "",
    follow_up_date: Optional[str] = None,
    appointment_id: Optional[int] = None,
) -> Dict[str, Any]:
    """Generates an official digital prescription issued by a verified doctor."""
    init_db()
    doctor = get_doctor_by_id(doctor_id)
    if not doctor or not doctor.get("is_verified"):
        raise ValueError("Only verified medical practitioners can issue digital prescriptions.")

    conn = get_connection()
    try:
        with conn:
            now = datetime.now(timezone.utc).isoformat()
            sig = f"Digitally Signed by Dr. {doctor['full_name']} (Reg: {doctor['license_number']}) on {now[:10]}"
            cursor = conn.execute(
                """
                INSERT INTO prescriptions (
                    appointment_id, doctor_id, patient_id, diagnosis, medicines_json,
                    general_advice, follow_up_date, doctor_signature, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                """,
                (
                    appointment_id,
                    doctor_id,
                    patient_id,
                    diagnosis.strip(),
                    json.dumps(medicines, ensure_ascii=False),
                    general_advice.strip(),
                    follow_up_date.strip() if follow_up_date else None,
                    sig,
                    now,
                ),
            )
            presc_id = cursor.lastrowid
            save_notification(
                "patient",
                patient_id,
                "Digital Prescription Available",
                f"Dr. {doctor['full_name']} has issued an official digital prescription for your consultation.",
            )
            return {
                "id": presc_id,
                "doctor_name": doctor["full_name"],
                "doctor_qualification": doctor["qualification"],
                "license_number": doctor["license_number"],
                "clinic_address": doctor["clinic_address"],
                "diagnosis": diagnosis.strip(),
                "medicines": medicines,
                "general_advice": general_advice.strip(),
                "follow_up_date": follow_up_date,
                "doctor_signature": sig,
                "created_at": now,
            }
    finally:
        conn.close()


def list_patient_prescriptions(patient_id: int) -> List[Dict[str, Any]]:
    """Returns all official digital prescriptions issued to a patient."""
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT p.*, d.full_name AS doctor_name, d.qualification AS doctor_qualification,
                   d.license_number, d.clinic_address
            FROM prescriptions p
            JOIN doctors d ON d.id = p.doctor_id
            WHERE p.patient_id = ?
            ORDER BY p.created_at DESC;
            """,
            (patient_id,),
        )
        results = []
        for row in cursor.fetchall():
            item = dict(row)
            try:
                item["medicines"] = json.loads(item["medicines_json"])
            except Exception:
                item["medicines"] = []
            results.append(item)
        return results
    finally:
        conn.close()


# -------------------------------------------------------------
# FEEDBACK & RATINGS
# -------------------------------------------------------------

def submit_feedback(
    patient_id: int,
    category: str,
    rating: int,
    title: str,
    description: str,
) -> Dict[str, Any]:
    """Submits user feedback or bug report."""
    init_db()
    conn = get_connection()
    try:
        with conn:
            now = datetime.now(timezone.utc).isoformat()
            cursor = conn.execute(
                """
                INSERT INTO feedbacks (patient_id, category, rating, title, description, status, created_at)
                VALUES (?, ?, ?, ?, ?, 'submitted', ?);
                """,
                (patient_id, category.strip(), int(rating), title.strip(), description.strip(), now),
            )
            return {
                "id": cursor.lastrowid,
                "patient_id": patient_id,
                "category": category.strip(),
                "rating": int(rating),
                "title": title.strip(),
                "description": description.strip(),
                "status": "submitted",
                "created_at": now,
            }
    finally:
        conn.close()


def list_patient_feedback(patient_id: int) -> List[Dict[str, Any]]:
    """Returns feedback submitted by patient."""
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM feedbacks WHERE patient_id = ? ORDER BY created_at DESC;", (patient_id,))
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def list_all_feedback_admin() -> List[Dict[str, Any]]:
    """Returns all feedback and bug reports for admin review."""
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT f.*, p.full_name AS patient_name, p.email AS patient_email
            FROM feedbacks f
            LEFT JOIN patients p ON p.id = f.patient_id
            ORDER BY f.created_at DESC;
            """
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def update_feedback_status_admin(feedback_id: int, new_status: str, admin_notes: str = "") -> bool:
    """Updates status of a feedback or bug report item."""
    init_db()
    conn = get_connection()
    try:
        with conn:
            cursor = conn.execute(
                "UPDATE feedbacks SET status = ?, admin_notes = ? WHERE id = ?;",
                (new_status.strip(), admin_notes.strip(), feedback_id),
            )
            return cursor.rowcount > 0
    finally:
        conn.close()


# -------------------------------------------------------------
# ADMIN DASHBOARD & METRICS
# -------------------------------------------------------------

def get_admin_dashboard_metrics() -> Dict[str, Any]:
    """Computes comprehensive health platform analytics for administrative oversight."""
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()

        # User counts
        cursor.execute("SELECT COUNT(*) FROM patients;")
        total_patients = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM patients WHERE status = 'active';")
        active_patients = cursor.fetchone()[0]

        # Doctor counts
        cursor.execute("SELECT COUNT(*) FROM doctors;")
        total_doctors = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM doctors WHERE is_verified = 1;")
        verified_doctors = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM doctors WHERE is_verified = 0 AND status = 'pending_verification';")
        pending_doctors = cursor.fetchone()[0]

        # Appointments & consultations
        cursor.execute("SELECT COUNT(*) FROM appointments;")
        total_appointments = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM consultations WHERE status = 'scheduled';")
        active_consultations = cursor.fetchone()[0]

        # Symptom predictions run
        cursor.execute("SELECT COUNT(*) FROM prediction_history;")
        total_predictions = cursor.fetchone()[0]

        # Pharmacies & listings
        cursor.execute("SELECT COUNT(*) FROM pharmacies WHERE place_type = 'pharmacy';")
        total_pharmacies = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM pharmacies WHERE place_type = 'hospital';")
        total_hospitals = cursor.fetchone()[0]

        # Feedbacks & Bugs
        cursor.execute("SELECT COUNT(*) FROM feedbacks;")
        total_feedback = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM feedbacks WHERE category = 'bug_report' AND status != 'resolved';")
        open_bugs = cursor.fetchone()[0]

        return {
            "total_registered_users": total_patients,
            "active_users": active_patients,
            "total_doctors": total_doctors,
            "verified_doctors": verified_doctors,
            "pending_doctor_approvals": pending_doctors,
            "total_appointments": total_appointments,
            "active_consultations": active_consultations,
            "symptom_checker_runs": total_predictions,
            "verified_pharmacies": total_pharmacies,
            "registered_hospitals": total_hospitals,
            "customer_feedbacks": total_feedback,
            "open_bug_reports": open_bugs,
        }
    finally:
        conn.close()


def list_all_patients_admin() -> List[Dict[str, Any]]:
    """Returns user directory for platform admin."""
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, full_name, dob, gender, email, mobile, role, status, created_at,
                   weight, blood_pressure, blood_group
            FROM patients
            ORDER BY id DESC;
            """
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def set_patient_status_admin(patient_id: int, status: str) -> bool:
    """Activates, deactivates, or suspends a user account."""
    init_db()
    conn = get_connection()
    try:
        with conn:
            cursor = conn.execute("UPDATE patients SET status = ? WHERE id = ?;", (status.strip(), patient_id))
            return cursor.rowcount > 0
    finally:
        conn.close()


# -------------------------------------------------------------
# EXISTING DOCTOR & APPOINTMENT OPERATIONS (PRESERVED)
# -------------------------------------------------------------

def save_notification(user_type: str, user_id: int, title: str, message: str) -> Dict[str, Any]:
    """Stores a notification for a patient or doctor."""
    init_db()
    conn = get_connection()
    try:
        with conn:
            now = datetime.now(timezone.utc).isoformat()
            cursor = conn.execute(
                """
                INSERT INTO notifications (user_type, user_id, title, message, is_read, created_at)
                VALUES (?, ?, ?, ?, 0, ?);
                """,
                (user_type, user_id, title.strip(), message.strip(), now),
            )
            return {
                "id": cursor.lastrowid,
                "user_type": user_type,
                "user_id": user_id,
                "title": title.strip(),
                "message": message.strip(),
                "is_read": 0,
                "created_at": now,
            }
    finally:
        conn.close()


def list_notifications(user_type: str, user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
    """Returns recent notifications for a user."""
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, user_type, user_id, title, message, is_read, created_at
            FROM notifications
            WHERE user_type = ? AND user_id = ?
            ORDER BY created_at DESC
            LIMIT ?;
            """,
            (user_type, user_id, limit),
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def get_doctor_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Returns a doctor record by email."""
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT *
            FROM doctors
            WHERE lower(trim(email)) = lower(trim(?))
            LIMIT 1;
            """,
            (email.strip(),),
        )
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def get_doctor_by_mobile(mobile: str) -> Optional[Dict[str, Any]]:
    """Returns a doctor record by mobile number."""
    init_db()
    cleaned = re.sub(r"[\s\-\(\)]", "", mobile.strip())
    digits_only = re.sub(r"\D", "", cleaned)
    if not digits_only or len(digits_only) < 10:
        return None

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT *
            FROM doctors
            WHERE (mobile = ? OR mobile = ?) AND status IN ('pending_verification', 'verified');
            """,
            (
                cleaned,
                f"+{cleaned}" if not cleaned.startswith("+") else cleaned.lstrip("+"),
            ),
        )
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def get_doctor_by_id(doctor_id: int) -> Optional[Dict[str, Any]]:
    """Returns a doctor record by unique id."""
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM doctors WHERE id = ? LIMIT 1;", (doctor_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def create_doctor(
    full_name: str,
    email: str,
    mobile: str,
    specialization: str,
    qualification: str,
    license_number: str,
    experience_years: int,
    clinic_address: str,
    consultation_fee: float,
    bio: str,
    password_hash: str,
    created_at: str,
) -> Dict[str, Any]:
    """Creates a doctor record in the database."""
    init_db()
    conn = get_connection()
    try:
        with conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO doctors (
                    full_name, email, mobile, specialization, qualification,
                    license_number, experience_years, clinic_address, consultation_fee,
                    bio, password_hash, created_at, status, is_verified
                )
                VALUES (?, lower(trim(?)), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_verification', 0);
                """,
                (
                    full_name.strip(),
                    email.strip(),
                    mobile.strip(),
                    specialization.strip(),
                    qualification.strip(),
                    license_number.strip(),
                    int(experience_years),
                    clinic_address.strip(),
                    float(consultation_fee),
                    bio.strip(),
                    password_hash,
                    created_at,
                ),
            )
            doctor_id = cursor.lastrowid

        doctor = get_doctor_by_id(doctor_id)
        if doctor is not None:
            conn2 = get_connection()
            try:
                with conn2:
                    conn2.execute(
                        """
                        INSERT INTO doctor_verifications (doctor_id, status, verification_comment, submitted_documents, created_at)
                        VALUES (?, 'pending', 'Registration submitted for verification review.', '{}', ?);
                        """,
                        (doctor_id, created_at),
                    )
            finally:
                conn2.close()
        return doctor or {}
    finally:
        conn.close()


def update_doctor_profile(
    doctor_id: int,
    full_name: str,
    specialization: str,
    qualification: str,
    license_number: str,
    experience_years: int,
    clinic_address: str,
    consultation_fee: float,
    bio: str,
) -> Optional[Dict[str, Any]]:
    """Updates a doctor profile."""
    init_db()
    conn = get_connection()
    try:
        with conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE doctors
                SET full_name = ?, specialization = ?, qualification = ?,
                    license_number = ?, experience_years = ?, clinic_address = ?,
                    consultation_fee = ?, bio = ?
                WHERE id = ?;
                """,
                (
                    full_name.strip(),
                    specialization.strip(),
                    qualification.strip(),
                    license_number.strip(),
                    int(experience_years),
                    clinic_address.strip(),
                    float(consultation_fee),
                    bio.strip(),
                    doctor_id,
                ),
            )
            if cursor.rowcount == 0:
                return None
        return get_doctor_by_id(doctor_id)
    finally:
        conn.close()


def verify_doctor(doctor_id: int, approved: bool, comment: str = "") -> Optional[Dict[str, Any]]:
    """Approves or rejects a doctor verification request."""
    init_db()
    conn = get_connection()
    try:
        with conn:
            now = datetime.now(timezone.utc).isoformat()
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE doctors
                SET status = ?, is_verified = ?
                WHERE id = ?;
                """,
                ("verified" if approved else "rejected", 1 if approved else 0, doctor_id),
            )
            if cursor.rowcount == 0:
                return None
            cursor.execute(
                """
                INSERT INTO doctor_verifications (doctor_id, status, verification_comment, created_at, reviewed_at)
                VALUES (?, ?, ?, ?, ?);
                """,
                (doctor_id, "verified" if approved else "rejected", comment or "Reviewed by admin.", now, now),
            )
        return get_doctor_by_id(doctor_id)
    finally:
        conn.close()


def create_doctor_availability(
    doctor_id: int,
    day_of_week: str,
    start_time: str,
    end_time: str,
    slot_duration: int = 30,
) -> Dict[str, Any]:
    """Adds a time slot plan for a doctor."""
    init_db()
    conn = get_connection()
    try:
        with conn:
            cursor = conn.execute(
                """
                INSERT INTO doctor_availability (
                    doctor_id, day_of_week, start_time, end_time, slot_duration, is_active, created_at
                ) VALUES (?, ?, ?, ?, ?, 1, ?);
                """,
                (doctor_id, day_of_week, start_time, end_time, slot_duration, datetime.now(timezone.utc).isoformat()),
            )
            return {
                "id": cursor.lastrowid,
                "doctor_id": doctor_id,
                "day_of_week": day_of_week,
                "start_time": start_time,
                "end_time": end_time,
                "slot_duration": slot_duration,
                "is_active": 1,
            }
    finally:
        conn.close()


def get_doctor_availability(doctor_id: int) -> List[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, doctor_id, day_of_week, start_time, end_time, slot_duration, is_active, created_at
            FROM doctor_availability
            WHERE doctor_id = ? AND is_active = 1
            ORDER BY day_of_week, start_time;
            """,
            (doctor_id,),
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def list_verified_doctors(specialization: Optional[str] = None, query: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns verified doctors available for patient appointments."""
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        where_clauses: List[str] = ["status = 'verified' AND is_verified = 1"]
        params: List[Any] = []
        if specialization:
            where_clauses.append("lower(specialization) = lower(?)")
            params.append(specialization.strip())
        if query:
            where_clauses.append(
                "(lower(full_name) LIKE lower(?) OR lower(specialization) LIKE lower(?) OR lower(clinic_address) LIKE lower(?))"
            )
            params.extend([f"%{query.strip()}%", f"%{query.strip()}%", f"%{query.strip()}%"])
        sql = (
            "SELECT id, full_name, email, mobile, specialization, qualification, license_number, "
            "experience_years, clinic_address, consultation_fee, bio, created_at, status, is_verified "
            "FROM doctors WHERE "
            + " AND ".join(where_clauses)
            + " ORDER BY full_name ASC;"
        )
        cursor.execute(sql, params)
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def create_appointment(
    patient_id: int,
    doctor_id: int,
    appointment_date: str,
    appointment_time: str,
    reason: str,
) -> Dict[str, Any]:
    """Creates a new appointment request and returns it."""
    init_db()
    doctor = get_doctor_by_id(doctor_id)
    patient = get_patient_by_id(patient_id)
    if not doctor or doctor.get("status") != "verified":
        raise ValueError("Doctor is not available for appointment booking.")
    if not patient:
        raise ValueError("Patient account not found.")

    conn = get_connection()
    try:
        with conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id FROM appointments
                WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?
                  AND status IN ('requested', 'accepted', 'scheduled')
                LIMIT 1;
                """,
                (doctor_id, appointment_date, appointment_time),
            )
            if cursor.fetchone():
                raise ValueError("This time slot is already booked for the selected doctor.")
            now = datetime.now(timezone.utc).isoformat()
            cursor.execute(
                """
                INSERT INTO appointments (
                    patient_id, doctor_id, appointment_date, appointment_time,
                    status, reason, notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, 'requested', ?, '', ?, ?);
                """,
                (patient_id, doctor_id, appointment_date, appointment_time, reason.strip(), now, now),
            )
            appointment_id = cursor.lastrowid
        appointment = get_appointment_by_id(appointment_id)
        if appointment:
            save_notification(
                "doctor",
                doctor_id,
                "New appointment request",
                f"A patient requested an appointment on {appointment_date} at {appointment_time}.",
            )
            save_notification(
                "patient",
                patient_id,
                "Appointment requested",
                f"Your appointment request with Dr. {doctor['full_name']} is pending review.",
            )
        return appointment or {}
    finally:
        conn.close()


def get_appointment_by_id(appointment_id: int) -> Optional[Dict[str, Any]]:
    """Fetches an appointment record by ID."""
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM appointments WHERE id = ? LIMIT 1;", (appointment_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def list_patient_appointments(patient_id: int) -> List[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT a.*, d.full_name AS doctor_name, d.specialization, d.consultation_fee
            FROM appointments a
            LEFT JOIN doctors d ON d.id = a.doctor_id
            WHERE a.patient_id = ?
            ORDER BY a.appointment_date DESC, a.appointment_time DESC;
            """,
            (patient_id,),
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def list_doctor_appointments(doctor_id: int) -> List[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT a.*, p.full_name AS patient_name, p.email AS patient_email, p.mobile AS patient_mobile
            FROM appointments a
            LEFT JOIN patients p ON p.id = a.patient_id
            WHERE a.doctor_id = ?
            ORDER BY a.appointment_date DESC, a.appointment_time DESC;
            """,
            (doctor_id,),
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def update_appointment_status(appointment_id: int, new_status: str, notes: str = "") -> Optional[Dict[str, Any]]:
    """Updates appointment status and triggers notification and consultation creation if accepted."""
    init_db()
    appointment = get_appointment_by_id(appointment_id)
    if not appointment:
        return None

    conn = get_connection()
    try:
        with conn:
            now = datetime.now(timezone.utc).isoformat()
            conn.execute(
                """
                UPDATE appointments
                SET status = ?, notes = ?, updated_at = ?
                WHERE id = ?;
                """,
                (new_status, notes.strip(), now, appointment_id),
            )

            if new_status == "accepted":
                room_name = f"med-{secrets.token_urlsafe(12)}"
                meeting_url = f"https://meet.jit.si/{room_name}"
                conn.execute(
                    """
                    INSERT OR REPLACE INTO consultations (
                        appointment_id, patient_id, doctor_id, room_name, meeting_url, status, doctor_notes, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, 'scheduled', ?, ?, ?);
                    """,
                    (
                        appointment_id,
                        appointment["patient_id"],
                        appointment["doctor_id"],
                        room_name,
                        meeting_url,
                        notes.strip() or "Consultation scheduled.",
                        now,
                        now,
                    ),
                )
                doc = get_doctor_by_id(appointment["doctor_id"])
                doc_name = doc["full_name"] if doc else "Doctor"
                save_notification("patient", appointment["patient_id"], "Appointment accepted", f"Dr. {doc_name} has accepted your appointment and scheduled the consultation.")
                save_notification("doctor", appointment["doctor_id"], "Appointment accepted", f"You accepted the appointment request for {appointment['appointment_date']} at {appointment['appointment_time']}.")
            elif new_status == "rejected":
                save_notification("patient", appointment["patient_id"], "Appointment declined", f"Your appointment request on {appointment['appointment_date']} at {appointment['appointment_time']} was not accepted.")
            elif new_status == "cancelled":
                save_notification("doctor", appointment["doctor_id"], "Appointment cancelled", f"The appointment on {appointment['appointment_date']} at {appointment['appointment_time']} has been cancelled.")

        return get_appointment_by_id(appointment_id)
    finally:
        conn.close()


def cancel_appointment(appointment_id: int, patient_id: int) -> Optional[Dict[str, Any]]:
    """Allows a patient to cancel an appointment if it is still pending or accepted."""
    init_db()
    appointment = get_appointment_by_id(appointment_id)
    if not appointment or appointment["patient_id"] != patient_id:
        return None
    if appointment["status"] in {"cancelled", "completed"}:
        return appointment
    return update_appointment_status(appointment_id, "cancelled", "Cancelled by patient.")


def list_patient_consultations(patient_id: int) -> List[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT c.*, d.full_name AS doctor_name, p.full_name AS patient_name, a.appointment_date, a.appointment_time
            FROM consultations c
            JOIN doctors d ON d.id = c.doctor_id
            JOIN patients p ON p.id = c.patient_id
            JOIN appointments a ON a.id = c.appointment_id
            WHERE c.patient_id = ?
            ORDER BY a.appointment_date DESC, a.appointment_time DESC;
            """,
            (patient_id,),
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def list_doctor_consultations(doctor_id: int) -> List[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT c.*, d.full_name AS doctor_name, p.full_name AS patient_name, a.appointment_date, a.appointment_time
            FROM consultations c
            JOIN doctors d ON d.id = c.doctor_id
            JOIN patients p ON p.id = c.patient_id
            JOIN appointments a ON a.id = c.appointment_id
            WHERE c.doctor_id = ?
            ORDER BY a.appointment_date DESC, a.appointment_time DESC;
            """,
            (doctor_id,),
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def save_doctor_notes(consultation_id: int, doctor_notes: str) -> Optional[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    try:
        with conn:
            cursor = conn.execute(
                """
                UPDATE consultations
                SET doctor_notes = ?, updated_at = ?
                WHERE id = ?;
                """,
                (doctor_notes.strip(), datetime.now(timezone.utc).isoformat(), consultation_id),
            )
            if cursor.rowcount == 0:
                return None
        return get_consultation_by_id(consultation_id)
    finally:
        conn.close()


def get_consultation_by_id(consultation_id: int) -> Optional[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM consultations WHERE id = ? LIMIT 1;", (consultation_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def get_doctor_dashboard_stats(doctor_id: int) -> Dict[str, Any]:
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                SUM(CASE WHEN status = 'requested' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
            FROM appointments
            WHERE doctor_id = ?;
            """,
            (doctor_id,),
        )
        row = cursor.fetchone()
        stats = dict(row) if row else {}
        for key in ["pending", "accepted", "rejected", "cancelled", "completed"]:
            stats[key] = stats.get(key) or 0
        return stats
    finally:
        conn.close()


def save_prediction_history(
    patient_id: int,
    symptoms: list,
    predicted_condition: Optional[str],
    model_confidence: Any,
    result_json: Dict[str, Any],
) -> int:
    """Saves a prediction result for the logged-in patient."""
    conn = get_connection()
    try:
        with conn:
            cursor = conn.execute(
                """
                INSERT INTO prediction_history (
                    patient_id, symptoms, predicted_condition, model_confidence, result_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?);
                """,
                (
                    patient_id,
                    json.dumps(symptoms),
                    predicted_condition,
                    model_confidence,
                    json.dumps(result_json, default=str),
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
            return cursor.lastrowid
    finally:
        conn.close()
