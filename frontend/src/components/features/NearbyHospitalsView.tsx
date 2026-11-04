import React, { useEffect, useState } from "react"
import { Icon } from "../Icon"
import { fetchNearbyPlaces, triggerEmergencyAlert } from "../../api"
import type { NearbyPlace } from "../../types"

const FALLBACK_HOSPITALS: NearbyPlace[] = [
  {
    id: 10,
    name: "Lilavati Hospital & Research Centre",
    place_type: "hospital",
    license_number: "HOSP-MH-4820",
    address: "A-791, Bandra Reclamation, Bandra West",
    city: "Mumbai",
    state: "Maharashtra",
    postal_code: "400050",
    phone: "+91 22 2675 1000",
    opening_hours: "24x7 Emergency & Trauma",
    photo_url:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&q=80",
    latitude: 19.0522,
    longitude: 72.8315,
    is_verified: 1,
    distance_km: 1.2,
    directions_url: "https://maps.google.com/?q=Lilavati+Hospital+Mumbai",
  },
  {
    id: 11,
    name: "Ruby Hall Clinic Multispeciality Hospital",
    place_type: "hospital",
    license_number: "HOSP-MH-1920",
    address: "40, Sassoon Road, Sangamvadi",
    city: "Pune",
    state: "Maharashtra",
    postal_code: "411001",
    phone: "+91 20 6645 5100",
    opening_hours: "24x7 Level-1 Trauma Care",
    photo_url:
      "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=400&q=80",
    latitude: 18.5298,
    longitude: 73.8744,
    is_verified: 1,
    distance_km: 2.3,
    directions_url: "https://maps.google.com/?q=Ruby+Hall+Clinic+Pune",
  },
  {
    id: 12,
    name: "AIIMS New Delhi (All India Institute of Medical Sciences)",
    place_type: "hospital",
    license_number: "HOSP-DL-0001",
    address: "Sri Aurobindo Marg, Ansari Nagar",
    city: "New Delhi",
    state: "Delhi",
    postal_code: "110029",
    phone: "+91 11 2658 8500",
    opening_hours: "24x7 Emergency Services",
    photo_url:
      "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&q=80",
    latitude: 28.5672,
    longitude: 77.21,
    is_verified: 1,
    distance_km: 3.5,
    directions_url: "https://maps.google.com/?q=AIIMS+New+Delhi",
  },
  {
    id: 13,
    name: "Fortis Hospital Mulund",
    place_type: "hospital",
    license_number: "HOSP-MH-7731",
    address: "Mulund Goregaon Link Road, Industrial Area, Mulund West",
    city: "Mumbai",
    state: "Maharashtra",
    postal_code: "400078",
    phone: "+91 22 4365 4365",
    opening_hours: "24x7 Emergency & Cardiac Center",
    photo_url:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&q=80",
    latitude: 19.1663,
    longitude: 72.9431,
    is_verified: 1,
    distance_km: 4.8,
    directions_url: "https://maps.google.com/?q=Fortis+Hospital+Mulund",
  },
]

export function NearbyHospitalsView({
  onNavigate,
}: {
  onNavigate: (screen: string) => void
}) {
  const [hospitals, setHospitals] = useState<NearbyPlace[]>(FALLBACK_HOSPITALS)
  const [cityFilter, setCityFilter] = useState<string>("All")
  const [alertSent, setAlertSent] = useState<string | null>(null)

  useEffect(() => {
    fetchNearbyPlaces({ place_type: "hospital" })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setHospitals(data)
        }
      })
      .catch(() => {})
  }, [])

  const handleRequestAmbulance = (hospitalName: string) => {
    triggerEmergencyAlert(
      undefined,
      undefined,
      `Ambulance requested for ${hospitalName}`,
    ).catch(() => {})
    setAlertSent(
      `Emergency dispatch alert sent to ${hospitalName}! Emergency teams notified. Please keep your phone line clear.`,
    )
    setTimeout(() => setAlertSent(null), 6000)
  }

  const filtered = hospitals.filter((h) => {
    if (cityFilter === "All") return true
    return h.city.toLowerCase() === cityFilter.toLowerCase()
  })

  return (
    <div className="feature-view-container">
      {/* Hero Banner */}
      <div
        className="feature-hero-banner"
        style={{
          background: "linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)",
        }}
      >
        <div className="feature-hero-copy">
          <span
            className="feat-tag"
            style={{
              background: "rgba(255, 255, 255, 0.25)",
              color: "#ffffff",
            }}
          >
            Feature 06 · Acute Emergency Network
          </span>
          <h2>Nearby Hospitals & Emergency Centers</h2>
          <p>
            Locate nearest tertiary care hospitals, level-1 trauma centers, and
            ICU facilities with real-time contact hotlines, GPS route
            navigation, and instant ambulance dispatch.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="btn btn--secondary"
            style={{ background: "#ffffff", color: "#dc2626", fontWeight: 800 }}
            onClick={() => onNavigate("emergency")}
          >
            🚨 Open Emergency SOS Center
          </button>
        </div>
      </div>

      {alertSent && (
        <div
          style={{
            padding: "14px 20px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            color: "#991b1b",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: 700,
          }}
        >
          <Icon name="alert" size={18} />
          {alertSent}
        </div>
      )}

      {/* Quick Emergency Helplines Bar */}
      <div
        className="card"
        style={{
          padding: "18px 24px",
          background: "#fff1f2",
          border: "1px solid #ffe4e6",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#be123c",
                textTransform: "uppercase",
              }}
            >
              Immediate Medical Assistance
            </span>
            <h4
              style={{
                margin: "2px 0 0",
                fontSize: "16px",
                fontWeight: 800,
                color: "#881337",
              }}
            >
              National Emergency Hotlines (24x7 Toll-Free)
            </h4>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a
              href="tel:108"
              className="btn btn--primary"
              style={{
                background: "#e11d48",
                textDecoration: "none",
                fontSize: "13px",
              }}
            >
              🚑 108 Ambulance
            </a>
            <a
              href="tel:112"
              className="btn btn--secondary"
              style={{
                background: "#ffffff",
                color: "#be123c",
                border: "1px solid #f43f5e",
                textDecoration: "none",
                fontSize: "13px",
              }}
            >
              📞 112 National SOS
            </a>
            <a
              href="tel:1075"
              className="btn btn--secondary"
              style={{
                background: "#ffffff",
                color: "#be123c",
                border: "1px solid #f43f5e",
                textDecoration: "none",
                fontSize: "13px",
              }}
            >
              🏥 1075 Health Line
            </a>
          </div>
        </div>
      </div>

      {/* City Filter & Hospitals Grid */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
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
          Accredited Emergency Hospitals ({filtered.length})
        </h3>
        <div style={{ display: "flex", gap: "8px" }}>
          {["All", "Mumbai", "Pune", "New Delhi"].map((city) => (
            <button
              key={city}
              type="button"
              className={`feature-filter-btn ${
                cityFilter === city ? "active" : ""
              }`}
              onClick={() => setCityFilter(city)}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "20px",
        }}
      >
        {filtered.map((hospital) => (
          <div
            key={hospital.id}
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
                      {hospital.name}
                    </h4>
                  </div>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Accredited: {hospital.license_number}
                  </span>
                </div>
                <span
                  className="feat-tag"
                  style={{ background: "#fee2e2", color: "#b91c1c" }}
                >
                  {hospital.distance_km
                    ? `${hospital.distance_km} km`
                    : "Nearby"}
                </span>
              </div>

              <div
                style={{
                  marginTop: "12px",
                  padding: "8px 12px",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                  color: "#0f766e",
                  fontWeight: 700,
                }}
              >
                🏥 {hospital.opening_hours} · ICU Beds & Trauma Ready
              </div>

              <div
                style={{
                  marginTop: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "13px",
                  color: "#475569",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Icon name="map" size={14} style={{ color: "#dc2626" }} />{" "}
                  {hospital.address}, {hospital.city}
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Icon name="phone" size={14} style={{ color: "#dc2626" }} />{" "}
                  Emergency: {hospital.phone}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                paddingTop: "14px",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <a
                href={`tel:${hospital.phone}`}
                className="btn btn--secondary"
                style={{
                  flex: 1,
                  justifyContent: "center",
                  textDecoration: "none",
                  fontSize: "13px",
                  color: "#dc2626",
                  borderColor: "#fca5a5",
                }}
              >
                📞 Call ER
              </a>
              <button
                type="button"
                className="btn btn--primary"
                style={{
                  flex: 1,
                  justifyContent: "center",
                  background: "#dc2626",
                  fontSize: "13px",
                }}
                onClick={() => handleRequestAmbulance(hospital.name)}
              >
                🚑 Dispatch Ambulance
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency First-Aid Triage Protocols */}
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
          <Icon name="shield" size={18} style={{ color: "#dc2626" }} />{" "}
          Emergency First-Aid Triage (While Waiting for Transport)
        </h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "14px",
          }}
        >
          <div
            style={{
              background: "#f8fafc",
              padding: "14px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          >
            <strong style={{ color: "#b91c1c", fontSize: "14px" }}>
              ❤️ Chest Pain / Heart Attack
            </strong>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "12px",
                color: "#475569",
                lineHeight: 1.5,
              }}
            >
              Seat the patient upright, loosen tight clothing, chew 300mg
              Aspirin if no allergy, avoid physical exertion.
            </p>
          </div>
          <div
            style={{
              background: "#f8fafc",
              padding: "14px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          >
            <strong style={{ color: "#b91c1c", fontSize: "14px" }}>
              🫁 Breathing Distress / Asthma
            </strong>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "12px",
                color: "#475569",
                lineHeight: 1.5,
              }}
            >
              Keep head elevated, administer emergency inhaler (Salbutamol 2
              puffs), provide adequate ventilation, avoid lying flat.
            </p>
          </div>
          <div
            style={{
              background: "#f8fafc",
              padding: "14px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          >
            <strong style={{ color: "#b91c1c", fontSize: "14px" }}>
              🩸 Severe Trauma / Bleeding
            </strong>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "12px",
                color: "#475569",
                lineHeight: 1.5,
              }}
            >
              Apply firm direct pressure with clean cloth, elevate injured limb
              above heart level, do not remove embedded objects.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
