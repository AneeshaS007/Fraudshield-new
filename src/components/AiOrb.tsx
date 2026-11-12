import { motion } from 'motion/react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface AiOrbProps {
  size?: number;
  active?: boolean;
  score?: number;
}

export function AiOrb({ size = 130, active = true, score }: AiOrbProps) {
  const isHighRisk = typeof score === 'number' && score >= 70;
  const isMediumRisk = typeof score === 'number' && score >= 35 && score < 70;

  const glowColor = isHighRisk
    ? 'rgba(199, 71, 71, 0.2)'
    : isMediumRisk
    ? 'rgba(217, 154, 53, 0.2)'
    : 'rgba(180, 154, 112, 0.15)';

  const primaryRing = isHighRisk
    ? 'border-high/40'
    : isMediumRisk
    ? 'border-medium/40'
    : 'border-primary/40';

  return (
    <div
      className="relative grid place-items-center select-none"
      style={{ width: size, height: size }}
    >
      {/* Outer Glow Halo */}
      <div
        className="absolute inset-0 rounded-full blur-xl transition-all duration-700 pointer-events-none"
        style={{
          background: glowColor,
          opacity: active ? 0.8 : 0.2,
        }}
      />

      {/* Orbiting dashed ring */}
      <motion.div
        animate={active ? { rotate: 360 } : {}}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        className={`absolute inset-1 rounded-full border border-dashed ${primaryRing} opacity-60`}
      />

      {/* Counter rotating inner ring */}
      <motion.div
        animate={active ? { rotate: -360 } : {}}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-3 rounded-full border border-primary/30 opacity-40"
      />

      {/* Pulsing Core Sphere */}
      <motion.div
        animate={
          active
            ? {
                scale: [0.95, 1.05, 0.95],
                opacity: [0.85, 1, 0.85],
              }
            : {}
        }
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="relative grid place-items-center rounded-full shadow-inner"
        style={{
          width: size * 0.65,
          height: size * 0.65,
          background: isHighRisk
            ? 'radial-gradient(circle at 35% 30%, #C74747, #7D2828 90%)'
            : isMediumRisk
            ? 'radial-gradient(circle at 35% 30%, #D99A35, #8A5E1B 90%)'
            : 'radial-gradient(circle at 35% 30%, #B49A70, #292D2F 85%)',
          boxShadow: `0 4px 18px ${glowColor}, inset 0 2px 6px rgba(255,255,255,0.35)`,
        }}
      >
        {isHighRisk ? (
          <ShieldAlert className="h-7 w-7 text-white drop-shadow" />
        ) : (
          <ShieldCheck className="h-7 w-7 text-white drop-shadow" />
        )}
      </motion.div>

      {/* Scanning laser beam indicator when active */}
      {active && (
        <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-secondary to-transparent animate-scan opacity-60 pointer-events-none" />
      )}
    </div>
  );
}
