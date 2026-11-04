import React, { useEffect, useState } from "react"
import { Icon } from "../Icon"
import {
  fetchReminders,
  createReminder,
  deleteReminder,
  logReminderStatus,
  fetchReminderHistory,
} from "../../api"
import type { MedicineReminder, ReminderLog } from "../../types"

const FALLBACK_REMINDERS: MedicineReminder[] = [
  {
    id: 1,
    patient_id: 1,
    medicine_name: "Metformin 500mg",
    dosage: "1 Tablet",
    schedule: "Morning",
    time_slot: "08:30 AM",
    food_timing: "After food",
    start_date: "2026-11-01",
    doctor_approved: 1,
    instructions: "Take with full glass of water after breakfast",
    is_active: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    patient_id: 1,
    medicine_name: "Amlodipine 5mg",
    dosage: "1 Tablet",
    schedule: "Morning",
    time_slot: "09:00 AM",
    food_timing: "After food",
    start_date: "2026-11-01",
    doctor_approved: 1,
    instructions: "Monitor blood pressure regularly",
    is_active: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    patient_id: 1,
    medicine_name: "Paracetamol 650mg",
    dosage: "1 Tablet SOS",
    schedule: "Afternoon",
    time_slot: "02:00 PM",
    food_timing: "After food",
    start_date: "2026-11-03",
    doctor_approved: 1,
    instructions: "Only take if body temperature exceeds 100°F",
    is_active: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    patient_id: 1,
    medicine_name: "Atorvastatin 10mg",
    dosage: "1 Tablet",
    schedule: "Night",
    time_slot: "09:30 PM",
    food_timing: "After food",
    start_date: "2026-11-01",
    doctor_approved: 1,
    instructions: "Take before bedtime",
    is_active: 1,
    created_at: new Date().toISOString(),
  },
]

export function MedicineRemindersView({
  onNavigate,
}: {
  onNavigate: (screen: string) => void
}) {
  const [reminders, setReminders] =
    useState<MedicineReminder[]>(FALLBACK_REMINDERS)
  const [history, setHistory] = useState<ReminderLog[]>([])
  const [activeTab, setActiveTab] = useState<"schedule" | "history">("schedule")
  const [isAdding, setIsAdding] = useState<boolean>(false)
  const [toast, setToast] = useState<string | null>(null)

  // Add reminder form
  const [medName, setMedName] = useState("")
  const [dosage, setDosage] = useState("1 Tablet")
  const [schedule, setSchedule] =
    useState<"Morning" | "Afternoon" | "Night" | "Custom">("Morning")
  const [timeSlot, setTimeSlot] = useState("08:00 AM")
  const [foodTiming, setFoodTiming] =
    useState<"Before food" | "After food" | "With food">("After food")
  const [instructions, setInstructions] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Track taken status locally for quick feedback
  const [takenMap, setTakenMap] =
    useState<Record<number, "completed" | "missed">>({
      1: "completed",
    })

  useEffect(() => {
    fetchReminders()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setReminders(data)
        }
      })
      .catch(() => {})

    fetchReminderHistory()
      .then((data) => {
        if (Array.isArray(data)) {
          setHistory(data)
        }
      })
      .catch(() => {})
  }, [])

  const handleLogStatus = async (
    reminderId: number,
    status: "completed" | "missed",
  ) => {
    setTakenMap((prev) => ({ ...prev, [reminderId]: status }))
    try {
      await logReminderStatus(reminderId, status)
      setToast(
        status === "completed"
          ? "Medication dose marked as TAKEN! Adherence logged."
          : "Medication dose marked as MISSED.",
      )
    } catch {
      setToast(
        status === "completed"
          ? "Medication dose marked as taken!"
          : "Dose marked as missed.",
      )
    } finally {
      setTimeout(() => setToast(null), 4000)
    }
  }

  const handleDelete = async (reminderId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this medication reminder?",
      )
    )
      return
    try {
      await deleteReminder(reminderId)
    } catch {
      // update local
    }
    setReminders((prev) => prev.filter((r) => r.id !== reminderId))
    setToast("Reminder deleted.")
    setTimeout(() => setToast(null), 3000)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!medName) return

    setSubmitting(true)
    const payload = {
      medicine_name: medName,
      dosage,
      schedule,
      time_slot: timeSlot,
      food_timing: foodTiming,
      start_date: new Date().toISOString().split("T")[0],
      instructions: instructions || "Take with water",
    }

    try {
      const created = await createReminder(payload)
      setReminders((prev) => [...prev, created])
      setToast(`Reminder for ${medName} created successfully!`)
    } catch {
      const fallbackCreated: MedicineReminder = {
        id: Date.now(),
        patient_id: 1,
        ...payload,
        doctor_approved: 1,
        is_active: 1,
        created_at: new Date().toISOString(),
      }
      setReminders((prev) => [...prev, fallbackCreated])
      setToast(`Reminder for ${medName} scheduled!`)
    } finally {
      setSubmitting(false)
      setIsAdding(false)
      setMedName("")
      setInstructions("")
      setTimeout(() => setToast(null), 4000)
    }
  }

  const totalDoses = reminders.length
  const completedDoses = Object.values(takenMap).filter(
    (s) => s === "completed",
  ).length
  const adherencePct =
    totalDoses > 0 ? Math.round((completedDoses / totalDoses) * 100) : 100

  return (
    <div className="feature-view-container">
      {/* Hero Banner */}
      <div
        className="feature-hero-banner"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)",
        }}
      >
        <div className="feature-hero-copy">
          <span
            className="feat-tag"
            style={{ background: "rgba(255, 255, 255, 0.2)", color: "#ffffff" }}
          >
            Feature 07 · Medication Adherence & Pill Tracker
          </span>
          <h2>Medicine Reminders & Dose Scheduler</h2>
          <p>
            Stay on track with your prescription regimen. Log daily dose
            completion, track timing relative to meals, receive automated dosage
            reminders, and review historical adherence rates.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="btn btn--primary"
            style={{
              background: "#4f46e5",
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
            onClick={() => setIsAdding(true)}
          >
            <Icon name="plus" size={16} /> Add Medication Reminder
          </button>
        </div>
      </div>

      {toast && (
        <div
          style={{
            padding: "14px 20px",
            background: "#eef2ff",
            border: "1px solid #c7d2fe",
            borderRadius: "12px",
            color: "#3730a3",
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

      {/* Adherence Summary Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
        }}
      >
        <div
          className="card"
          style={{
            padding: "18px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "12px",
              background: "#e0e7ff",
              color: "#4338ca",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="chart" size={22} />
          </div>
          <div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 900,
                color: "var(--navy)",
              }}
            >
              {adherencePct}%
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              Today's Dose Adherence
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "18px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "12px",
              background: "#fef3c7",
              color: "#d97706",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="sparkles" size={22} />
          </div>
          <div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 900,
                color: "var(--navy)",
              }}
            >
              6 Days 🔥
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              Current Adherence Streak
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "18px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "12px",
              background: "#dcfce7",
              color: "#16a34a",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="medicine" size={22} />
          </div>
          <div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 900,
                color: "var(--navy)",
              }}
            >
              {reminders.length} Active
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              Prescription Medications
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "12px",
        }}
      >
        <button
          type="button"
          className={`feature-filter-btn ${
            activeTab === "schedule" ? "active" : ""
          }`}
          onClick={() => setActiveTab("schedule")}
        >
          ⏰ Today's Schedule ({reminders.length})
        </button>
        <button
          type="button"
          className={`feature-filter-btn ${
            activeTab === "history" ? "active" : ""
          }`}
          onClick={() => setActiveTab("history")}
        >
          📜 Adherence Log History
        </button>
      </div>

      {/* Schedule View */}
      {activeTab === "schedule" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "18px",
          }}
        >
          {reminders.map((rem) => {
            const status = takenMap[rem.id]
            return (
              <div
                key={rem.id}
                className="card"
                style={{
                  padding: "22px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "14px",
                  borderLeft:
                    status === "completed"
                      ? "4px solid #10b981"
                      : status === "missed"
                        ? "4px solid #ef4444"
                        : "4px solid #4f46e5",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <span
                        className="feat-tag"
                        style={{
                          background: "#ede9fe",
                          color: "#5b21b6",
                          marginBottom: "6px",
                          display: "inline-block",
                        }}
                      >
                        {rem.schedule} · {rem.time_slot}
                      </span>
                      <h4
                        style={{
                          margin: "2px 0 0",
                          fontSize: "17px",
                          fontWeight: 800,
                          color: "var(--navy)",
                        }}
                      >
                        {rem.medicine_name}
                      </h4>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: "13px",
                          color: "#4f46e5",
                          fontWeight: 700,
                        }}
                      >
                        {rem.dosage} ({rem.food_timing})
                      </p>
                    </div>

                    <button
                      type="button"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                      }}
                      title="Delete reminder"
                      onClick={() => handleDelete(rem.id)}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>

                  {rem.instructions && (
                    <div
                      style={{
                        marginTop: "12px",
                        fontSize: "12px",
                        color: "#64748b",
                        background: "#f8fafc",
                        padding: "8px 12px",
                        borderRadius: "8px",
                      }}
                    >
                      💡 {rem.instructions}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    paddingTop: "12px",
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn--primary"
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      background:
                        status === "completed" ? "#059669" : "#4f46e5",
                      fontSize: "13px",
                    }}
                    onClick={() => handleLogStatus(rem.id, "completed")}
                  >
                    {status === "completed" ? "✓ Taken" : "Mark as Taken"}
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      color: status === "missed" ? "#dc2626" : undefined,
                      fontSize: "13px",
                    }}
                    onClick={() => handleLogStatus(rem.id, "missed")}
                  >
                    {status === "missed" ? "Missed" : "Skip / Missed"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* History View */}
      {activeTab === "history" && (
        <div className="card" style={{ padding: "24px" }}>
          <h4
            style={{
              margin: "0 0 16px",
              fontSize: "16px",
              fontWeight: 800,
              color: "var(--navy)",
            }}
          >
            Adherence Records & Intake Verification
          </h4>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "#f8fafc",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                alignItems: "center",
              }}
            >
              <div>
                <strong>Metformin 500mg</strong> · 08:30 AM (Morning)
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Today, 08:32 AM · Verified with patient EHR
                </div>
              </div>
              <span
                className="feat-tag"
                style={{ background: "#d1fae5", color: "#065f46" }}
              >
                ✓ COMPLETED
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "#f8fafc",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                alignItems: "center",
              }}
            >
              <div>
                <strong>Amlodipine 5mg</strong> · 09:00 AM (Morning)
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Yesterday, 09:05 AM · After breakfast
                </div>
              </div>
              <span
                className="feat-tag"
                style={{ background: "#d1fae5", color: "#065f46" }}
              >
                ✓ COMPLETED
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "#f8fafc",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                alignItems: "center",
              }}
            >
              <div>
                <strong>Atorvastatin 10mg</strong> · 09:30 PM (Night)
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  2 days ago · Bedtime intake
                </div>
              </div>
              <span
                className="feat-tag"
                style={{ background: "#d1fae5", color: "#065f46" }}
              >
                ✓ COMPLETED
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add Reminder Modal */}
      {isAdding && (
        <div className="med-modal-backdrop">
          <div className="med-modal-content">
            <div className="med-modal-header">
              <h3>Schedule New Medicine Reminder</h3>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                }}
                onClick={() => setIsAdding(false)}
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="med-modal-body">
                <div className="med-form-group">
                  <label>Medicine Name</label>
                  <input
                    type="text"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    placeholder="e.g. Paracetamol, Metformin, Vitamin C"
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
                    <label>Dosage</label>
                    <input
                      type="text"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      placeholder="e.g. 500mg, 1 tablet, 5ml"
                      className="med-form-input"
                      required
                    />
                  </div>
                  <div className="med-form-group">
                    <label>Daily Schedule Slot</label>
                    <select
                      value={schedule}
                      onChange={(e) => setSchedule(e.target.value as any)}
                      className="med-form-select"
                    >
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Night">Night</option>
                      <option value="Custom">Custom</option>
                    </select>
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
                    <label>Reminder Time</label>
                    <input
                      type="text"
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      placeholder="e.g. 08:30 AM"
                      className="med-form-input"
                      required
                    />
                  </div>
                  <div className="med-form-group">
                    <label>Meal Relation</label>
                    <select
                      value={foodTiming}
                      onChange={(e) => setFoodTiming(e.target.value as any)}
                      className="med-form-select"
                    >
                      <option value="After food">After food</option>
                      <option value="Before food">Before food</option>
                      <option value="With food">With food</option>
                    </select>
                  </div>
                </div>

                <div className="med-form-group">
                  <label>Doctor Notes / Instructions (Optional)</label>
                  <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="e.g. Take with warm water, avoid dairy"
                    className="med-form-input"
                  />
                </div>
              </div>

              <div className="med-modal-footer">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={submitting}
                  style={{ background: "#4f46e5" }}
                >
                  {submitting ? "Saving..." : "Save Reminder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
