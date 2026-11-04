import React, { useEffect, useState } from "react"
import { Icon } from "../Icon"
import {
  fetchFamilyMembers,
  addFamilyMember,
  deleteFamilyMember,
} from "../../api"
import type { FamilyMember, PatientUser } from "../../types"

const FALLBACK_MEMBERS: FamilyMember[] = [
  {
    id: 1,
    patient_id: 1,
    full_name: "Anita Patil",
    relationship: "Spouse",
    gender: "Female",
    dob: "1997-08-20",
    blood_group: "B+",
    medical_conditions: "Mild Allergic Rhinitis",
    known_allergies: "Sulfonamides",
    current_medications: "Cetirizine 10mg PRN",
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    patient_id: 1,
    full_name: "Aarav Patil",
    relationship: "Child",
    gender: "Male",
    dob: "2020-03-15",
    blood_group: "O+",
    medical_conditions: "None reported",
    known_allergies: "Peanuts",
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    patient_id: 1,
    full_name: "Babaso Patil",
    relationship: "Father",
    gender: "Male",
    dob: "1960-11-12",
    blood_group: "O+",
    medical_conditions: "Hypertension, Osteoarthritis",
    known_allergies: "No known allergies",
    current_medications: "Telmisartan 40mg, Calcium 500mg",
    created_at: new Date().toISOString(),
  },
]

export function FamilyProfilesView({
  currentUser,
  onNavigate,
}: {
  currentUser?: PatientUser | null
  onNavigate: (screen: string) => void
}) {
  const [members, setMembers] = useState<FamilyMember[]>(FALLBACK_MEMBERS)
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [relation, setRelation] = useState("Spouse")
  const [gender, setGender] = useState("Female")
  const [dob, setDob] = useState("1996-01-01")
  const [bloodGroup, setBloodGroup] = useState("O+")
  const [conditions, setConditions] = useState("")
  const [allergies, setAllergies] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchFamilyMembers()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setMembers(data)
        }
      })
      .catch(() => {})
  }, [])

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    setSubmitting(true)
    const payload = {
      full_name: name,
      relationship: relation,
      gender,
      dob,
      blood_group: bloodGroup,
      medical_conditions: conditions,
      known_allergies: allergies,
    }

    try {
      const created = await addFamilyMember(payload)
      setMembers((prev) => [...prev, created])
      setToast(`Family member "${name}" added successfully!`)
    } catch {
      const fallbackMember: FamilyMember = {
        id: Date.now(),
        patient_id: 1,
        ...payload,
        created_at: new Date().toISOString(),
      }
      setMembers((prev) => [...prev, fallbackMember])
      setToast(`Family member "${name}" added!`)
    } finally {
      setSubmitting(false)
      setIsAdding(false)
      setName("")
      setConditions("")
      setAllergies("")
      setTimeout(() => setToast(null), 4000)
    }
  }

  const handleDelete = async (memberId: number) => {
    if (!window.confirm("Remove this family member profile?")) return
    try {
      await deleteFamilyMember(memberId)
    } catch {}
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
    setToast("Family member profile removed.")
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="feature-view-container">
      {/* Hero Banner */}
      <div
        className="feature-hero-banner"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
        }}
      >
        <div className="feature-hero-copy">
          <span
            className="feat-tag"
            style={{ background: "rgba(255, 255, 255, 0.2)", color: "#ffffff" }}
          >
            Feature 12 · Dependent Health Records
          </span>
          <h2>Family Health Profiles & Dependents</h2>
          <p>
            Centralize health profiles for your spouse, children, and elderly
            parents. Track customized dosages, specific drug contraindications,
            vaccination timelines, and emergency contacts.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="btn btn--primary"
            style={{
              background: "#4338ca",
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
            onClick={() => setIsAdding(true)}
          >
            <Icon name="plus" size={16} /> Add Family Member
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

      {/* Primary Account Card */}
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
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "white",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
            }}
          >
            {currentUser?.full_name?.charAt(0) || "P"}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h4
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "var(--navy)",
                }}
              >
                {currentUser?.full_name || "Primary Account Holder"} (Self)
              </h4>
              <span
                className="feat-tag"
                style={{ background: "#dbeafe", color: "#1e40af" }}
              >
                Primary Account
              </span>
            </div>
            <p
              style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}
            >
              Blood Group: {currentUser?.blood_group || "O+"} · Mobile:{" "}
              {currentUser?.mobile || "+91 98765 43210"}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => onNavigate("profile")}
        >
          View My Profile
        </button>
      </div>

      {/* Family Members Grid */}
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
          Dependent Profiles ({members.length})
        </h3>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "20px",
        }}
      >
        {members.map((member) => (
          <div
            key={member.id}
            className="card"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "16px",
              border:
                activeProfileId === member.id ? "2px solid #4338ca" : undefined,
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
                <div
                  style={{ display: "flex", gap: "12px", alignItems: "center" }}
                >
                  <div
                    style={{
                      width: "46px",
                      height: "46px",
                      borderRadius: "14px",
                      background: "#ede9fe",
                      color: "#5b21b6",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                      fontSize: "18px",
                    }}
                  >
                    {member.full_name.charAt(0)}
                  </div>
                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: 800,
                        color: "var(--navy)",
                      }}
                    >
                      {member.full_name}
                    </h4>
                    <span
                      className="feat-tag"
                      style={{
                        background: "#ede9fe",
                        color: "#5b21b6",
                        marginTop: "4px",
                        display: "inline-block",
                      }}
                    >
                      {member.relationship}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                  }}
                  title="Remove family member"
                  onClick={() => handleDelete(member.id)}
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>

              <div
                style={{
                  marginTop: "14px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  fontSize: "12px",
                  background: "#f8fafc",
                  padding: "12px",
                  borderRadius: "10px",
                }}
              >
                <div>
                  <span style={{ color: "#94a3b8", fontWeight: 700 }}>
                    DOB & Gender
                  </span>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "var(--navy)",
                      marginTop: "2px",
                    }}
                  >
                    {member.dob} ({member.gender})
                  </div>
                </div>
                <div>
                  <span style={{ color: "#94a3b8", fontWeight: 700 }}>
                    Blood Group
                  </span>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#dc2626",
                      marginTop: "2px",
                    }}
                  >
                    {member.blood_group || "Unknown"}
                  </div>
                </div>
              </div>

              {member.known_allergies && (
                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "12px",
                    color: "#b45309",
                    background: "#fffbeb",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #fef3c7",
                  }}
                >
                  ⚠️ <strong>Allergies:</strong> {member.known_allergies}
                </div>
              )}

              {member.medical_conditions && (
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "#1e40af",
                    background: "#eff6ff",
                    padding: "8px 12px",
                    borderRadius: "8px",
                  }}
                >
                  📋 <strong>Conditions:</strong> {member.medical_conditions}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                paddingTop: "14px",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <button
                type="button"
                className={`btn ${
                  activeProfileId === member.id
                    ? "btn--primary"
                    : "btn--secondary"
                }`}
                style={{ flex: 1, justifyContent: "center", fontSize: "13px" }}
                onClick={() => {
                  setActiveProfileId(member.id)
                  setToast(`Switched active view to ${member.full_name}`)
                  setTimeout(() => setToast(null), 3000)
                }}
              >
                {activeProfileId === member.id
                  ? "✓ Active View"
                  : "Manage Profile"}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                style={{ justifyContent: "center", fontSize: "13px" }}
                onClick={() => onNavigate("reminders")}
              >
                Reminders
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Member Modal */}
      {isAdding && (
        <div className="med-modal-backdrop">
          <div className="med-modal-content">
            <div className="med-modal-header">
              <h3>Add Family Member Profile</h3>
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
            <form onSubmit={handleAddSubmit}>
              <div className="med-modal-body">
                <div className="med-form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Anita Patil"
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
                    <label>Relationship</label>
                    <select
                      value={relation}
                      onChange={(e) => setRelation(e.target.value)}
                      className="med-form-select"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="med-form-group">
                    <label>Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="med-form-select"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
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
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="med-form-input"
                      required
                    />
                  </div>

                  <div className="med-form-group">
                    <label>Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="med-form-select"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div className="med-form-group">
                  <label>Known Allergies (if any)</label>
                  <input
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="e.g. Penicillin, Peanuts"
                    className="med-form-input"
                  />
                </div>

                <div className="med-form-group">
                  <label>Chronic Medical Conditions (if any)</label>
                  <input
                    type="text"
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                    placeholder="e.g. Asthma, High Blood Pressure"
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
                  style={{ background: "#4338ca" }}
                >
                  {submitting ? "Adding..." : "Save Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
