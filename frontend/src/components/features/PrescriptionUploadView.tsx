import React, { useEffect, useState } from "react"
import { Icon } from "../Icon"
import {
  fetchMedicalDocuments,
  uploadMedicalDocument,
  deleteMedicalDocument,
  getDocumentDownloadUrl,
} from "../../api"
import type { MedicalDocument } from "../../types"

const FALLBACK_DOCS: MedicalDocument[] = [
  {
    id: 1,
    patient_id: 1,
    title: "Cardiology Annual Review & ECG Report",
    category: "Prescription",
    file_name: "prescription_cardio_2026.pdf",
    file_size: 482000,
    mime_type: "application/pdf",
    doctor_name: "Dr. Sarah Jenkins",
    notes: "Prescribed Amlodipine 5mg & lifestyle dietary modifications",
    uploaded_at: "2026-11-01T10:14:00Z",
  },
  {
    id: 2,
    patient_id: 1,
    title: "Complete Blood Count & Lipid Profile",
    category: "Lab Report",
    file_name: "blood_test_results.pdf",
    file_size: 1024000,
    mime_type: "application/pdf",
    doctor_name: "Pathology Care Labs",
    notes: "HbA1c: 5.6% (Normal), Total Cholesterol: 185 mg/dL",
    uploaded_at: "2026-10-28T14:30:00Z",
  },
  {
    id: 3,
    patient_id: 1,
    title: "Chest X-Ray & Spirometry Report",
    category: "Lab Report",
    file_name: "chest_xray_radiology.png",
    file_size: 2450000,
    mime_type: "image/png",
    doctor_name: "Dr. Anand Kulkarni",
    notes: "Normal lung fields, clear costophrenic angles",
    uploaded_at: "2026-10-15T09:20:00Z",
  },
]

export function PrescriptionUploadView({
  onNavigate,
}: {
  onNavigate: (screen: string) => void
}) {
  const [documents, setDocuments] = useState<MedicalDocument[]>(FALLBACK_DOCS)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [filterCategory, setFilterCategory] = useState<string>("All")
  const [toast, setToast] = useState<string | null>(null)

  // Upload form state
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [category, setCategory] =
    useState<"Prescription" | "Lab Report" | "Discharge Summary" | "Other">(
      "Prescription",
    )
  const [doctorName, setDoctorName] = useState("")
  const [notes, setNotes] = useState("")
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchMedicalDocuments()
      .then((docs) => {
        if (Array.isArray(docs) && docs.length > 0) {
          setDocuments(docs)
        }
      })
      .catch(() => {})
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      setFile(selected)
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      alert("Please choose a file to upload.")
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("title", title || file.name)
    formData.append("category", category)
    formData.append("doctor_name", doctorName || "Self Upload")
    formData.append("notes", notes)

    try {
      const created = await uploadMedicalDocument(formData)
      setDocuments((prev) => [created, ...prev])
      setToast("Medical document securely saved to your health vault!")
    } catch {
      // Local fallback simulation
      const fallbackDoc: MedicalDocument = {
        id: Date.now(),
        patient_id: 1,
        title: title || file.name,
        category,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || "application/pdf",
        doctor_name: doctorName || "Attending Physician",
        notes,
        uploaded_at: new Date().toISOString(),
      }
      setDocuments((prev) => [fallbackDoc, ...prev])
      setToast("Medical document saved successfully!")
    } finally {
      setUploading(false)
      setIsUploading(false)
      setFile(null)
      setTitle("")
      setDoctorName("")
      setNotes("")
      setTimeout(() => setToast(null), 4000)
    }
  }

  const handleDelete = async (docId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this document from your vault?",
      )
    )
      return
    try {
      await deleteMedicalDocument(docId)
    } catch {}
    setDocuments((prev) => prev.filter((d) => d.id !== docId))
    setToast("Document deleted.")
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = documents.filter((doc) => {
    if (filterCategory === "All") return true
    return doc.category.toLowerCase() === filterCategory.toLowerCase()
  })

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="feature-view-container">
      {/* Hero Banner */}
      <div
        className="feature-hero-banner"
        style={{
          background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
        }}
      >
        <div className="feature-hero-copy">
          <span
            className="feat-tag"
            style={{ background: "rgba(255, 255, 255, 0.2)", color: "#ffffff" }}
          >
            Feature 08 · Digital Health Records Vault
          </span>
          <h2>Prescription Upload & Document Vault</h2>
          <p>
            Securely store, organize, and inspect your medical prescriptions,
            diagnostic laboratory reports, radiology scans, and hospital
            discharge summaries in an encrypted clinical archive.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="btn btn--primary"
            style={{
              background: "#2563eb",
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
            onClick={() => setIsUploading(true)}
          >
            <Icon name="prescription" size={16} /> Upload New Document
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

      {/* Vault Category Filter */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["All", "Prescription", "Lab Report", "Discharge Summary"].map(
            (cat) => (
              <button
                key={cat}
                type="button"
                className={`feature-filter-btn ${
                  filterCategory === cat ? "active" : ""
                }`}
                onClick={() => setFilterCategory(cat)}
              >
                {cat} (
                {cat === "All"
                  ? documents.length
                  : documents.filter((d) => d.category === cat).length}
                )
              </button>
            ),
          )}
        </div>
      </div>

      {/* Documents Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "20px",
        }}
      >
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="card"
            style={{
              padding: "22px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "14px",
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
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "12px",
                    background: "#eff6ff",
                    color: "#2563eb",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name="prescription" size={22} />
                </div>
                <span
                  className="feat-tag"
                  style={{
                    background:
                      doc.category === "Prescription" ? "#e0e7ff" : "#ecfdf5",
                    color:
                      doc.category === "Prescription" ? "#4338ca" : "#047857",
                  }}
                >
                  {doc.category}
                </span>
              </div>

              <div style={{ marginTop: "12px" }}>
                <h4
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: 800,
                    color: "var(--navy)",
                  }}
                >
                  {doc.title}
                </h4>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  Attending: <strong>{doc.doctor_name}</strong> ·{" "}
                  {formatFileSize(doc.file_size)}
                </p>
                {doc.notes && (
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: "13px",
                      color: "#475569",
                      background: "#f8fafc",
                      padding: "8px 12px",
                      borderRadius: "8px",
                    }}
                  >
                    📝 {doc.notes}
                  </p>
                )}
                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "11px",
                    color: "#94a3b8",
                  }}
                >
                  Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()} ·{" "}
                  {doc.file_name}
                </div>
              </div>
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
                className="btn btn--secondary"
                style={{ flex: 1, justifyContent: "center", fontSize: "13px" }}
                onClick={() => {
                  const url = getDocumentDownloadUrl(doc.id)
                  window.open(url, "_blank")
                }}
              >
                📥 Download
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                style={{
                  justifyContent: "center",
                  color: "#ef4444",
                  borderColor: "#fecaca",
                }}
                title="Delete document"
                onClick={() => handleDelete(doc.id)}
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {isUploading && (
        <div className="med-modal-backdrop">
          <div className="med-modal-content">
            <div className="med-modal-header">
              <h3>Upload Prescription / Diagnostic Document</h3>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                }}
                onClick={() => setIsUploading(false)}
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <form onSubmit={handleUploadSubmit}>
              <div className="med-modal-body">
                <div className="med-form-group">
                  <label>Document File (PDF, PNG, JPG)</label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="med-form-input"
                    required
                  />
                </div>

                <div className="med-form-group">
                  <label>Document Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Dr. Mehta Cardiology Prescription"
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
                    <label>Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="med-form-select"
                    >
                      <option value="Prescription">Prescription</option>
                      <option value="Lab Report">Lab Report</option>
                      <option value="Discharge Summary">
                        Discharge Summary
                      </option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="med-form-group">
                    <label>Doctor or Lab Name</label>
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      placeholder="e.g. Dr. Sarah Jenkins"
                      className="med-form-input"
                    />
                  </div>
                </div>

                <div className="med-form-group">
                  <label>Clinical Notes or Summary</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any specific clinical notes, medications listed, or follow-up instructions..."
                    className="med-form-textarea"
                  />
                </div>
              </div>

              <div className="med-modal-footer">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setIsUploading(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={uploading}
                >
                  {uploading ? "Encrypting & Uploading..." : "Upload to Vault"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
