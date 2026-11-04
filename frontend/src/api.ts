import type {
  ApiError,
  ApiValidationErrorDetail,
  AuthResponse,
  LoginPayload,
  PatientUser,
  PredictionSuccessResponse,
  RegisterPayload,
  UpdateProfilePayload,
  ResetPasswordPayload,
} from "./types"

const rawBase = import.meta.env.VITE_API_URL as string | undefined || "/api"
export const API_BASE = rawBase.replace(/\/+$/, "")
const REQUEST_TIMEOUT_MS = 10000

export const TOKEN_STORAGE_KEY = "ai_med_auth_token"
export const USER_STORAGE_KEY = "ai_med_user_profile"

// -------------------------------------------------------------
// TOKEN & USER SESSION HELPERS
// -------------------------------------------------------------

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setAuthSession(token: string, user: PatientUser): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  } catch {
    // LocalStorage quota or access error handling
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
  } catch {
    // Ignore storage errors on cleanup
  }
}

export function getStoredUser(): PatientUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PatientUser
  } catch {
    return null
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  return headers
}

// Helper to cleanly extract and surface actual backend error messages
async function parseResponseError(response: Response, defaultMessage: string): Promise<string> {
  try {
    const rawText = await response.text()
    if (!rawText || !rawText.trim()) {
      if (response.status === 409) return "An account with this email address or mobile number already exists."
      if (response.status === 401) return "Invalid credentials. Please verify your details."
      if (response.status === 403) return "Access restricted."
      if (response.status >= 500) return `Server error (${response.status}). Please check backend status.`
      return `${defaultMessage} (Status ${response.status})`
    }

    try {
      const json = JSON.parse(rawText)
      if (json?.detail) {
        if (typeof json.detail === "string") return json.detail
        if (Array.isArray(json.detail)) {
          return json.detail
            .map((item: any) => {
              if (typeof item === "string") return item
              const loc = item?.loc?.filter((l: string) => l !== "body")?.join(" ")
              const field = loc ? `[${loc}] ` : ""
              return `${field}${item?.msg || item?.message || JSON.stringify(item)}`
            })
            .join("; ")
        }
        if (typeof json.detail === "object") {
          return json.detail.message || JSON.stringify(json.detail)
        }
      }
      if (json?.message) return json.message
      if (json?.error) return json.error
    } catch {
      // Non-JSON response (e.g. HTML from Vite proxy or Render)
      if (rawText.includes("ECONNREFUSED")) {
        return "Cannot connect to backend server on http://127.0.0.1:8000. Please start the backend (`uvicorn api.main:app --port 8000`)."
      }
      if (response.status === 502 || response.status === 504) {
        return "Server is currently starting up (Render free tier cold start). Please wait 15 seconds and try again."
      }
      if (response.status >= 500) {
        return `Backend server error (${response.status}).`
      }
    }
  } catch {
    // Ignore text parsing errors
  }
  return defaultMessage
}

// -------------------------------------------------------------
// AUTHENTICATION API SERVICES
// -------------------------------------------------------------

export async function registerPatient(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    })
  } catch (err: any) {
    throw {
      type: "connection",
      statusCode: 0,
      message: "Cannot connect to server. Please ensure the backend is running on port 8000 or check your internet connection.",
    } as ApiError
  }

  if (!response.ok) {
    const message = await parseResponseError(response, "Registration failed. Please check your inputs.")
    const error: ApiError = {
      type: "client",
      statusCode: response.status,
      message,
    }
    throw error
  }

  const authData = (await response.json()) as AuthResponse
  setAuthSession(authData.access_token, authData.patient)
  return authData
}

export async function loginPatient(
  payload: LoginPayload,
): Promise<AuthResponse> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    })
  } catch (err: any) {
    throw {
      type: "connection",
      statusCode: 0,
      message: "Cannot connect to server. Please ensure the backend is running on port 8000 or check your internet connection.",
    } as ApiError
  }

  if (!response.ok) {
    const message = await parseResponseError(response, "Invalid email or password. Please try again.")
    const error: ApiError = {
      type: "client",
      statusCode: response.status,
      message,
    }
    throw error
  }

  const authData = (await response.json()) as AuthResponse
  setAuthSession(authData.access_token, authData.patient)
  return authData
}

export async function resetPatientPassword(
  payload: ResetPasswordPayload
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      data?.detail && typeof data.detail === "string"
        ? data.detail
        : "Password reset failed. Please check your verification details."
    const error: ApiError = {
      type: "client",
      statusCode: response.status,
      message,
    }
    throw error
  }

  return data as { message: string }
}

export async function verifyMobileNumber(
  mobile: string,
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/verify-mobile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ mobile }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      data?.detail && typeof data.detail === "string"
        ? data.detail
        : "Verification failed. The mobile number could not be verified."
    const error: ApiError = {
      type: "client",
      statusCode: response.status,
      message,
    }
    throw error
  }

  const authData = data as AuthResponse
  setAuthSession(authData.access_token, authData.patient)
  return authData
}

export async function fetchCurrentUser(): Promise<PatientUser> {
  const token = getAuthToken()
  if (!token) {
    throw {
      type: "client",
      statusCode: 401,
      message: "No active session found.",
    } as ApiError
  }

  const response = await fetch(`${API_BASE}/auth/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession()
    }
    throw {
      type: "client",
      statusCode: response.status,
      message: "Session expired or invalid.",
    } as ApiError
  }

  const patient = (await response.json()) as PatientUser
  // Update cached profile
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(patient))
  } catch {
    // Ignore storage issues
  }
  return patient
}

export async function registerDoctor(payload: {
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
  password: string
  confirm_password: string
}): Promise<any> {
  const response = await fetch(`${API_BASE}/doctor/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      data?.detail && typeof data.detail === "string"
        ? data.detail
        : "Doctor registration failed."
    throw { type: "client", statusCode: response.status, message } as ApiError
  }
  return data
}

export async function loginDoctor(payload: { email: string; password: string }): Promise<any> {
  const response = await fetch(`${API_BASE}/doctor/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      data?.detail && typeof data.detail === "string"
        ? data.detail
        : "Doctor login failed."
    throw { type: "client", statusCode: response.status, message } as ApiError
  }
  return data
}

export async function fetchDoctors(params?: { specialization?: string; q?: string }): Promise<any> {
  const query = new URLSearchParams()
  if (params?.specialization) query.set("specialization", params.specialization)
  if (params?.q) query.set("q", params.q)
  const response = await fetch(`${API_BASE}/doctors${query.toString() ? `?${query.toString()}` : ""}`)
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Failed to load doctors." } as ApiError
  }
  return data
}

export async function fetchDoctorById(doctorId: number): Promise<any> {
  const response = await fetch(`${API_BASE}/doctors/${doctorId}`)
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Doctor details not available." } as ApiError
  }
  return data
}

export async function fetchMyAppointments(): Promise<any> {
  const response = await fetch(`${API_BASE}/appointments/my`, { headers: getAuthHeaders() })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Failed to load your appointments." } as ApiError
  }
  return data
}

export async function fetchDoctorAppointments(): Promise<any> {
  const response = await fetch(`${API_BASE}/doctor/appointments`, { headers: getAuthHeaders() })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Failed to load doctor appointments." } as ApiError
  }
  return data
}

export async function createAppointment(payload: {
  doctor_id: number
  appointment_date: string
  appointment_time: string
  reason?: string
}): Promise<any> {
  const response = await fetch(`${API_BASE}/appointments`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message = data?.detail && typeof data.detail === "string" ? data.detail : "Appointment request failed."
    throw { type: "client", statusCode: response.status, message } as ApiError
  }
  return data
}

export async function updateAppointmentStatus(appointmentId: number, payload: { status: "accepted" | "rejected" | "cancelled"; notes?: string }): Promise<any> {
  const response = await fetch(`${API_BASE}/appointments/${appointmentId}/status`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message = data?.detail && typeof data.detail === "string" ? data.detail : "Failed to update appointment status."
    throw { type: "client", statusCode: response.status, message } as ApiError
  }
  return data
}

export async function fetchEmergencySupport(): Promise<any> {
  const response = await fetch(`${API_BASE}/emergency/support`)
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Emergency support data unavailable." } as ApiError
  }
  return data
}

export async function logoutPatient(): Promise<void> {
  try {
    const token = getAuthToken()
    if (token) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: getAuthHeaders(),
      }).catch(() => {
        // Ignore network failure on logout
      })
    }
  } finally {
    clearAuthSession()
  }
}

// -------------------------------------------------------------
// PREDICTION & SYMPTOM ANALYSIS SERVICE
// -------------------------------------------------------------

export async function predictSymptoms(
  symptoms: string[],
): Promise<PredictionSuccessResponse> {
  if (!symptoms || symptoms.length === 0) {
    const error: ApiError = {
      type: "validation",
      message:
        "Please select at least one symptom before running the analysis.",
      invalidSymptoms: [],
    }
    throw error
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ symptoms }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = (await response.json()) as PredictionSuccessResponse
      return data
    }

    if (response.status === 401) {
      clearAuthSession()
      const error: ApiError = {
        type: "client",
        statusCode: 401,
        message: "Your session has expired. Please log in again to continue.",
      }
      throw error
    }

    if (response.status === 422) {
      let detail: ApiValidationErrorDetail | undefined
      try {
        const errorJson = await response.json()
        detail = errorJson.detail
      } catch {
        // Fallback if response is not JSON
      }

      const error: ApiError = {
        type: "validation",
        statusCode: 422,
        message:
          detail?.message ||
          "Some symptoms were not recognized by the machine learning model.",
        invalidSymptoms: detail?.invalid_symptoms || [],
      }
      throw error
    }

    // Other HTTP errors (500, 502, 404, etc.)
    let errorMessage = `Server returned status ${response.status} (${response.statusText}).`
    try {
      const errorJson = await response.json()
      if (errorJson.detail && typeof errorJson.detail === "string") {
        errorMessage = errorJson.detail
      }
    } catch {
      // Keep default message
    }

    const error: ApiError = {
      type: "server",
      statusCode: response.status,
      message: errorMessage,
    }
    throw error
  } catch (err: unknown) {
    clearTimeout(timeoutId)

    // If it's already an ApiError, rethrow
    if (err && typeof err === "object" && "type" in err && "message" in err) {
      throw err as ApiError
    }

    if (err instanceof DOMException && err.name === "AbortError") {
      const error: ApiError = {
        type: "connection",
        message:
          "Request timed out after 10 seconds. The backend server might be busy or unreachable.",
      }
      throw error
    }

    const error: ApiError = {
      type: "connection",
      message:
        "Unable to connect to the prediction backend service. Ensure the FastAPI server is running.",
    }
    throw error
  }
}

export async function updatePatientProfile(
  payload: UpdateProfilePayload,
): Promise<PatientUser> {
  const response = await fetch(`${API_BASE}/auth/profile`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    let message = "Failed to update profile information."
    if (data?.detail) {
      if (typeof data.detail === "string") {
        message = data.detail
      } else if (Array.isArray(data.detail) && data.detail.length > 0) {
        message = data.detail.map((err: any) => err.msg || err.message).join("; ")
      }
    }
    const error: ApiError = {
      type: "client",
      statusCode: response.status,
      message,
    }
    throw error
  }

  const updatedPatient = data as PatientUser
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedPatient))
  } catch {
    // Ignore storage issues
  }
  return updatedPatient
}

// -------------------------------------------------------------
// OTP & ACCOUNT MANAGEMENT SERVICES
// -------------------------------------------------------------

export async function sendRegistrationOtp(
  email: string,
  fullName: string = "Patient",
): Promise<{ success: boolean; message: string; demo_otp?: string }> {
  const response = await fetch(`${API_BASE}/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: email.trim().lower(), full_name: fullName.trim() }),
  })
  if (!response.ok) {
    const message = await parseResponseError(response, "Failed to send OTP code.")
    throw { type: "client", statusCode: response.status, message } as ApiError
  }
  return response.json()
}

export async function verifyRegistrationOtp(
  email: string,
  otpCode: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: email.trim().lower(), otp_code: otpCode.trim() }),
  })
  if (!response.ok) {
    const message = await parseResponseError(response, "Invalid OTP code.")
    throw { type: "client", statusCode: response.status, message } as ApiError
  }
  return response.json()
}

export async function deletePatientAccount(): Promise<void> {
  const response = await fetch(`${API_BASE}/patient/account`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    const message = await parseResponseError(response, "Failed to deactivate account.")
    throw { type: "client", statusCode: response.status, message } as ApiError
  }
  clearAuthSession()
}

// -------------------------------------------------------------
// EMERGENCY SOS SERVICES
// -------------------------------------------------------------

export async function fetchEmergencyInfo(): Promise<any> {
  const response = await fetch(`${API_BASE}/emergency/sos`)
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Emergency helpline unavailable." } as ApiError
  }
  return response.json()
}

export async function triggerEmergencyAlert(lat?: number, lng?: number, notes?: string): Promise<any> {
  const params = new URLSearchParams()
  if (lat) params.set("lat", lat.toString())
  if (lng) params.set("lng", lng.toString())
  if (notes) params.set("notes", notes)
  const response = await fetch(`${API_BASE}/emergency/alert?${params.toString()}`, {
    method: "POST",
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Failed to log emergency alert." } as ApiError
  }
  return response.json()
}

// -------------------------------------------------------------
// NEARBY MEDICAL STORES & HOSPITALS MAP
// -------------------------------------------------------------

export async function fetchNearbyPlaces(params?: {
  type?: string
  city?: string
  q?: string
  lat?: number
  lng?: number
}): Promise<any[]> {
  const query = new URLSearchParams()
  if (params?.type && params.type !== "all") query.set("type", params.type)
  if (params?.city && params.city !== "all") query.set("city", params.city)
  if (params?.q) query.set("q", params.q)
  if (params?.lat) query.set("lat", params.lat.toString())
  if (params?.lng) query.set("lng", params.lng.toString())

  const response = await fetch(`${API_BASE}/places/nearby?${query.toString()}`)
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Failed to load nearby places." } as ApiError
  }
  const data = await response.json()
  return data.places || []
}

export async function searchPharmacyMedicines(query: string): Promise<any[]> {
  const response = await fetch(`${API_BASE}/pharmacy/medicines?q=${encodeURIComponent(query.trim())}`)
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Failed to search pharmacy stock." } as ApiError
  }
  const data = await response.json()
  return data.results || []
}

// -------------------------------------------------------------
// MEDICINE REMINDERS
// -------------------------------------------------------------

export async function fetchReminders(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/reminders`, { headers: getAuthHeaders() })
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Failed to load reminders." } as ApiError
  }
  const data = await response.json()
  return data.reminders || []
}

export async function createReminder(payload: {
  medicine_name: string
  dosage: string
  schedule: string
  time_slot: string
  food_timing: string
  start_date: string
  end_date?: string
  instructions?: string
  family_member_id?: number
}): Promise<any> {
  const response = await fetch(`${API_BASE}/reminders`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const message = await parseResponseError(response, "Failed to create reminder.")
    throw { type: "client", statusCode: response.status, message } as ApiError
  }
  return response.json()
}

export async function deleteReminder(reminderId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/reminders/${reminderId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Failed to cancel reminder." } as ApiError
  }
}

export async function logReminderStatus(reminderId: number, status: "completed" | "missed"): Promise<any> {
  const response = await fetch(`${API_BASE}/reminders/${reminderId}/log`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  })
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Failed to record reminder status." } as ApiError
  }
  return response.json()
}

export async function fetchReminderHistory(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/reminders/history`, { headers: getAuthHeaders() })
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Failed to load reminder history." } as ApiError
  }
  const data = await response.json()
  return data.history || []
}

// -------------------------------------------------------------
// MEDICAL DOCUMENTS & REPORTS
// -------------------------------------------------------------

export async function uploadMedicalDocument(formData: FormData): Promise<any> {
  const token = getAuthToken()
  const headers: Record<string, string> = {}
  if (token) headers["Authorization"] = `Bearer ${token}`

  const response = await fetch(`${API_BASE}/documents/upload`, {
    method: "POST",
    headers,
    body: formData,
  })
  if (!response.ok) {
    const message = await parseResponseError(response, "Document upload failed.")
    throw { type: "client", statusCode: response.status, message } as ApiError
  }
  return response.json()
}

export async function fetchMedicalDocuments(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/documents`, { headers: getAuthHeaders() })
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Failed to load documents." } as ApiError
  }
  const data = await response.json()
  return data.documents || []
}

export async function deleteMedicalDocument(docId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/documents/${docId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Failed to delete document." } as ApiError
  }
}

export function getDocumentDownloadUrl(docId: number): string {
  return `${API_BASE}/documents/${docId}/download`
}

// -------------------------------------------------------------
// AI HEALTH CHATBOT
// -------------------------------------------------------------

export async function sendChatbotMessage(query: string, lang: string = "en"): Promise<any> {
  const response = await fetch(`${API_BASE}/chatbot/message`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ query: query.trim(), lang }),
  })
  if (!response.ok) {
    const message = await parseResponseError(response, "Chatbot service temporarily unavailable.")
    throw { type: "client", statusCode: response.status, message } as ApiError
  }
  return response.json()
}

// -------------------------------------------------------------
// MEDICINE INTERACTION CHECKER
// -------------------------------------------------------------

export async function checkMedicineInteractions(
  medicines: string[],
  patientAllergies: string = "None",
): Promise<any> {
  const response = await fetch(`${API_BASE}/medicines/interaction-check`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ medicines, patient_allergies: patientAllergies }),
  })
  if (!response.ok) {
    const message = await parseResponseError(response, "Interaction check failed.")
    throw { type: "client", statusCode: response.status, message } as ApiError
  }
  return response.json()
}

// -------------------------------------------------------------
// DIGITAL PRESCRIPTIONS
// -------------------------------------------------------------

export async function fetchPatientPrescriptions(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/prescriptions/my`, { headers: getAuthHeaders() })
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Failed to load prescriptions." } as ApiError
  }
  const data = await response.json()
  return data.prescriptions || []
}

// -------------------------------------------------------------
// FAMILY HEALTH PROFILES
// -------------------------------------------------------------

export async function fetchFamilyMembers(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/family`, { headers: getAuthHeaders() })
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Failed to load family members." } as ApiError
  }
  const data = await response.json()
  return data.family_members || []
}

export async function addFamilyMember(payload: any): Promise<any> {
  const response = await fetch(`${API_BASE}/family`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const message = await parseResponseError(response, "Failed to add family member.")
    throw { type: "client", statusCode: response.status, message } as ApiError
  }
  return response.json()
}

export async function deleteFamilyMember(memberId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/family/${memberId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Failed to remove family member." } as ApiError
  }
}

// -------------------------------------------------------------
// CUSTOMER FEEDBACK & BUG REPORTING
// -------------------------------------------------------------

export async function submitFeedback(payload: {
  category: string
  rating: number
  title: string
  description: string
}): Promise<any> {
  const response = await fetch(`${API_BASE}/feedback`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const message = await parseResponseError(response, "Failed to submit feedback.")
    throw { type: "client", statusCode: response.status, message } as ApiError
  }
  return response.json()
}

export async function fetchMyFeedbacks(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/feedback/my`, { headers: getAuthHeaders() })
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Failed to load feedback." } as ApiError
  }
  const data = await response.json()
  return data.feedbacks || []
}

// -------------------------------------------------------------
// ADMIN DASHBOARD
// -------------------------------------------------------------

export async function fetchAdminMetrics(): Promise<any> {
  const response = await fetch(`${API_BASE}/admin/metrics`, { headers: getAuthHeaders() })
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Failed to load admin metrics." } as ApiError
  }
  const data = await response.json()
  return data.metrics || {}
}

export async function fetchAdminUsers(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/admin/users`, { headers: getAuthHeaders() })
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Failed to load user directory." } as ApiError
  }
  const data = await response.json()
  return data.users || []
}

export async function toggleUserStatusAdmin(userId: number, status: string): Promise<void> {
  const response = await fetch(`${API_BASE}/admin/users/${userId}/status?status_val=${status}`, {
    method: "POST",
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Failed to update user status." } as ApiError
  }
}

export async function fetchAdminFeedback(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/admin/feedback`, { headers: getAuthHeaders() })
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Failed to load customer feedback." } as ApiError
  }
  const data = await response.json()
  return data.feedbacks || []
}

export async function updateAdminFeedbackStatus(feedbackId: number, status: string, notes: string = ""): Promise<void> {
  const response = await fetch(`${API_BASE}/admin/feedback/${feedbackId}/status?status_val=${status}&admin_notes=${encodeURIComponent(notes)}`, {
    method: "POST",
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Failed to update feedback status." } as ApiError
  }
}

// -------------------------------------------------------------
// MEDICINE DATASET SEARCH
// -------------------------------------------------------------

export async function searchMedicinesDataset(query: string): Promise<any[]> {
  const response = await fetch(`${API_BASE}/medicines/search?q=${encodeURIComponent(query.trim())}`)
  if (!response.ok) {
    throw { type: "client", statusCode: response.status, message: "Failed to search medicines." } as ApiError
  }
  const data = await response.json()
  return data.results || []
}
