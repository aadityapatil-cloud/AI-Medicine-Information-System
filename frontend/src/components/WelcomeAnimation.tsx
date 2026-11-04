import { useEffect, useState } from "react";
import type { PatientUser } from "../types";

interface WelcomeAnimationProps {
  patient: PatientUser;
  onComplete: () => void;
}

export function WelcomeAnimation({ patient, onComplete }: WelcomeAnimationProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const statusSteps = [
    "Verifying patient credentials and security tokens…",
    "Initializing 132 clinical symptom inference models…",
    "Synchronizing medicine safety and interaction databases…",
    "Welcome AI Medicine Clinical Decision Support platform is ready.",
  ];

  useEffect(() => {
    // Step progression
    const t1 = setTimeout(() => {
      setStepIndex(1);
      setProgress(45);
    }, 600);

    const t2 = setTimeout(() => {
      setStepIndex(2);
      setProgress(75);
    }, 1300);

    const t3 = setTimeout(() => {
      setStepIndex(3);
      setProgress(100);
    }, 2000);

    const t4 = setTimeout(() => {
      setIsFadingOut(true);
    }, 2700);

    const t5 = setTimeout(() => {
      onComplete();
    }, 3100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(onComplete, 300);
  };

  return (
    <div className={`welcome-screen ${isFadingOut ? "welcome-screen--fade-out" : ""}`}>
      {/* Decorative pulse circles */}
      <div className="welcome-ripple-ring ripple-1" />
      <div className="welcome-ripple-ring ripple-2" />
      <div className="welcome-ripple-ring ripple-3" />

      <div className="welcome-card">
        {/* Animated Glowing Medical Cross & AI Dots */}
        <div className="welcome-badge-glow">
          <div className="welcome-logo-circle">
            <span className="welcome-cross-v" />
            <span className="welcome-cross-h" />
            <span className="welcome-dot dot-1" />
            <span className="welcome-dot dot-2" />
            <span className="welcome-dot dot-3" />
          </div>
        </div>

        {/* Eyebrow Pill */}
        <span className="welcome-screen-pill">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 3-1.2 3.8L7 8l3.8 1.2L12 13l1.2-3.8L17 8l-3.8-1.2Z" />
            <path d="m5 15-.7 2.3L2 18l2.3.7L5 21l.7-2.3L8 18l-2.3-.7Z" />
          </svg>
          Clinical AI Lab Active
        </span>

        {/* Main Welcome Headings */}
        <h1 className="welcome-main-title">
          Welcome to <span className="highlight-blue">AI Medicine</span>
        </h1>
        <h2 className="welcome-sub-title">
          Clinical Decision Support
        </h2>

        {/* Patient Greeting */}
        <div className="welcome-patient-badge">
          <span className="patient-avatar-mini">
            {patient.full_name
              .trim()
              .split(/\s+/)
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </span>
          <div>
            <span>Authenticated Patient</span>
            <strong>{patient.full_name}</strong>
          </div>
        </div>

        {/* Progress Bar with glowing pulse */}
        <div className="welcome-progress-track">
          <div
            className="welcome-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Dynamic status line */}
        <div className="welcome-status-box">
          <span className="pulse-beacon" />
          <p key={stepIndex} className="welcome-status-text">
            {statusSteps[stepIndex]}
          </p>
        </div>

        {/* Action Skip Button */}
        <button
          type="button"
          className="welcome-enter-btn"
          onClick={handleSkip}
        >
          Enter Dashboard &rarr;
        </button>
      </div>
    </div>
  );
}
