import base64
from datetime import date, datetime
import hashlib
import hmac
import json
import os
import re
import secrets
import time
from typing import Any, Dict, Optional, Tuple

# Configuration
JWT_SECRET = os.environ.get(
    "JWT_SECRET",
    "ai-med-system-secure-key-2026-production-prototype-token",
)
JWT_EXPIRATION_SECONDS = int(os.environ.get("JWT_EXPIRATION_SECONDS", "604800"))  # 7 days


# -------------------------------------------------------------
# DATE OF BIRTH & MINIMUM AGE VALIDATION (Strict >= 18 years)
# -------------------------------------------------------------

def parse_dob(dob_str: str) -> date:
    """Parses a YYYY-MM-DD date string into a date object."""
    try:
        parsed = datetime.strptime(dob_str.strip(), "%Y-%m-%d").date()
        return parsed
    except ValueError as exc:
        raise ValueError("Date of birth must be a valid date in YYYY-MM-DD format.") from exc


def calculate_age(dob: date, reference_date: Optional[date] = None) -> int:
    """
    Accurately calculates age in full completed years using birthday (month & day).
    """
    if reference_date is None:
        reference_date = date.today()

    age = reference_date.year - dob.year
    if (reference_date.month, reference_date.day) < (dob.month, dob.day):
        age -= 1
    return age


def validate_age_eligibility(dob_str: str) -> Tuple[bool, str, int]:
    """
    Validates DOB against system requirements:
    1. Valid format YYYY-MM-DD
    2. Not a future date
    3. Reasonable lower bound (e.g., within 125 years)
    4. At least 18 years of age

    Returns (is_valid, error_message, calculated_age)
    """
    try:
        dob = parse_dob(dob_str)
    except ValueError as err:
        return False, str(err), 0

    today = date.today()

    if dob > today:
        return False, "Date of birth cannot be in the future.", 0

    if dob.year < (today.year - 125):
        return False, "Please enter a valid date of birth.", 0

    age = calculate_age(dob, today)
    if age < 18:
        return (
            False,
            f"Registration requires users to be at least 18 years of age. Current calculated age is {age}.",
            age,
        )

    return True, "", age


# -------------------------------------------------------------
# MOBILE NUMBER VALIDATION
# -------------------------------------------------------------

def validate_mobile(mobile: str) -> Tuple[bool, str]:
    """
    Validates phone number format: allows optional '+' and between 10 to 15 digits.
    """
    cleaned = re.sub(r"[\s\-\(\)]", "", mobile.strip())
    # Match +[country code] followed by digits, or 10-15 standard digits
    if not re.match(r"^\+?[0-9]{10,15}$", cleaned):
        return (
            False,
            "Mobile number must contain between 10 and 15 digits, with optional '+' country code.",
        )
    return True, cleaned


# -------------------------------------------------------------
# SECURE PASSWORD HASHING (Scrypt RFC 7914)
# -------------------------------------------------------------

def hash_password(password: str) -> str:
    """
    Hashes password using scrypt with a cryptographically secure random 16-byte salt.
    Format: scrypt$n$r$p$salt_b64$hash_b64
    """
    if not password or len(password) < 6:
        raise ValueError("Password must be at least 6 characters long.")

    salt = secrets.token_bytes(16)
    derived = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=16384,
        r=8,
        p=1,
        maxmem=64 * 1024 * 1024,
    )

    salt_b64 = base64.b64encode(salt).decode("utf-8")
    derived_b64 = base64.b64encode(derived).decode("utf-8")
    return f"scrypt$16384$8$1${salt_b64}${derived_b64}"


def verify_password(plain_password: str, stored_hash: str) -> bool:
    """
    Verifies a plain password against the stored scrypt hash using constant-time comparison.
    """
    try:
        parts = stored_hash.split("$")
        if len(parts) != 6 or parts[0] != "scrypt":
            return False

        n = int(parts[1])
        r = int(parts[2])
        p = int(parts[3])
        salt = base64.b64decode(parts[4])
        expected_derived = base64.b64decode(parts[5])

        computed = hashlib.scrypt(
            plain_password.encode("utf-8"),
            salt=salt,
            n=n,
            r=r,
            p=p,
            maxmem=64 * 1024 * 1024,
        )

        return hmac.compare_digest(computed, expected_derived)
    except Exception:
        return False


# -------------------------------------------------------------
# JWT AUTHENTICATION TOKEN (HS256)
# -------------------------------------------------------------

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _base64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_access_token(
    email: str,
    full_name: str,
    expires_delta: Optional[int] = None,
    patient_id: Optional[int] = None,
    doctor_id: Optional[int] = None,
    role: str = "patient",
) -> str:
    """
    Generates a cryptographically signed HS256 JWT access token.
    """
    now = int(time.time())
    exp = now + (expires_delta if expires_delta is not None else JWT_EXPIRATION_SECONDS)

    user_id = patient_id if patient_id is not None else doctor_id
    if user_id is None:
        raise ValueError("Either patient_id or doctor_id is required.")

    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": str(user_id),
        "role": role,
        "email": email.strip().lower(),
        "name": full_name.strip(),
        "iat": now,
        "exp": exp,
    }

    header_bytes = json.dumps(header, separators=(",", ":")).encode("utf-8")
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")

    encoded_header = _base64url_encode(header_bytes)
    encoded_payload = _base64url_encode(payload_bytes)

    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    signature = hmac.new(
        JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256
    ).digest()
    encoded_signature = _base64url_encode(signature)

    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and verifies a JWT token. Returns payload dict or None if invalid or expired.
    """
    try:
        parts = token.strip().split(".")
        if len(parts) != 3:
            return None

        encoded_header, encoded_payload, encoded_signature = parts
        signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
        expected_signature = hmac.new(
            JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256
        ).digest()

        signature = _base64url_decode(encoded_signature)
        if not hmac.compare_digest(signature, expected_signature):
            return None

        payload_bytes = _base64url_decode(encoded_payload)
        payload = json.loads(payload_bytes.decode("utf-8"))

        now = int(time.time())
        if "exp" in payload and payload["exp"] < now:
            return None

        return payload
    except Exception:
        return None
