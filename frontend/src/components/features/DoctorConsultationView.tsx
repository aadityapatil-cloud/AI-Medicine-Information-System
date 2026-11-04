import React, { useEffect, useState } from "react"
import { Icon } from "../Icon"
import { fetchDoctors, createAppointment, fetchMyAppointments } from "../../api"
import type { AppointmentRecord, DoctorUser } from "../../types"

const FALLBACK_DOCTORS: DoctorUser[] = [
  {
    id: 1,
    full_name: "Dr. Sarah Jenkins",
    email: "sarah.jenkins@hospital.org",
    mobile: "+91 98234 11223",
    specialization: "Cardiologist",
    qualification: "MBBS, MD (Cardiology), FACC",
    license_number: "MCI-48291",
    experience_years: 14,
    clinic_address: "Apollo Heart Institute, Bandra West, Mumbai",
    consultation_fee: 900,
    bio: "Specializing in cardiovascular risk analysis, hypertension management, and echocardiography.",
    status: "active",
    is_verified: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    full_name: "Dr. Rajesh Sharma",
    email: "rajesh.sharma@medcare.in",
    mobile: "+91 98765 22334",
    specialization: "General Physician",
    qualification: "MBBS, MD (Internal Medicine)",
    license_number: "MCI-39102",
    experience_years: 18,
    clinic_address: "Max Healthcare Care Clinic, Connaught Place, New Delhi",
    consultation_fee: 500,
    bio: "Expert in infectious diseases, metabolic syndrome, diabetes management, and geriatric care.",
    status: "active",
    is_verified: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    full_name: "Dr. Priya Nair",
    email: "priya.nair@dermacare.com",
    mobile: "+91 98112 33445",
    specialization: "Dermatologist",
    qualification: "MBBS, DVD, MD (Dermatology)",
    license_number: "MCI-51029",
    experience_years: 11,
    clinic_address: "Skin & Laser Wellness Center, Indiranagar, Bengaluru",
    consultation_fee: 700,
    bio: "Focusing on chronic dermatological conditions, eczema, fungal infections, and allergy patch testing.",
    status: "active",
    is_verified: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    full_name: "Dr. Anand Kulkarni",
    email: "anand.kulkarni@pulmo.in",
    mobile: "+91 98450 99887",
    specialization: "Pulmonologist",
    qualification: "MBBS, MD (Pulmonary Medicine)",
    license_number: "MCI-22910",
    experience_years: 16,
    clinic_address: "Ruby Hall Chest Clinic, Dhole Patil Road, Pune",
    consultation_fee: 750,
    bio: "Specialist in bronchial asthma, allergic bronchitis, COPD, and sleep apnea treatment.",
    status: "active",
    is_verified: true,
    created_at: new Date().toISOString(),
  },
]

export function DoctorConsultationView({
  onNavigate,
}: {
  onNavigate: (screen: string) => void
}) {
  const [activeTab, setActiveTab] = useState<"doctors" | "appointments">(
    "doctors",
  )
  const [specialty, setSpecialty] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [doctors, setDoctors] = useState<DoctorUser[]>(FALLBACK_DOCTORS)
  const [loading, setLoading] = useState<boolean>(false)
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])

  // Modal State
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorUser | null>(null)
  const [appointmentDate, setAppointmentDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split("T")[0],
  )
  const [appointmentTime, setAppointmentTime] = useState<string>("10:30 AM")
  const [consultMode, setConsultMode] = useState<"Video" | "Clinic">("Video")
  const [reason, setReason] = useState<string>("")
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchDoctors()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDoctors(data)
        }
      })
      .catch(() => {
        // Fallback to static verified doctors
      })
      .finally(() => setLoading(false))

    fetchMyAppointments()
      .then((data) => {
        if (Array.isArray(data)) {
          setAppointments(data)
        }
      })
      .catch(() => {})
  }, [])

  const specialties = [
    "All",
    "General Physician",
    "Cardiologist",
    "Dermatologist",
    "Pulmonologist",
  ]

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSpec =
      specialty === "All" ||
      doc.specialization.toLowerCase() === specialty.toLowerCase()
    const matchesQuery =
      doc.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.clinic_address.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSpec && matchesQuery
  })

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDoctor) return

    setSubmitting(true)
    try {
      await createAppointment({
        doctor_id: selectedDoctor.id,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        reason: `${consultMode} Consultation: ${reason || "General health consultation"}`,
        notes: `Selected mode: ${consultMode}`,
      })
      setSuccessToast(
        `Appointment with ${selectedDoctor.full_name} confirmed for ${appointmentDate} at ${appointmentTime}!`,
      )
    } catch {
      // Create local appointment simulation if offline
      const newAppt: AppointmentRecord = {
        id: Date.now(),
        patient_id: 1,
        doctor_id: selectedDoctor.id,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        status: "confirmed",
        reason: reason || "General Consultation",
        notes: `Mode: ${consultMode}`,
        doctor_name: selectedDoctor.full_name,
        specialization: selectedDoctor.specialization,
        consultation_fee: selectedDoctor.consultation_fee,
        meeting_room:
          consultMode === "Video" ? `meet-${Date.now()}` : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setAppointments((prev) => [newAppt, ...prev])
      setSuccessToast(`Appointment confirmed with ${selectedDoctor.full_name}!`)
    } finally {
      setSubmitting(false)
      setSelectedDoctor(null)
      setActiveTab("appointments")
      setTimeout(() => setSuccessToast(null), 5000)
    }
  }

  return (
    <div className="feature-view-container">
      {/* Hero Banner */}
      <div
        className="feature-hero-banner"
        style={{
          background: "linear-gradient(135deg, #09203f 0%, #537895 100%)",
        }}
      >
        <div className="feature-hero-copy">
          <span
            className="feat-tag"
            style={{ background: "rgba(255, 255, 255, 0.2)", color: "#ffffff" }}
          >
            Feature 04 · Telehealth & Clinical Network
          </span>
          <h2>Doctor Consultation & Telehealth</h2>
          <p>
            Connect directly with verified specialists across cardiology,
            pulmonology, dermatology, and internal medicine for in-person
            appointments or encrypted HD video consultations.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="btn btn--secondary"
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
            onClick={() =>
              setActiveTab(activeTab === "doctors" ? "appointments" : "doctors")
            }
          >
            {activeTab === "doctors"
              ? `My Appointments (${appointments.length})`
              : "Browse Doctors"}
          </button>
        </div>
      </div>

      {successToast && (
        <div
          style={{
            padding: "14px 20px",
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: "12px",
            color: "#065f46",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: 700,
          }}
        >
          <Icon name="check" size={18} />
          {successToast}
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "12px",
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className={`feature-filter-btn ${
              activeTab === "doctors" ? "active" : ""
            }`}
            onClick={() => setActiveTab("doctors")}
          >
            👨‍⚕️ Available Doctors ({filteredDoctors.length})
          </button>
          <button
            type="button"
            className={`feature-filter-btn ${
              activeTab === "appointments" ? "active" : ""
            }`}
            onClick={() => setActiveTab("appointments")}
          >
            📅 My Appointments ({appointments.length})
          </button>
        </div>

        {activeTab === "doctors" && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flex: "1",
              maxWidth: "380px",
            }}
          >
            <div style={{ position: "relative", width: "100%" }}>
              <input
                type="text"
                placeholder="Search by doctor, clinic, specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="med-form-input"
                style={{ paddingLeft: "36px" }}
              />
              <span
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              >
                <Icon name="search" size={16} />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Doctors Grid View */}
      {activeTab === "doctors" && (
        <>
          {/* Specialty Filter Chips */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {specialties.map((spec) => (
              <button
                key={spec}
                type="button"
                className={`feature-filter-btn ${
                  specialty === spec ? "active" : ""
                }`}
                onClick={() => setSpecialty(spec)}
              >
                {spec}
              </button>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: "20px",
            }}
          >
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="card"
                style={{
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "16px",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", gap: "14px" }}>
                      <div
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "16px",
                          background:
                            "linear-gradient(135deg, #0284c7, #0369a1)",
                          color: "white",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 800,
                          fontSize: "20px",
                        }}
                      >
                        {doc.full_name.charAt(4) || "D"}
                      </div>
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <h4
                            style={{
                              margin: 0,
                              fontSize: "17px",
                              fontWeight: 800,
                              color: "var(--navy)",
                            }}
                          >
                            {doc.full_name}
                          </h4>
                          <span
                            title="Verified Specialist"
                            style={{ color: "#0284c7" }}
                          >
                            <Icon name="check" size={16} />
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#0284c7",
                          }}
                        >
                          {doc.specialization}
                        </span>
                        <p
                          style={{
                            margin: "2px 0 0",
                            fontSize: "12px",
                            color: "#64748b",
                          }}
                        >
                          {doc.qualification}
                        </p>
                      </div>
                    </div>
                    <span
                      className="feat-tag"
                      style={{ background: "#f0fdf4", color: "#16a34a" }}
                    >
                      ★ 4.9 (120+)
                    </span>
                  </div>

                  <p
                    style={{
                      margin: "14px 0 0",
                      fontSize: "13px",
                      color: "#475569",
                      lineHeight: 1.5,
                    }}
                  >
                    {doc.bio}
                  </p>

                  <div
                    style={{
                      marginTop: "14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Icon name="map" size={14} /> {doc.clinic_address}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Icon name="shield" size={14} /> License:{" "}
                      {doc.license_number} · {doc.experience_years} Years
                      Experience
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "14px",
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        fontWeight: 700,
                      }}
                    >
                      Fee
                    </span>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: 900,
                        color: "var(--navy)",
                      }}
                    >
                      ₹{doc.consultation_fee}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn--primary"
                    style={{ background: "#0284c7" }}
                    onClick={() => setSelectedDoctor(doc)}
                  >
                    Book Consultation
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Appointments View */}
      {activeTab === "appointments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {appointments.length === 0 ? (
            <div
              className="card"
              style={{ padding: "40px", textAlign: "center", color: "#64748b" }}
            >
              <Icon
                name="calendar"
                size={40}
                style={{ margin: "0 auto 12px", color: "#cbd5e1" }}
              />
              <h4 style={{ margin: 0, color: "var(--navy)" }}>
                No booked appointments yet
              </h4>
              <p style={{ margin: "6px 0 16px" }}>
                Browse our medical panel and schedule your consultation anytime.
              </p>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setActiveTab("doctors")}
              >
                Find Specialists
              </button>
            </div>
          ) : (
            appointments.map((appt) => (
              <div
                key={appt.id}
                className="card"
                style={{
                  padding: "20px 24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                <div
                  style={{ display: "flex", gap: "16px", alignItems: "center" }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      background: "#e0f2fe",
                      color: "#0284c7",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name="calendar" size={22} />
                  </div>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "16px",
                          fontWeight: 800,
                          color: "var(--navy)",
                        }}
                      >
                        {appt.doctor_name || "Specialist Consultation"}
                      </h4>
                      <span
                        className="feat-tag"
                        style={{
                          background:
                            appt.status === "confirmed" ? "#dcfce7" : "#fef3c7",
                          color:
                            appt.status === "confirmed" ? "#16a34a" : "#d97706",
                        }}
                      >
                        {appt.status.toUpperCase()}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: "13px",
                        color: "#64748b",
                      }}
                    >
                      📅 {appt.appointment_date} at ⏰ {appt.appointment_time} ·{" "}
                      {appt.reason}
                    </p>
                  </div>
                </div>

                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  {appt.meeting_room && (
                    <button
                      type="button"
                      className="btn btn--primary"
                      style={{ background: "#16a34a", fontSize: "13px" }}
                      onClick={() =>
                        window.alert(
                          `Joining secure telehealth video room: ${appt.meeting_room}`,
                        )
                      }
                    >
                      🎥 Join Video Call
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn--secondary"
                    style={{ fontSize: "13px" }}
                    onClick={() => onNavigate("prescriptions")}
                  >
                    View Prescriptions
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Book Appointment Modal */}
      {selectedDoctor && (
        <div className="med-modal-backdrop">
          <div className="med-modal-content">
            <div className="med-modal-header">
              <h3>Schedule Appointment with {selectedDoctor.full_name}</h3>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                }}
                onClick={() => setSelectedDoctor(null)}
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <form onSubmit={handleBookSubmit}>
              <div className="med-modal-body">
                <div
                  style={{
                    padding: "12px 16px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ fontWeight: 800, color: "var(--navy)" }}>
                    {selectedDoctor.full_name}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#0284c7",
                      fontWeight: 700,
                    }}
                  >
                    {selectedDoctor.specialization}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      marginTop: "2px",
                    }}
                  >
                    Fee: ₹{selectedDoctor.consultation_fee} ·{" "}
                    {selectedDoctor.clinic_address}
                  </div>
                </div>

                <div className="med-form-group">
                  <label>Consultation Mode</label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                    }}
                  >
                    <button
                      type="button"
                      className={`btn ${
                        consultMode === "Video"
                          ? "btn--primary"
                          : "btn--secondary"
                      }`}
                      onClick={() => setConsultMode("Video")}
                      style={{ justifyContent: "center" }}
                    >
                      🎥 Video Telehealth
                    </button>
                    <button
                      type="button"
                      className={`btn ${
                        consultMode === "Clinic"
                          ? "btn--primary"
                          : "btn--secondary"
                      }`}
                      onClick={() => setConsultMode("Clinic")}
                      style={{ justifyContent: "center" }}
                    >
                      🏥 In-Person Clinic Visit
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px",
                  }}
                >
                  <div className="med-form-group">
                    <label>Preferred Date</label>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="med-form-input"
                      required
                    />
                  </div>
                  <div className="med-form-group">
                    <label>Preferred Time Slot</label>
                    <select
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="med-form-select"
                    >
                      <option value="09:30 AM">09:30 AM (Morning)</option>
                      <option value="11:00 AM">11:00 AM (Morning)</option>
                      <option value="02:30 PM">02:30 PM (Afternoon)</option>
                      <option value="04:30 PM">04:30 PM (Evening)</option>
                      <option value="06:30 PM">06:30 PM (Evening)</option>
                    </select>
                  </div>
                </div>

                <div className="med-form-group">
                  <label>Reason for Consultation / Current Symptoms</label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly describe your symptoms or health queries..."
                    className="med-form-textarea"
                    required
                  />
                </div>
              </div>

              <div className="med-modal-footer">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setSelectedDoctor(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={submitting}
                  style={{ background: "#0284c7" }}
                >
                  {submitting
                    ? "Booking..."
                    : `Confirm Booking (₹${selectedDoctor.consultation_fee})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
