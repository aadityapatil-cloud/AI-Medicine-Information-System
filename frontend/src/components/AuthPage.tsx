import { useState, useId } from "react"
import {
  loginPatient,
  registerPatient,
  resetPatientPassword,
  verifyMobileNumber,
  sendRegistrationOtp,
  verifyRegistrationOtp,
} from "../api"
import { translations, type Language } from "../translations"
import { LanguageSelector } from "./LanguageSelector"
import type { PatientUser } from "../types"

interface AuthPageProps {
  onAuthSuccess: (user: PatientUser) => void
  lang?: Language
  onLanguageChange?: (lang: Language) => void
}

export function AuthPage({
  onAuthSuccess,
  lang = "en",
  onLanguageChange,
}: AuthPageProps) {
  const t = translations[lang] || translations.en
  const [mode, setMode] =
    useState<"login" | "signup" | "forgot" | "forgot-mobile">("login")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form fields for login & signup
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [dob, setDob] = useState("")
  const [mobile, setMobile] = useState("")

  // Form field for forgot password via mobile
  const [forgotMobile, setForgotMobile] = useState("")

  // Form fields for password reset
  const [resetEmail, setResetEmail] = useState("")
  const [resetDob, setResetDob] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)

  // UI state
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Unique IDs for accessibility
  const emailId = useId()
  const passwordId = useId()
  const fullNameId = useId()
  const dobId = useId()
  const mobileId = useId()
  const confirmPasswordId = useId()

  const resetEmailId = useId()
  const resetDobId = useId()
  const newPasswordId = useId()
  const confirmNewPasswordId = useId()
  const forgotMobileId = useId()

  // Calculate live age on frontend for instant feedback
  let calculatedAge: number | null = null
  let ageValidationError: string | null = null

  if (dob) {
    const dobDate = new Date(dob)
    if (!isNaN(dobDate.getTime())) {
      const today = new Date()
      if (dobDate > today) {
        ageValidationError = "Date of birth cannot be in the future."
      } else {
        let age = today.getFullYear() - dobDate.getFullYear()
        const m = today.getMonth() - dobDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
          age--
        }
        calculatedAge = age
        if (age < 18) {
          ageValidationError = `Registration requires patients to be at least 18 years of age (current age: ${age}).`
        }
      }
    }
  }

  const handleSwitchMode = (
    newMode: "login" | "signup" | "forgot" | "forgot-mobile",
  ) => {
    setMode(newMode)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  const handleForgotMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    const trimmed = forgotMobile.trim()
    if (!trimmed) {
      setErrorMessage("Please enter your registered mobile number.")
      return
    }

    setLoading(true)
    try {
      const res = await verifyMobileNumber(trimmed)
      setSuccessMessage(
        "Mobile number verified successfully! Redirecting to dashboard…",
      )
      setTimeout(() => {
        onAuthSuccess(res.patient)
      }, 400)
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          "Verification failed. The mobile number could not be verified with our records.",
      )
    } finally {
      setLoading(false)
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.")
      return
    }

    setLoading(true)
    try {
      const res = await loginPatient({
        email: email.trim(),
        password,
      })
      setSuccessMessage(`Welcome back, ${res.patient.full_name}!`)
      setTimeout(() => {
        onAuthSuccess(res.patient)
      }, 350)
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          "Invalid email or password. Please verify your credentials.",
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    // Frontend validations
    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.")
      return
    }

    if (!dob) {
      setErrorMessage("Please select your date of birth.")
      return
    }

    if (ageValidationError) {
      setErrorMessage(ageValidationError)
      return
    }

    if (!mobile.trim()) {
      setErrorMessage("Please enter your mobile phone number.")
      return
    }

    if (!email.trim()) {
      setErrorMessage("Please enter a valid email address.")
      return
    }

    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.")
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const res = await registerPatient({
        full_name: fullName.trim(),
        gender: "Not specified",
        dob,
        mobile: mobile.trim(),
        email: email.trim(),
        medical_conditions: "None",
        password,
        confirm_password: confirmPassword,
      })

      setSuccessMessage("Account created successfully! Redirecting to login…")
      setTimeout(() => {
        setMode("login")
        setEmail(email.trim())
        setPassword("")
        setConfirmPassword("")
        setFullName("")
        setDob("")
        setMobile("")
        setErrorMessage(null)
        setSuccessMessage(null)
      }, 500)
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          "Registration failed. Please check your inputs and try again.",
      )
    } finally {
      setLoading(false)
    }
  }

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!resetEmail.trim()) {
      setErrorMessage("Please enter your registered email address.")
      return
    }

    if (!resetDob) {
      setErrorMessage(
        "Please select your registered date of birth for identity verification.",
      )
      return
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.")
      return
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage("New password and confirmation password do not match.")
      return
    }

    setLoading(true)
    try {
      const res = await resetPatientPassword({
        email: resetEmail.trim(),
        dob: resetDob,
        new_password: newPassword,
        confirm_password: confirmNewPassword,
      })

      setSuccessMessage(
        res.message ||
          "Password updated successfully! Please sign in with your new password.",
      )
      setEmail(resetEmail.trim())
      setPassword("")
      setMode("login")
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Password reset failed. Please check your details.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Language Selector in Auth Card */}
        {onLanguageChange && (
          <div className="auth-lang-row">
            <LanguageSelector
              currentLang={lang}
              onLanguageChange={onLanguageChange}
              compact
            />
          </div>
        )}

        {/* Header Branding */}
        <div className="auth-header">
          <div className="brand auth-brand">
            <div className="brand-mark">
              <span className="cross-v" />
              <span className="cross-h" />
              <span className="ai-dot dot-a" />
              <span className="ai-dot dot-b" />
              <span className="ai-dot dot-c" />
            </div>
            <div>
              <strong>{t.brandTitle}</strong>
              <span>{t.clinicalSupport}</span>
            </div>
          </div>
          <h2>
            {mode === "login"
              ? t.signInToAccount
              : mode === "signup"
                ? t.patientRegistration
                : mode === "forgot-mobile"
                  ? t.forgotPasswordTitle
                  : t.forgotPasswordTitle}
          </h2>
          <p>
            {mode === "login"
              ? t.signInDesc
              : mode === "signup"
                ? t.signUpDesc
                : mode === "forgot-mobile"
                  ? t.forgotPasswordDesc
                  : t.forgotPasswordDesc}
          </p>
        </div>

        {/* Tab switch */}
        <div
          className="auth-tabs"
          role="tablist"
          aria-label="Authentication mode"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => handleSwitchMode("login")}
          >
            {t.signInTab}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            className={`auth-tab ${mode === "signup" ? "active" : ""}`}
            onClick={() => handleSwitchMode("signup")}
          >
            {t.signUpTab}
          </button>
          {mode === "forgot-mobile" && (
            <button
              type="button"
              role="tab"
              aria-selected={true}
              className="auth-tab active"
            >
              {t.forgotPasswordTab}
            </button>
          )}
          {mode === "forgot" && (
            <button
              type="button"
              role="tab"
              aria-selected={true}
              className="auth-tab active"
            >
              {t.forgotPasswordTab}
            </button>
          )}
        </div>

        {/* Alert banners */}
        {errorMessage && (
          <div className="notice notice--error auth-alert" role="alert">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            className="notice notice--info auth-alert auth-alert--success"
            role="status"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Login Form */}
        {mode === "login" && (
          <form onSubmit={handleLoginSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor={emailId}>{t.emailLabel}</label>
              <div className="input-with-icon">
                <input
                  id={emailId}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor={passwordId}>{t.passwordLabel}</label>
              <div className="input-with-action">
                <input
                  id={passwordId}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div className="forgot-password-row">
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => {
                    setForgotMobile("")
                    handleSwitchMode("forgot-mobile")
                  }}
                >
                  {t.forgotPasswordLink}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn--primary auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-sm" />
                  <span>{t.signingInBtn}</span>
                </>
              ) : (
                t.signInBtn
              )}
            </button>

            <div className="auth-footer-prompt">
              <span>{t.noAccountPrompt}</span>{" "}
              <button
                type="button"
                className="link-btn"
                onClick={() => handleSwitchMode("signup")}
              >
                {t.createAccountLink}
              </button>
            </div>
          </form>
        )}

        {/* Signup Form */}
        {mode === "signup" && (
          <form onSubmit={handleSignupSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor={fullNameId}>{t.fullNameLabel}</label>
              <input
                id={fullNameId}
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                autoComplete="name"
                required
              />
            </div>

            <div className="form-group">
              <div className="label-with-badge">
                <label htmlFor={dobId}>{t.dobLabel}</label>
                {calculatedAge !== null && (
                  <span
                    className={`age-badge ${
                      calculatedAge >= 18
                        ? "age-badge--valid"
                        : "age-badge--invalid"
                    }`}
                  >
                    Age: {calculatedAge}{" "}
                    {calculatedAge >= 18
                      ? `(${t.ageValidBadge})`
                      : `(${t.ageInvalidBadge})`}
                  </span>
                )}
              </div>
              <input
                id={dobId}
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                required
              />
              <span className="field-hint">{t.dobHint}</span>
            </div>

            <div className="form-group">
              <label htmlFor={mobileId}>{t.mobileLabel}</label>
              <input
                id={mobileId}
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                autoComplete="tel"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor={emailId}>{t.emailLabel}</label>
              <input
                id={emailId}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. patient@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor={passwordId}>{t.passwordLabel}</label>
              <div className="input-with-action">
                <input
                  id={passwordId}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor={confirmPasswordId}>
                {t.confirmPasswordLabel}
              </label>
              <div className="input-with-action">
                <input
                  id={confirmPasswordId}
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() =>
                    setShowConfirmNewPassword(!showConfirmPassword)
                  }
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn--primary auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-sm" />
                  <span>{t.creatingAccountBtn}</span>
                </>
              ) : (
                t.createAccountBtn
              )}
            </button>

            <div className="auth-footer-prompt">
              <span>{t.alreadyRegisteredPrompt}</span>{" "}
              <button
                type="button"
                className="link-btn"
                onClick={() => handleSwitchMode("login")}
              >
                {t.signInHereLink}
              </button>
            </div>
          </form>
        )}

        {/* Forgot Password Form */}
        {mode === "forgot" && (
          <form
            onSubmit={handleResetPasswordSubmit}
            className="auth-form"
            noValidate
          >
            <div className="form-group">
              <label htmlFor={resetEmailId}>Registered Email Address</label>
              <input
                id={resetEmailId}
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="patient@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor={resetDobId}>
                Date of Birth (Identity Verification)
              </label>
              <input
                id={resetDobId}
                type="date"
                value={resetDob}
                onChange={(e) => setResetDob(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                required
              />
              <span className="field-hint">
                Security check: Must match the birth date registered with your
                account.
              </span>
            </div>

            <div className="form-group">
              <label htmlFor={newPasswordId}>New Password</label>
              <div className="input-with-action">
                <input
                  id={newPasswordId}
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={
                    showNewPassword ? "Hide password" : "Show password"
                  }
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor={confirmNewPasswordId}>Confirm New Password</label>
              <div className="input-with-action">
                <input
                  id={confirmNewPasswordId}
                  type={showConfirmNewPassword ? "text" : "password"}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() =>
                    setShowConfirmNewPassword(!showConfirmNewPassword)
                  }
                  aria-label={
                    showConfirmNewPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn--primary auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-sm" />
                  <span>Updating Password…</span>
                </>
              ) : (
                "Reset & Update Password"
              )}
            </button>

            <div className="auth-footer-prompt">
              <span>Remembered your password?</span>{" "}
              <button
                type="button"
                className="link-btn"
                onClick={() => handleSwitchMode("login")}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* Forgot Password Form via Mobile Number Verification */}
        {mode === "forgot-mobile" && (
          <form
            onSubmit={handleForgotMobileSubmit}
            className="auth-form"
            noValidate
          >
            <div className="form-group">
              <label htmlFor={forgotMobileId}>{t.registeredMobileLabel}</label>
              <input
                id={forgotMobileId}
                type="tel"
                value={forgotMobile}
                onChange={(e) => setForgotMobile(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                autoComplete="tel"
                required
                autoFocus
              />
              <span className="field-hint">{t.registeredMobileHint}</span>
            </div>

            <button
              type="submit"
              className="btn btn--primary auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-sm" />
                  <span>{t.verifyingBtn}</span>
                </>
              ) : (
                t.okBtn
              )}
            </button>

            <div className="auth-footer-prompt">
              <span>{t.rememberPasswordPrompt}</span>{" "}
              <button
                type="button"
                className="link-btn"
                onClick={() => handleSwitchMode("login")}
              >
                {t.backToSignInBtn}
              </button>
            </div>

            <div className="auth-security-note">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>{t.securityNote}</span>
            </div>
          </form>
        )}

        {/* Disclaimer footer */}
        <div className="auth-disclaimer">
          <small>{t.disclaimerText}</small>
        </div>
      </div>
    </div>
  )
}
