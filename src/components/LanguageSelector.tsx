import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { LANGUAGES, Language } from '../lib/i18n';

interface LanguageSelectorProps {
  variant?: 'earth' | 'trader' | 'light';
  compact?: boolean;
}

export function LanguageSelector({ variant = 'earth', compact = false }: LanguageSelectorProps) {
  const { language, setLanguage } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const buttonStyles = {
    earth:
      'border-[#8D6E63]/30 bg-[#EFEBE9] text-[#302824] hover:bg-[#8D6E63] hover:text-white',
    trader:
      'border-[#52758F]/40 bg-[#14263D] text-[#F3F7FB] hover:border-[#20C9A6] hover:text-[#20C9A6]',
    light:
      'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100',
  }[variant];

  const menuStyles = {
    earth: 'bg-[#F7F4F0] border-[#D7CCC8] text-[#302824] shadow-xl',
    trader: 'bg-[#14263D] border-[#244766] text-[#F3F7FB] shadow-2xl',
    light: 'bg-white border-neutral-200 text-neutral-800 shadow-xl',
  }[variant];

  const itemHover = {
    earth: 'hover:bg-[#EAE2DA] hover:text-[#302824]',
    trader: 'hover:bg-[#244766] hover:text-[#20C9A6]',
    light: 'hover:bg-neutral-100',
  }[variant];

  const activeItem = {
    earth: 'bg-[#8D6E63] text-white font-bold',
    trader: 'bg-[#20C9A6] text-[#0B1320] font-bold',
    light: 'bg-neutral-900 text-white font-bold',
  }[variant];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer ${buttonStyles}`}
        title={`Change Language (Current: ${currentLang.nativeLabel})`}
        aria-label="Select Language"
        aria-expanded={isOpen}
      >
        <Globe className="h-3.5 w-3.5 opacity-80 shrink-0" />
        <span className="font-semibold">{currentLang.flag}</span>
        {!compact && <span className="font-bold">{currentLang.nativeLabel}</span>}
        <ChevronDown className={`h-3 w-3 opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-1.5 w-48 rounded-2xl border p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 ${menuStyles}`}
          role="menu"
        >
          <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider opacity-60">
            Select Language / மொழியைத் தேர்வு செய்க
          </div>
          <div className="space-y-0.5">
            {LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                    isSelected ? activeItem : itemHover
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{lang.flag}</span>
                    <span className="font-semibold">{lang.nativeLabel}</span>
                    <span className="text-[10px] opacity-70">({lang.label})</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
