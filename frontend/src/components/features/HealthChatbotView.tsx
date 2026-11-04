import React, { useState, useRef, useEffect } from "react"
import { Icon } from "../Icon"
import { sendChatbotMessage } from "../../api"

interface ChatMessage {
  id: string
  sender: "bot" | "user"
  text: string
  time: string
  isEmergency?: boolean
  recommendation?: string
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    sender: "bot",
    text: "Hello! I am your AI Clinical Assistant. You can ask me about medication dosage guidelines, symptoms, drug safety precautions, or common health questions.",
    time: "Just now",
  },
]

const QUICK_PROMPTS = [
  "What are common symptoms of Dengue fever?",
  "Can I take Paracetamol with food?",
  "What is the normal blood pressure range?",
  "Home remedies for acidity and GERD",
  "How to manage sudden allergic skin rash?",
]

export function HealthChatbotView({
  onNavigate,
}: {
  onNavigate: (screen: string) => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState<"en" | "hi" | "mr">("en")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input
    if (!textToSend.trim() || loading) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!queryText) setInput("")
    setLoading(true)

    try {
      const response = await sendChatbotMessage(textToSend, language)
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: response.response,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isEmergency: response.is_emergency,
        recommendation: response.recommendation,
      }
      setMessages((prev) => [...prev, botMsg])
    } catch {
      // Local fallback intelligent response
      let fallbackText =
        "I've analyzed your question. For general symptoms, ensure adequate rest and oral rehydration. If you have any persistent discomfort, fever above 101°F, or chronic pain, please book a consultation with our verified doctors."
      let isEmerg = false

      const lower = textToSend.toLowerCase()
      if (
        lower.includes("chest pain") ||
        lower.includes("heart") ||
        lower.includes("breath")
      ) {
        fallbackText =
          "⚠️ CRITICAL ALERT: Severe chest pressure or shortness of breath requires immediate emergency care. Please dial 108 or activate Emergency SOS immediately."
        isEmerg = true
      } else if (lower.includes("paracetamol") || lower.includes("fever")) {
        fallbackText =
          "Paracetamol (Acetaminophen) is commonly taken at 500mg-650mg every 6 hours as needed for fever and pain, preferably after meals. Do not exceed 3,000mg in 24 hours. Avoid concurrent alcohol consumption."
      } else if (lower.includes("dengue")) {
        fallbackText =
          "Dengue symptoms typically include high fever, severe retro-orbital headache, joint and muscle pain, fatigue, and nodal skin rash. Hydration is vital; avoid NSAIDs like Ibuprofen/Aspirin due to bleeding risk."
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: fallbackText,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isEmergency: isEmerg,
      }
      setMessages((prev) => [...prev, botMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="feature-view-container">
      {/* Hero Banner */}
      <div
        className="feature-hero-banner"
        style={{
          background: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
        }}
      >
        <div className="feature-hero-copy">
          <span
            className="feat-tag"
            style={{ background: "rgba(255, 255, 255, 0.2)", color: "#ffffff" }}
          >
            Feature 09 · Conversational Medical AI
          </span>
          <h2>AI Health Chatbot & Triage Assistant</h2>
          <p>
            Engage with our multimodal medical conversational intelligence.
            Clarify medication queries, investigate symptom patterns, receive
            immediate home-care guidance, and access multi-language triage.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="med-form-select"
            style={{
              background: "rgba(255,255,255,0.2)",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <option value="en" style={{ color: "#000" }}>
              English (EN)
            </option>
            <option value="hi" style={{ color: "#000" }}>
              हिंदी (Hindi)
            </option>
            <option value="mr" style={{ color: "#000" }}>
              मराठी (Marathi)
            </option>
          </select>
        </div>
      </div>

      {/* Chat Window */}
      <div className="chat-window">
        {/* Chat Header */}
        <div className="chat-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #059669, #047857)",
                color: "white",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon name="brain" size={20} />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  color: "var(--navy)",
                  fontSize: "15px",
                }}
              >
                Clinical AI Assistant
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#10b981",
                    display: "inline-block",
                  }}
                />
                Online · Knowledge Base Active
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn--secondary"
            style={{ fontSize: "12px", padding: "6px 12px" }}
            onClick={() => setMessages(INITIAL_MESSAGES)}
          >
            Clear Chat
          </button>
        </div>

        {/* Chat Messages */}
        <div className="chat-messages">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`chat-bubble ${
                m.sender === "bot" ? "chat-bubble--bot" : "chat-bubble--user"
              }`}
              style={
                m.isEmergency
                  ? {
                      border: "2px solid #ef4444",
                      background: "#fef2f2",
                      color: "#991b1b",
                    }
                  : undefined
              }
            >
              {m.isEmergency && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 800,
                    color: "#dc2626",
                    marginBottom: "6px",
                  }}
                >
                  <Icon name="alert" size={16} /> EMERGENCY ALERT TRIGGERED
                </div>
              )}
              <div style={{ whiteSpace: "pre-line" }}>{m.text}</div>
              {m.recommendation && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "8px 12px",
                    background: "rgba(255,255,255,0.7)",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  👉 {m.recommendation}
                </div>
              )}
              <div
                style={{
                  fontSize: "10px",
                  opacity: 0.65,
                  marginTop: "6px",
                  textAlign: m.sender === "user" ? "right" : "left",
                }}
              >
                {m.time}
              </div>
            </div>
          ))}

          {loading && (
            <div
              className="chat-bubble chat-bubble--bot"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <div
                className="loader"
                style={{ width: "16px", height: "16px" }}
              />
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                AI is formulating clinical guidance...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="chat-quick-prompts">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              className="quick-prompt-chip"
              onClick={() => handleSend(prompt)}
            >
              💬 {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="chat-input-bar"
        >
          <input
            type="text"
            placeholder="Type your health or medication question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="med-form-input"
            style={{ borderRadius: "12px" }}
          />
          <button
            type="submit"
            className="btn btn--primary"
            style={{
              background: "#059669",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
            disabled={loading || !input.trim()}
          >
            Send <Icon name="arrow" size={16} />
          </button>
        </form>
      </div>

      {/* Clinical Disclaimer */}
      <div
        style={{
          padding: "12px 18px",
          background: "#f8fafc",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          fontSize: "12px",
          color: "#64748b",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <Icon
          name="info"
          size={16}
          style={{ color: "#3b82f6", flexShrink: 0 }}
        />
        <span>
          Medical Information Notice: The AI Chatbot provides educational
          guidance based on pharmacology databases. It does not substitute for a
          professional clinical diagnosis or doctor consultation.
        </span>
      </div>
    </div>
  )
}
