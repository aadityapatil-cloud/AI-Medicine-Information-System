import logging
import os
import random
import smtplib
import string
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Optional, Tuple

logger = logging.getLogger("email_service")

# SMTP Configuration from Environment Variables
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM = os.environ.get("SMTP_FROM", "no-reply@ai-medicine-system.org")
SMTP_TLS = os.environ.get("SMTP_TLS", "true").lower() in ("true", "1", "yes")

# OTP Settings
OTP_EXPIRATION_SECONDS = int(os.environ.get("OTP_EXPIRATION_SECONDS", "600"))  # 10 minutes

# In-memory OTP storage: email -> {otp, expires_at, attempts, purpose}
_OTP_CACHE: Dict[str, Dict] = {}


def generate_otp(length: int = 6) -> str:
    """Generates a cryptographically strong 6-digit numeric OTP."""
    digits = string.digits
    return "".join(random.choice(digits) for _ in range(length))


def store_otp(email: str, otp: str, purpose: str = "registration") -> None:
    """Stores the OTP in the memory cache and handles expiration."""
    normalized = email.strip().lower()
    _OTP_CACHE[normalized] = {
        "otp": otp,
        "expires_at": time.time() + OTP_EXPIRATION_SECONDS,
        "attempts": 0,
        "purpose": purpose,
    }


def verify_stored_otp(email: str, entered_otp: str) -> Tuple[bool, str]:
    """
    Verifies the submitted OTP against stored value.
    Returns (is_valid, message).
    """
    normalized = email.strip().lower()
    record = _OTP_CACHE.get(normalized)

    if not record:
        return False, "No active OTP found. Please request a new verification code."

    if time.time() > record["expires_at"]:
        _OTP_CACHE.pop(normalized, None)
        return False, "OTP has expired. Please request a new verification code."

    record["attempts"] += 1
    if record["attempts"] > 5:
        _OTP_CACHE.pop(normalized, None)
        return False, "Too many failed attempts. Please request a new OTP."

    if record["otp"] != entered_otp.strip():
        remaining = 5 - record["attempts"]
        return False, f"Incorrect OTP. {remaining} attempt(s) remaining."

    # Verified successfully: remove from cache
    _OTP_CACHE.pop(normalized, None)
    return True, "Email verified successfully."


def send_email_message(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: Optional[str] = None,
) -> bool:
    """
    Sends an email using standard SMTP.
    If SMTP credentials are not configured, logs to console (useful in dev/prototype mode).
    """
    normalized_to = to_email.strip().lower()

    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD:
        # Development / Simulation mode: log to console
        print("\n==================== [OUTGOING EMAIL SIMULATION] ====================")
        print(f"To: {normalized_to}")
        print(f"Subject: {subject}")
        print(f"Content: {text_body or html_body[:200]}...")
        print("=====================================================================\n")
        logger.info(f"[DEV EMAIL SERVICE] SMTP not configured. To: {normalized_to} | Subject: {subject}")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM
        msg["To"] = normalized_to

        if text_body:
            msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
        if SMTP_TLS:
            server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM, [normalized_to], msg.as_string())
        server.quit()
        logger.info(f"Email successfully sent to {normalized_to}")
        return True
    except Exception as exc:
        logger.error(f"Failed to send email to {normalized_to}: {str(exc)}")
        return False


def send_registration_otp(email: str, full_name: str, otp: str) -> bool:
    """Sends OTP verification email for new customer registration."""
    subject = "Verify Your Email - AI Medicine Recommendation System"
    display_name = full_name.strip() if full_name else "Patient"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 20px; }}
        .card {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }}
        .header {{ text-align: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }}
        .badge {{ background: #0284c7; color: white; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; }}
        .otp-box {{ text-align: center; margin: 28px 0; background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 10px; padding: 20px; }}
        .otp-code {{ font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #15803d; }}
        .footer {{ font-size: 12px; color: #64748b; text-align: center; margin-top: 28px; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <span class="badge">Security Verification</span>
          <h2 style="color: #0f172a; margin-top: 12px; margin-bottom: 4px;">Welcome, {display_name}!</h2>
          <p style="color: #64748b; margin: 0; font-size: 14px;">Confirm your email address to complete registration</p>
        </div>
        <p style="font-size: 15px; line-height: 1.6;">
          Thank you for joining our AI Healthcare Assistance Platform. Please use the One-Time Password (OTP) below to verify your email:
        </p>
        <div class="otp-box">
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #166534; margin-bottom: 6px; font-weight: 600;">Your Verification Code</div>
          <div class="otp-code">{otp}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 8px;">Valid for 10 minutes. Never share this code with anyone.</div>
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          If you did not request this registration, please ignore this email.
        </p>
        <div class="footer">
          AI Medicine Recommendation System<br>
          Clinical Decision Support Platform • Not an emergency service
        </div>
      </div>
    </body>
    </html>
    """

    text_content = f"Hello {display_name},\n\nYour registration verification OTP code is: {otp}\nValid for 10 minutes. Do not share it with anyone."
    return send_email_message(email, subject, html_content, text_content)


def send_welcome_email(email: str, full_name: str) -> bool:
    """Sends registration confirmation email after successful verification."""
    subject = "Account Verified - Welcome to AI Healthcare Assistance Platform"
    display_name = full_name.strip() if full_name else "Patient"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 20px; }}
        .card {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }}
        .h1 {{ color: #0f172a; font-size: 20px; margin-bottom: 12px; }}
        .feature-list {{ background: #f1f5f9; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }}
        .feature-list li {{ margin-bottom: 8px; font-size: 14px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <h2 class="h1">Welcome aboard, {display_name}!</h2>
        <p style="font-size: 14px; line-height: 1.6;">
          Your patient profile has been successfully verified and registered with the AI Medicine Recommendation System.
        </p>
        <div class="feature-list">
          <strong>Your platform features include:</strong>
          <ul style="padding-left: 20px; margin-top: 8px;">
            <li>AI Symptom Checker with clinical safety validation</li>
            <li>Drug-Drug Interaction & Allergy Checker</li>
            <li>Consultations with verified medical practitioners</li>
            <li>Nearby verified pharmacies & hospital locator</li>
            <li>Daily medicine reminder schedule</li>
            <li>Secure medical document storage</li>
            <li>Multilingual voice guidance (English, Marathi, Hindi)</li>
          </ul>
        </div>
        <p style="font-size: 12px; color: #64748b;">
          Important Note: This application provides academic and clinical decision-support information. It is not an automated medical diagnosis or prescription. Always consult a qualified physician for medical decisions.
        </p>
      </div>
    </body>
    </html>
    """
    text_content = f"Welcome {display_name}!\nYour account is now registered and verified."
    return send_email_message(email, subject, html_content, text_content)


def send_login_notification(email: str, full_name: str, ip_address: Optional[str] = None) -> bool:
    """Sends a security notification email when a patient logs into their account."""
    subject = "Security Notice: New Login to Your Healthcare Account"
    now_str = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    display_name = full_name.strip() if full_name else "Patient"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; background: #f8fafc; padding: 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <h3 style="color: #0f172a; margin-top: 0;">New Account Sign-in</h3>
        <p style="font-size: 14px; color: #334155;">Hello {display_name},</p>
        <p style="font-size: 14px; color: #334155;">
          A new sign-in to your AI Healthcare account was detected on <strong>{now_str}</strong>.
          {f'<br>IP Address: <code>{ip_address}</code>' if ip_address else ''}
        </p>
        <p style="font-size: 13px; color: #64748b;">
          If this was you, no action is needed. If you did not log in, please reset your password immediately.
        </p>
      </div>
    </body>
    </html>
    """
    text_content = f"Hello {display_name},\nA new sign-in to your account was detected at {now_str}."
    return send_email_message(email, subject, html_content, text_content)
