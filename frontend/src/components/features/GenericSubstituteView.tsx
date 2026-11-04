import React, { useState } from "react"
import { Icon } from "../Icon"

interface GenericItem {
  id: string
  brandName: string
  genericName: string
  saltComposition: string
  brandManufacturer: string
  brandPrice: number
  genericManufacturer: string
  genericPrice: number
  unit: string
  savingsPct: number
  uses: string
}

const DATABASE: GenericItem[] = [
  {
    id: "g1",
    brandName: "Crocin 650 Advance",
    genericName: "Paracetamol 650mg",
    saltComposition: "Paracetamol (650mg)",
    brandManufacturer: "GlaxoSmithKline Pharmaceuticals",
    brandPrice: 38.0,
    genericManufacturer: "PMBJP (Jan Aushadhi Generic)",
    genericPrice: 11.2,
    unit: "10 Tablets",
    savingsPct: 70,
    uses: "Analgesic & Antipyretic for fever, headache, body aches",
  },
  {
    id: "g2",
    brandName: "Augmentin 625 Duo",
    genericName: "Amoxycillin & Potassium Clavulanate",
    saltComposition: "Amoxicillin (500mg) + Clavulanic Acid (125mg)",
    brandManufacturer: "GlaxoSmithKline Pharmaceuticals",
    brandPrice: 215.0,
    genericManufacturer: "Cipla Generic / Jan Aushadhi",
    genericPrice: 65.0,
    unit: "10 Tablets",
    savingsPct: 69,
    uses: "Broad-spectrum antibacterial for respiratory and ENT infections",
  },
  {
    id: "g3",
    brandName: "Lipitor 10mg / Atorva 10",
    genericName: "Atorvastatin 10mg",
    saltComposition: "Atorvastatin Calcium (10mg)",
    brandManufacturer: "Pfizer / Zydus Cadila",
    brandPrice: 110.0,
    genericManufacturer: "Jan Aushadhi Generic Store",
    genericPrice: 22.0,
    unit: "10 Tablets",
    savingsPct: 80,
    uses: "HMG-CoA reductase inhibitor for lowering LDL cholesterol",
  },
  {
    id: "g4",
    brandName: "Glycomet 500 SR",
    genericName: "Metformin 500mg Sustained Release",
    saltComposition: "Metformin Hydrochloride (500mg)",
    brandManufacturer: "USV Private Limited",
    brandPrice: 48.0,
    genericManufacturer: "Jan Aushadhi Kendra",
    genericPrice: 14.0,
    unit: "10 Tablets",
    savingsPct: 71,
    uses: "Type 2 Diabetes glycemic management",
  },
  {
    id: "g5",
    brandName: "Pan 40 Tablet",
    genericName: "Pantoprazole 40mg Gastro-Resistant",
    saltComposition: "Pantoprazole (40mg)",
    brandManufacturer: "Alkem Laboratories Ltd",
    brandPrice: 155.0,
    genericManufacturer: "PMBJP Generic Kendra",
    genericPrice: 32.0,
    unit: "10 Tablets",
    savingsPct: 79,
    uses: "Proton Pump Inhibitor for gastroesophageal reflux & acidity",
  },
]

export function GenericSubstituteView({
  onNavigate,
}: {
  onNavigate: (screen: string) => void
}) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("All")

  const filtered = DATABASE.filter((item) => {
    const matchesQuery =
      item.brandName.toLowerCase().includes(query.toLowerCase()) ||
      item.genericName.toLowerCase().includes(query.toLowerCase()) ||
      item.saltComposition.toLowerCase().includes(query.toLowerCase())
    return matchesQuery
  })

  return (
    <div className="feature-view-container">
      {/* Hero Banner */}
      <div
        className="feature-hero-banner"
        style={{
          background: "linear-gradient(135deg, #14532d 0%, #15803d 100%)",
        }}
      >
        <div className="feature-hero-copy">
          <span
            className="feat-tag"
            style={{ background: "rgba(255, 255, 255, 0.2)", color: "#ffffff" }}
          >
            Feature 18 · Affordable Healthcare & Pharmacoeconomics
          </span>
          <h2>Generic Medicine & Substitute Finder</h2>
          <p>
            Find identical bioequivalent generic formulations for expensive
            branded medications. Save up to 80% on chronic pharmacy bills with
            Jan Aushadhi and WHO-GMP certified generic substitutes.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="btn btn--secondary"
            style={{ background: "#ffffff", color: "#14532d", fontWeight: 800 }}
            onClick={() => onNavigate("stores")}
          >
            Locate Jan Aushadhi Stores →
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: "20px 24px" }}>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Search branded medication (e.g. Crocin, Augmentin, Lipitor, Glycomet, Pan 40)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="med-form-input"
            style={{ paddingLeft: "38px" }}
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
            <Icon name="search" size={18} />
          </span>
        </div>
      </div>

      {/* Results Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {filtered.map((item) => (
          <div key={item.id} className="card" style={{ padding: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <span
                  className="feat-tag"
                  style={{ background: "#dcfce7", color: "#166534" }}
                >
                  Save {item.savingsPct}% Cost
                </span>
                <h3
                  style={{
                    margin: "6px 0 2px",
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "var(--navy)",
                  }}
                >
                  {item.brandName} → {item.genericName}
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  Active Salt Composition:{" "}
                  <strong>{item.saltComposition}</strong>
                </p>
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "12px",
                    color: "#475569",
                  }}
                >
                  Therapeutic Uses: {item.uses}
                </div>
              </div>
            </div>

            {/* Price Comparison Grid */}
            <div
              style={{
                marginTop: "18px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "14px",
              }}
            >
              {/* Branded Card */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                  }}
                >
                  Branded Proprietary Drug
                </span>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 800,
                    color: "var(--navy)",
                    marginTop: "2px",
                  }}
                >
                  {item.brandName}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Mfr: {item.brandManufacturer}
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 900,
                    color: "#ef4444",
                    marginTop: "8px",
                  }}
                >
                  ₹{item.brandPrice}{" "}
                  <small style={{ fontSize: "11px", color: "#64748b" }}>
                    / {item.unit}
                  </small>
                </div>
              </div>

              {/* Generic Card */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  border: "2px solid #22c55e",
                  background: "#f0fdf4",
                }}
              >
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
                      fontWeight: 800,
                      color: "#166534",
                      textTransform: "uppercase",
                    }}
                  >
                    Bioequivalent Generic
                  </span>
                  <span
                    className="feat-tag"
                    style={{ background: "#22c55e", color: "white" }}
                  >
                    Recommended
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 800,
                    color: "#14532d",
                    marginTop: "2px",
                  }}
                >
                  {item.genericName}
                </div>
                <div style={{ fontSize: "12px", color: "#166534" }}>
                  Mfr: {item.genericManufacturer}
                </div>
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 900,
                    color: "#16a34a",
                    marginTop: "8px",
                  }}
                >
                  ₹{item.genericPrice}{" "}
                  <small style={{ fontSize: "11px", color: "#166534" }}>
                    / {item.unit}
                  </small>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "14px",
                borderTop: "1px solid #f1f5f9",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <span
                style={{ fontSize: "12px", color: "#166534", fontWeight: 600 }}
              >
                ✓ 100% Chemically Identical · CDSCO Quality Tested · Equal
                Bioavailability
              </span>
              <button
                type="button"
                className="btn btn--primary"
                style={{ background: "#16a34a", fontSize: "13px" }}
                onClick={() => onNavigate("stores")}
              >
                Find in Nearby Stores →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
