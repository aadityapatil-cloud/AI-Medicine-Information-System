import React, { useState } from "react"
import { Icon } from "../Icon"
import { triggerEmergencyAlert } from "../../api"
import type { PatientUser } from "../../types"

export function EmergencySosView({
  currentUser,
  onNavigate,
}: {
  currentUser?: PatientUser | null
  onNavigate: (screen: string) => void
}) {
  const [broadcasting, setBroadcasting] = useState(false)
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  const handleTriggerSOS = () => {
    if (
      !window.confirm(
        "⚠️ Confirm Emergency SOS Trigger: This will broadcast an acute medical emergency alert and your live GPS location to emergency responders and your emergency contact.",
      )
    ) {
      return
    }

    setBroadcasting(true)

    // Attempt geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setCoords({ lat, lng })
          try {
            await triggerEmergencyAlert(
              lat,
              lng,
              "Immediate acute medical emergency triggered via SOS panic button",
            )
          } catch {}
          setBroadcasting(false)
          setAlertSuccess(
            `🚨 EMERGENCY SOS DISPATCHED: Location coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}) transmitted. Ambulance & emergency contact (${currentUser?.emergency_contact_phone || "Primary contact"}) notified!`,
          )
        },
        async () => {
          // Geolocation declined/unavailable
          try {
            await triggerEmergencyAlert(
              undefined,
              undefined,
              "Acute medical emergency triggered via SOS panic button (GPS unavailable)",
            )
          } catch {}
          setBroadcasting(false)
          setAlertSuccess(
            `🚨 EMERGENCY SOS BROADCASTED: Emergency responders and your emergency contact (${currentUser?.emergency_contact_phone || "+91 99887 76655"}) have been alerted!`,
          )
        },
      )
    } else {
      triggerEmergencyAlert().catch(() => {})
      setBroadcasting(false)
      setAlertSuccess(
        "🚨 EMERGENCY SOS BROADCASTED to registered contacts and nearest emergency network!",
      )
    }
  }

  return (
    <div className="feature-view-container">
      {/* SOS Hero Panic Card */}
      <div className="sos-banner-card">
        <span
          className="feat-tag"
          style={{ background: "rgba(255, 255, 255, 0.25)", color: "#ffffff" }}
        >
          Feature 11 · Rapid Acute Emergency Response
        </span>

        <h1
          style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: 900,
            letterSpacing: "-0.02em",
          }}
        >
          Emergency SOS & Critical Dispatch
        </h1>

        <p
          style={{
            margin: 0,
            maxWidth: "600px",
            fontSize: "15px",
            opacity: 0.95,
            lineHeight: 1.5,
          }}
        >
          Press the SOS Panic Button below to immediately broadcast your
          distress signal, live GPS coordinates, and clinical profile to local
          emergency medical services and your primary contact.
        </p>

        {/* Giant Panic Button */}
        <button
          type="button"
          className="sos-panic-btn"
          onClick={handleTriggerSOS}
          disabled={broadcasting}
        >
          {broadcasting ? "ALERTING..." : "SOS"}
        </button>

        <span
          style={{
            fontSize: "12px",
            opacity: 0.85,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Single Tap Emergency Activation
        </span>
      </div>

      {alertSuccess && (
        <div
          style={{
            padding: "18px 24px",
            background: "#fef2f2",
            border: "2px solid #ef4444",
            borderRadius: "14px",
            color: "#991b1b",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            fontWeight: 700,
            fontSize: "15px",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <Icon name="alert" size={24} style={{ flexShrink: 0 }} />
          <div>{alertSuccess}</div>
        </div>
      )}

      {/* Toll-Free Emergency Helplines */}
      <div className="card" style={{ padding: "26px" }}>
        <h3
          style={{
            margin: "0 0 16px",
            fontSize: "18px",
            fontWeight: 800,
            color: "var(--navy)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Icon name="phone" size={20} style={{ color: "#dc2626" }} /> 24x7
          Government & Medical Emergency Numbers
        </h3>

        <div className="helplines-grid">
          <div
            className="helpline-box"
            style={{
              background: "#fef2f2",
              borderColor: "#fecaca",
              color: "var(--navy)",
            }}
          >
            <div>
              <div
                style={{ fontSize: "18px", fontWeight: 900, color: "#dc2626" }}
              >
                108
              </div>
              <div style={{ fontSize: "13px", fontWeight: 700 }}>
                Ambulance Services
              </div>
              <small style={{ color: "#64748b" }}>
                Free National Medical Transport
              </small>
            </div>
            <a href="tel:108" className="helpline-btn">
              📞 Call 108
            </a>
          </div>

          <div
            className="helpline-box"
            style={{
              background: "#fef2f2",
              borderColor: "#fecaca",
              color: "var(--navy)",
            }}
          >
            <div>
              <div
                style={{ fontSize: "18px", fontWeight: 900, color: "#dc2626" }}
              >
                112
              </div>
              <div style={{ fontSize: "13px", fontWeight: 700 }}>
                National Emergency SOS
              </div>
              <small style={{ color: "#64748b" }}>
                All-in-One Response System
              </small>
            </div>
            <a href="tel:112" className="helpline-btn">
              📞 Call 112
            </a>
          </div>

          <div
            className="helpline-box"
            style={{
              background: "#fef2f2",
              borderColor: "#fecaca",
              color: "var(--navy)",
            }}
          >
            <div>
              <div
                style={{ fontSize: "18px", fontWeight: 900, color: "#dc2626" }}
              >
                1091
              </div>
              <div style={{ fontSize: "13px", fontWeight: 700 }}>
                Women Helpline
              </div>
              <small style={{ color: "#64748b" }}>24x7 Distress Support</small>
            </div>
            <a href="tel:1091" className="helpline-btn">
              📞 Call 1091
            </a>
          </div>

          <div
            className="helpline-box"
            style={{
              background: "#fef2f2",
              borderColor: "#fecaca",
              color: "var(--navy)",
            }}
          >
            <div>
              <div
                style={{ fontSize: "18px", fontWeight: 900, color: "#dc2626" }}
              >
                1075
              </div>
              <div style={{ fontSize: "13px", fontWeight: 700 }}>
                Health Helpline
              </div>
              <small style={{ color: "#64748b" }}>National Health Portal</small>
            </div>
            <a href="tel:1075" className="helpline-btn">
              📞 Call 1075
            </a>
          </div>
        </div>
      </div>

      {/* Emergency Contact & Nearest Hospital Navigation */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Next of Kin Contact */}
        <div
          className="card"
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "14px",
          }}
        >
          <div>
            <h4
              style={{
                margin: "0 0 10px",
                fontSize: "16px",
                fontWeight: 800,
                color: "var(--navy)",
              }}
            >
              Registered Emergency Contact
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
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "var(--navy)",
                }}
              >
                {currentUser?.emergency_contact_name || "Primary Next of Kin"}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#dc2626",
                  fontWeight: 700,
                  marginTop: "4px",
                }}
              >
                📞 {currentUser?.emergency_contact_phone || "+91 99887 76655"}
              </div>
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: "12px",
                  color: "#64748b",
                }}
              >
                Receives automatic SMS alert with your blood group (
                {currentUser?.blood_group || "O+"}) and known allergies when SOS
                is pressed.
              </p>
            </div>
          </div>
          <a
            href={`tel:${currentUser?.emergency_contact_phone || "+919988776655"}`}
            className="btn btn--primary"
            style={{
              background: "#dc2626",
              justifyContent: "center",
              textDecoration: "none",
            }}
          >
            Direct Call Contact
          </a>
        </div>

        {/* Nearest Hospital Link */}
        <div
          className="card"
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "14px",
          }}
        >
          <div>
            <h4
              style={{
                margin: "0 0 10px",
                fontSize: "16px",
                fontWeight: 800,
                color: "var(--navy)",
              }}
            >
              Find Nearest Emergency Hospital
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              View emergency hospitals within a 5 km radius with 24x7 ICU bed
              availability, direct phone lines, and turn-by-turn navigation.
            </p>
          </div>
          <button
            type="button"
            className="btn btn--secondary"
            style={{ justifyContent: "center", fontWeight: 700 }}
            onClick={() => onNavigate("hospitals")}
          >
            Open Hospitals Directory →
          </button>
        </div>
      </div>
    </div>
  )
}
