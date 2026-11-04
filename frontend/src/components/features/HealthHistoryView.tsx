import React, { useState } from "react"
import { Icon } from "../Icon"
import type { PatientUser } from "../../types"

interface TimelineEvent {
  id: string
  date: string
  time: string
  category: "ai" | "doctor" | "medication" | "document"
  title: string
  subtitle: string
  details: string
  badge: string
  badgeColor: string
}

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: "e1",
    date: "Today, Nov 4, 2026",
    time: "08:32 AM",
    category: "medication",
    title: "Medication Dose Taken: Metformin 500mg",
    subtitle: "Morning dosage schedule · After breakfast",
    details:
      "Logged adherence verification. Normal blood glucose reading 104 mg/dL recorded.",
    badge: "ADHERENCE LOGGED",
    badgeColor: "#dcfce7",
  },
  {
    id: "e2",
    date: "Yesterday, Nov 3, 2026",
    time: "03:15 PM",
    category: "ai",
    title: "AI Symptom Checker Evaluation",
    subtitle: "Selected symptoms: Fatigue, Mild Cough, Headache",
    details:
      "Model predicted Viral Upper Respiratory Tract Infection with 88.4% confidence. 3 OTC formulations recommended with safety precautions.",
    badge: "AI INFERENCE",
    badgeColor: "#e0e7ff",
  },
  {
    id: "e3",
    date: "Nov 1, 2026",
    time: "10:30 AM",
    category: "doctor",
    title: "Telehealth Video Consultation with Dr. Sarah Jenkins",
    subtitle: "Cardiology Review · Apollo Heart Institute",
    details:
      "Reviewed annual ECG & BP vitals. Prescribed Amlodipine 5mg once daily. Follow-up scheduled in 6 months.",
    badge: "CONSULTATION COMPLETED",
    badgeColor: "#d1fae5",
  },
  {
    id: "e4",
    date: "Oct 28, 2026",
    time: "02:45 PM",
    category: "document",
    title: "Uploaded Diagnostic Report: Complete Lipid Profile",
    subtitle: "Pathology Care Labs · 1.02 MB PDF",
    details:
      "Verified parameters: Total Cholesterol 185 mg/dL, HDL 52 mg/dL, LDL 108 mg/dL, Triglycerides 125 mg/dL.",
    badge: "DOCUMENT VAULT",
    badgeColor: "#fef3c7",
  },
  {
    id: "e5",
    date: "Oct 15, 2026",
    time: "11:00 AM",
    category: "ai",
    title: "Multi-Drug Interaction Verification",
    subtitle: "Checked: Aspirin + Warfarin",
    details:
      "High-risk contraindication flagged for combined anticoagulant and antiplatelet therapy. Prevented adverse bleeding incident.",
    badge: "SAFETY CHECK",
    badgeColor: "#fee2e2",
  },
]

export function HealthHistoryView({
  currentUser,
  onNavigate,
}: {
  currentUser?: PatientUser | null
  onNavigate: (screen: string) => void
}) {
  const [filter, setFilter] = useState<string>("All")

  const filtered = TIMELINE_EVENTS.filter((e) => {
    if (filter === "All") return true
    if (filter === "AI Diagnostics") return e.category === "ai"
    if (filter === "Doctor Consults") return e.category === "doctor"
    if (filter === "Medications") return e.category === "medication"
    if (filter === "Lab Reports") return e.category === "document"
    return true
  })

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="feature-view-container">
      {/* Hero Banner */}
      <div
        className="feature-hero-banner"
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
        }}
      >
        <div className="feature-hero-copy">
          <span
            className="feat-tag"
            style={{ background: "rgba(255, 255, 255, 0.2)", color: "#ffffff" }}
          >
            Feature 13 · Longitudinal Health Records
          </span>
          <h2>Health History & Clinical Timeline</h2>
          <p>
            An immutable, chronological timeline of your health journey. Trace
            machine learning diagnostic runs, physician consultation summaries,
            lab findings, and medication compliance logs in one place.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="btn btn--secondary"
            style={{
              background: "#ffffff",
              color: "var(--navy)",
              fontWeight: 700,
            }}
            onClick={handlePrint}
          >
            🖨️ Export Health Summary
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
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
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            "All",
            "AI Diagnostics",
            "Doctor Consults",
            "Medications",
            "Lab Reports",
          ].map((item) => (
            <button
              key={item}
              type="button"
              className={`feature-filter-btn ${
                filter === item ? "active" : ""
              }`}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Nodes */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {filtered.map((event) => (
          <div
            key={event.id}
            className="card"
            style={{
              padding: "22px",
              display: "flex",
              gap: "18px",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                background: "#f1f5f9",
                color: "var(--navy)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                marginTop: "2px",
              }}
            >
              <Icon
                name={
                  event.category === "ai"
                    ? "brain"
                    : event.category === "doctor"
                      ? "stethoscope"
                      : event.category === "medication"
                        ? "medicine"
                        : "prescription"
                }
                size={20}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: 800,
                      color: "var(--navy)",
                    }}
                  >
                    {event.title}
                  </h4>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "13px",
                      color: "#64748b",
                    }}
                  >
                    {event.subtitle}
                  </p>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    className="feat-tag"
                    style={{ background: event.badgeColor, color: "#1e293b" }}
                  >
                    {event.badge}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      fontWeight: 600,
                    }}
                  >
                    {event.date} · {event.time}
                  </span>
                </div>
              </div>

              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: "13px",
                  color: "#334155",
                  background: "#f8fafc",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  lineHeight: 1.5,
                }}
              >
                {event.details}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
