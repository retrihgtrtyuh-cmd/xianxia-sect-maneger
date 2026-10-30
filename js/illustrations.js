/**
 * МОДУЛЬ ПРОЦЕДУРНОЙ ВЕКТОРНОЙ И PIXEL-ART ГРАФИКИ САНЬСЯ (SVG · 16:9 PIXEL ART UI ASSETS)
 * Генерирует:
 * 1. 16:9 Pixel-Art ассет «Мистические Весы Дао и Сияющий Щит Духовной Ци» (нефрит, золото, китайская мифология)
 * 2. Интерактивный главный баннер Святилища и панораму Обители
 * 3. Пиксель-арт иконки Весов Сердца Дао и Личного Щита Ци для карточек учеников и боя
 */
(function () {
  window.SectGame = window.SectGame || {};

  function getT(key, fallback) {
    if (window.SectGame.i18n && typeof window.SectGame.i18n.t === 'function') {
      var res = window.SectGame.i18n.t(key);
      if (res && res !== key) return res;
    }
    return fallback || key;
  }

  /**
   * 16:9 PIXEL-ART UI ASSET (320x180 native pixel grid -> 16:9 aspect ratio)
   * Dark fantasy xianxia aesthetic, traditional Chinese mythology elements,
   * jade and gold accents, mystical balance scale of dao, glowing blue spiritual qi shield.
   */
  function renderDaoScalePixelArtSvg(options) {
    var opts = options || {};
    // tilt: -1 (Yin / Abyss), 0 (Balance), +1 (Yang / Light) or continuous -100..+100
    var rawTilt = typeof opts.tilt === 'number' ? opts.tilt : 0;
    var tiltStep = rawTilt < -15 ? -1 : rawTilt > 15 ? 1 : rawTilt < 0 ? -1 : rawTilt > 0 ? 1 : 0;
    var shieldMode = opts.shieldMode || 'HARMONY'; // 'HARMONY' | 'BASTION' | 'SURGE'
    var pulseActive = Boolean(opts.pulseActive);

    // Pixel offset for left and right pans based on tilt (-1, 0, +1)
    // When tilted towards Yin (-1), left pan is heavier (lower: +8px), right pan is higher (-8px)
    // When tilted towards Yang (+1), right pan is heavier (lower: +8px), left pan is higher (-8px)
    var leftOffsetY = tiltStep === -1 ? 8 : tiltStep === 1 ? -8 : 0;
    var rightOffsetY = tiltStep === 1 ? 8 : tiltStep === -1 ? -8 : 0;

    var leftBeamY = 66 + leftOffsetY;
    var rightBeamY = 66 + rightOffsetY;

    var shieldMainColor =
      shieldMode === 'SURGE'
        ? '#7DD3FC'
        : shieldMode === 'BASTION'
        ? '#38BDF8'
        : '#0EA5E9';
    var shieldCoreOpacity = pulseActive
      ? '0.42'
      : shieldMode === 'SURGE'
      ? '0.28'
      : shieldMode === 'BASTION'
      ? '0.24'
      : '0.18';

    // Stepped pixel beam segments (from x=96 to x=224, center at x=160, y=66)
    var beamRects = '';
    for (var bx = -64; bx <= 60; bx += 4) {
      var progress = bx / 64; // -1 .. +1
      var segY = Math.round(65 + progress * rightOffsetY);
      var isJadeSegment = Math.abs(bx) >= 16 && Math.abs(bx) <= 44;
      // Gold outer pixel row + Jade inner pixel row
      beamRects +=
        '<rect x="' + (160 + bx) + '" y="' + (segY - 1) + '" width="4" height="4" fill="#78350F" />' +
        '<rect x="' + (160 + bx) + '" y="' + segY + '" width="4" height="2" fill="' + (isJadeSegment ? '#10B981' : '#F59E0B') + '" />' +
        '<rect x="' + (160 + bx) + '" y="' + segY + '" width="2" height="1" fill="' + (isJadeSegment ? '#34D399' : '#FDE68A') + '" />';
    }

    var leftPanX = 96;
    var leftPanTopY = leftBeamY;
    var leftPanBowlY = leftPanTopY + 34;

    var rightPanX = 224;
    var rightPanTopY = rightBeamY;
    var rightPanBowlY = rightPanTopY + 34;

    return (
      '<svg viewBox="0 0 320 180" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" shape-rendering="crispEdges" style="image-rendering:pixelated;display:block;background:#05070E" aria-label="Mystical Balance Scale of Dao and Spiritual Qi Shield">' +
        '<defs>' +
          '<linearGradient id="pxAbyssSky" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#04060C" />' +
            '<stop offset="45%" stop-color="#080E1C" />' +
            '<stop offset="80%" stop-color="#0C162B" />' +
            '<stop offset="100%" stop-color="#050811" />' +
          '</linearGradient>' +
          '<radialGradient id="pxQiShieldAura" cx="50%" cy="52%" r="46%">' +
            '<stop offset="0%" stop-color="#38BDF8" stop-opacity="' + shieldCoreOpacity + '" />' +
            '<stop offset="65%" stop-color="#0284C7" stop-opacity="0.16" />' +
            '<stop offset="92%" stop-color="#38BDF8" stop-opacity="0.38" />' +
            '<stop offset="100%" stop-color="#000000" stop-opacity="0" />' +
          '</radialGradient>' +
        '</defs>' +

        /* 1. DARK BACKGROUND & PIXEL GRID */
        '<rect width="320" height="180" fill="url(#pxAbyssSky)" />' +

        /* Subtle Dark Fantasy Pixel Grid */
        '<g fill="#111C30" opacity="0.55">' +
          '<rect x="0" y="20" width="320" height="1" />' +
          '<rect x="0" y="40" width="320" height="1" />' +
          '<rect x="0" y="60" width="320" height="1" />' +
          '<rect x="0" y="80" width="320" height="1" />' +
          '<rect x="0" y="100" width="320" height="1" />' +
          '<rect x="0" y="120" width="320" height="1" />' +
          '<rect x="0" y="140" width="320" height="1" />' +
          '<rect x="0" y="160" width="320" height="1" />' +
        '</g>' +

        /* 28 Lunar Mansions Pixel Stars & Constellations */
        '<g>' +
          '<rect x="24" y="18" width="2" height="2" fill="#7DD3FC" />' +
          '<rect x="38" y="26" width="2" height="2" fill="#E0F2FE" />' +
          '<rect x="52" y="16" width="2" height="2" fill="#FDE68A" />' +
          '<rect x="68" y="28" width="1" height="1" fill="#93C5FD" />' +
          '<rect x="252" y="24" width="2" height="2" fill="#7DD3FC" />' +
          '<rect x="268" y="15" width="2" height="2" fill="#FDE68A" />' +
          '<rect x="284" y="27" width="2" height="2" fill="#E0F2FE" />' +
          '<rect x="296" y="19" width="1" height="1" fill="#38BDF8" />' +
          /* Constellation links */
          '<rect x="26" y="20" width="12" height="1" fill="#1E3A5F" />' +
          '<rect x="40" y="21" width="12" height="1" fill="#1E3A5F" />' +
          '<rect x="254" y="20" width="14" height="1" fill="#1E3A5F" />' +
          '<rect x="270" y="21" width="14" height="1" fill="#1E3A5F" />' +
        '</g>' +

        /* Traditional Chinese Pixel Cloud Scrolls (Xiangyun) */
        '<g fill="#162238">' +
          /* Left Cloud */
          '<rect x="16" y="44" width="28" height="4" />' +
          '<rect x="22" y="40" width="18" height="4" />' +
          '<rect x="26" y="36" width="10" height="4" />' +
          '<rect x="18" y="48" width="14" height="2" fill="#1E3A5F" />' +
          /* Right Cloud */
          '<rect x="276" y="44" width="28" height="4" />' +
          '<rect x="280" y="40" width="18" height="4" />' +
          '<rect x="284" y="36" width="10" height="4" />' +
          '<rect x="288" y="48" width="14" height="2" fill="#1E3A5F" />' +
        '</g>' +

        /* Stepped Pixel Karst Mountains in Background */
        '<g fill="#080D18">' +
          '<rect x="8" y="130" width="44" height="36" />' +
          '<rect x="14" y="116" width="32" height="14" />' +
          '<rect x="20" y="104" width="20" height="12" />' +
          '<rect x="26" y="96" width="8" height="8" />' +
          /* Left Distant Pixel Pagoda Roof */
          '<rect x="22" y="92" width="16" height="2" fill="#1E293B" />' +
          '<rect x="26" y="88" width="8" height="4" fill="#0F172A" />' +
          '<rect x="29" y="85" width="2" height="3" fill="#D97706" />' +

          '<rect x="268" y="130" width="44" height="36" />' +
          '<rect x="274" y="116" width="32" height="14" />' +
          '<rect x="280" y="104" width="20" height="12" />' +
          '<rect x="286" y="96" width="8" height="8" />' +
          /* Right Distant Pixel Pagoda Roof */
          '<rect x="282" y="92" width="16" height="2" fill="#1E293B" />' +
          '<rect x="286" y="88" width="8" height="4" fill="#0F172A" />' +
          '<rect x="289" y="85" width="2" height="3" fill="#10B981" />' +
        '</g>' +

        /* 2. GLOWING BLUE SPIRITUAL QI SHIELD (OCTAGONAL PIXEL BARRIER) */
        '<circle cx="160" cy="94" r="78" fill="url(#pxQiShieldAura)" />' +

        /* Outer Pixel Shield Dome Perimeter (Stepped Octagon in Glowing Blue/Cyan) */
        '<g>' +
          /* Top Horizontal Shield Bar */
          '<rect x="112" y="20" width="96" height="3" fill="' + shieldMainColor + '" />' +
          '<rect x="116" y="18" width="88" height="2" fill="#E0F2FE" opacity="0.85" />' +
          /* Stepped Top-Left Diagonal of Qi Shield */
          '<rect x="104" y="23" width="8" height="3" fill="' + shieldMainColor + '" />' +
          '<rect x="96" y="26" width="8" height="4" fill="' + shieldMainColor + '" />' +
          '<rect x="88" y="30" width="8" height="4" fill="' + shieldMainColor + '" />' +
          '<rect x="80" y="34" width="8" height="6" fill="' + shieldMainColor + '" />' +
          '<rect x="74" y="40" width="6" height="6" fill="' + shieldMainColor + '" />' +
          '<rect x="68" y="46" width="6" height="8" fill="' + shieldMainColor + '" />' +
          '<rect x="64" y="54" width="4" height="10" fill="' + shieldMainColor + '" />' +
          /* Left Vertical Shield Wall */
          '<rect x="60" y="64" width="4" height="82" fill="' + shieldMainColor + '" />' +
          '<rect x="62" y="68" width="2" height="74" fill="#E0F2FE" opacity="0.8" />' +

          /* Stepped Top-Right Diagonal of Qi Shield */
          '<rect x="208" y="23" width="8" height="3" fill="' + shieldMainColor + '" />' +
          '<rect x="216" y="26" width="8" height="4" fill="' + shieldMainColor + '" />' +
          '<rect x="224" y="30" width="8" height="4" fill="' + shieldMainColor + '" />' +
          '<rect x="232" y="34" width="8" height="6" fill="' + shieldMainColor + '" />' +
          '<rect x="240" y="40" width="6" height="6" fill="' + shieldMainColor + '" />' +
          '<rect x="246" y="46" width="6" height="8" fill="' + shieldMainColor + '" />' +
          '<rect x="252" y="54" width="4" height="10" fill="' + shieldMainColor + '" />' +
          /* Right Vertical Shield Wall */
          '<rect x="256" y="64" width="4" height="82" fill="' + shieldMainColor + '" />' +
          '<rect x="256" y="68" width="2" height="74" fill="#E0F2FE" opacity="0.8" />' +

          /* Inner Hexagonal Lattice Lines (Pixel Dithered Cyan) */
          '<rect x="72" y="66" width="176" height="1" fill="#38BDF8" opacity="0.35" />' +
          '<rect x="68" y="106" width="184" height="1" fill="#38BDF8" opacity="0.3" />' +
          '<rect x="116" y="24" width="2" height="122" fill="#38BDF8" opacity="0.18" />' +
          '<rect x="202" y="24" width="2" height="122" fill="#38BDF8" opacity="0.18" />' +

          /* Second Inner Ring of Spiritual Qi Shield */
          '<rect x="120" y="26" width="80" height="1" fill="#7DD3FC" opacity="0.6" />' +
          '<rect x="68" y="70" width="1" height="72" fill="#7DD3FC" opacity="0.6" />' +
          '<rect x="251" y="70" width="1" height="72" fill="#7DD3FC" opacity="0.6" />' +
        '</g>' +

        /* Floating Spiritual Qi Motes / Pixel Sparks Inside Shield */
        '<g>' +
          '<rect x="76" y="84" width="3" height="3" fill="#E0F2FE" />' +
          '<rect x="75" y="85" width="5" height="1" fill="#38BDF8" />' +
          '<rect x="128" y="42" width="2" height="2" fill="#7DD3FC" />' +
          '<rect x="190" y="40" width="2" height="2" fill="#7DD3FC" />' +
          '<rect x="240" y="80" width="3" height="3" fill="#E0F2FE" />' +
          '<rect x="239" y="81" width="5" height="1" fill="#38BDF8" />' +
          '<rect x="136" y="122" width="2" height="2" fill="#34D399" />' +
          '<rect x="182" y="120" width="2" height="2" fill="#FBBF24" />' +
          '<rect x="150" y="34" width="2" height="2" fill="#E0F2FE" />' +
          '<rect x="168" y="36" width="2" height="2" fill="#38BDF8" />' +
        '</g>' +

        /* Bagua Trigram Runes Around Spiritual Shield */
        '<g fill="#BAE6FD" font-family="monospace" font-size="8" font-weight="bold" text-anchor="middle">' +
          '<text x="160" y="15">☰ 乾 · DAO SHIELD · 坤 ☷</text>' +
          '<text x="50" y="62">☵</text>' +
          '<text x="270" y="62">☲</text>' +
          '<text x="48" y="108">☴</text>' +
          '<text x="272" y="108">☳</text>' +
        '</g>' +

        /* 3. JADE & GOLD TEMPLE ALTAR PEDESTAL */
        '<g>' +
          /* Base Platform Step 1 (Obsidian & Dark Gold) */
          '<rect x="64" y="156" width="192" height="10" fill="#0B111E" />' +
          '<rect x="64" y="156" width="192" height="2" fill="#B45309" />' +
          '<rect x="68" y="158" width="184" height="2" fill="#059669" />' +
          /* Gold Corner Studs */
          '<rect x="64" y="156" width="8" height="4" fill="#F59E0B" />' +
          '<rect x="248" y="156" width="8" height="4" fill="#F59E0B" />' +

          /* Altar Platform Step 2 (Imperial Jade & Gold Inlay) */
          '<rect x="92" y="146" width="136" height="10" fill="#0F172A" />' +
          '<rect x="92" y="146" width="136" height="2" fill="#F59E0B" />' +
          '<rect x="96" y="148" width="128" height="4" fill="#047857" />' +
          '<rect x="100" y="149" width="120" height="2" fill="#10B981" />' +
          '<rect x="92" y="146" width="6" height="6" fill="#FBBF24" />' +
          '<rect x="222" y="146" width="6" height="6" fill="#FBBF24" />' +

          /* Altar Pedestal Step 3 (Central Throne of Equilibrium) */
          '<rect x="124" y="134" width="72" height="12" fill="#111C2D" />' +
          '<rect x="124" y="134" width="72" height="2" fill="#FDE68A" />' +
          '<rect x="128" y="138" width="64" height="4" fill="#065F46" />' +
          /* Jade Gems on Pedestal */
          '<rect x="132" y="138" width="4" height="4" fill="#34D399" />' +
          '<rect x="184" y="138" width="4" height="4" fill="#34D399" />' +
        '</g>' +

        /* 4. CENTRAL PILLAR OF THE DAO SCALE (JADE CORE & GOLDEN DRAGON COILS) */
        '<g>' +
          /* Outer Dark Gold / Iron Pillar */
          '<rect x="154" y="54" width="12" height="80" fill="#1E293B" />' +
          '<rect x="155" y="54" width="10" height="80" fill="#0F172A" />' +
          /* Glowing Emerald Jade Core Channel */
          '<rect x="158" y="56" width="4" height="76" fill="#059669" />' +
          '<rect x="159" y="58" width="2" height="72" fill="#34D399" />' +

          /* Golden Dragon Rings Coiling Pillar */
          '<rect x="152" y="122" width="16" height="4" fill="#D97706" />' +
          '<rect x="153" y="122" width="14" height="2" fill="#FDE68A" />' +

          '<rect x="153" y="106" width="14" height="4" fill="#D97706" />' +
          '<rect x="154" y="106" width="12" height="2" fill="#FBBF24" />' +

          '<rect x="152" y="90" width="16" height="4" fill="#D97706" />' +
          '<rect x="153" y="90" width="14" height="2" fill="#FDE68A" />' +

          '<rect x="153" y="74" width="14" height="4" fill="#D97706" />' +
          '<rect x="154" y="74" width="12" height="2" fill="#FBBF24" />' +

          /* Crown Finial of the Pillar (Jade Lotus + Celestial Qi Pearl) */
          '<rect x="148" y="50" width="24" height="4" fill="#047857" />' +
          '<rect x="150" y="48" width="20" height="2" fill="#34D399" />' +
          '<rect x="152" y="44" width="16" height="4" fill="#F59E0B" />' +
          '<rect x="155" y="40" width="10" height="4" fill="#FDE68A" />' +
          /* Glowing Blue Qi Pearl at Apex */
          '<rect x="157" y="32" width="6" height="6" fill="#0284C7" />' +
          '<rect x="158" y="33" width="4" height="4" fill="#38BDF8" />' +
          '<rect x="159" y="34" width="2" height="2" fill="#E0F2FE" />' +
        '</g>' +

        /* 5. MYSTICAL BALANCE BEAM & JADE-GOLD PANS */
        '<g>' +
          beamRects +

          /* Center Fulcrum Medallion (Jade & Gold Seal) */
          '<rect x="153" y="60" width="14" height="12" fill="#D97706" />' +
          '<rect x="155" y="62" width="10" height="8" fill="#065F46" />' +
          '<rect x="157" y="64" width="6" height="4" fill="#34D399" />' +
          '<rect x="159" y="65" width="2" height="2" fill="#FDE68A" />' +

          /* Left Dragon-Head Beam Tip */
          '<rect x="92" y="' + (leftBeamY - 3) + '" width="8" height="6" fill="#F59E0B" />' +
          '<rect x="94" y="' + (leftBeamY - 2) + '" width="4" height="2" fill="#FDE68A" />' +
          '<rect x="95" y="' + leftBeamY + '" width="2" height="2" fill="#10B981" />' +

          /* Right Dragon-Head Beam Tip */
          '<rect x="220" y="' + (rightBeamY - 3) + '" width="8" height="6" fill="#F59E0B" />' +
          '<rect x="222" y="' + (rightBeamY - 2) + '" width="4" height="2" fill="#FDE68A" />' +
          '<rect x="223" y="' + rightBeamY + '" width="2" height="2" fill="#10B981" />' +
        '</g>' +

        /* 6. LEFT PAN: YIN / HEART DEMON / ABYSS FLAME */
        '<g>' +
          /* Pixel Chains (Left, Center, Right Strands) */
          '<rect x="' + (leftPanX - 12) + '" y="' + (leftPanTopY + 4) + '" width="2" height="30" fill="#B45309" />' +
          '<rect x="' + (leftPanX - 1) + '" y="' + (leftPanTopY + 3) + '" width="2" height="31" fill="#F59E0B" />' +
          '<rect x="' + (leftPanX + 10) + '" y="' + (leftPanTopY + 4) + '" width="2" height="30" fill="#B45309" />' +

          /* Pan Rim (Gold & Jade) */
          '<rect x="' + (leftPanX - 22) + '" y="' + leftPanBowlY + '" width="44" height="3" fill="#F59E0B" />' +
          '<rect x="' + (leftPanX - 20) + '" y="' + (leftPanBowlY + 1) + '" width="40" height="1" fill="#FDE68A" />' +
          '<rect x="' + (leftPanX - 18) + '" y="' + (leftPanBowlY + 3) + '" width="36" height="4" fill="#065F46" />' +
          '<rect x="' + (leftPanX - 14) + '" y="' + (leftPanBowlY + 7) + '" width="28" height="3" fill="#78350F" />' +
          '<rect x="' + (leftPanX - 8) + '" y="' + (leftPanBowlY + 10) + '" width="16" height="2" fill="#F59E0B" />' +

          /* Mystical Yin / Crimson-Azure Spirit Flame Inside Left Pan */
          '<rect x="' + (leftPanX - 10) + '" y="' + (leftPanBowlY - 6) + '" width="20" height="6" fill="#881337" />' +
          '<rect x="' + (leftPanX - 8) + '" y="' + (leftPanBowlY - 12) + '" width="16" height="6" fill="#E11D48" />' +
          '<rect x="' + (leftPanX - 5) + '" y="' + (leftPanBowlY - 18) + '" width="10" height="6" fill="#F43F5E" />' +
          '<rect x="' + (leftPanX - 3) + '" y="' + (leftPanBowlY - 22) + '" width="6" height="4" fill="#C084FC" />' +
          '<rect x="' + (leftPanX - 1) + '" y="' + (leftPanBowlY - 25) + '" width="2" height="3" fill="#F5D0FE" />' +
          '<rect x="' + (leftPanX - 4) + '" y="' + (leftPanBowlY - 10) + '" width="8" height="6" fill="#FB7185" />' +
        '</g>' +

        /* 7. RIGHT PAN: YANG / LIGHT OF HEAVENS / JADE-GOLD LOTUS */
        '<g>' +
          /* Pixel Chains (Left, Center, Right Strands) */
          '<rect x="' + (rightPanX - 12) + '" y="' + (rightPanTopY + 4) + '" width="2" height="30" fill="#B45309" />' +
          '<rect x="' + (rightPanX - 1) + '" y="' + (rightPanTopY + 3) + '" width="2" height="31" fill="#F59E0B" />' +
          '<rect x="' + (rightPanX + 10) + '" y="' + (rightPanTopY + 4) + '" width="2" height="30" fill="#B45309" />' +

          /* Pan Rim (Gold & Jade) */
          '<rect x="' + (rightPanX - 22) + '" y="' + rightPanBowlY + '" width="44" height="3" fill="#F59E0B" />' +
          '<rect x="' + (rightPanX - 20) + '" y="' + (rightPanBowlY + 1) + '" width="40" height="1" fill="#FDE68A" />' +
          '<rect x="' + (rightPanX - 18) + '" y="' + (rightPanBowlY + 3) + '" width="36" height="4" fill="#065F46" />' +
          '<rect x="' + (rightPanX - 14) + '" y="' + (rightPanBowlY + 7) + '" width="28" height="3" fill="#78350F" />' +
          '<rect x="' + (rightPanX - 8) + '" y="' + (rightPanBowlY + 10) + '" width="16" height="2" fill="#F59E0B" />' +

          /* Mystical Yang / Golden-Jade Immortal Lotus Flame Inside Right Pan */
          '<rect x="' + (rightPanX - 12) + '" y="' + (rightPanBowlY - 5) + '" width="24" height="5" fill="#047857" />' +
          '<rect x="' + (rightPanX - 9) + '" y="' + (rightPanBowlY - 11) + '" width="18" height="6" fill="#10B981" />' +
          '<rect x="' + (rightPanX - 6) + '" y="' + (rightPanBowlY - 17) + '" width="12" height="6" fill="#F59E0B" />' +
          '<rect x="' + (rightPanX - 4) + '" y="' + (rightPanBowlY - 22) + '" width="8" height="5" fill="#FBBF24" />' +
          '<rect x="' + (rightPanX - 2) + '" y="' + (rightPanBowlY - 26) + '" width="4" height="4" fill="#FEF08A" />' +
          '<rect x="' + (rightPanX - 3) + '" y="' + (rightPanBowlY - 11) + '" width="6" height="6" fill="#FDE68A" />' +
        '</g>' +

        /* 8. JADE & GOLD ORNATE PIXEL GAME UI FRAME CORNERS */
        '<g>' +
          /* Outer Pixel Border */
          '<rect x="2" y="2" width="316" height="2" fill="#92400E" />' +
          '<rect x="2" y="176" width="316" height="2" fill="#92400E" />' +
          '<rect x="2" y="2" width="2" height="176" fill="#92400E" />' +
          '<rect x="316" y="2" width="2" height="176" fill="#92400E" />' +

          /* Top-Left Jade & Gold Bracket */
          '<rect x="4" y="4" width="22" height="3" fill="#F59E0B" />' +
          '<rect x="4" y="4" width="3" height="22" fill="#F59E0B" />' +
          '<rect x="9" y="9" width="6" height="6" fill="#10B981" />' +
          '<rect x="11" y="11" width="2" height="2" fill="#A7F3D0" />' +

          /* Top-Right Jade & Gold Bracket */
          '<rect x="294" y="4" width="22" height="3" fill="#F59E0B" />' +
          '<rect x="313" y="4" width="3" height="22" fill="#F59E0B" />' +
          '<rect x="305" y="9" width="6" height="6" fill="#10B981" />' +
          '<rect x="307" y="11" width="2" height="2" fill="#A7F3D0" />' +

          /* Bottom-Left Jade & Gold Bracket */
          '<rect x="4" y="173" width="22" height="3" fill="#F59E0B" />' +
          '<rect x="4" y="154" width="3" height="22" fill="#F59E0B" />' +
          '<rect x="9" y="165" width="6" height="6" fill="#10B981" />' +
          '<rect x="11" y="167" width="2" height="2" fill="#A7F3D0" />' +

          /* Bottom-Right Jade & Gold Bracket */
          '<rect x="294" y="173" width="22" height="3" fill="#F59E0B" />' +
          '<rect x="313" y="154" width="3" height="22" fill="#F59E0B" />' +
          '<rect x="305" y="165" width="6" height="6" fill="#10B981" />' +
          '<rect x="307" y="167" width="2" height="2" fill="#A7F3D0" />' +
        '</g>' +
      '</svg>'
    );
  }

  /**
   * Компактная пиксель-арт иконка Весов Сердца Дао (28x18) для карточек учеников
   */
  function renderMiniDaoScalePixelIcon(daoHeart) {
    var val = typeof daoHeart === 'number' && !isNaN(daoHeart) ? daoHeart : 0;
    var leftY = val < -19 ? 8 : val > 19 ? 4 : 6;
    var rightY = val > 19 ? 8 : val < -19 ? 4 : 6;
    return (
      '<svg width="26" height="16" viewBox="0 0 26 16" shape-rendering="crispEdges" style="image-rendering:pixelated;vertical-align:middle;flex-shrink:0" aria-hidden="true">' +
        '<rect x="8" y="14" width="10" height="2" fill="#10B981" />' +
        '<rect x="12" y="3" width="2" height="11" fill="#F59E0B" />' +
        '<rect x="12" y="1" width="2" height="2" fill="#38BDF8" />' +
        '<line x1="4" y1="' + leftY + '" x2="22" y2="' + rightY + '" stroke="#FBBF24" stroke-width="2" />' +
        '<rect x="2" y="' + (leftY + 4) + '" width="5" height="2" fill="#F43F5E" />' +
        '<rect x="19" y="' + (rightY + 4) + '" width="5" height="2" fill="#34D399" />' +
      '</svg>'
    );
  }

  /**
   * Компактная пиксель-арт иконка Сияющего Щита Духовной Ци (16x16)
   */
  function renderMiniQiShieldPixelIcon(active) {
    var col = active ? '#38BDF8' : '#475569';
    var core = active ? '#E0F2FE' : '#64748B';
    return (
      '<svg width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="image-rendering:pixelated;vertical-align:middle;flex-shrink:0" aria-hidden="true">' +
        '<rect x="4" y="1" width="8" height="2" fill="' + col + '" />' +
        '<rect x="2" y="3" width="2" height="6" fill="' + col + '" />' +
        '<rect x="12" y="3" width="2" height="6" fill="' + col + '" />' +
        '<rect x="4" y="9" width="2" height="3" fill="' + col + '" />' +
        '<rect x="10" y="9" width="2" height="3" fill="' + col + '" />' +
        '<rect x="6" y="12" width="4" height="2" fill="' + col + '" />' +
        '<rect x="6" y="5" width="4" height="4" fill="' + core + '" />' +
      '</svg>'
    );
  }

  /**
   * Классическая панорама Обители (Уровень 1 / 2)
   */
  function renderSectAbodePanoramaSvg(level) {
    var isLv2 = level === 2;
    var stop1 = isLv2 ? '#0B1924' : '#0B0E14';
    var stop2 = isLv2 ? '#132A38' : '#141B26';
    var orbColor = isLv2 ? '#34D399' : '#D97706';
    var orbColor2 = isLv2 ? '#059669' : '#92400E';
    var strokeAccent = isLv2 ? '#34D399' : '#B48A4E';

    return (
      '<svg viewBox="0 0 800 220" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="' + stop1 + '" />' +
            '<stop offset="60%" stop-color="' + stop2 + '" />' +
            '<stop offset="100%" stop-color="#0D1118" />' +
          '</linearGradient>' +
          '<radialGradient id="qiOrb" cx="50%" cy="45%" r="45%">' +
            '<stop offset="0%" stop-color="' + orbColor + '" stop-opacity="0.28" />' +
            '<stop offset="60%" stop-color="' + orbColor2 + '" stop-opacity="0.08" />' +
            '<stop offset="100%" stop-color="#000000" stop-opacity="0" />' +
          '</radialGradient>' +
        '</defs>' +
        '<rect width="800" height="220" fill="url(#skyGrad)" />' +
        '<circle cx="400" cy="105" r="150" fill="url(#qiOrb)" />' +
        '<g stroke="' + orbColor + '" stroke-opacity="0.22" fill="none">' +
          '<circle cx="400" cy="110" r="75" stroke-width="1.5" stroke-dasharray="6 4" />' +
          '<circle cx="400" cy="110" r="55" stroke-width="1" />' +
          (isLv2 ? '<circle cx="400" cy="110" r="95" stroke-width="1" stroke-dasharray="3 6" />' : '') +
        '</g>' +
        '<path d="M0,0 L800,0 L800,70 L730,35 L670,80 L590,25 L520,60 L450,18 L350,18 L280,65 L210,25 L130,75 L60,35 L0,70 Z" fill="#090C11" opacity="0.85" />' +
        '<g transform="translate(330, 42)">' +
          (isLv2
            ? '<path d="M25,28 L70,4 L115,28 L102,32 L38,32 Z" fill="#1E293B" stroke="#34D399" stroke-width="1" stroke-opacity="0.5" />' +
              '<rect x="46" y="32" width="48" height="20" fill="#131C29" stroke="#334155" stroke-width="1" />'
            : '') +
          '<path d="M5,66 L70,38 L135,66 L122,72 L18,72 Z" fill="#19212E" stroke="' + strokeAccent + '" stroke-width="1.2" stroke-opacity="0.6" />' +
          '<rect x="26" y="72" width="88" height="52" fill="#0F151F" stroke="#283244" stroke-width="1" />' +
          '<line x1="44" y1="72" x2="44" y2="124" stroke="#B48A4E" stroke-opacity="0.4" stroke-width="2" />' +
          '<line x1="96" y1="72" x2="96" y2="124" stroke="#B48A4E" stroke-opacity="0.4" stroke-width="2" />' +
          '<circle cx="70" cy="98" r="9" fill="' + (isLv2 ? '#10B981' : '#D97706') + '" opacity="0.75" />' +
          '<path d="M16,124 L124,124 L142,165 L-2,165 Z" fill="#151C28" stroke="#263142" stroke-width="1" />' +
        '</g>' +
        '<path d="M0,220 L0,155 L140,175 L250,205 L550,205 L660,175 L800,155 L800,220 Z" fill="#080B10" />' +
      '</svg>'
    );
  }

  /**
   * Главный интерактивный блок витрины в подразделе «Обитель и Чайный дом» (SANCTUARY).
   * По умолчанию сразу показывает 16:9 Pixel-Art ассет Весов Дао и Щита Духовной Ци с кнопками управления!
   */
  function renderSectAbodeBanner(level, customOpts) {
    var isLv2 = level === 2;
    var opts = customOpts || {};
    var viewMode = opts.viewMode || 'DAO_SCALE'; // 'DAO_SCALE' | 'ABODE'
    var tilt = typeof opts.tilt === 'number' ? opts.tilt : 0;
    var shieldMode = opts.shieldMode || 'HARMONY';
    var pulseActive = Boolean(opts.pulseActive);

    return (
      '<div class="dao-hero-showcase">' +
        /* Верхняя панель переключения графики и интерактивных кнопок */
        '<div class="dao-hero-toolbar">' +
          '<div class="row-wrap">' +
            '<button class="btn-tab ' + (viewMode === 'DAO_SCALE' ? 'active' : '') + '" style="padding:3px 10px;min-height:24px;font-size:11px" data-action="set-banner-view" data-view="DAO_SCALE">' +
              getT('bannerTabDaoScale', '☯ Весы Дао и Щит Ци (Pixel Art)') +
            '</button>' +
            '<button class="btn-tab ' + (viewMode === 'ABODE' ? 'active' : '') + '" style="padding:3px 10px;min-height:24px;font-size:11px" data-action="set-banner-view" data-view="ABODE">' +
              getT('bannerTabAbodeView', '🏯 Панорама Обители') +
            '</button>' +
          '</div>' +
          '<div class="row-wrap">' +
            '<button class="btn btn-sm" style="padding:2px 8px;min-height:24px;border-color:rgba(244,63,94,0.45);color:#fda4af" data-action="dao-tilt" data-tilt="-45">' +
              getT('daoTiltAbyssBtn', '☵ К Тьме') +
            '</button>' +
            '<button class="btn btn-sm" style="padding:2px 8px;min-height:24px;border-color:rgba(148,163,184,0.4);color:#e2e8f0" data-action="dao-tilt" data-tilt="0">' +
              getT('daoTiltBalanceBtn', '☯ Покой') +
            '</button>' +
            '<button class="btn btn-sm" style="padding:2px 8px;min-height:24px;border-color:rgba(251,191,36,0.45);color:#fde68a" data-action="dao-tilt" data-tilt="45">' +
              getT('daoTiltLightBtn', '☲ К Свету') +
            '</button>' +
            '<button class="btn btn-sm" style="padding:2px 8px;min-height:24px;background:rgba(14,165,233,0.18);border-color:rgba(56,189,248,0.55);color:#7dd3fc" data-action="dao-pulse-qi">' +
              getT('daoPulseQiBtn', '✦ Импульс Щита Ци') +
            '</button>' +
            '<button class="btn btn-sm btn-amber" style="padding:2px 9px;min-height:24px" data-action="open-dao-modal">' +
              getT('daoExpand16x9Btn', '🔍 16:9 Полный вид') +
            '</button>' +
          '</div>' +
        '</div>' +

        /* Сам графический холст (Pixel Art Весы Дао + Щит Ци ИЛИ Панорама Обители) */
        '<div class="dao-hero-canvas" data-action="open-dao-modal" title="' + getT('daoExpand16x9Btn', 'Открыть 16:9 Pixel Art') + '">' +
          (viewMode === 'ABODE'
            ? renderSectAbodePanoramaSvg(level)
            : renderDaoScalePixelArtSvg({
                tilt: tilt,
                shieldMode: shieldMode,
                pulseActive: pulseActive,
              })) +
          '<div class="banner-overlay"></div>' +
          '<div class="banner-caption">' +
            '<span class="font-semibold" style="color:#f8fafc;text-shadow:0 1px 4px #000">' +
              (viewMode === 'ABODE'
                ? getT(
                    isLv2 ? 'bannerAbodeLv2Title' : 'bannerAbodeLv1Title',
                    isLv2
                      ? 'Обитель II ступени: Твердыня Глубин'
                      : 'Обитель I ступени: Забытая Нора'
                  )
                : getT('daoPixelAssetTitle', 'МИСТИЧЕСКИЕ ВЕСЫ ДАО · ЩИТ ДУХОВНОЙ ЦИ')) +
            '</span>' +
            '<span class="text-cyan font-mono" style="font-size:11px;text-shadow:0 1px 4px #000">' +
              (viewMode === 'ABODE'
                ? getT(
                    isLv2 ? 'bannerAbodeLv2Sub' : 'bannerAbodeLv1Sub',
                    isLv2
                      ? 'Отдых +10 здоровья/тик · Опыт +35%'
                      : 'Отдых +4 здоровья/тик · Потолок I царства'
                  )
                : getT('daoPixelAssetSubtitle', 'Нефритово-золотой алтарь равновесия и защитная формация Лазурной Ци')) +
            '</span>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderKarstRiftBanner(depthStage, active) {
    var glowColor = active ? '#E11D48' : '#38BDF8';
    return (
      '<div class="banner-box" style="height:68px">' +
        '<svg viewBox="0 0 320 72" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges" style="image-rendering:pixelated" aria-hidden="true">' +
          '<defs>' +
            '<linearGradient id="riftBg" x1="0" y1="0" x2="1" y2="1">' +
              '<stop offset="0%" stop-color="#07060D" />' +
              '<stop offset="50%" stop-color="#160D21" />' +
              '<stop offset="100%" stop-color="#080C14" />' +
            '</linearGradient>' +
            '<radialGradient id="riftGlow" cx="50%" cy="55%" r="45%">' +
              '<stop offset="0%" stop-color="' + glowColor + '" stop-opacity="0.32" />' +
              '<stop offset="100%" stop-color="#000000" stop-opacity="0" />' +
            '</radialGradient>' +
          '</defs>' +
          '<rect width="320" height="72" fill="url(#riftBg)" />' +
          '<circle cx="160" cy="38" r="70" fill="url(#riftGlow)" />' +
          /* Pixel Stalactites & Jagged Karst Rocks */
          '<rect x="0" y="0" width="320" height="8" fill="#05040A" />' +
          '<rect x="16" y="8" width="14" height="12" fill="#090710" />' +
          '<rect x="20" y="20" width="6" height="8" fill="#090710" />' +
          '<rect x="86" y="8" width="18" height="10" fill="#090710" />' +
          '<rect x="92" y="18" width="6" height="10" fill="#090710" />' +
          '<rect x="210" y="8" width="16" height="12" fill="#090710" />' +
          '<rect x="214" y="20" width="8" height="8" fill="#090710" />' +
          '<rect x="278" y="8" width="20" height="14" fill="#090710" />' +
          /* Glowing Jade & Crimson Crystals in the Rift */
          '<rect x="64" y="42" width="6" height="14" fill="#991B1B" />' +
          '<rect x="66" y="38" width="2" height="4" fill="#F43F5E" />' +
          '<rect x="246" y="40" width="6" height="16" fill="#047857" />' +
          '<rect x="248" y="36" width="2" height="4" fill="#34D399" />' +
          /* Vanguard Spiritual Qi Shield Barrier in Center of Rift */
          '<rect x="144" y="18" width="32" height="2" fill="#38BDF8" />' +
          '<rect x="138" y="20" width="2" height="32" fill="#38BDF8" />' +
          '<rect x="180" y="20" width="2" height="32" fill="#38BDF8" />' +
          '<rect x="140" y="20" width="40" height="32" fill="#0EA5E9" opacity="0.14" />' +
          /* Gold Dao Scale Emblem inside Shield */
          '<rect x="159" y="26" width="2" height="20" fill="#F59E0B" />' +
          '<rect x="148" y="30" width="24" height="2" fill="#FBBF24" />' +
          '<rect x="146" y="38" width="6" height="2" fill="#F43F5E" />' +
          '<rect x="168" y="38" width="6" height="2" fill="#34D399" />' +
          '<rect x="0" y="54" width="320" height="18" fill="#05070C" />' +
        '</svg>' +
        '<div class="banner-overlay"></div>' +
        '<div class="banner-caption">' +
          '<span>' +
            getT('bannerRiftTitle', 'Карстовый Разлом · Ярус глубины ' + depthStage).replace('{stage}', depthStage) +
          '</span>' +
          '<span class="text-cyan font-mono">' +
            getT('bannerRiftSub', 'Авангард принимает 80% атак') +
          '</span>' +
        '</div>' +
      '</div>'
    );
  }

  window.SectGame.illustrations = {
    renderSectAbodeBanner: renderSectAbodeBanner,
    renderKarstRiftBanner: renderKarstRiftBanner,
    renderDaoScalePixelArtSvg: renderDaoScalePixelArtSvg,
    renderMiniDaoScalePixelIcon: renderMiniDaoScalePixelIcon,
    renderMiniQiShieldPixelIcon: renderMiniQiShieldPixelIcon,
  };
})();
