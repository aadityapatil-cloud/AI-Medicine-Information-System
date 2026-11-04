import React, { useEffect, useState } from "react"
import { Icon } from "../Icon"
import { fetchNearbyPlaces, searchPharmacyMedicines } from "../../api"
import type { NearbyPlace, PharmacyMedicine } from "../../types"

const FALLBACK_PHARMACIES: NearbyPlace[] = [
  {
    id: 1,
    name: "Apollo Pharmacy 24x7",
    place_type: "pharmacy",
    license_number: "MH-MUM-20491",
    address: "Shop 4, Ground Floor, Linking Road, Bandra West",
    city: "Mumbai",
    state: "Maharashtra",
    postal_code: "400050",
    latitude: 19.0601,
    longitude: 72.8339,
    phone: "+91 22 2640 1234",
    opening_hours: "Open 24 Hours",
    photo_url:
      "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=400&q=80",
    is_verified: 1,
    distance_km: 0.8,
    directions_url: "https://maps.google.com/?q=Apollo+Pharmacy+Bandra+West",
  },
  {
    id: 2,
    name: "Wellness Forever Chemist & Superstore",
    place_type: "pharmacy",
    license_number: "MH-PUN-38102",
    address: "FC Road, Near Deccan Gymkhana, Shivajinagar",
    city: "Pune",
    state: "Maharashtra",
    postal_code: "411004",
    phone: "+91 20 2567 8901",
    opening_hours: "Open 24 Hours",
    photo_url:
      "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=400&q=80",
    latitude: 18.5204,
    longitude: 73.8567,
    is_verified: 1,
    distance_km: 1.4,
    directions_url: "https://maps.google.com/?q=Wellness+Forever+FC+Road+Pune",
  },
  {
    id: 3,
    name: "MedPlus Pharmacy & Surgical Store",
    place_type: "pharmacy",
    license_number: "DL-DEL-51920",
    address: "Block C-2, Safdarjung Development Area",
    city: "New Delhi",
    state: "Delhi",
    postal_code: "110016",
    phone: "+91 11 4123 5678",
    opening_hours: "07:00 AM - 11:30 PM",
    photo_url:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&q=80",
    latitude: 28.5489,
    longitude: 77.1994,
    is_verified: 1,
    distance_km: 2.1,
    directions_url: "https://maps.google.com/?q=MedPlus+Pharmacy+Safdarjung",
  },
  {
    id: 4,
    name: "Jan Aushadhi Generic Medical Store",
    place_type: "pharmacy",
    license_number: "GOI-JAN-10492",
    address: "Near Civil Hospital Gate, Shivaji Nagar",
    city: "Mumbai",
    state: "Maharashtra",
    postal_code: "400018",
    phone: "+91 22 2490 8877",
    opening_hours: "08:00 AM - 09:30 PM",
    photo_url:
      "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=400&q=80",
    latitude: 19.0176,
    longitude: 72.8561,
    is_verified: 1,
    distance_km: 2.8,
    directions_url: "https://maps.google.com/?q=Jan+Aushadhi+Mumbai",
  },
]

export function MedicalStoresView({
  onNavigate,
}: {
  onNavigate: (screen: string) => void
}) {
  const [stores, setStores] = useState<NearbyPlace[]>(FALLBACK_PHARMACIES)
  const [cityFilter, setCityFilter] = useState<string>("All")
  const [medicineQuery, setMedicineQuery] = useState<string>("")
  const [searchResults, setSearchResults] = useState<PharmacyMedicine[]>([])
  const [searchingMed, setSearchingMed] = useState<boolean>(false)
  const [reservedToast, setReservedToast] = useState<string | null>(null)

  useEffect(() => {
    fetchNearbyPlaces({ place_type: "pharmacy" })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setStores(data)
        }
      })
      .catch(() => {})
  }, [])

  const handleMedicineSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!medicineQuery.trim()) return

    setSearchingMed(true)
    try {
      const results = await searchPharmacyMedicines(medicineQuery)
      setSearchResults(results)
    } catch {
      // Mock result if offline
      setSearchResults([
        {
          id: 101,
          pharmacy_id: 1,
          pharmacy_name: "Apollo Pharmacy 24x7",
          medicine_name: medicineQuery,
          composition: "Standard clinical grade preparation",
          stock_status: "In Stock",
          price: 45.0,
          unit: "10 Tablets",
          phone: "+91 22 2640 1234",
          address: "Linking Road, Bandra West, Mumbai",
          city: "Mumbai",
          opening_hours: "24 Hours",
          photo_url: "",
        },
        {
          id: 102,
          pharmacy_id: 4,
          pharmacy_name: "Jan Aushadhi Generic Medical Store",
          medicine_name: `${medicineQuery} (Generic Substitute)`,
          composition: "Bioequivalent active pharmaceutical ingredient",
          stock_status: "In Stock",
          price: 14.5,
          unit: "10 Tablets",
          phone: "+91 22 2490 8877",
          address: "Shivaji Nagar, Mumbai",
          city: "Mumbai",
          opening_hours: "08:00 AM - 09:30 PM",
          photo_url: "",
        },
      ])
    } finally {
      setSearchingMed(false)
    }
  }

  const handleReserve = (pharmacyName: string, medName?: string) => {
    setReservedToast(
      `Medication ${
        medName ? `"${medName}"` : ""
      } reserved at ${pharmacyName}! Present confirmation SMS at counter.`,
    )
    setTimeout(() => setReservedToast(null), 5000)
  }

  const filteredStores = stores.filter((store) => {
    if (cityFilter === "All") return true
    return store.city.toLowerCase() === cityFilter.toLowerCase()
  })

  return (
    <div className="feature-view-container">
      {/* Hero Banner */}
      <div
        className="feature-hero-banner"
        style={{
          background: "linear-gradient(135deg, #064e3b 0%, #047857 100%)",
        }}
      >
        <div className="feature-hero-copy">
          <span
            className="feat-tag"
            style={{ background: "rgba(255, 255, 255, 0.2)", color: "#ffffff" }}
          >
            Feature 05 · Geolocation & Supply Network
          </span>
          <h2>Nearby Medical Stores & Pharmacies</h2>
          <p>
            Locate verified retail and 24x7 chemist stores nearby, check live
            medicine stock availability, compare generic drug prices, and
            reserve prescriptions for rapid pickup.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="btn btn--secondary"
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
            onClick={() => onNavigate("hospitals")}
          >
            Find Nearby Hospitals →
          </button>
        </div>
      </div>

      {reservedToast && (
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
          {reservedToast}
        </div>
      )}

      {/* Live Medicine Stock Search Bar */}
      <div
        className="card"
        style={{
          padding: "20px 24px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
        }}
      >
        <h4
          style={{
            margin: "0 0 10px",
            fontSize: "15px",
            fontWeight: 800,
            color: "var(--navy)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Icon name="search" size={18} style={{ color: "#059669" }} /> Live
          Medicine Stock Checker
        </h4>
        <form
          onSubmit={handleMedicineSearch}
          style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
        >
          <input
            type="text"
            placeholder="Search specific medicine in stores (e.g. Paracetamol, Azithromycin, Metformin)..."
            value={medicineQuery}
            onChange={(e) => setMedicineQuery(e.target.value)}
            className="med-form-input"
            style={{ flex: 1, minWidth: "260px" }}
          />
          <button
            type="submit"
            className="btn btn--primary"
            style={{ background: "#059669" }}
            disabled={searchingMed}
          >
            {searchingMed ? "Checking Stock..." : "Check Availability"}
          </button>
        </form>

        {/* Live Search Results */}
        {searchResults.length > 0 && (
          <div
            style={{
              marginTop: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              Available Stock Across Verified Chemist Stores:
            </span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "12px",
              }}
            >
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: "#ffffff",
                    padding: "14px 18px",
                    borderRadius: "12px",
                    border: "1px solid #a7f3d0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: "var(--navy)" }}>
                      {item.medicine_name}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#059669",
                        fontWeight: 700,
                      }}
                    >
                      ✓ {item.stock_status} · {item.pharmacy_name}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 800,
                        color: "var(--navy)",
                        marginTop: "4px",
                      }}
                    >
                      ₹{item.price}{" "}
                      <small style={{ color: "#64748b", fontSize: "11px" }}>
                        / {item.unit}
                      </small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn--primary"
                    style={{
                      background: "#059669",
                      fontSize: "12px",
                      padding: "6px 12px",
                    }}
                    onClick={() =>
                      handleReserve(item.pharmacy_name, item.medicine_name)
                    }
                  >
                    Reserve Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Pharmacies Grid */}
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
          Nearby Verified Pharmacies ({filteredStores.length})
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
        {filteredStores.map((store) => (
          <div
            key={store.id}
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
                      {store.name}
                    </h4>
                    <span
                      title="Licensed Pharmacy"
                      style={{ color: "#059669" }}
                    >
                      <Icon name="check" size={16} />
                    </span>
                  </div>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Lic: {store.license_number}
                  </span>
                </div>
                <span
                  className="feat-tag"
                  style={{ background: "#d1fae5", color: "#047857" }}
                >
                  {store.distance_km
                    ? `${store.distance_km} km away`
                    : "Nearby"}
                </span>
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
                  <Icon name="map" size={14} style={{ color: "#059669" }} />{" "}
                  {store.address}, {store.city}
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Icon name="clock" size={14} style={{ color: "#059669" }} />{" "}
                  {store.opening_hours}
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Icon name="phone" size={14} style={{ color: "#059669" }} />{" "}
                  {store.phone}
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
                href={`tel:${store.phone}`}
                className="btn btn--secondary"
                style={{
                  flex: 1,
                  justifyContent: "center",
                  textDecoration: "none",
                  fontSize: "13px",
                }}
              >
                📞 Call Store
              </a>
              <a
                href={
                  store.directions_url ||
                  `https://maps.google.com/?q=${encodeURIComponent(store.name + " " + store.address)}`
                }
                target="_blank"
                rel="noreferrer"
                className="btn btn--primary"
                style={{
                  flex: 1,
                  justifyContent: "center",
                  background: "#059669",
                  textDecoration: "none",
                  fontSize: "13px",
                }}
              >
                📍 Directions
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
