import React, { useState } from "react"
import { Icon } from "../Icon"
import { updatePatientProfile } from "../../api"
import type { PatientUser, UpdateProfilePayload } from "../../types"

interface PatientProfileViewProps {
  currentUser: PatientUser
  onUpdateUser: (user: PatientUser) => void
  onNavigate: (screen: string) => void
}

export function PatientProfileView({
  currentUser,
  onUpdateUser,
  onNavigate,
}: PatientProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [formData, setFormData] = useState<UpdateProfilePayload>({
    full_name: currentUser.full_name || "",
    gender: currentUser.gender || "Other",
    dob: currentUser.dob || "1995-01-01",
    mobile: currentUser.mobile || "",
    medical_conditions: currentUser.medical_conditions || "",
    known_allergies: currentUser.known_allergies || "",
    current_medications: currentUser.current_medications || "",
    medical_history: currentUser.medical_history || "",
    emergency_contact_name: currentUser.emergency_contact_name || "",
    emergency_contact_phone: currentUser.emergency_contact_phone || "",
    weight: currentUser.weight || 68,
    blood_pressure: currentUser.blood_pressure || "120/80",
    blood_group: currentUser.blood_group || "O+",
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "weight" ? parseFloat(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const updated = await updatePatientProfile(formData)
      onUpdateUser(updated)
      setSuccessMsg("Health profile updated successfully!")
      setIsEditing(false)
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: any) {
      setErrorMsg(
        err.message || "Failed to update profile. Changes saved locally.",
      )
      // Still update locally for smooth UI experience
      const localUpdated: PatientUser = {
        ...currentUser,
        ...formData,
      }
      onUpdateUser(localUpdated)
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  // Calculate approximate BMI if height default ~170cm or weight available
  const weight = currentUser.weight || 68
  const heightM = 1.72
  const bmi = (weight / (heightM * heightM)).toFixed(1)

  const allergiesList = currentUser.known_allergies
    ? currentUser.known_allergies
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : ["No known drug allergies reported"]

  const conditionsList = currentUser.medical_conditions
    ? currentUser.medical_conditions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : ["No active chronic conditions"]

  return (
    <div className="feature-view-container">
      {/* Hero Banner */}
      <div
        className="feature-hero-banner"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
        }}
      >
        <div className="feature-hero-copy">
          <span
            className="feat-tag"
            style={{ background: "rgba(59, 130, 246, 0.2)", color: "#93c5fd" }}
          >
            Feature 01 · Patient EHR
          </span>
          <h2>Patient Health Profile</h2>
          <p>
            Secure Electronic Health Record (EHR) containing clinical history,
            known drug allergies, vital baselines, and emergency dispatch
            parameters.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="btn btn--primary"
            style={{
              background: "#2563eb",
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
            onClick={() => setIsEditing(true)}
          >
            <Icon name="edit" size={16} /> Edit Health Record
          </button>
        </div>
      </div>

      {successMsg && (
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
            fontWeight: 600,
          }}
        >
          <Icon name="check" size={18} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: "14px 20px",
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            borderRadius: "12px",
            color: "#9f1239",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: 600,
          }}
        >
          <Icon name="alert" size={18} />
          {errorMsg}
        </div>
      )}

      {/* Grid: Profile Card + Vitals Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Personal Details */}
        <div
          className="card"
          style={{
            padding: "26px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              paddingBottom: "16px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                color: "white",
                display: "grid",
                placeItems: "center",
                fontSize: "24px",
                fontWeight: 800,
              }}
            >
              {currentUser.full_name?.charAt(0) || "P"}
            </div>
            <div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "var(--navy)",
                  }}
                >
                  {currentUser.full_name}
                </h3>
                <span
                  className="feat-tag"
                  style={{ background: "#dcfce7", color: "#15803d" }}
                >
                  Active Patient
                </span>
              </div>
              <p
                style={{
                  margin: "4px 0 0",
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                Patient ID: #MED-{currentUser.id || 1042} · Registered:{" "}
                {new Date(
                  currentUser.created_at || Date.now(),
                ).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                }}
              >
                Age & Gender
              </span>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--navy)",
                }}
              >
                {currentUser.age || 29} Years ·{" "}
                {currentUser.gender || "Not specified"}
              </p>
            </div>
            <div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                }}
              >
                Date of Birth
              </span>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--navy)",
                }}
              >
                {currentUser.dob || "1995-04-12"}
              </p>
            </div>
            <div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                }}
              >
                Mobile Number
              </span>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--navy)",
                }}
              >
                {currentUser.mobile || "+91 98765 43210"}
              </p>
            </div>
            <div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                }}
              >
                Email Address
              </span>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--navy)",
                }}
              >
                {currentUser.email}
              </p>
            </div>
          </div>
        </div>

        {/* Clinical Vitals & Emergency */}
        <div
          className="card"
          style={{
            padding: "26px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h4
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 800,
                color: "var(--navy)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Icon name="heart" size={18} style={{ color: "#ef4444" }} />{" "}
              Clinical Baseline Vitals
            </h4>
            <span
              className="feat-tag"
              style={{ background: "#e0e7ff", color: "#4338ca" }}
            >
              Verified
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
            }}
          >
            <div
              style={{
                background: "#f8fafc",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                textAlign: "center",
              }}
            >
              <span
                style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}
              >
                Blood Group
              </span>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 900,
                  color: "#dc2626",
                  marginTop: "4px",
                }}
              >
                {currentUser.blood_group || "O+"}
              </div>
            </div>
            <div
              style={{
                background: "#f8fafc",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                textAlign: "center",
              }}
            >
              <span
                style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}
              >
                Blood Pressure
              </span>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 900,
                  color: "#2563eb",
                  marginTop: "4px",
                }}
              >
                {currentUser.blood_pressure || "120/80"}
              </div>
            </div>
            <div
              style={{
                background: "#f8fafc",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                textAlign: "center",
              }}
            >
              <span
                style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}
              >
                Weight / BMI
              </span>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 900,
                  color: "#059669",
                  marginTop: "4px",
                }}
              >
                {weight} kg{" "}
                <small style={{ fontSize: "11px", color: "#64748b" }}>
                  ({bmi})
                </small>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div
            style={{
              padding: "14px",
              background: "#fef2f2",
              border: "1px solid #fee2e2",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#b91c1c",
                fontWeight: 700,
                fontSize: "13px",
              }}
            >
              <Icon name="phone" size={16} /> Emergency Contact Dispatch
            </div>
            <p
              style={{ margin: "6px 0 0", fontSize: "14px", color: "#7f1d1d" }}
            >
              <strong>
                {currentUser.emergency_contact_name || "Primary Next of Kin"}
              </strong>
              : {currentUser.emergency_contact_phone || "+91 99887 76655"}
            </p>
          </div>
        </div>
      </div>

      {/* Medical History & Allergies */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Drug Allergies */}
        <div className="card" style={{ padding: "24px" }}>
          <h4
            style={{
              margin: "0 0 14px",
              fontSize: "16px",
              fontWeight: 800,
              color: "var(--navy)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Icon name="alert" size={18} style={{ color: "#f59e0b" }} /> Known
            Drug Allergies & Contraindications
          </h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {allergiesList.map((item, idx) => (
              <span
                key={idx}
                style={{
                  padding: "6px 14px",
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  color: "#b45309",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                ⚠️ {item}
              </span>
            ))}
          </div>
        </div>

        {/* Chronic Conditions */}
        <div className="card" style={{ padding: "24px" }}>
          <h4
            style={{
              margin: "0 0 14px",
              fontSize: "16px",
              fontWeight: 800,
              color: "var(--navy)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Icon name="activity" size={18} style={{ color: "#2563eb" }} />{" "}
            Chronic Conditions & Ongoing Medications
          </h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {conditionsList.map((item, idx) => (
              <span
                key={idx}
                style={{
                  padding: "6px 14px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1d4ed8",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                📋 {item}
              </span>
            ))}
          </div>
          {currentUser.current_medications && (
            <div
              style={{ marginTop: "14px", fontSize: "13px", color: "#64748b" }}
            >
              <strong>Current Rx:</strong> {currentUser.current_medications}
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div
        className="card"
        style={{
          padding: "20px 26px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div>
          <h4
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 800,
              color: "var(--navy)",
            }}
          >
            Need a doctor consultation?
          </h4>
          <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#64748b" }}>
            Share this EHR directly with registered specialists or upload past
            prescriptions.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => onNavigate("prescriptions")}
          >
            View Uploaded Records
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onNavigate("doctors")}
          >
            Consult a Doctor
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="med-modal-backdrop">
          <div className="med-modal-content">
            <div className="med-modal-header">
              <h3>Edit Patient Health Profile</h3>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                }}
                onClick={() => setIsEditing(false)}
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="med-modal-body">
                <div className="med-form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="med-form-input"
                    required
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px",
                  }}
                >
                  <div className="med-form-group">
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="med-form-select"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="med-form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className="med-form-input"
                      required
                    />
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
                    <label>Blood Group</label>
                    <select
                      name="blood_group"
                      value={formData.blood_group}
                      onChange={handleChange}
                      className="med-form-select"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div className="med-form-group">
                    <label>Weight (kg)</label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      className="med-form-input"
                    />
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
                    <label>Blood Pressure (e.g. 120/80)</label>
                    <input
                      type="text"
                      name="blood_pressure"
                      value={formData.blood_pressure}
                      onChange={handleChange}
                      className="med-form-input"
                    />
                  </div>
                  <div className="med-form-group">
                    <label>Mobile Number</label>
                    <input
                      type="text"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      className="med-form-input"
                    />
                  </div>
                </div>

                <div className="med-form-group">
                  <label>Known Drug Allergies (comma separated)</label>
                  <input
                    type="text"
                    name="known_allergies"
                    value={formData.known_allergies}
                    onChange={handleChange}
                    placeholder="e.g. Penicillin, Sulfa drugs, Aspirin"
                    className="med-form-input"
                  />
                </div>

                <div className="med-form-group">
                  <label>Chronic Medical Conditions</label>
                  <input
                    type="text"
                    name="medical_conditions"
                    value={formData.medical_conditions}
                    onChange={handleChange}
                    placeholder="e.g. Hypertension, Type 2 Diabetes, Asthma"
                    className="med-form-input"
                  />
                </div>

                <div className="med-form-group">
                  <label>Current Medications</label>
                  <input
                    type="text"
                    name="current_medications"
                    value={formData.current_medications}
                    onChange={handleChange}
                    placeholder="e.g. Metformin 500mg, Amlodipine 5mg"
                    className="med-form-input"
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px",
                  }}
                >
                  <div className="med-form-group">
                    <label>Emergency Contact Name</label>
                    <input
                      type="text"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleChange}
                      className="med-form-input"
                    />
                  </div>
                  <div className="med-form-group">
                    <label>Emergency Contact Phone</label>
                    <input
                      type="text"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleChange}
                      className="med-form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="med-modal-footer">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Health Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
