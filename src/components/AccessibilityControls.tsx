import React from 'react';
import { Sun, Moon, Globe, Check, Eye } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { LANGUAGES, Language } from '../lib/i18n';

interface AccessibilityControlsProps {
  variant?: 'earth' | 'trader';
  compact?: boolean;
}

export function AccessibilityControls({
  variant = 'earth',
  compact = false,
}: AccessibilityControlsProps) {
  const { theme, setTheme, highContrast, setHighContrast, language, setLanguage, t } =
    useAccessibility();

  const isTrader = variant === 'trader';

  // Styling tokens based on space
  const cardBg = isTrader ? 'bg-[#0B1320]/60 border-[#244766]' : 'bg-[#EDE7E1] border-[#D7CCC8] shadow-2xs';
  const headerText = isTrader ? 'text-[#A9C4D8]' : 'text-neutral-900 font-bold';
  const activeBtnBg = isTrader
    ? 'bg-[#20C9A6] text-[#0B1320] shadow-sm font-bold'
    : 'bg-[#8D6E63] text-white shadow-sm font-bold';
  const inactiveBtnBg = isTrader
    ? 'bg-[#14263D] text-[#F3F7FB] border border-[#52758F]/40 hover:bg-[#244766]'
    : 'bg-[#F7F4F0] text-neutral-950 border border-[#D7CCC8] hover:bg-[#EAE2DA] font-semibold';

  return (
    <div className={`rounded-2xl border p-3.5 space-y-3.5 ${cardBg}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${headerText}`}>
          <Eye className={`h-3.5 w-3.5 ${isTrader ? 'text-[#20C9A6]' : 'text-[#8D6E63]'}`} />
          <span>{t('accessibility')}</span>
        </span>
        <span
          className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
            theme === 'dark'
              ? isTrader
                ? 'bg-[#20C9A6]/20 text-[#20C9A6] border border-[#20C9A6]/30'
                : 'bg-[#8D6E63] text-white border border-[#8D6E63]'
              : isTrader
                ? 'bg-muted text-muted-foreground'
                : 'bg-[#D7CCC8] text-neutral-900 font-semibold'
          }`}
        >
          {theme === 'dark' ? 'Dark (AAA)' : 'Light (Default)'}
        </span>
      </div>

      {/* 1. Theme Toggle: Light vs Dark High-Contrast */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className={`text-[11px] font-bold ${isTrader ? 'text-[#F3F7FB]' : 'text-neutral-950'}`}>
            {t('theme')}
          </span>
          <span className={`text-[10px] ${isTrader ? 'text-[#A9C4D8]' : 'text-neutral-700 font-medium'}`}>
            High-Contrast
          </span>
        </div>

        <div className={`grid grid-cols-2 gap-1.5 rounded-xl p-1 border ${isTrader ? 'bg-black/10 border-white/5' : 'bg-[#E5DDD4] border-[#D7CCC8]'}`}>
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs transition-all cursor-pointer ${
              theme === 'light' ? activeBtnBg : inactiveBtnBg
            }`}
            title="Switch to Light Theme"
          >
            <Sun className="h-3.5 w-3.5 shrink-0" />
            <span>{t('lightMode')}</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs transition-all cursor-pointer ${
              theme === 'dark' ? activeBtnBg : inactiveBtnBg
            }`}
            title="Switch to Dark Mode with High-Contrast Elements"
          >
            <Moon className="h-3.5 w-3.5 shrink-0" />
            <span>{t('darkMode')}</span>
          </button>
        </div>
      </div>

      {/* 2. Multilingual Language Selector */}
      <div className={`space-y-1.5 pt-2 border-t ${isTrader ? 'border-white/10' : 'border-[#D7CCC8]'}`}>
        <div className="flex items-center justify-between text-xs">
          <span className={`text-[11px] font-bold flex items-center gap-1.5 ${isTrader ? 'text-[#F3F7FB]' : 'text-neutral-950'}`}>
            <Globe className="h-3 w-3 opacity-70" />
            <span>{t('language')}</span>
          </span>
          <span className={`text-[10px] font-mono uppercase font-bold ${isTrader ? 'text-muted-foreground' : 'text-neutral-700'}`}>
            {language}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer text-left ${
                  isSelected ? activeBtnBg : inactiveBtnBg
                }`}
                title={`Switch language to ${lang.label} (${lang.nativeLabel})`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-xs">{lang.flag}</span>
                  <span className="font-semibold truncate">{lang.nativeLabel}</span>
                </div>
                {isSelected && <Check className="h-3 w-3 shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. WCAG AAA High Contrast Extra Accent Switch */}
      <div className={`pt-2 border-t ${isTrader ? 'border-white/10' : 'border-[#D7CCC8]'}`}>
        <label className="flex items-center justify-between text-[11px] cursor-pointer hover:opacity-90">
          <span className={isTrader ? 'text-[#A9C4D8]' : 'text-neutral-900 font-semibold'}>
            {t('highContrastMode')}
          </span>
          <input
            type="checkbox"
            checked={highContrast}
            onChange={(e) => setHighContrast(e.target.checked)}
            className="rounded border-[#8D6E63] text-[#8D6E63] focus:ring-[#8D6E63] h-3.5 w-3.5 cursor-pointer accent-[#8D6E63]"
          />
        </label>
      </div>
    </div>
  );
}
