import React, { useState } from "react"
import { Icon } from "../Icon"
import type { PatientUser } from "../../types"

interface VitalLog {
  id: string
  date: string
  time: string
  bp: string
  sugar: number
  heartRate: number
  spo2: number
  weight: number
}

const INITIAL_LOGS: VitalLog[] = [
  {
    id: "v1",
    date: "2026-11-04",
    time: "08:15 AM",
    bp: "120/80",
    sugar: 104,
    heartRate: 72,
    spo2: 99,
    weight: 68.5,
  },
  {
    id: "v2",
    date: "2026-11-03",
    time: "08:30 AM",
    bp: "122/82",
    sugar: 108,
    heartRate: 74,
    spo2: 98,
    weight: 68.7,
  },
  {
    id: "v3",
    date: "2026-11-02",
    time: "08:20 AM",
    bp: "118/78",
    sugar: 99,
    heartRate: 70,
    spo2: 99,
    weight: 68.4,
  },
]

export function VitalsTrackerView({
  currentUser,
  onNavigate,
}: {
  currentUser?: PatientUser | null
  onNavigate: (screen: string) => void
}) {
  const [logs, setLogs] = useState<VitalLog[]>(INITIAL_LOGS)
  const [isLogging, setIsLogging] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Form state
  const [systolic, setSystolic] = useState("120")
  const [diastolic, setDiastolic] = useState("80")
  const [sugar, setSugar] = useState("105")
  const [heartRate, setHeartRate] = useState("72")
  const [spo2, setSpo2] = useState("99")
  const [weight, setWeight] = useState(currentUser?.weight?.toString() || "68")
  const [height, setHeight] = useState("172")

  const latest = logs[0] || INITIAL_LOGS[0]

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault()
    const newLog: VitalLog = {
      id: `v-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      bp: `${systolic}/${diastolic}`,
      sugar: parseFloat(sugar) || 100,
      heartRate: parseInt(heartRate) || 72,
      spo2: parseInt(spo2) || 98,
      weight: parseFloat(weight) || 68,
    }

    setLogs((prev) => [newLog, ...prev])
    setIsLogging(false)
    setToast("New clinical vital signs logged successfully!")
    setTimeout(() => setToast(null), 4000)
  }

  // Calculate BMI
  const heightM = (parseFloat(height) || 172) / 100
  const weightKg = parseFloat(weight) || 68
  const bmi = (weightKg / (heightM * heightM)).toFixed(1)

  const getBmiCategory = (val: number) => {
    if (val < 18.5) return { label: "Underweight", color: "#f59e0b" }
    if (val < 25) return { label: "Normal (Healthy)", color: "#10b981" }
    if (val < 30) return { label: "Overweight", color: "#f97316" }
    return { label: "Obese", color: "#ef4444" }
  }

  const bmiCat = getBmiCategory(parseFloat(bmi))

  return (
    <div className="feature-view-container">
      {/* Hero Banner */}
      <div
        className="feature-hero-banner"
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #0369a1 100%)",
        }}
      >
        <div className="feature-hero-copy">
          <span
            className="feat-tag"
            style={{ background: "rgba(255, 255, 255, 0.2)", color: "#ffffff" }}
          >
            Feature 17 · Biometric Monitoring & Wellness
          </span>
          <h2>Health Vitals & Wellness Tracker</h2>
          <p>
            Monitor real-time physiological indicators including Blood Pressure,
            Fasting Blood Glucose, Resting Heart Rate, Blood Oxygen (SpO2), and
            Body Mass Index (BMI).
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="btn btn--primary"
            style={{ background: "#ffffff", color: "#1e3a8a", fontWeight: 800 }}
            onClick={() => setIsLogging(true)}
          >
            + Log New Vitals
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

      {/* Vitals Summary Grid */}
      <div className="vitals-grid">
        {/* Blood Pressure */}
        <div className="vital-metric-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}
            >
              Blood Pressure
            </span>
            <span
              className="feat-tag"
              style={{ background: "#dcfce7", color: "#15803d" }}
            >
              Normal
            </span>
          </div>
          <div className="vital-metric-val">
            {latest.bp} <small>mmHg</small>
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
            Baseline: Systolic &lt; 120, Diastolic &lt; 80
          </p>
        </div>

        {/* Blood Glucose */}
        <div className="vital-metric-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}
            >
              Blood Glucose (Fasting)
            </span>
            <span
              className="feat-tag"
              style={{ background: "#dcfce7", color: "#15803d" }}
            >
              Normal
            </span>
          </div>
          <div className="vital-metric-val">
            {latest.sugar} <small>mg/dL</small>
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
            Target: 70 - 110 mg/dL (fasting)
          </p>
        </div>

        {/* Heart Rate */}
        <div className="vital-metric-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}
            >
              Resting Pulse
            </span>
            <span
              className="feat-tag"
              style={{ background: "#e0e7ff", color: "#4338ca" }}
            >
              Optimal
            </span>
          </div>
          <div className="vital-metric-val">
            {latest.heartRate} <small>BPM</small>
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
            Normal: 60 - 100 beats per minute
          </p>
        </div>

        {/* SpO2 */}
        <div className="vital-metric-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}
            >
              Blood Oxygen (SpO2)
            </span>
            <span
              className="feat-tag"
              style={{ background: "#dcfce7", color: "#15803d" }}
            >
              Safe
            </span>
          </div>
          <div className="vital-metric-val">
            {latest.spo2}% <small>saturation</small>
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
            Normal clinical range: 95% - 100%
          </p>
        </div>

        {/* BMI Card */}
        <div className="vital-metric-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}
            >
              Body Mass Index (BMI)
            </span>
            <span
              className="feat-tag"
              style={{ background: "#ecfdf5", color: bmiCat.color }}
            >
              {bmiCat.label}
            </span>
          </div>
          <div className="vital-metric-val">
            {bmi} <small>kg/m²</small>
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
            Weight: {weightKg} kg · Height: {height} cm
          </p>
        </div>
      </div>

      {/* Historical Readings Log */}
      <div className="card" style={{ padding: "24px" }}>
        <h3
          style={{
            margin: "0 0 16px",
            fontSize: "17px",
            fontWeight: 800,
            color: "var(--navy)",
          }}
        >
          Recent Vitals Log History
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
              textAlign: "left",
            }}
          >
            <thead>
              <tr
                style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b" }}
              >
                <th style={{ padding: "10px 14px" }}>Date & Time</th>
                <th style={{ padding: "10px 14px" }}>Blood Pressure</th>
                <th style={{ padding: "10px 14px" }}>Blood Sugar</th>
                <th style={{ padding: "10px 14px" }}>Heart Rate</th>
                <th style={{ padding: "10px 14px" }}>SpO2</th>
                <th style={{ padding: "10px 14px" }}>Weight</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td
                    style={{
                      padding: "12px 14px",
                      fontWeight: 700,
                      color: "var(--navy)",
                    }}
                  >
                    {log.date} · {log.time}
                  </td>
                  <td
                    style={{
                      padding: "12px 14px",
                      color: "#2563eb",
                      fontWeight: 700,
                    }}
                  >
                    {log.bp} mmHg
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: 600 }}>
                    {log.sugar} mg/dL
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: 600 }}>
                    {log.heartRate} BPM
                  </td>
                  <td
                    style={{
                      padding: "12px 14px",
                      color: "#16a34a",
                      fontWeight: 700,
                    }}
                  >
                    {log.spo2}%
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: 600 }}>
                    {log.weight} kg
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Modal */}
      {isLogging && (
        <div className="med-modal-backdrop">
          <div className="med-modal-content">
            <div className="med-modal-header">
              <h3>Log Vital Signs Measurement</h3>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                }}
                onClick={() => setIsLogging(false)}
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveVitals}>
              <div className="med-modal-body">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px",
                  }}
                >
                  <div className="med-form-group">
                    <label>Systolic BP (mmHg)</label>
                    <input
                      type="number"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      className="med-form-input"
                      required
                    />
                  </div>
                  <div className="med-form-group">
                    <label>Diastolic BP (mmHg)</label>
                    <input
                      type="number"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
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
                    <label>Fasting Blood Sugar (mg/dL)</label>
                    <input
                      type="number"
                      value={sugar}
                      onChange={(e) => setSugar(e.target.value)}
                      className="med-form-input"
                    />
                  </div>
                  <div className="med-form-group">
                    <label>Heart Rate (BPM)</label>
                    <input
                      type="number"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      className="med-form-input"
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div className="med-form-group">
                    <label>SpO2 (%)</label>
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      className="med-form-input"
                    />
                  </div>
                  <div className="med-form-group">
                    <label>Weight (kg)</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="med-form-input"
                    />
                  </div>
                  <div className="med-form-group">
                    <label>Height (cm)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="med-form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="med-modal-footer">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setIsLogging(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  style={{ background: "#1e3a8a" }}
                >
                  Save Measurement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
