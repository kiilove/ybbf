export interface ThemeConfig {
  key: string;
  name: string;
  icon: string;
  primary: string;
  border: string;
  border50: string;
  border40: string;
  bgGradient: string;
  particleRgb1: string;
  particleRgb2: string;
  glowRgba: string;
  rayRgba: string;
  textGradient: string;
  badgeBg: string;
  specText: string;
  shockColor: string;
  titleClass: string;
  laserGradient: string;
  laserShadow: string;
}

export const THEME_CONFIGS: Record<string, ThemeConfig> = {
  GOLD: {
    key: 'GOLD',
    name: '골드 챔피언',
    icon: '🏆',
    primary: 'text-amber-400',
    border: 'border-amber-400',
    border50: 'border-amber-400/50',
    border40: 'border-amber-400/40',
    bgGradient: 'from-amber-500/35 via-yellow-500/15 to-transparent',
    particleRgb1: '251, 191, 36',
    particleRgb2: '245, 158, 11',
    glowRgba: 'rgba(251, 191, 36, 0.22)',
    rayRgba: 'rgba(251, 191, 36, 0.04)',
    textGradient: 'from-amber-300 via-yellow-200 to-amber-400',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
    specText: 'text-amber-300',
    shockColor: '#fbbf24',
    titleClass: 'hyper-gold-text',
    laserGradient: 'from-amber-400 via-yellow-300 to-transparent',
    laserShadow: 'rgba(251, 191, 36, 0.9)',
  },
  BLUE: {
    key: 'BLUE',
    name: '일렉트릭 블루',
    icon: '⚡',
    primary: 'text-cyan-400',
    border: 'border-cyan-400',
    border50: 'border-cyan-400/50',
    border40: 'border-cyan-400/40',
    bgGradient: 'from-cyan-500/35 via-blue-500/15 to-transparent',
    particleRgb1: '34, 211, 238',
    particleRgb2: '59, 130, 246',
    glowRgba: 'rgba(6, 182, 212, 0.22)',
    rayRgba: 'rgba(6, 182, 212, 0.04)',
    textGradient: 'from-cyan-300 via-sky-200 to-blue-400',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50',
    specText: 'text-cyan-300',
    shockColor: '#22d3ee',
    titleClass: 'hyper-cyan-text',
    laserGradient: 'from-cyan-400 via-sky-300 to-transparent',
    laserShadow: 'rgba(34, 211, 238, 0.9)',
  },
  RED: {
    key: 'RED',
    name: '크림슨 레드',
    icon: '🔥',
    primary: 'text-rose-400',
    border: 'border-rose-500',
    border50: 'border-rose-500/50',
    border40: 'border-rose-500/40',
    bgGradient: 'from-rose-600/35 via-red-600/15 to-transparent',
    particleRgb1: '244, 63, 94',
    particleRgb2: '225, 29, 72',
    glowRgba: 'rgba(244, 63, 94, 0.22)',
    rayRgba: 'rgba(244, 63, 94, 0.04)',
    textGradient: 'from-rose-300 via-red-200 to-rose-500',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
    specText: 'text-rose-300',
    shockColor: '#f43f5e',
    titleClass: 'hyper-crimson-text',
    laserGradient: 'from-rose-500 via-red-400 to-transparent',
    laserShadow: 'rgba(244, 63, 94, 0.9)',
  },
  GREEN: {
    key: 'GREEN',
    name: '에메랄드 그린',
    icon: '💎',
    primary: 'text-emerald-400',
    border: 'border-emerald-400',
    border50: 'border-emerald-400/50',
    border40: 'border-emerald-400/40',
    bgGradient: 'from-emerald-500/35 via-teal-500/15 to-transparent',
    particleRgb1: '16, 185, 129',
    particleRgb2: '5, 150, 105',
    glowRgba: 'rgba(16, 185, 129, 0.22)',
    rayRgba: 'rgba(16, 185, 129, 0.04)',
    textGradient: 'from-emerald-300 via-teal-200 to-emerald-400',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50',
    specText: 'text-emerald-300',
    shockColor: '#10b981',
    titleClass: 'hyper-emerald-text',
    laserGradient: 'from-emerald-400 via-teal-300 to-transparent',
    laserShadow: 'rgba(168, 85, 247, 0.9)',
  },
  PURPLE: {
    key: 'PURPLE',
    name: '로열 퍼플',
    icon: '👑',
    primary: 'text-purple-400',
    border: 'border-purple-400',
    border50: 'border-purple-400/50',
    border40: 'border-purple-400/40',
    bgGradient: 'from-purple-500/35 via-fuchsia-500/15 to-transparent',
    particleRgb1: '192, 132, 252',
    particleRgb2: '147, 51, 234',
    glowRgba: 'rgba(168, 85, 247, 0.22)',
    rayRgba: 'rgba(168, 85, 247, 0.04)',
    textGradient: 'from-purple-300 via-fuchsia-200 to-purple-400',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/50',
    specText: 'text-purple-300',
    shockColor: '#a855f7',
    titleClass: 'hyper-purple-text',
    laserGradient: 'from-purple-400 via-fuchsia-300 to-transparent',
    laserShadow: 'rgba(168, 85, 247, 0.9)',
  }
};
