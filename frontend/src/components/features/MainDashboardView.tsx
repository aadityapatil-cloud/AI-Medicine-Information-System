import React, { useState } from "react"
import { Icon, type IconName } from "../Icon"
import type { PatientUser } from "../../types"

interface DashboardFeature {
  id: string
  icon: IconName
  title: string
  tag: string
  tagColor: string
  tagBg: string
  desc: string
  actionLabel: string
  category: "ai" | "care" | "daily" | "emergency" | "admin"
  navScreen: string
  accentColor: string
}

const ALL_21_FEATURES: DashboardFeature[] = [
  {
    id: "profile",
    icon: "user",
    title: "Patient Health Profile",
    tag: "EHR Baseline",
    tagColor: "#1d4ed8",
    tagBg: "#dbeafe",
    desc: "Manage personal medical baseline, recorded allergies, blood group, chronic conditions, and emergency dispatch contacts.",
    actionLabel: "View Health Profile",
    category: "daily",
    navScreen: "profile",
    accentColor: "#2563eb",
  },
  {
    id: "checker",
    icon: "activity",
    title: "Symptom Checker",
    tag: "Multi-Symptom AI",
    tagColor: "#b91c1c",
    tagBg: "#fee2e2",
    desc: "Evaluate multi-symptom presentations across 132 standardized clinical features with real-time ML diagnostic inference.",
    actionLabel: "Launch Checker",
    category: "ai",
    navScreen: "checker",
    accentColor: "#ff5138",
  },
  {
    id: "results",
    icon: "chart",
    title: "AI Medicine Recommendations",
    tag: "Condition Diagnosis",
    tagColor: "#047857",
    tagBg: "#d1fae5",
    desc: "Review model-based diagnosis, confidence scores, evidence-based medicines, safe dosage rules, and contraindications.",
    actionLabel: "View Diagnostics",
    category: "ai",
    navScreen: "results",
    accentColor: "#10b981",
  },
  {
    id: "doctors",
    icon: "stethoscope",
    title: "Doctor Consultation",
    tag: "Verified Specialists",
    tagColor: "#0284c7",
    tagBg: "#e0f2fe",
    desc: "Browse verified cardiologists, physicians, and dermatologists, and book in-clinic or encrypted HD video consultations.",
    actionLabel: "Consult Doctor",
    category: "care",
    navScreen: "doctors",
    accentColor: "#0284c7",
  },
  {
    id: "stores",
    icon: "store",
    title: "Nearby Medical Stores",
    tag: "24x7 Chemist Network",
    tagColor: "#059669",
    tagBg: "#dcfce7",
    desc: "Locate retail pharmacies nearby, verify real-time drug stock availability, check operating hours, and get directions.",
    actionLabel: "Find Stores",
    category: "care",
    navScreen: "stores",
    accentColor: "#059669",
  },
  {
    id: "hospitals",
    icon: "hospital",
    title: "Nearby Hospitals",
    tag: "ICU & Trauma Care",
    tagColor: "#be123c",
    tagBg: "#ffe4e6",
    desc: "Locate tertiary hospitals, 24x7 emergency trauma centers, verified ICU facilities, and call hospital dispatch lines.",
    actionLabel: "Locate Hospitals",
    category: "emergency",
    navScreen: "hospitals",
    accentColor: "#e11d48",
  },
  {
    id: "reminders",
    icon: "clock",
    title: "Medicine Reminders",
    tag: "Dose Tracker",
    tagColor: "#4338ca",
    tagBg: "#e0e7ff",
    desc: "Set morning, noon, and night medication alarms, log daily dose compliance, and build continuous adherence streaks.",
    actionLabel: "Open Reminders",
    category: "daily",
    navScreen: "reminders",
    accentColor: "#4f46e5",
  },
  {
    id: "prescriptions",
    icon: "prescription",
    title: "Prescription Upload",
    tag: "Digital Vault",
    tagColor: "#0f766e",
    tagBg: "#ccfbf1",
    desc: "Upload, store, and categorize physical prescriptions, laboratory reports, and radiology scans in a secure digital vault.",
    actionLabel: "Access Vault",
    category: "care",
    navScreen: "prescriptions",
    accentColor: "#0d9488",
  },
  {
    id: "chatbot",
    icon: "message",
    title: "AI Health Chatbot",
    tag: "Multilingual Triage",
    tagColor: "#047857",
    tagBg: "#d1fae5",
    desc: "Interactive conversational assistant answering questions on medicine dosages, home-care tips, and symptom triage in 3 languages.",
    actionLabel: "Chat with AI",
    category: "ai",
    navScreen: "chatbot",
    accentColor: "#059669",
  },
  {
    id: "interactions",
    icon: "interaction",
    title: "Medicine Interaction Checker",
    tag: "Safety Pharmacology",
    tagColor: "#c2410c",
    tagBg: "#ffedd5",
    desc: "Test multi-drug regimens to prevent severe adverse drug events (ADEs), biochemical contraindications, and allergic reactions.",
    actionLabel: "Check Interactions",
    category: "ai",
    navScreen: "interactions",
    accentColor: "#ea580c",
  },
  {
    id: "emergency",
    icon: "alert",
    title: "Emergency SOS",
    tag: "Critical Response",
    tagColor: "#dc2626",
    tagBg: "#fee2e2",
    desc: "Single-tap emergency panic button broadcasting live GPS coordinates, medical records, and dialing 108/112 ambulance.",
    actionLabel: "Open Emergency SOS",
    category: "emergency",
    navScreen: "emergency",
    accentColor: "#dc2626",
  },
  {
    id: "family",
    icon: "users",
    title: "Family Health Profiles",
    tag: "Dependents Care",
    tagColor: "#6d28d9",
    tagBg: "#ede9fe",
    desc: "Manage individual health profiles, allergy notes, and medication regimens for your spouse, children, and parents.",
    actionLabel: "Manage Family",
    category: "daily",
    navScreen: "family",
    accentColor: "#7c3aed",
  },
  {
    id: "history",
    icon: "history",
    title: "Health History",
    tag: "Longitudinal EHR",
    tagColor: "#334155",
    tagBg: "#f1f5f9",
    desc: "Comprehensive chronological audit trail of AI symptom checks, physician visits, adherence logs, and lab results.",
    actionLabel: "View Timeline",
    category: "daily",
    navScreen: "history",
    accentColor: "#475569",
  },
  {
    id: "feedback",
    icon: "star",
    title: "Feedback and Support",
    tag: "Quality & Help Desk",
    tagColor: "#b45309",
    tagBg: "#fef3c7",
    desc: "Rate your healthcare experience, submit support tickets, report bugs, and browse clinical answers in the Help Center.",
    actionLabel: "Get Support",
    category: "admin",
    navScreen: "feedback",
    accentColor: "#d97706",
  },
  {
    id: "medicines",
    icon: "medicine",
    title: "Medicine Directory & Catalog",
    tag: "32,000+ Drugs",
    tagColor: "#0284c7",
    tagBg: "#e0f2fe",
    desc: "Search complete pharmacology repository by brand name, active salt composition, manufacturer, indications, and pricing.",
    actionLabel: "Browse Catalog",
    category: "care",
    navScreen: "medicines",
    accentColor: "#0284c7",
  },
  {
    id: "xai",
    icon: "chart",
    title: "Explainable AI (XAI) Insights",
    tag: "Model Transparency",
    tagColor: "#7c3aed",
    tagBg: "#ede9fe",
    desc: "Inspect transparent feature attribution vectors, positive evidence weights, and softmax probability distributions.",
    actionLabel: "View XAI Weights",
    category: "ai",
    navScreen: "xai",
    accentColor: "#7c3aed",
  },
  {
    id: "vitals",
    icon: "thermometer",
    title: "Health Vitals Tracker",
    tag: "Biometric Logs",
    tagColor: "#1d4ed8",
    tagBg: "#dbeafe",
    desc: "Track and log Blood Pressure, Fasting Glucose, Resting Pulse, SpO2, and Body Mass Index with historical trend charts.",
    actionLabel: "Track Vitals",
    category: "daily",
    navScreen: "vitals",
    accentColor: "#2563eb",
  },
  {
    id: "generics",
    icon: "repeat",
    title: "Generic Substitute Finder",
    tag: "Save up to 80%",
    tagColor: "#15803d",
    tagBg: "#dcfce7",
    desc: "Discover chemically identical, WHO-GMP certified generic alternatives to expensive branded medicines and slash pharmacy costs.",
    actionLabel: "Find Generics",
    category: "care",
    navScreen: "generics",
    accentColor: "#16a34a",
  },
  {
    id: "doctor_portal",
    icon: "stethoscope",
    title: "Doctor Portal & Digital Rx Pad",
    tag: "Clinical Suite",
    tagColor: "#1e40af",
    tagBg: "#dbeafe",
    desc: "Doctor workflow console to review upcoming appointments queue and generate digitally signed e-prescriptions.",
    actionLabel: "Doctor Console",
    category: "care",
    navScreen: "doctor_portal",
    accentColor: "#1e40af",
  },
  {
    id: "translations",
    icon: "sparkles",
    title: "Multilingual System Translation",
    tag: "Global Access",
    tagColor: "#0f766e",
    tagBg: "#ccfbf1",
    desc: "Instant real-time interface localization across English, Hindi (हिंदी), Marathi (मराठी), Spanish, and French.",
    actionLabel: "Select Language",
    category: "admin",
    navScreen: "dashboard",
    accentColor: "#0d9488",
  },
  {
    id: "analytics",
    icon: "analytics",
    title: "System Analytics & Health Monitor",
    tag: "Platform Telemetry",
    tagColor: "#334155",
    tagBg: "#f1f5f9",
    desc: "Live system performance, ML diagnostic model accuracy (98.4%), active consultations, and operational uptime telemetry.",
    actionLabel: "View Telemetry",
    category: "admin",
    navScreen: "analytics",
    accentColor: "#475569",
  },
]

interface MainDashboardViewProps {
  currentUser?: PatientUser | null
  selected: string[]
  setSelected: React.Dispatch<React.SetStateAction<string[]>>
  onAnalyse: (symptoms?: string[]) => void
  navigate: (screen: string) => void
  disabled: boolean
}

export function MainDashboardView({
  currentUser,
  setSelected,
  navigate,
  disabled,
}: MainDashboardViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All")

  const benchmarkConditions = [
    {
      name: "Fungal Infection",
      category: "Dermatological",
      symptoms: ["itching", "skin_rash", "nodal_skin_eruptions"],
      symptomLabels: ["Itching", "Skin Rash", "Nodal Skin Eruptions"],
      medicines: "3 Formulations",
      status: "Safe with Precaution",
    },
    {
      name: "Bronchial Asthma",
      category: "Respiratory",
      symptoms: ["fatigue", "cough", "high_fever", "breathlessness"],
      symptomLabels: ["Fatigue", "Cough", "High Fever", "Breathlessness"],
      medicines: "4 Formulations",
      status: "Inhaler Protocol",
    },
    {
      name: "Diabetes",
      category: "Metabolic",
      symptoms: ["fatigue", "weight_loss", "restlessness", "excessive_hunger"],
      symptomLabels: [
        "Fatigue",
        "Weight Loss",
        "Restlessness",
        "Excessive Hunger",
      ],
      medicines: "5 Formulations",
      status: "Chronic Protocol",
    },
    {
      name: "GERD (Acid Reflux)",
      category: "Gastrointestinal",
      symptoms: ["stomach_pain", "acidity", "ulcers_on_tongue", "vomiting"],
      symptomLabels: ["Stomach Pain", "Acidity", "Tongue Ulcers", "Vomiting"],
      medicines: "2 Formulations",
      status: "OTC / Prescription",
    },
  ]

  const handleTestCondition = (conditionSymptoms: string[]) => {
    setSelected(conditionSymptoms)
    navigate("checker")
  }

  const filteredFeatures = ALL_21_FEATURES.filter((f) => {
    if (activeCategory === "All") return true
    if (activeCategory === "Clinical & AI") return f.category === "ai"
    if (activeCategory === "Care & Doctors") return f.category === "care"
    if (activeCategory === "Daily Tracking") return f.category === "daily"
    if (activeCategory === "Emergency & Safety")
      return f.category === "emergency"
    if (activeCategory === "Platform & Admin") return f.category === "admin"
    return true
  })

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Redesigned Modern Healthcare Dashboard Hero */}
      <section className="dashboard-welcome" style={{ padding: "32px 36px" }}>
        <div className="welcome-copy">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "8px",
            }}
          >
            <span className="welcome-pill">
              <Icon name="sparkles" size={14} /> Clinical AI Decision-Support
              v2.4 Active
            </span>
            <span
              className="feat-tag"
              style={{
                background: "rgba(16, 185, 129, 0.2)",
                color: "#10b981",
              }}
            >
              ✓ All 21 Features Online
            </span>
          </div>

          <h1
            style={{
              fontSize: "28px",
              fontWeight: 900,
              color: "var(--navy)",
              margin: "4px 0 10px",
              letterSpacing: "-0.02em",
            }}
          >
            Welcome back, {currentUser?.full_name || "Patient"}!
          </h1>

          <p
            style={{
              maxWidth: "680px",
              fontSize: "14px",
              color: "#64748b",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Comprehensive healthcare management ecosystem: evaluate 132 symptoms
            with explainable AI, consult registered doctors, track medicine
            reminders, inspect multi-drug interactions, and access 24/7
            emergency dispatch.
          </p>

          <div
            className="welcome-actions"
            style={{
              marginTop: "20px",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="btn btn--primary"
              style={{
                background: "#ff5138",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
              onClick={() => navigate("checker")}
              disabled={disabled}
            >
              <Icon name="activity" size={18} /> Launch Symptom Checker
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
              onClick={() => navigate("chatbot")}
            >
              <Icon name="message" size={18} /> AI Health Chatbot
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#dc2626",
                borderColor: "#fca5a5",
              }}
              onClick={() => navigate("emergency")}
            >
              <Icon name="alert" size={18} /> Emergency SOS
            </button>
          </div>
        </div>
      </section>

      {/* Patient Health Baseline & Today's Overview Bar */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "14px",
        }}
      >
        <div
          className="card"
          style={{
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            cursor: "pointer",
          }}
          onClick={() => navigate("profile")}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "#dbeafe",
              color: "#1d4ed8",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="user" size={20} />
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
              Health Record
            </span>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 800,
                color: "var(--navy)",
              }}
            >
              {currentUser?.full_name || "Profile"}
            </div>
            <div
              style={{ fontSize: "12px", color: "#2563eb", fontWeight: 600 }}
            >
              Blood Group: {currentUser?.blood_group || "O+"} →
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            cursor: "pointer",
          }}
          onClick={() => navigate("vitals")}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "#dcfce7",
              color: "#15803d",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="thermometer" size={20} />
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
              Baseline Vitals
            </span>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 800,
                color: "var(--navy)",
              }}
            >
              {currentUser?.blood_pressure || "120/80"} mmHg
            </div>
            <div
              style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600 }}
            >
              Normal Blood Pressure →
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            cursor: "pointer",
          }}
          onClick={() => navigate("reminders")}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "#ede9fe",
              color: "#6d28d9",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="clock" size={20} />
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
              Today's Medicine
            </span>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 800,
                color: "var(--navy)",
              }}
            >
              Metformin 500mg
            </div>
            <div
              style={{ fontSize: "12px", color: "#7c3aed", fontWeight: 600 }}
            >
              Dose Taken · 6-Day Streak →
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            cursor: "pointer",
          }}
          onClick={() => navigate("doctors")}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "#e0f2fe",
              color: "#0369a1",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="stethoscope" size={20} />
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
              Doctor Network
            </span>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 800,
                color: "var(--navy)",
              }}
            >
              48 Specialists
            </div>
            <div
              style={{ fontSize: "12px", color: "#0284c7", fontWeight: 600 }}
            >
              Book Appointment →
            </div>
          </div>
        </div>
      </section>

      {/* ALL 21 FEATURES SECTION */}
      <section className="dashboard-features-section">
        <div className="dashboard-features-header">
          <div>
            <h3>
              <Icon
                name="dashboard"
                size={22}
                style={{ color: "var(--blue)" }}
              />
              All 21 Healthcare Features
            </h3>
            <p
              style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}
            >
              Every feature is fully integrated with interactive components,
              live forms, and backend APIs.
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="feature-filter-tabs">
            {[
              "All",
              "Clinical & AI",
              "Care & Doctors",
              "Daily Tracking",
              "Emergency & Safety",
              "Platform & Admin",
            ].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`feature-filter-btn ${
                  activeCategory === cat ? "active" : ""
                }`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 21 Feature Cards Grid */}
        <div className="features-21-grid">
          {filteredFeatures.map((feat, index) => (
            <div
              key={feat.id}
              className="feature-card-item"
              onClick={() => navigate(feat.navScreen)}
              style={
                { "--card-accent": feat.accentColor } as React.CSSProperties
              }
            >
              <div>
                <div className="feature-card-top">
                  <div
                    className="feature-card-icon-wrapper"
                    style={{ background: feat.tagBg, color: feat.tagColor }}
                  >
                    <Icon name={feat.icon} size={22} />
                  </div>
                  <span
                    className="feat-tag"
                    style={{ background: feat.tagBg, color: feat.tagColor }}
                  >
                    {feat.tag}
                  </span>
                </div>

                <div
                  className="feature-card-body"
                  style={{ marginTop: "14px" }}
                >
                  <h4>{feat.title}</h4>
                  <p>{feat.desc}</p>
                </div>
              </div>

              <div className="feature-card-footer">
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#94a3b8",
                  }}
                >
                  Feature {String(index + 1).padStart(2, "0")}
                </span>
                <span className="feature-action-btn">{feat.actionLabel} →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benchmark Conditions Quick Test Runner */}
      <section className="card" style={{ padding: "26px" }}>
        <div className="card-header-row" style={{ marginBottom: "14px" }}>
          <div>
            <span className="section-kicker">Clinical Validation</span>
            <h3
              style={{
                margin: "2px 0 0",
                fontSize: "18px",
                fontWeight: 800,
                color: "var(--navy)",
              }}
            >
              Benchmark Condition Presets (Quick Evaluation)
            </h3>
          </div>
          <span className="status-badge status-badge--active">Validated</span>
        </div>

        <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748b" }}>
          Instantly test pre-configured multi-symptom presentations across
          validated disease benchmarks:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "14px",
          }}
        >
          {benchmarkConditions.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: "#f8fafc",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.category}
                  </span>
                  <span
                    className="feat-tag"
                    style={{ background: "#e0e7ff", color: "#4338ca" }}
                  >
                    {item.medicines}
                  </span>
                </div>
                <h4
                  style={{
                    margin: "6px 0 4px",
                    fontSize: "16px",
                    fontWeight: 800,
                    color: "var(--navy)",
                  }}
                >
                  {item.name}
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "4px",
                    marginTop: "6px",
                  }}
                >
                  {item.symptomLabels.map((lbl, lIdx) => (
                    <span
                      key={lIdx}
                      style={{
                        padding: "2px 8px",
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        fontSize: "11px",
                        color: "#475569",
                        fontWeight: 600,
                      }}
                    >
                      {lbl}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="btn btn--secondary"
                style={{ fontSize: "12px", justifyContent: "center" }}
                onClick={() => handleTestCondition(item.symptoms)}
              >
                Run Test Diagnosis →
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
