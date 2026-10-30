import React, { useState, useEffect } from 'react';
import { soundFX } from '../utils/sound';

interface DaoBalanceScaleArtProps {
  interactive?: boolean;
  className?: string;
  showUiOverlay?: boolean;
  onMeditate?: () => void;
}

/**
 * 16:9 PROCEDURAL PIXEL ART UI ASSET:
 * Dark fantasy xianxia aesthetic, traditional Chinese mythology elements,
 * jade and gold accents, mystical balance scale of Dao, glowing blue spiritual Qi shield,
 * clean and sharp pixel details on a dark abyss background.
 */
export const DaoBalanceScaleArt: React.FC<DaoBalanceScaleArtProps> = ({
  interactive = true,
  className = '',
  showUiOverlay = true,
  onMeditate,
}) => {
  // State for interactive Dao balance & Qi shield
  const [balanceTilt, setBalanceTilt] = useState<number>(0); // -15 (Yin) to +15 (Yang)
  const [targetTilt, setTargetTilt] = useState<number>(0);
  const [shieldActive, setShieldActive] = useState<boolean>(true);
  const [shieldMode, setShieldMode] = useState<'HARMONY' | 'FORTIFY' | 'OVERCHARGE'>('HARMONY');
  const [pulsePhase, setPulsePhase] = useState<number>(0);
  const [qiPulseEffect, setQiPulseEffect] = useState<boolean>(false);
  const [yinValue, setYinValue] = useState<number>(50);
  const [yangValue, setYangValue] = useState<number>(50);

  // Subtle breathing animation for Qi shield & particles
  useEffect(() => {
    const timer = setInterval(() => {
      setPulsePhase((prev) => (prev + 1) % 100);
    }, 60);
    return () => clearInterval(timer);
  }, []);

  // Smooth tilt transition
  useEffect(() => {
    if (balanceTilt === targetTilt) return;
    const diff = targetTilt - balanceTilt;
    const step = Math.sign(diff) * Math.min(Math.abs(diff), 0.8);
    const id = requestAnimationFrame(() => {
      setBalanceTilt((prev) => +(prev + step).toFixed(2));
    });
    return () => cancelAnimationFrame(id);
  }, [balanceTilt, targetTilt]);

  const handleShieldClick = () => {
    soundFX.playChime();
    setQiPulseEffect(true);
    setTimeout(() => setQiPulseEffect(false), 450);
    if (onMeditate) onMeditate();
  };

  const handleTiltShift = (delta: number) => {
    soundFX.playHit(false);
    const newTarget = Math.max(-12, Math.min(12, targetTilt + delta));
    setTargetTilt(newTarget);
    setYinValue(50 - Math.round(newTarget * 3.5));
    setYangValue(50 + Math.round(newTarget * 3.5));
  };

  const resetBalance = () => {
    soundFX.playCoin();
    setTargetTilt(0);
    setYinValue(50);
    setYangValue(50);
  };

  // Calculations for scale beam and pans based on tilt angle
  const angleRad = (balanceTilt * Math.PI) / 180;
  const beamLength = 140; // half length
  const leftX = 320 - Math.cos(angleRad) * beamLength;
  const leftY = 140 - Math.sin(angleRad) * beamLength;
  const rightX = 320 + Math.cos(angleRad) * beamLength;
  const rightY = 140 + Math.sin(angleRad) * beamLength;

  // Floating particles
  const particles = [
    { x: 260 + Math.sin(pulsePhase * 0.1) * 8, y: 180 - ((pulsePhase * 1.5) % 80), r: 2, c: '#38BDF8' },
    { x: 380 - Math.cos(pulsePhase * 0.08) * 10, y: 200 - (((pulsePhase + 25) * 1.3) % 90), r: 2.5, c: '#7DD3FC' },
    { x: 320 + Math.sin(pulsePhase * 0.07) * 14, y: 160 - (((pulsePhase + 50) * 1.2) % 70), r: 1.5, c: '#E0F2FE' },
    { x: 230 + Math.cos(pulsePhase * 0.09) * 6, y: 220 - (((pulsePhase + 10) * 1.4) % 85), r: 2, c: '#34D399' },
    { x: 410 + Math.sin(pulsePhase * 0.11) * 7, y: 215 - (((pulsePhase + 65) * 1.2) % 85), r: 2, c: '#FBBF24' },
    { x: 300, y: 110 - ((pulsePhase * 0.8) % 50), r: 2, c: '#BAE6FD' },
    { x: 340, y: 125 - (((pulsePhase + 40) * 0.9) % 55), r: 1.5, c: '#67E8F9' },
  ];

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden border border-[#2D283E] bg-[#06080F] shadow-2xl select-none ${className}`}
      style={{ aspectRatio: '16/9' }}
    >
      {/* Crisp pixel-art SVG canvas (640x360 = true 16:9) */}
      <svg
        viewBox="0 0 640 360"
        className="w-full h-full block"
        style={{
          imageRendering: 'pixelated',
          shapeRendering: 'crispEdges',
        }}
      >
        <defs>
          {/* Spiritual Qi Shield Glow Filter */}
          <filter id="qiGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={qiPulseEffect ? '6' : '3'} result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Deep Dark Xianxia Gradient */}
          <linearGradient id="abyssBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#04060A" />
            <stop offset="35%" stopColor="#080C16" />
            <stop offset="70%" stopColor="#0A1020" />
            <stop offset="100%" stopColor="#04060B" />
          </linearGradient>

          {/* Jade Gradient */}
          <linearGradient id="jadeShine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#024E38" />
          </linearGradient>

          {/* Dao Ancient Gold Gradient */}
          <linearGradient id="daoGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="30%" stopColor="#F59E0B" />
            <stop offset="70%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          {/* Qi Shield Azure Gradient */}
          <radialGradient id="qiShieldGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity={shieldMode === 'OVERCHARGE' ? '0.35' : '0.18'} />
            <stop offset="70%" stopColor="#0284C7" stopOpacity={shieldMode === 'OVERCHARGE' ? '0.25' : '0.12'} />
            <stop offset="95%" stopColor="#0EA5E9" stopOpacity={shieldMode === 'OVERCHARGE' ? '0.5' : '0.28'} />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity={shieldMode === 'OVERCHARGE' ? '0.7' : '0.45'} />
          </radialGradient>
        </defs>

        {/* -------------------------------------------------------------
            1. DARK BACKGROUND & PIXEL STARS (28 MANSIONS CONSTELLATIONS)
        -------------------------------------------------------------- */}
        <rect width="640" height="360" fill="url(#abyssBg)" />

        {/* Pixel Grid Mesh (Background Atmosphere) */}
        <g opacity="0.04" stroke="#38BDF8" strokeWidth="1">
          {Array.from({ length: 32 }).map((_, i) => (
            <line key={`v-${i}`} x1={i * 20} y1="0" x2={i * 20} y2="360" />
          ))}
          {Array.from({ length: 18 }).map((_, i) => (
            <line key={`h-${i}`} x1="0" y1={i * 20} x2="640" y2={i * 20} />
          ))}
        </g>

        {/* Distant Chinese Mountain Peaks (Dark Fantasy Silhouette) */}
        <path
          d="M0,320 L0,250 L40,230 L80,260 L140,210 L190,240 L250,190 L320,230 L400,185 L460,225 L530,195 L590,245 L640,220 L640,320 Z"
          fill="#0B0F1C"
          opacity="0.85"
        />
        <path
          d="M0,330 L0,280 L60,260 L120,290 L180,250 L250,285 L320,260 L390,290 L470,255 L550,290 L640,265 L640,330 Z"
          fill="#0E1424"
        />

        {/* Pixel Constellation Stars */}
        <g fill="#93C5FD" opacity="0.7">
          <rect x="70" y="45" width="2" height="2" />
          <rect x="78" y="52" width="3" height="3" fill="#BAE6FD" />
          <rect x="110" y="48" width="2" height="2" />
          <rect x="135" y="65" width="3" height="3" fill="#FDE68A" />
          <rect x="160" y="55" width="2" height="2" />
          <rect x="520" y="40" width="3" height="3" fill="#BAE6FD" />
          <rect x="545" y="58" width="2" height="2" />
          <rect x="575" y="45" width="3" height="3" fill="#FDE68A" />
          <rect x="600" y="70" width="2" height="2" />
          <rect x="290" y="30" width="2" height="2" />
          <rect x="350" y="32" width="2" height="2" />
        </g>

        {/* Traditional Chinese Cloud Motifs (Xiángyún) Pixel Art */}
        <g fill="#1E293B" opacity="0.5">
          {/* Left Cloud */}
          <rect x="30" y="90" width="40" height="6" />
          <rect x="42" y="84" width="24" height="6" />
          <rect x="50" y="78" width="16" height="6" />
          <rect x="66" y="96" width="18" height="4" />
          {/* Right Cloud */}
          <rect x="570" y="86" width="40" height="6" />
          <rect x="580" y="80" width="22" height="6" />
          <rect x="590" y="74" width="14" height="6" />
          <rect x="560" y="92" width="16" height="4" />
        </g>

        {/* -------------------------------------------------------------
            2. DAO TEMPLE ALTAR BASE (JADE, OBSIDIAN & GOLD ACCENTS)
        -------------------------------------------------------------- */}
        {/* Foundation Steps */}
        <g>
          {/* Bottom Dark Stone Platform */}
          <rect x="170" y="316" width="300" height="18" fill="#0C101A" stroke="#1E293B" strokeWidth="2" />
          {/* Stepped Altar Tier 2 */}
          <rect x="200" y="300" width="240" height="16" fill="#111726" stroke="#2D3A52" strokeWidth="2" />
          {/* Jade Inlay Border on Altar */}
          <rect x="204" y="303" width="232" height="4" fill="url(#jadeShine)" />
          {/* Gold Decorative Corner Brackets on Tier 2 */}
          <rect x="200" y="300" width="12" height="4" fill="url(#daoGold)" />
          <rect x="428" y="300" width="12" height="4" fill="url(#daoGold)" />
          <rect x="200" y="312" width="12" height="4" fill="url(#daoGold)" />
          <rect x="428" y="312" width="12" height="4" fill="url(#daoGold)" />

          {/* Stepped Altar Tier 3 (Pedestal) */}
          <rect x="240" y="278" width="160" height="22" fill="#151D2E" stroke="#334155" strokeWidth="2" />
          {/* Carved Dragon/Qilin Pixel Relief in Pedestal */}
          <rect x="260" y="284" width="120" height="10" fill="#0D1321" />
          <rect x="270" y="287" width="100" height="4" fill="url(#daoGold)" opacity="0.8" />
          {/* Jade Studs */}
          <circle cx="250" cy="289" r="3" fill="#10B981" />
          <circle cx="390" cy="289" r="3" fill="#10B981" />
          {/* Central Yin-Yang Medallion in Stone Altar */}
          <circle cx="320" cy="289" r="6" fill="#0F172A" stroke="url(#daoGold)" strokeWidth="1.5" />
          <circle cx="320" cy="289" r="3" fill="#38BDF8" />
        </g>

        {/* -------------------------------------------------------------
            3. CENTRAL SCALE PILLAR (METEORIC IRON & GOLD DRAGON SPIRAL)
        -------------------------------------------------------------- */}
        {/* Main Column */}
        <rect x="314" y="142" width="12" height="136" fill="#0F172A" stroke="#1E293B" strokeWidth="1.5" />
        {/* Jade Central Core Glowing In Pillar */}
        <rect x="317" y="152" width="6" height="116" fill="url(#jadeShine)" />

        {/* Golden Dragon Coil Around Pillar (Pixel Art Bands) */}
        <g fill="url(#daoGold)">
          <rect x="311" y="254" width="18" height="5" />
          <rect x="313" y="228" width="14" height="5" />
          <rect x="311" y="202" width="18" height="5" />
          <rect x="313" y="176" width="14" height="5" />
          <rect x="310" y="150" width="20" height="6" />
        </g>

        {/* Top Pivot Cap & Trigram Crown */}
        <g>
          {/* Golden Lotus Throne Pivot */}
          <polygon points="320,118 334,136 306,136" fill="url(#daoGold)" stroke="#78350F" strokeWidth="1" />
          <rect x="310" y="136" width="20" height="6" fill="#10B981" stroke="url(#daoGold)" strokeWidth="1" />
          {/* Celestial Pearl on Top (Glows Cyan) */}
          <circle
            cx="320"
            cy="114"
            r={5 + (pulsePhase % 20 < 10 ? 0.8 : 0)}
            fill="#38BDF8"
            stroke="#E0F2FE"
            strokeWidth="1.5"
            filter="url(#qiGlow)"
          />
        </g>

        {/* -------------------------------------------------------------
            4. THE BALANCE BEAM & CHAINS (ANIMATED TILT)
        -------------------------------------------------------------- */}
        {/* Main Beam */}
        <g strokeLinecap="square">
          {/* Beam Shadow/Glow */}
          <line
            x1={leftX}
            y1={leftY}
            x2={rightX}
            y2={rightY}
            stroke="#0369A1"
            strokeWidth="7"
            opacity="0.3"
          />
          {/* Main Gold-Jade Beam */}
          <line
            x1={leftX}
            y1={leftY}
            x2={rightX}
            y2={rightY}
            stroke="url(#daoGold)"
            strokeWidth="5"
          />
          {/* Emerald Jade Center Inset of Beam */}
          <line
            x1={leftX + 20}
            y1={leftY + (rightY - leftY) * (20 / (beamLength * 2))}
            x2={rightX - 20}
            y2={rightY - (rightY - leftY) * (20 / (beamLength * 2))}
            stroke="#10B981"
            strokeWidth="2"
          />

          {/* Central Pivot Jewel */}
          <circle cx="320" cy="140" r="7" fill="#047857" stroke="url(#daoGold)" strokeWidth="2" />
          <circle cx="320" cy="140" r="3" fill="#FDE68A" />

          {/* Left Tip Dragon Head / Hook */}
          <circle cx={leftX} cy={leftY} r="4" fill="url(#daoGold)" stroke="#78350F" strokeWidth="1" />
          {/* Right Tip Dragon Head / Hook */}
          <circle cx={rightX} cy={rightY} r="4" fill="url(#daoGold)" stroke="#78350F" strokeWidth="1" />
        </g>

        {/* Left Pan (YIN / WATER & MOON / SPIRIT STONES) */}
        <g>
          {/* Pixel Chains (3 Suspension Strands) */}
          <g stroke="url(#daoGold)" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.85">
            <line x1={leftX} y1={leftY} x2={leftX - 24} y2={leftY + 65} />
            <line x1={leftX} y1={leftY} x2={leftX} y2={leftY + 65} />
            <line x1={leftX} y1={leftY} x2={leftX + 24} y2={leftY + 65} />
          </g>

          {/* Scale Pan Structure */}
          <ellipse
            cx={leftX}
            cy={leftY + 68}
            rx="30"
            ry="7"
            fill="#091E28"
            stroke="url(#daoGold)"
            strokeWidth="2"
          />
          <path
            d={`M${leftX - 30},${leftY + 68} Q${leftX},${leftY + 84} ${leftX + 30},${leftY + 68} Z`}
            fill="#0F172A"
            stroke="url(#daoGold)"
            strokeWidth="1.5"
          />

          {/* Jade Rim on Pan */}
          <ellipse cx={leftX} cy={leftY + 68} rx="26" ry="5" fill="#064E3B" opacity="0.9" />

          {/* Yin Offering: Glowing Azure Spiritual Flame / Jade Crystals */}
          <g filter="url(#qiGlow)">
            <polygon
              points={`${leftX},${leftY + 48} ${leftX - 9},${leftY + 65} ${leftX + 9},${leftY + 65}`}
              fill="#38BDF8"
              opacity="0.95"
            />
            <polygon
              points={`${leftX - 10},${leftY + 54} ${leftX - 18},${leftY + 66} ${leftX - 3},${leftY + 66}`}
              fill="#34D399"
              opacity="0.85"
            />
            <polygon
              points={`${leftX + 10},${leftY + 55} ${leftX + 3},${leftY + 66} ${leftX + 18},${leftY + 66}`}
              fill="#67E8F9"
              opacity="0.85"
            />
            <circle cx={leftX} cy={leftY + 62} r="4" fill="#E0F2FE" />
          </g>

          {/* Yin Trigram Inscription: ☵ (Kan / Water) */}
          <text
            x={leftX}
            y={leftY + 96}
            fill="#38BDF8"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="middle"
            fontWeight="bold"
            opacity="0.8"
          >
            ☵ 陰 YIN ({yinValue}%)
          </text>
        </g>

        {/* Right Pan (YANG / FIRE & SUN / KARMIC FLAME) */}
        <g>
          {/* Pixel Chains (3 Suspension Strands) */}
          <g stroke="url(#daoGold)" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.85">
            <line x1={rightX} y1={rightY} x2={rightX - 24} y2={rightY + 65} />
            <line x1={rightX} y1={rightY} x2={rightX} y2={rightY + 65} />
            <line x1={rightX} y1={rightY} x2={rightX + 24} y2={rightY + 65} />
          </g>

          {/* Scale Pan Structure */}
          <ellipse
            cx={rightX}
            cy={rightY + 68}
            rx="30"
            ry="7"
            fill="#2A1B0E"
            stroke="url(#daoGold)"
            strokeWidth="2"
          />
          <path
            d={`M${rightX - 30},${rightY + 68} Q${rightX},${rightY + 84} ${rightX + 30},${rightY + 68} Z`}
            fill="#1E120A"
            stroke="url(#daoGold)"
            strokeWidth="1.5"
          />

          {/* Jade/Gold Rim on Pan */}
          <ellipse cx={rightX} cy={rightY + 68} rx="26" ry="5" fill="#78350F" opacity="0.9" />

          {/* Yang Offering: Golden Karmic Embers / Solar Qi */}
          <g filter="url(#qiGlow)">
            <polygon
              points={`${rightX},${rightY + 46} ${rightX - 9},${rightY + 65} ${rightX + 9},${rightY + 65}`}
              fill="#F59E0B"
              opacity="0.95"
            />
            <polygon
              points={`${rightX - 10},${rightY + 54} ${rightX - 18},${rightY + 66} ${rightX - 2},${rightY + 66}`}
              fill="#EF4444"
              opacity="0.8"
            />
            <polygon
              points={`${rightX + 10},${rightY + 52} ${rightX + 2},${rightY + 66} ${rightX + 18},${rightY + 66}`}
              fill="#FBBF24"
              opacity="0.9"
            />
            <circle cx={rightX} cy={rightY + 62} r="4" fill="#FEF08A" />
          </g>

          {/* Yang Trigram Inscription: ☲ (Li / Fire) */}
          <text
            x={rightX}
            y={rightY + 96}
            fill="#F59E0B"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="middle"
            fontWeight="bold"
            opacity="0.8"
          >
            ☲ 陽 YANG ({yangValue}%)
          </text>
        </g>

        {/* -------------------------------------------------------------
            5. GLOWING BLUE SPIRITUAL QI SHIELD (DEFENSIVE FORMATION)
        -------------------------------------------------------------- */}
        {shieldActive && (
          <g onClick={handleShieldClick} className="cursor-pointer" filter="url(#qiGlow)">
            {/* Outer Hexagonal / Dome Qi Barrier Field */}
            <path
              d="M 120 290 L 120 170 L 220 70 L 420 70 L 520 170 L 520 290 Z"
              fill="url(#qiShieldGrad)"
              stroke="#38BDF8"
              strokeWidth={qiPulseEffect ? '3.5' : shieldMode === 'FORTIFY' ? '3' : '2'}
              strokeDasharray={shieldMode === 'OVERCHARGE' ? '8 4' : 'none'}
              opacity={0.88 + Math.sin(pulsePhase * 0.1) * 0.1}
            />

            {/* Inner Sacred Hexagon Lattice Lines */}
            <g stroke="#67E8F9" strokeWidth="1" opacity="0.35" strokeDasharray="4 4">
              <line x1="220" y1="70" x2="420" y2="290" />
              <line x1="420" y1="70" x2="220" y2="290" />
              <line x1="120" y1="170" x2="520" y2="170" />
              <circle cx="320" cy="180" r="95" fill="none" stroke="#38BDF8" strokeWidth="1.2" />
              <circle cx="320" cy="180" r="120" fill="none" stroke="#0284C7" strokeWidth="1" strokeDasharray="6 6" />
            </g>

            {/* Ancient Bagua Runes Encoded in Shield Perimeter */}
            <g fill="#BAE6FD" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold" opacity="0.85">
              <text x="320" y="60">☰ 乾 (QIAN)</text>
              <text x="160" y="115">☴ 巽</text>
              <text x="480" y="115">☱ 兌</text>
              <text x="106" y="235">☵ 坎</text>
              <text x="536" y="235">☲ 離</text>
              <text x="210" y="306">☶ 艮</text>
              <text x="430" y="306">☳ 震</text>
            </g>

            {/* Floating Spiritual Qi Motes / Particles */}
            {particles.map((p, idx) => (
              <circle key={`qi-p-${idx}`} cx={p.x} cy={p.y} r={p.r} fill={p.c} opacity="0.9" />
            ))}
          </g>
        )}

        {/* -------------------------------------------------------------
            6. PIXEL-ART CORNER ACCENTS & GAME UI BORDER
        -------------------------------------------------------------- */}
        {/* Jade & Gold Ornate Frame Corners */}
        <g fill="url(#daoGold)">
          {/* Top-Left Corner */}
          <rect x="8" y="8" width="24" height="4" />
          <rect x="8" y="8" width="4" height="24" />
          <rect x="14" y="14" width="6" height="6" fill="#10B981" />

          {/* Top-Right Corner */}
          <rect x="608" y="8" width="24" height="4" />
          <rect x="628" y="8" width="4" height="24" />
          <rect x="620" y="14" width="6" height="6" fill="#10B981" />

          {/* Bottom-Left Corner */}
          <rect x="8" y="348" width="24" height="4" />
          <rect x="8" y="328" width="4" height="24" />
          <rect x="14" y="340" width="6" height="6" fill="#10B981" />

          {/* Bottom-Right Corner */}
          <rect x="608" y="348" width="24" height="4" />
          <rect x="628" y="328" width="4" height="24" />
          <rect x="620" y="340" width="6" height="6" fill="#10B981" />
        </g>

        {/* Outer Fine Border */}
        <rect x="8" y="8" width="624" height="344" fill="none" stroke="#222C3E" strokeWidth="1" />
      </svg>

      {/* ---------------------------------------------------------------
          7. GAME INTERFACE DESIGN OVERLAYS & CONTROLS (IF ENABLED)
      ---------------------------------------------------------------- */}
      {showUiOverlay && (
        <div className="absolute inset-0 pointer-events-none p-3 sm:p-4 flex flex-col justify-between">
          {/* Header Bar inside Asset */}
          <div className="flex items-start justify-between">
            <div className="pointer-events-auto flex items-center gap-2 bg-[#080D1A]/85 backdrop-blur-sm border border-[#232F46] px-3 py-1.5 rounded-lg shadow-md">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#38BDF8]" />
              <div>
                <div className="text-[11px] font-bold tracking-wider text-slate-100 uppercase font-mono">
                  Весы Дао · Щит Духовной Ци
                </div>
                <div className="text-[9px] text-cyan-400 font-mono">
                  Формация защиты: {shieldMode === 'FORTIFY' ? 'Укрепление (Def +25%)' : shieldMode === 'OVERCHARGE' ? 'Перегрузка Ци (Atk +20%)' : 'Гармония Инь-Ян'}
                </div>
              </div>
            </div>

            {/* Qi Shield Mode Switcher */}
            {interactive && (
              <div className="pointer-events-auto flex items-center gap-1 bg-[#090E1B]/90 border border-[#222E44] p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playCoin();
                    setShieldMode('HARMONY');
                  }}
                  className={`px-2 py-1 text-[10px] rounded font-mono transition-colors ${
                    shieldMode === 'HARMONY'
                      ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Гармоничный баланс Инь и Ян"
                >
                  Гармония
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playCoin();
                    setShieldMode('FORTIFY');
                  }}
                  className={`px-2 py-1 text-[10px] rounded font-mono transition-colors ${
                    shieldMode === 'FORTIFY'
                      ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Плотный защитный купол Ци"
                >
                  Защита
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playCoin();
                    setShieldMode('OVERCHARGE');
                  }}
                  className={`px-2 py-1 text-[10px] rounded font-mono transition-colors ${
                    shieldMode === 'OVERCHARGE'
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Выброс духовной энергии"
                >
                  Перегрузка
                </button>
              </div>
            )}
          </div>

          {/* Footer Interactive Controls Bar */}
          {interactive && (
            <div className="flex items-center justify-between gap-2 pointer-events-auto bg-[#070B16]/90 backdrop-blur-sm border border-[#1E293B] px-3 py-1.5 rounded-lg">
              {/* Manual Balance Tilt Controls */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-mono">Баланс:</span>
                <button
                  type="button"
                  onClick={() => handleTiltShift(-3)}
                  className="px-2 py-0.5 rounded bg-[#131C2E] border border-[#2D3F5E] text-cyan-300 hover:bg-[#1D2942] text-[10px] font-mono"
                  title="Склонить к Инь (Покой / Вода)"
                >
                  ← Инь
                </button>
                <button
                  type="button"
                  onClick={resetBalance}
                  className="px-2 py-0.5 rounded bg-[#131C2E] border border-[#2D3F5E] text-slate-300 hover:bg-[#1D2942] text-[10px] font-mono"
                  title="Сброс в нулевую точку равновесия"
                >
                  ☯ 0
                </button>
                <button
                  type="button"
                  onClick={() => handleTiltShift(3)}
                  className="px-2 py-0.5 rounded bg-[#131C2E] border border-[#2D3F5E] text-amber-300 hover:bg-[#1D2942] text-[10px] font-mono"
                  title="Склонить к Ян (Ярость / Огонь)"
                >
                  Ян →
                </button>
              </div>

              {/* Tap Shield to Pulse */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShieldActive(!shieldActive);
                    soundFX.playHit(!shieldActive);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                    shieldActive
                      ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-900 text-slate-500 border-slate-700'
                  }`}
                >
                  {shieldActive ? 'Щит активен' : 'Щит снят'}
                </button>

                <button
                  type="button"
                  onClick={handleShieldClick}
                  className="px-2.5 py-0.5 rounded bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-[10px] font-semibold shadow-[0_0_10px_#0284c780] active:scale-95 transition-transform"
                >
                  ✨ Пульс Ци
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
