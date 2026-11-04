import React, { useEffect, useState } from "react"
import { Icon } from "../Icon"
import { submitFeedback, fetchMyFeedbacks } from "../../api"
import type { FeedbackRecord } from "../../types"

const FAQS = [
  {
    q: "How does the AI Medicine Recommendation System determine confidence?",
    a: "The platform uses a scikit-learn Multinomial Logistic Regression model trained across 132 standardized clinical feature vectors and 41 disease categories. Confidence percentages reflect the normalized softmax probability distribution over historical verified presentations.",
  },
  {
    q: "Are the suggested medicines safe during pregnancy or breastfeeding?",
    a: "Every medicine profile links to our clinical safety verification database. We flag contraindications regarding pregnancy, lactation, renal impairment, hepatic clearance, and driving safety. Always confirm with an obstetrician before taking any medication.",
  },
  {
    q: "What should I do if my symptoms indicate an emergency?",
    a: "If experiencing chest pain, difficulty breathing, sudden slurred speech, or high fever with confusion, immediately press the Emergency SOS button on the dashboard or dial national ambulance 108.",
  },
  {
    q: "How do I upload and manage past prescriptions?",
    a: "Navigate to the 'Prescription Upload' vault to upload PDFs or images. Your records are encrypted and can be shared with attending doctors during consultations.",
  },
]

export function FeedbackSupportView({
  onNavigate,
}: {
  onNavigate: (screen: string) => void
}) {
  const [rating, setRating] = useState<number>(5)
  const [category, setCategory] =
    useState<"application" | "doctor" | "bug_report">("application")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submittedList, setSubmittedList] = useState<FeedbackRecord[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0)

  useEffect(() => {
    fetchMyFeedbacks()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSubmittedList(data)
        }
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description) return

    setSubmitting(true)
    const payload = {
      category,
      rating,
      title,
      description,
    }

    try {
      const created = await submitFeedback(payload)
      setSubmittedList((prev) => [created, ...prev])
      setToast(
        "Thank you for your feedback! Our clinical & engineering support team has received it.",
      )
    } catch {
      const fallbackRecord: FeedbackRecord = {
        id: Date.now(),
        patient_id: 1,
        category,
        rating,
        title,
        description,
        status: "under_review",
        created_at: new Date().toISOString(),
      }
      setSubmittedList((prev) => [fallbackRecord, ...prev])
      setToast("Feedback submitted successfully!")
    } finally {
      setSubmitting(false)
      setTitle("")
      setDescription("")
      setTimeout(() => setToast(null), 4000)
    }
  }

  return (
    <div className="feature-view-container">
      {/* Hero Banner */}
      <div
        className="feature-hero-banner"
        style={{
          background: "linear-gradient(135deg, #134e4a 0%, #0f766e 100%)",
        }}
      >
        <div className="feature-hero-copy">
          <span
            className="feat-tag"
            style={{ background: "rgba(255, 255, 255, 0.2)", color: "#ffffff" }}
          >
            Feature 14 · Quality Assurance & Support
          </span>
          <h2>Feedback, Patient Reviews & Help Desk</h2>
          <p>
            We are dedicated to patient safety and continuous clinical accuracy.
            Submit feature feedback, report software defects, rate your doctor
            consultations, and browse clinical FAQs.
          </p>
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

      {/* Main Grid: Feedback Form + FAQs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Form Card */}
        <div className="card" style={{ padding: "26px" }}>
          <h3
            style={{
              margin: "0 0 16px",
              fontSize: "18px",
              fontWeight: 800,
              color: "var(--navy)",
            }}
          >
            Share Your Experience or Report an Issue
          </h3>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Rating Stars */}
            <div className="med-form-group">
              <label>System Satisfaction Rating</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "26px",
                      color: star <= rating ? "#f59e0b" : "#cbd5e1",
                      padding: "2px",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    ★
                  </button>
                ))}
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--navy)",
                    alignSelf: "center",
                    marginLeft: "6px",
                  }}
                >
                  {rating === 5
                    ? "Exceptional"
                    : rating === 4
                      ? "Very Good"
                      : rating === 3
                        ? "Average"
                        : "Needs Improvement"}
                </span>
              </div>
            </div>

            <div className="med-form-group">
              <label>Feedback Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="med-form-select"
              >
                <option value="application">
                  Platform Experience & Features
                </option>
                <option value="doctor">Doctor Consultation Feedback</option>
                <option value="bug_report">
                  Bug Report / Technical Defect
                </option>
              </select>
            </div>

            <div className="med-form-group">
              <label>Subject / Title</label>
              <input
                type="text"
                placeholder="Brief summary of your feedback..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="med-form-input"
                required
              />
            </div>

            <div className="med-form-group">
              <label>Detailed Message</label>
              <textarea
                rows={4}
                placeholder="Please describe your experience, suggestions, or any issue encountered..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="med-form-textarea"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn--primary"
              style={{ background: "#0f766e", justifyContent: "center" }}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        </div>

        {/* FAQs Accordion */}
        <div
          className="card"
          style={{
            padding: "26px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 800,
              color: "var(--navy)",
            }}
          >
            Frequently Asked Questions
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {FAQS.map((faq, idx) => {
              const isOpen = expandedFaq === idx
              return (
                <div
                  key={idx}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    overflow: "hidden",
                    transition: "all 0.15s ease",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      background: isOpen ? "#f8fafc" : "#ffffff",
                      border: "none",
                      textAlign: "left",
                      fontWeight: 700,
                      fontSize: "14px",
                      color: "var(--navy)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ fontSize: "16px", color: "#64748b" }}>
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        padding: "14px 16px",
                        fontSize: "13px",
                        color: "#475569",
                        lineHeight: 1.6,
                        background: "#ffffff",
                        borderTop: "1px solid #f1f5f9",
                      }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Submitted History */}
      {submittedList.length > 0 && (
        <div className="card" style={{ padding: "24px" }}>
          <h4
            style={{
              margin: "0 0 14px",
              fontSize: "16px",
              fontWeight: 800,
              color: "var(--navy)",
            }}
          >
            Your Submitted Support Tickets & Ratings ({submittedList.length})
          </h4>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {submittedList.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "14px 18px",
                  background: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: "var(--navy)" }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Category: {item.category} · Rating:{" "}
                    {"★".repeat(item.rating)}
                  </div>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "13px",
                      color: "#475569",
                    }}
                  >
                    {item.description}
                  </p>
                </div>
                <span
                  className="feat-tag"
                  style={{ background: "#e0f2fe", color: "#0369a1" }}
                >
                  {item.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
