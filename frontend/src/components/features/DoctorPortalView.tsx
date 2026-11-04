import React, { useState } from "react"
import { Icon } from "../Icon"

interface MedicineRow {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

export function DoctorPortalView({
  onNavigate,
}: {
  onNavigate: (screen: string) => void
}) {
  const [activeTab, setActiveTab] =
    useState<"appointments" | "write_rx" | "issued">("appointments")
  const [patientName, setPatientName] = useState("Aaditya Patil")
  const [diagnosis, setDiagnosis] = useState(
    "Bronchial Asthma with Allergic Bronchospasm",
  )
  const [advice, setAdvice] = useState(
    "Avoid cold exposure, use salbutamol inhaler PRN, maintain hydration.",
  )
  const [followUpDate, setFollowUpDate] = useState("2026-11-18")
  const [toast, setToast] = useState<string | null>(null)

  const [medications, setMedications] = useState<MedicineRow[]>([
    {
      name: "Salbutamol 100mcg Inhaler",
      dosage: "2 Puffs",
      frequency: "As needed (SOS)",
      duration: "14 Days",
      instructions: "Inhale through spacer when breathlessness occurs",
    },
    {
      name: "Montelukast 10mg Tablet",
      dosage: "1 Tablet",
      frequency: "0-0-1 (Night)",
      duration: "10 Days",
      instructions: "Take before sleep after dinner",
    },
  ])

  const handleAddMedRow = () => {
    setMedications((prev) => [
      ...prev,
      {
        name: "",
        dosage: "1 Tablet",
        frequency: "1-0-1",
        duration: "5 Days",
        instructions: "After food",
      },
    ])
  }

  const handleMedChange = (
    index: number,
    field: keyof MedicineRow,
    value: string,
  ) => {
    setMedications((prev) => {
      const copy = [...prev]
      copy[index][field] = value
      return copy
    })
  }

  const handleRemoveMedRow = (index: number) => {
    setMedications((prev) => prev.filter((_, i) => i !== index))
  }

  const handleIssueRx = (e: React.FormEvent) => {
    e.preventDefault()
    setToast(
      `Digital Prescription issued for ${patientName}! Digitally signed & archived in patient EHR.`,
    )
    setActiveTab("issued")
    setTimeout(() => setToast(null), 5000)
  }

  return (
    <div className="feature-view-container">
      {/* Hero Banner */}
      <div
        className="feature-hero-banner"
        style={{
          background: "linear-gradient(135deg, #172554 0%, #1e40af 100%)",
        }}
      >
        <div className="feature-hero-copy">
          <span
            className="feat-tag"
            style={{ background: "rgba(255, 255, 255, 0.2)", color: "#ffffff" }}
          >
            Feature 19 · Physician Clinical Suite
          </span>
          <h2>Doctor Integration Portal & Digital Rx Pad</h2>
          <p>
            Licensed practitioner interface to review upcoming consultation
            requests, review AI triage summaries, issue digitally signed
            tamper-proof prescriptions, and monitor patient adherence.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="btn btn--secondary"
            style={{ background: "#ffffff", color: "#1e40af", fontWeight: 800 }}
            onClick={() => setActiveTab("write_rx")}
          >
            ✍️ Issue Digital Prescription
          </button>
        </div>
      </div>

      {toast && (
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
          {toast}
        </div>
      )}

      {/* Doctor Identity Header */}
      <div
        className="card"
        style={{
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #0284c7, #0369a1)",
              color: "white",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: "20px",
            }}
          >
            SJ
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h4
                style={{
                  margin: 0,
                  fontSize: "17px",
                  fontWeight: 800,
                  color: "var(--navy)",
                }}
              >
                Dr. Sarah Jenkins, MD (Cardiology)
              </h4>
              <span
                className="feat-tag"
                style={{ background: "#dcfce7", color: "#15803d" }}
              >
                Verified Practitioner
              </span>
            </div>
            <p
              style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}
            >
              License: <strong>MCI-48291</strong> · Apollo Heart Institute,
              Mumbai · Consultation Fee: ₹900
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className={`feature-filter-btn ${
              activeTab === "appointments" ? "active" : ""
            }`}
            onClick={() => setActiveTab("appointments")}
          >
            📋 Appointments Queue
          </button>
          <button
            type="button"
            className={`feature-filter-btn ${
              activeTab === "write_rx" ? "active" : ""
            }`}
            onClick={() => setActiveTab("write_rx")}
          >
            ✍️ Write Rx
          </button>
          <button
            type="button"
            className={`feature-filter-btn ${
              activeTab === "issued" ? "active" : ""
            }`}
            onClick={() => setActiveTab("issued")}
          >
            📜 Issued Prescriptions
          </button>
        </div>
      </div>

      {/* Appointments Tab */}
      {activeTab === "appointments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            className="card"
            style={{
              padding: "20px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="calendar" size={20} />
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 800,
                    color: "var(--navy)",
                    fontSize: "16px",
                  }}
                >
                  Patient: Aaditya Patil (29, M)
                </div>
                <div style={{ fontSize: "13px", color: "#64748b" }}>
                  Schedule: Today at 02:30 PM · Video Telehealth · Reason:
                  Recurrent chest tightness
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="btn btn--primary"
                style={{ background: "#16a34a", fontSize: "13px" }}
                onClick={() =>
                  window.alert(
                    "Opening secure HD Telehealth consultation room...",
                  )
                }
              >
                🎥 Start Consultation
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                style={{ fontSize: "13px" }}
                onClick={() => setActiveTab("write_rx")}
              >
                Create Rx
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Write Rx Tab */}
      {activeTab === "write_rx" && (
        <form
          onSubmit={handleIssueRx}
          className="card"
          style={{
            padding: "28px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div
            style={{ borderBottom: "2px solid #e2e8f0", paddingBottom: "14px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "var(--navy)",
                  }}
                >
                  Official Digital Prescription
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Apollo Heart Institute · Dr. Sarah Jenkins (MCI-48291)
                </span>
              </div>
              <span
                className="feat-tag"
                style={{ background: "#e0e7ff", color: "#4338ca" }}
              >
                E-Prescription Standard
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div className="med-form-group">
              <label>Patient Name</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="med-form-input"
                required
              />
            </div>
            <div className="med-form-group">
              <label>Clinical Diagnosis</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="med-form-input"
                required
              />
            </div>
          </div>

          {/* Dynamic Medication Table */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <label
                style={{
                  fontWeight: 800,
                  color: "var(--navy)",
                  fontSize: "14px",
                }}
              >
                Prescribed Medications
              </label>
              <button
                type="button"
                className="btn btn--secondary"
                style={{ fontSize: "12px", padding: "4px 10px" }}
                onClick={handleAddMedRow}
              >
                + Add Medication
              </button>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {medications.map((med, index) => (
                <div
                  key={index}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 2fr auto",
                    gap: "8px",
                    alignItems: "center",
                    background: "#f8fafc",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Medicine Name"
                    value={med.name}
                    onChange={(e) =>
                      handleMedChange(index, "name", e.target.value)
                    }
                    className="med-form-input"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Dosage"
                    value={med.dosage}
                    onChange={(e) =>
                      handleMedChange(index, "dosage", e.target.value)
                    }
                    className="med-form-input"
                  />
                  <input
                    type="text"
                    placeholder="Frequency"
                    value={med.frequency}
                    onChange={(e) =>
                      handleMedChange(index, "frequency", e.target.value)
                    }
                    className="med-form-input"
                  />
                  <input
                    type="text"
                    placeholder="Duration"
                    value={med.duration}
                    onChange={(e) =>
                      handleMedChange(index, "duration", e.target.value)
                    }
                    className="med-form-input"
                  />
                  <input
                    type="text"
                    placeholder="Instructions"
                    value={med.instructions}
                    onChange={(e) =>
                      handleMedChange(index, "instructions", e.target.value)
                    }
                    className="med-form-input"
                  />
                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                    }}
                    onClick={() => handleRemoveMedRow(index)}
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "16px",
            }}
          >
            <div className="med-form-group">
              <label>General Clinical Advice & Dietary Instructions</label>
              <textarea
                rows={2}
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                className="med-form-textarea"
              />
            </div>
            <div className="med-form-group">
              <label>Follow-Up Consultation Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="med-form-input"
              />
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
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              Digital Signature:{" "}
              <strong>
                Dr. Sarah Jenkins (MCI verified cryptographic token)
              </strong>
            </div>
            <button
              type="submit"
              className="btn btn--primary"
              style={{ background: "#1e40af" }}
            >
              Sign & Issue Prescription
            </button>
          </div>
        </form>
      )}

      {/* Issued Archive */}
      {activeTab === "issued" && (
        <div className="card" style={{ padding: "24px" }}>
          <h4
            style={{
              margin: "0 0 16px",
              fontSize: "16px",
              fontWeight: 800,
              color: "var(--navy)",
            }}
          >
            Prescription Issuance Archive
          </h4>
          <div
            style={{
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong>Rx #MED-2026-9041</strong> · Patient: Aaditya Patil
                <div style={{ fontSize: "13px", color: "#64748b" }}>
                  Diagnosis: {diagnosis}
                </div>
              </div>
              <span
                className="feat-tag"
                style={{ background: "#dcfce7", color: "#15803d" }}
              >
                ✓ DIGITALLY SIGNED
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
