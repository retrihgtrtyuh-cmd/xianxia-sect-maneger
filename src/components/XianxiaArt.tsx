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
