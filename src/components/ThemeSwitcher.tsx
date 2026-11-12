import React, { useState, useEffect } from 'react';
import {
  Palette,
  Check,
  RotateCcw,
  Save,
  ShieldCheck,
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Moon,
  Sun,
  Layers,
} from 'lucide-react';

export type ThemeId =
  | 'rose-quartz'
  | 'midnight-elegance'
  | 'ocean-breeze'
  | 'burgundy-classic'
  | 'graphite-modern';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  tagline: string;
  description: string;
  isDark: boolean;
  bgHex: string;
  cardHex: string;
  primaryHex: string;
  accentHex: string;
  textHex: string;
  badge: string;
  swatches: string[];
}

export const THEMES: ThemeOption[] = [
  {
    id: 'rose-quartz',
    name: 'Rose Quartz (Default Light)',
    tagline: 'Soft Pale Blush, Dusty Rose & Rose Gold',
    description:
      'Elegant, warm light theme featuring Pale Blush background (#F8EDEF), Soft Pink cards (#F1DDE3), Muted Rose primary buttons (#B76E79), and Rose Gold accents (#C49A8A).',
    isDark: false,
    bgHex: '#F8EDEF',
    cardHex: '#F1DDE3',
    primaryHex: '#B76E79',
    accentHex: '#C49A8A',
    textHex: '#30252A',
    badge: 'Default Light Theme',
    swatches: ['#F8EDEF', '#F1DDE3', '#E5C5D0', '#B76E79', '#C49A8A', '#30252A'],
  },
  {
    id: 'midnight-elegance',
    name: 'Midnight Elegance',
    tagline: 'Sleek Cyber Navy & Rose Gold Dark Theme',
    description:
      'High-contrast dark banking theme with Midnight Navy background (#121824), deep slate cards (#1F293D), Rose Gold primary highlights (#C49A8A), and Muted Rose buttons.',
    isDark: true,
    bgHex: '#121824',
    cardHex: '#1F293D',
    primaryHex: '#C49A8A',
    accentHex: '#B76E79',
    textHex: '#F3F4F6',
    badge: 'Optional Dark Theme',
    swatches: ['#121824', '#1F293D', '#2D3C59', '#C49A8A', '#B76E79', '#F3F4F6'],
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    tagline: 'Light Aqua, Fresh Cyan & Deep Teal',
    description: 'Crisp light aqua canvas (#EBF8F7) paired with vibrant teal buttons (#0D9488) and mint accents.',
    isDark: false,
    bgHex: '#EBF8F7',
    cardHex: '#FFFFFF',
    primaryHex: '#0D9488',
    accentHex: '#14B8A6',
    textHex: '#134E4A',
    badge: 'Light Aqua',
    swatches: ['#EBF8F7', '#FFFFFF', '#99F6E4', '#0D9488', '#14B8A6', '#134E4A'],
  },
  {
    id: 'burgundy-classic',
    name: 'Burgundy Classic',
    tagline: 'Light Soft Rose Canvas & Deep Burgundy',
    description: 'Refined soft rose canvas (#FAF0F2) accented with rich deep burgundy primary buttons (#800020).',
    isDark: false,
    bgHex: '#FAF0F2',
    cardHex: '#FFFFFF',
    primaryHex: '#800020',
    accentHex: '#B76E79',
    textHex: '#2B0812',
    badge: 'Burgundy & Rose',
    swatches: ['#FAF0F2', '#FFFFFF', '#D98295', '#800020', '#B76E79', '#2B0812'],
  },
  {
    id: 'graphite-modern',
    name: 'Graphite Modern',
    tagline: 'Light Slate Grey & Modern Teal',
    description: 'Clean light slate grey background (#F3F4F6) with deep graphite text (#1E293B) and modern teal accents.',
    isDark: false,
    bgHex: '#F3F4F6',
    cardHex: '#FFFFFF',
    primaryHex: '#0F766E',
    accentHex: '#475569',
    textHex: '#1E293B',
    badge: 'Light Grey & Teal',
    swatches: ['#F3F4F6', '#FFFFFF', '#94A3B8', '#0F766E', '#475569', '#1E293B'],
  },
];

export function applyTheme(themeId: ThemeId) {
  if (typeof document !== 'undefined') {
    if (themeId === 'rose-quartz') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', themeId);
    }
    localStorage.setItem('fraudshield_theme', themeId);
  }
}

export function getStoredTheme(): ThemeId {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('fraudshield_theme') as ThemeId;
    if (saved && THEMES.some((t) => t.id === saved)) {
      return saved;
    }
  }
  return 'rose-quartz';
}

interface ThemeSwitcherProps {
  compact?: boolean;
}

export function ThemeSwitcher({ compact = false }: ThemeSwitcherProps) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('rose-quartz');
  const [activeAppliedTheme, setActiveAppliedTheme] = useState<ThemeId>('rose-quartz');
  const [isOpen, setIsOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const saved = getStoredTheme();
    setSelectedTheme(saved);
    setActiveAppliedTheme(saved);
    applyTheme(saved);
  }, []);

  const handleSelectTheme = (id: ThemeId) => {
    setSelectedTheme(id);
    applyTheme(id);
    setActiveAppliedTheme(id);
  };

  const handleSavePreferences = () => {
    applyTheme(selectedTheme);
    setActiveAppliedTheme(selectedTheme);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefault = () => {
    handleSelectTheme('rose-quartz');
  };

  const selectedThemeObj = THEMES.find((t) => t.id === selectedTheme) || THEMES[0];

  // Compact Header Dropdown View
  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold transition-all hover:border-primary/50 shadow-xs cursor-pointer"
          title="Theme Selector / தீம் தேர்வு"
        >
          <span
            className="h-3 w-3 rounded-full shrink-0 border border-black/20 shadow-xs"
            style={{ backgroundColor: selectedThemeObj.primaryHex }}
          />
          <Palette className="h-3.5 w-3.5 text-primary" />
          <span className="hidden lg:inline text-foreground">{selectedThemeObj.name.split(' ')[0]}</span>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 z-50 w-72 rounded-2xl border border-glass-border bg-card p-3 shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center justify-between">
                <span>Theme Presets</span>
                <span className="text-[10px] text-primary">5 Themes</span>
              </div>
              <div className="space-y-1">
                {THEMES.map((theme) => {
                  const isCur = selectedTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        handleSelectTheme(theme.id);
                        setIsOpen(false);
                      }}
                      className={`flex items-center justify-between w-full rounded-xl p-2 text-xs text-left transition-colors cursor-pointer ${
                        isCur
                          ? 'bg-primary/10 border border-primary/30 font-bold text-primary'
                          : 'hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-4 w-4 rounded-full shrink-0 border border-black/10 shadow-xs"
                          style={{ backgroundColor: theme.primaryHex }}
                        />
                        <div>
                          <div className="font-semibold">{theme.name}</div>
                          <div className="text-[10px] text-muted-foreground">{theme.tagline}</div>
                        </div>
                      </div>
                      {isCur && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Full Theme Settings Page View
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass rounded-3xl border border-glass-border p-6 sm:p-8 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 mb-1">
              <Palette className="h-4 w-4" /> Theme & Appearance Settings
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
              Customize <span className="text-gradient">Rose Quartz & Theme Options</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mt-1">
              Select your preferred color palette. FraudShield is designed with a soft <strong>Rose Quartz</strong> light theme default, pale blush background, soft pink cards, and rose gold accents.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefault}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset to Default
            </button>
            <button
              onClick={handleSavePreferences}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow hover:bg-primary/90 transition-all cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" /> Save Preference
            </button>
          </div>
        </div>

        {savedSuccess && (
          <div className="mt-3 rounded-2xl border border-safe/30 bg-safe/10 p-3 text-xs text-safe flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Theme preferences saved successfully! Theme applied globally across all FraudShield pages.</span>
          </div>
        )}
      </div>

      {/* Main Grid: Theme Cards List (Left) + Live Interactive Preview (Right) */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Left Column: 5 Theme Cards */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
            <Layers className="h-4 w-4 text-primary" /> Select Theme Preset (5 Options)
          </h3>

          <div className="space-y-3">
            {THEMES.map((theme) => {
              const isSelected = selectedTheme === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`group rounded-3xl border p-5 text-left transition-all cursor-pointer relative overflow-hidden shadow-2xs ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/40 bg-card shadow-md scale-[1.01]'
                      : 'border-border bg-card/80 hover:border-primary/50 hover:bg-card hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-4 w-4 rounded-full border border-black/10 shadow-xs"
                          style={{ backgroundColor: theme.primaryHex }}
                        />
                        <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                          {theme.name}
                        </h4>
                        {theme.isDark ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full">
                            <Moon className="h-2.5 w-2.5" /> Dark
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full">
                            <Sun className="h-2.5 w-2.5" /> Light
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-primary">{theme.tagline}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {theme.description}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div
                        className={`h-6 w-6 rounded-full border border-black/10 flex items-center justify-center transition-all ${
                          isSelected ? 'bg-primary text-primary-foreground scale-110 shadow-xs' : 'bg-muted/40'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {theme.badge}
                      </span>
                    </div>
                  </div>

                  {/* Palette Swatch Bar */}
                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">Swatches:</span>
                    <div className="flex items-center gap-1.5 flex-1">
                      {theme.swatches.map((hex, idx) => (
                        <div
                          key={idx}
                          title={hex}
                          className="h-5 flex-1 rounded-lg border border-black/10 shadow-2xs transition-transform hover:scale-110"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Accurate Live UI Theme Preview */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
            <Sparkles className="h-4 w-4 text-primary" /> Live UI Preview ({selectedThemeObj.name})
          </h3>

          <div className="sticky top-24 rounded-3xl border border-glass-border glass p-6 space-y-5 shadow-xl">
            {/* Mock Header Navbar */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-white shadow-xs">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span className="font-display text-xs font-bold text-foreground">FraudShield UI</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                {selectedThemeObj.badge}
              </span>
            </div>

            {/* Mock Dashboard Stat Card */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Pre-Transfer Risk Evaluation</span>
                <span className="font-mono font-bold text-safe">SAFE (12/100)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/25 grid place-items-center text-primary font-bold text-sm font-mono">
                  UPI
                </div>
                <div>
                  <span className="font-bold text-xs text-foreground block">swiggy.food@icici</span>
                  <span className="text-[10px] text-muted-foreground">Verified Merchant Entity</span>
                </div>
              </div>
            </div>

            {/* Mock Action Controls */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold uppercase text-muted-foreground">
                Interactive Form Input
              </label>
              <input
                type="text"
                readOnly
                value="merchant@okhdfcbank"
                className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-mono text-foreground shadow-xs"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-sm"
              >
                <Send className="h-3.5 w-3.5" /> Transfer Funds
              </button>
              <button
                type="button"
                className="flex items-center justify-center rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground shadow-2xs"
              >
                Scan QR
              </button>
            </div>

            {/* Risk Status Badges */}
            <div className="pt-2 border-t border-border/40 space-y-2">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
                Risk Tier Indicators:
              </span>
              <div className="flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1 text-safe font-bold bg-safe/10 border border-safe/25 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> Safe Transfer
                </span>
                <span className="inline-flex items-center gap-1 text-medium font-bold bg-medium/10 border border-medium/25 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="h-3 w-3" /> Medium Warning
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
