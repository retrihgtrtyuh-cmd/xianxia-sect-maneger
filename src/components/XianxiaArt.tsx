import React from 'react';

/**
 * АТМОСФЕРНЫЕ ВЕКТОРНЫЕ ИЛЛЮСТРАЦИИ САНЬСЯ (ZERO-BROKEN-IMAGE FALLBACK & BANNERS)
 */

export const SectAbodeIllustration: React.FC<{ level: 1 | 2 }> = ({ level }) => {
  return (
    <div className="relative w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-[#262E3D] bg-[#0F141C] shrink-0">
      <svg
        viewBox="0 0 800 220"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={level === 2 ? '#0B1924' : '#0B0E14'} />
            <stop offset="60%" stopColor={level === 2 ? '#132A38' : '#141B26'} />
            <stop offset="100%" stopColor="#0D1118" />
          </linearGradient>
          <radialGradient id="qiOrb" cx="50%" cy="45%" r="45%">
            <stop offset="0%" stopColor={level === 2 ? '#34D399' : '#D97706'} stopOpacity="0.28" />
            <stop offset="60%" stopColor={level === 2 ? '#059669' : '#92400E'} stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="220" fill="url(#skyGrad)" />
        <circle cx="400" cy="105" r="150" fill="url(#qiOrb)" />

        <g stroke={level === 2 ? '#34D399' : '#D97706'} strokeOpacity="0.22" fill="none">
          <circle cx="400" cy="110" r="75" strokeWidth="1.5" strokeDasharray="6 4" />
          <circle cx="400" cy="110" r="55" strokeWidth="1" />
          {level === 2 && <circle cx="400" cy="110" r="95" strokeWidth="1" strokeDasharray="3 6" />}
        </g>

        <path
          d="M0,0 L800,0 L800,70 L730,35 L670,80 L590,25 L520,60 L450,18 L350,18 L280,65 L210,25 L130,75 L60,35 L0,70 Z"
          fill="#090C11"
          opacity="0.85"
        />

        <g transform="translate(330, 42)">
          {level === 2 && (
            <>
              <path d="M25,28 L70,4 L115,28 L102,32 L38,32 Z" fill="#1E293B" stroke="#34D399" strokeWidth="1" strokeOpacity="0.5" />
              <rect x="46" y="32" width="48" height="20" fill="#131C29" stroke="#334155" strokeWidth="1" />
            </>
          )}
          <path
            d="M5,66 L70,38 L135,66 L122,72 L18,72 Z"
            fill="#19212E"
            stroke={level === 2 ? '#34D399' : '#B48A4E'}
            strokeWidth="1.2"
            strokeOpacity="0.6"
          />
          <rect x="26" y="72" width="88" height="52" fill="#0F151F" stroke="#283244" strokeWidth="1" />
          <line x1="44" y1="72" x2="44" y2="124" stroke="#B48A4E" strokeOpacity="0.4" strokeWidth="2" />
          <line x1="96" y1="72" x2="96" y2="124" stroke="#B48A4E" strokeOpacity="0.4" strokeWidth="2" />
          <circle cx="70" cy="98" r="9" fill={level === 2 ? '#10B981' : '#D97706'} opacity="0.75" />
          <path d="M16,124 L124,124 L142,165 L-2,165 Z" fill="#151C28" stroke="#263142" strokeWidth="1" />
        </g>

        <path d="M0,220 L0,155 L140,175 L250,205 L550,205 L660,175 L800,155 L800,220 Z" fill="#080B10" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/40 to-transparent pointer-events-none" />
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-[#E6E1D6]">
        <span className="font-semibold">
          {level === 2 ? 'Обитель II ступени: Твердыня Глубин' : 'Обитель I ступени: Забытая Нора'}
        </span>
        <span className="text-[#94A3B8]">
          {level === 2 ? 'Отдых +10 здоровья/тик · Опыт +35%' : 'Отдых +4 здоровья/тик · Потолок I царства'}
        </span>
      </div>
    </div>
  );
};

export const KarstRiftIllustration: React.FC<{ depthStage: number; active: boolean }> = ({
  depthStage,
  active,
}) => {
  return (
    <div className="relative w-full h-16 sm:h-20 rounded-xl overflow-hidden border border-[#2A2430] bg-[#110D16] shrink-0">
      <svg
        viewBox="0 0 800 180"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="riftBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0E0B14" />
            <stop offset="50%" stopColor="#1D1322" />
            <stop offset="100%" stopColor="#0B0E14" />
          </linearGradient>
          <radialGradient id="riftGlow" cx="50%" cy="55%" r="45%">
            <stop offset="0%" stopColor={active ? '#E11D48' : '#D97706'} stopOpacity="0.26" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="180" fill="url(#riftBg)" />
        <circle cx="400" cy="95" r="160" fill="url(#riftGlow)" />

        <g stroke="#9F1239" strokeOpacity="0.3" strokeWidth="1">
          <line x1="120" y1="0" x2="290" y2="120" />
          <line x1="680" y1="0" x2="510" y2="120" />
          <line x1="180" y1="35" x2="620" y2="35" strokeOpacity="0.15" />
        </g>

        <path
          d="M0,0 L800,0 L800,55 L710,95 L630,35 L540,80 L430,25 L340,75 L230,30 L130,90 L0,50 Z"
          fill="#09070D"
        />
        <polygon points="210,140 230,105 250,140" fill="#991B1B" opacity="0.65" />
        <polygon points="560,145 582,100 605,145" fill="#B45309" opacity="0.6" />
        <polygon points="385,150 400,115 418,150" fill="#047857" opacity="0.55" />

        <path d="M0,180 L0,130 L190,150 L400,165 L610,150 L800,130 L800,180 Z" fill="#07090E" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/40 to-transparent pointer-events-none" />
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-[#D6D1C4]">
        <span>Карстовый Разлом · Ярус глубины {depthStage}</span>
        <span>Авангард принимает 80% атак</span>
      </div>
    </div>
  );
};

export { DaoBalanceScaleArt } from './DaoBalanceScaleArt';

/**
 * Компактный баннер Весов Равновесия Дао и Щита Ци для использования во вкладках Обители
 */
export const DaoBalanceScaleBanner: React.FC<{
  onInspect?: () => void;
  title?: string;
  subtitle?: string;
}> = ({ onInspect, title = 'Алтарь Равновесия Дао · Щит Ци Секты', subtitle = 'Инь-Ян баланс и защитная духовная формация' }) => {
  return (
    <div
      onClick={onInspect}
      className={`group relative w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-[#2B3548] bg-[#070A12] cursor-pointer hover:border-cyan-500/60 transition-all shadow-lg shrink-0`}
    >
      <svg
        viewBox="0 0 800 220"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
        style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}
      >
        <defs>
          <linearGradient id="daoBannerBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#050811" />
            <stop offset="50%" stopColor="#0B1324" />
            <stop offset="100%" stopColor="#04060C" />
          </linearGradient>
          <radialGradient id="daoQiGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#0284C7" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="800" height="220" fill="url(#daoBannerBg)" />
        <circle cx="400" cy="110" r="140" fill="url(#daoQiGlow)" />

        {/* Traditional Chinese Pixel Stars & Cloud */}
        <g fill="#93C5FD" opacity="0.6">
          <rect x="60" y="30" width="3" height="3" />
          <rect x="180" y="45" width="2" height="2" />
          <rect x="650" y="35" width="3" height="3" />
          <rect x="730" y="55" width="2" height="2" />
        </g>

        {/* Mountain Silhouette */}
        <path
          d="M0,0 L800,0 L800,50 L710,25 L620,60 L510,20 L400,50 L280,15 L190,45 L90,20 L0,50 Z"
          fill="#080C14"
        />

        {/* Glowing Blue Spiritual Qi Shield Dome in Center */}
        <path
          d="M 280 190 L 280 110 L 340 50 L 460 50 L 520 110 L 520 190 Z"
          fill="#38BDF8"
          fillOpacity="0.16"
          stroke="#38BDF8"
          strokeWidth="2"
        />
        <circle cx="400" cy="110" r="65" fill="none" stroke="#67E8F9" strokeWidth="1" strokeDasharray="4 4" />

        {/* Pedestal */}
        <rect x="330" y="180" width="140" height="15" fill="#0E1626" stroke="#22324D" strokeWidth="1.5" />
        <rect x="345" y="174" width="110" height="6" fill="#10B981" />

        {/* Scale Column */}
        <rect x="396" y="85" width="8" height="95" fill="#1E293B" />
        <rect x="398" y="90" width="4" height="85" fill="#F59E0B" />

        {/* Scale Crossbeam */}
        <line x1="300" y1="92" x2="500" y2="88" stroke="#F59E0B" strokeWidth="3.5" />
        <circle cx="400" cy="90" r="5" fill="#10B981" stroke="#FBBF24" strokeWidth="1" />

        {/* Left Pan (Yin) */}
        <line x1="300" y1="92" x2="280" y2="135" stroke="#D97706" strokeWidth="1" strokeDasharray="3 2" />
        <line x1="300" y1="92" x2="320" y2="135" stroke="#D97706" strokeWidth="1" strokeDasharray="3 2" />
        <ellipse cx="300" cy="138" rx="22" ry="5" fill="#091E28" stroke="#F59E0B" strokeWidth="1.5" />
        <circle cx="300" cy="132" r="4" fill="#38BDF8" />

        {/* Right Pan (Yang) */}
        <line x1="500" y1="88" x2="480" y2="131" stroke="#D97706" strokeWidth="1" strokeDasharray="3 2" />
        <line x1="500" y1="88" x2="520" y2="131" stroke="#D97706" strokeWidth="1" strokeDasharray="3 2" />
        <ellipse cx="500" cy="134" rx="22" ry="5" fill="#26170A" stroke="#F59E0B" strokeWidth="1.5" />
        <circle cx="500" cy="128" r="4" fill="#F59E0B" />

        {/* Bagua / Mythological Glyphs */}
        <text x="400" y="44" fill="#93C5FD" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
          ☰ 乾 ☯ 坤 ☷
        </text>

        {/* Bottom Ground Border */}
        <path d="M0,220 L0,185 L180,195 L400,205 L620,195 L800,185 L800,220 Z" fill="#05080E" />
      </svg>

      <div className="absolute inset-0 bg-gradient-to-t from-[#060910] via-transparent to-transparent pointer-events-none" />

      {/* Banner Text & Action Pill */}
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-[#E6E1D6]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#38bdf8]" />
          <span className="font-semibold text-slate-100">{title}</span>
          <span className="hidden sm:inline text-[#94A3B8]">· {subtitle}</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 group-hover:bg-cyan-500 group-hover:text-black font-mono text-[10px] transition-colors">
          ☯ Осмотреть (16:9 Pixel Art) →
        </span>
      </div>
    </div>
  );
};
