import { useState, useRef, useEffect } from "react";
import type { Language } from "../translations";

interface LanguageSelectorProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  compact?: boolean;
}

const languages: { code: Language; label: string; nativeName: string; flag: string }[] = [
  { code: "en", label: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "mr", label: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "hi", label: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
];

export function LanguageSelector({
  currentLang,
  onLanguageChange,
  compact = false,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentOption = languages.find((l) => l.code === currentLang) || languages[0];

  return (
    <div className="language-selector-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`language-selector-btn ${isOpen ? "active" : ""} ${
          compact ? "language-selector-btn--compact" : ""
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Language (भाषा निवडा)"
        title="Select Language / भाषा निवडा"
      >
        <span className="language-globe-icon" aria-hidden="true">
          🌐
        </span>
        <span className="language-name-label">
          {currentOption.nativeName}
        </span>
        <svg
          className={`language-chevron ${isOpen ? "rotate" : ""}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="language-dropdown-menu" role="menu">
          <div className="language-dropdown-header">
            <span>Select Language / भाषा निवडा</span>
          </div>
          {languages.map((item) => (
            <button
              key={item.code}
              type="button"
              className={`language-dropdown-item ${
                currentLang === item.code ? "selected" : ""
              }`}
              onClick={() => {
                onLanguageChange(item.code);
                setIsOpen(false);
              }}
              role="menuitem"
            >
              <div className="language-item-left">
                <span className="language-item-flag">{item.flag}</span>
                <div className="language-item-text">
                  <strong>{item.nativeName}</strong>
                  <small>{item.label}</small>
                </div>
              </div>
              {currentLang === item.code && (
                <svg
                  className="language-check-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
