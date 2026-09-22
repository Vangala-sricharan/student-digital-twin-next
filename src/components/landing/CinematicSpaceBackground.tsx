import React, { useEffect, useRef } from 'react';

export const CinematicSpaceBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
  const ambientGradientsRef = useRef<HTMLDivElement | null>(null);
  const nebulaPrimaryRef = useRef<HTMLDivElement | null>(null);
  const nebulaDeepRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let parallaxRafId: number | null = null;

    // Load authentic NASA night satellite texture
    const earthTexture = new Image();
    earthTexture.src = '/earth-active-night-gold.jpg';
    let textureLoaded = false;
    earthTexture.onload = () => {
      textureLoaded = true;
      render();
    };
    if (earthTexture.complete && earthTexture.naturalWidth > 0) {
      textureLoaded = true;
    }

    const render = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || window.innerWidth;
      const height = parent?.clientHeight || 960;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);

      // Deterministic PRNG for consistent, reproducible procedural generation
      let seed = 88319;
      const random = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };

      // =========================================================================
      // 1. BASE DEEP SPACE CANVAS (DEEP DARK-NAVY & OBSIDIAN TONES)
      // =========================================================================
      ctx.clearRect(0, 0, width, height);

      const baseGrad = ctx.createLinearGradient(0, 0, 0, height);
      baseGrad.addColorStop(0, '#000104');
      baseGrad.addColorStop(0.35, '#000208');
      baseGrad.addColorStop(0.70, '#010518');
      baseGrad.addColorStop(1, '#000105');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // =========================================================================
      // 2. PROCEDURAL COSMIC NEBULAE & DEEP SPACE GALAXY ARMS
      // Palette: rich purple, royal violet, magenta-indigo, and deep night navy
      // Layered with fine cosmic dust, galaxy clusters, and dark absorption rifts
      // Leaves central zone dark for high Digital Twin contrast (No giant wash)
      // =========================================================================
      ctx.globalCompositeOperation = 'screen';

      // A. Major Cosmic Gas Clusters (Centered Lower, Leaving Center Zone Dark for Twin Contrast)
      const nebulaePuffs = [
        // Lower Cosmic Horizon Glow (Centered lower at ~68%-75% height)
        { x: width * 0.50, y: height * 0.70, r: width * 0.32, col: 'rgba(126, 34, 206, 0.32)' },
        { x: width * 0.53, y: height * 0.74, r: width * 0.28, col: 'rgba(88, 28, 135, 0.28)' },
        { x: width * 0.46, y: height * 0.68, r: width * 0.24, col: 'rgba(79, 70, 229, 0.22)' },
        { x: width * 0.55, y: height * 0.65, r: width * 0.20, col: 'rgba(147, 51, 234, 0.25)' },

        // Subtle Twin Backdrop Halo (Deep Dark Violet, Controlled without Bright Wash)
        { x: width * 0.50, y: height * 0.40, r: width * 0.16, col: 'rgba(88, 28, 135, 0.15)' },
        { x: width * 0.51, y: height * 0.36, r: width * 0.13, col: 'rgba(59, 7, 100, 0.18)' },

        // Upper-Right Deep Indigo, Royal Violet & Magenta Galaxy Arm
        { x: width * 0.82, y: height * 0.20, r: width * 0.32, col: 'rgba(79, 70, 229, 0.26)' },
        { x: width * 0.76, y: height * 0.15, r: width * 0.24, col: 'rgba(126, 34, 206, 0.24)' },
        { x: width * 0.85, y: height * 0.26, r: width * 0.22, col: 'rgba(147, 51, 234, 0.22)' },
        { x: width * 0.89, y: height * 0.34, r: width * 0.19, col: 'rgba(107, 33, 168, 0.20)' },
        { x: width * 0.92, y: height * 0.18, r: width * 0.17, col: 'rgba(168, 85, 247, 0.18)' },

        // Mid-Space Cosmic Bridge connecting Lower Center to Upper Right
        { x: width * 0.65, y: height * 0.45, r: width * 0.24, col: 'rgba(126, 34, 206, 0.20)' },
        { x: width * 0.60, y: height * 0.56, r: width * 0.20, col: 'rgba(88, 28, 135, 0.18)' },

        // Distant Upper-Left Framing (Deep midnight indigo to keep text perfectly crisp)
        { x: width * 0.14, y: height * 0.12, r: width * 0.20, col: 'rgba(49, 46, 129, 0.12)' },
        { x: width * 0.20, y: height * 0.16, r: width * 0.16, col: 'rgba(30, 27, 75, 0.10)' },
        { x: width * 0.08, y: height * 0.22, r: width * 0.14, col: 'rgba(67, 56, 202, 0.08)' },
      ];

      for (const neb of nebulaePuffs) {
        const rad = ctx.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.r);
        rad.addColorStop(0, neb.col);
        rad.addColorStop(0.45, neb.col.replace(/[\d\.]+\)$/, (m) => `${parseFloat(m) * 0.50})`));
        rad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = rad;
        ctx.beginPath();
        ctx.arc(neb.x, neb.y, neb.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // B. Fine Cosmic Dust & Interstellar Violet/Indigo Filaments (340+ particles)
      const filamentCount = 340;
      for (let i = 0; i < filamentCount; i++) {
        const t = random();
        // Slanted galactic arc primarily spanning middle to right
        const gx = width * (0.26 + t * 0.70 + (random() - 0.5) * 0.22);
        const gy = height * (0.05 + t * 0.60 + (random() - 0.5) * 0.18);
        const gr = 20 + random() * 95;

        // Rich cosmic palette: vibrant purple, deep violet, royal magenta, dark indigo
        const colors = [
          'rgba(147, 51, 234, ',
          'rgba(126, 34, 206, ',
          'rgba(168, 85, 247, ',
          'rgba(107, 33, 168, ',
          'rgba(88, 28, 135, ',
          'rgba(79, 70, 229, ',
          'rgba(99, 102, 241, ',
          'rgba(192, 132, 252, '
        ];
        const colPick = colors[Math.floor(random() * colors.length)];
        const alpha = 0.035 + random() * 0.075;

        const gGrad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        gGrad.addColorStop(0, `${colPick}${alpha * 1.8})`);
        gGrad.addColorStop(0.5, `${colPick}${alpha * 0.60})`);
        gGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gGrad;
        ctx.beginPath();
        ctx.arc(gx, gy, gr, 0, Math.PI * 2);
        ctx.fill();
      }

      // C. Distant Deep-Space Galaxies & Star Clusters
      const distantGalaxies = [
        { x: width * 0.26, y: height * 0.12, rx: 24, ry: 10, rot: -0.45, core: '#e0e7ff', haze: 'rgba(129, 140, 248, 0.28)' },
        { x: width * 0.86, y: height * 0.10, rx: 28, ry: 12, rot: 0.35, core: '#f5f3ff', haze: 'rgba(192, 132, 252, 0.32)' },
        { x: width * 0.70, y: height * 0.44, rx: 20, ry: 9, rot: 0.6, core: '#e0f2fe', haze: 'rgba(56, 189, 248, 0.24)' },
        { x: width * 0.93, y: height * 0.28, rx: 16, ry: 7, rot: -0.2, core: '#fed7aa', haze: 'rgba(251, 146, 60, 0.20)' },
      ];

      for (const gal of distantGalaxies) {
        // Outer galactic halo
        const galHalo = ctx.createRadialGradient(gal.x, gal.y, 0, gal.x, gal.y, gal.rx);
        galHalo.addColorStop(0, gal.haze);
        galHalo.addColorStop(0.6, gal.haze.replace(/[\d\.]+\)$/, (m) => `${parseFloat(m) * 0.4})`));
        galHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = galHalo;
        ctx.beginPath();
        ctx.ellipse(gal.x, gal.y, gal.rx, gal.ry, gal.rot, 0, Math.PI * 2);
        ctx.fill();

        // Luminous galactic core
        const galCore = ctx.createRadialGradient(gal.x, gal.y, 0, gal.x, gal.y, 4);
        galCore.addColorStop(0, '#ffffff');
        galCore.addColorStop(0.5, gal.core);
        galCore.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = galCore;
        ctx.beginPath();
        ctx.arc(gal.x, gal.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // D. Subtle Dark Silhouette Absorption Rifts (Cosmic Dust Lanes for Deep Optical Depth)
      ctx.globalCompositeOperation = 'source-over';
      const dustLanes = [
        { x: width * 0.74, y: height * 0.22, rx: 42, ry: 14, rot: 0.32, alpha: 0.42 },
        { x: width * 0.82, y: height * 0.29, rx: 36, ry: 12, rot: 0.28, alpha: 0.38 },
        { x: width * 0.62, y: height * 0.48, rx: 48, ry: 16, rot: 0.55, alpha: 0.35 },
      ];
      for (const lane of dustLanes) {
        const laneGrad = ctx.createRadialGradient(lane.x, lane.y, 0, lane.x, lane.y, lane.rx);
        laneGrad.addColorStop(0, `rgba(0, 2, 8, ${lane.alpha})`);
        laneGrad.addColorStop(0.7, `rgba(0, 2, 8, ${lane.alpha * 0.45})`);
        laneGrad.addColorStop(1, 'rgba(0, 2, 8, 0)');
        ctx.fillStyle = laneGrad;
        ctx.beginPath();
        ctx.ellipse(lane.x, lane.y, lane.rx, lane.ry, lane.rot, 0, Math.PI * 2);
        ctx.fill();
      }

      // =========================================================================
      // 3. DENSE REALISTIC STARFIELD (3,400+ STARS ACROSS MULTIPLE DEPTH TIERS)
      // =========================================================================
      const starPalette = ['#ffffff', '#f0f9ff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#c7d2fe', '#fed7aa', '#fde68a'];

      // Tier 1: 2,600 Microscopic Background Galaxy Pinpricks
      for (let i = 0; i < 2600; i++) {
        const sx = random() * width;
        const sy = random() * height * 0.86;

        // Less density directly over main heading text
        if (sx < width * 0.44 && sy > height * 0.14 && sy < height * 0.72 && random() > 0.45) {
          continue;
        }

        const sr = 0.25 + random() * 0.6;
        const sa = 0.15 + random() * 0.75;
        const scol = starPalette[Math.floor(random() * starPalette.length)];

        ctx.fillStyle = scol;
        ctx.globalAlpha = sa;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tier 2: 750 Midground Stellar Navigators
      for (let i = 0; i < 750; i++) {
        const sx = random() * width;
        const sy = random() * height * 0.84;

        if (sx < width * 0.44 && sy > height * 0.14 && sy < height * 0.72 && random() > 0.35) {
          continue;
        }

        const sr = 0.7 + random() * 0.75;
        const sa = 0.4 + random() * 0.55;
        const scol = starPalette[Math.floor(random() * starPalette.length)];

        ctx.fillStyle = scol;
        ctx.globalAlpha = sa;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tier 3: 120 Luminous Foreground Stars with Natural Optical Halos
      for (let i = 0; i < 120; i++) {
        const sx = random() * width;
        const sy = random() * height * 0.80;

        if (sx < width * 0.44 && sy > height * 0.14 && sy < height * 0.72 && random() > 0.2) {
          continue;
        }

        const sr = 1.1 + random() * 0.9;
        const scol = starPalette[Math.floor(random() * starPalette.length)];

        // Soft optical halo
        const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 4);
        halo.addColorStop(0, scol);
        halo.addColorStop(0.3, 'rgba(56, 189, 248, 0.4)');
        halo.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx.globalAlpha = 0.85;
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(sx, sy, sr * 4, 0, Math.PI * 2);
        ctx.fill();

        // Brilliant star core
        ctx.globalAlpha = 0.98;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();

        // Delicate 4-point diffraction spike on select bright foreground stars
        if (i < 8) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(sx - sr * 5, sy);
          ctx.lineTo(sx + sr * 5, sy);
          ctx.moveTo(sx, sy - sr * 5);
          ctx.lineTo(sx, sy + sr * 5);
          ctx.stroke();
        }
      }

      // =========================================================================
      // 4. SUBTLE SECONDARY PLANET (LOWER RIGHT BACKGROUND, BEHIND INTERFACE)
      // Position: lower-right background, behind the main interface composition
      // Subtle, dark, slightly illuminated crescent rim, clearly recognizable
      // =========================================================================
      const px = width * 0.90;
      const py = height * 0.44;
      const pr = Math.min(width, height) * 0.038; // ~36-40px — distinct yet secondary

      // Planet Shadow Body (Spherical gradient with subtle dark craters)
      const pGrad = ctx.createRadialGradient(px - pr * 0.25, py - pr * 0.25, 0, px, py, pr);
      pGrad.addColorStop(0, '#2d3748');
      pGrad.addColorStop(0.35, '#1a202c');
      pGrad.addColorStop(0.75, '#0a0f1d');
      pGrad.addColorStop(1, '#01030a');

      ctx.globalAlpha = 1.0;
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric Crescent Rim facing the Horizon Sunrise (Illuminated lower-left curve)
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.clip();

      const pRim = ctx.createLinearGradient(px + pr * 0.8, py - pr * 0.8, px - pr * 0.8, py + pr * 0.8);
      pRim.addColorStop(0, 'rgba(0, 0, 0, 0)');
      pRim.addColorStop(0.50, 'rgba(56, 189, 248, 0.20)');
      pRim.addColorStop(0.82, 'rgba(56, 189, 248, 0.92)');
      pRim.addColorStop(1, 'rgba(255, 255, 255, 1.0)');

      ctx.fillStyle = pRim;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Subtle Outer Corona on Planet
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.35)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(px, py, pr + 0.6, 0, Math.PI * 2);
      ctx.stroke();

      // =========================================================================
      // 5. PHOTOREALISTIC CINEMATIC EARTH FROM ORBIT (COMMANDING LOWER HERO)
      // Genuine orbital perspective matching high-res NASA space photography:
      // - Increased planetary scale commanding the lower hero base (~58% down)
      // - Expansive, authentic Low Earth Orbit (LEO) curvature
      // - Deep midnight abyssal ocean & detailed continental landmass shelves
      // - Multi-tier luminous blue Rayleigh & Mie atmospheric scattering exosphere
      // - Ethereal nocturnal airglow chemiluminescence ribbon
      // - Razor-sharp multi-frequency electric cyan & incandescent limb edge
      // - Detailed transcontinental city-light overlays with metropolitan megalopolises,
      //   branching transport arteries, capillary grids, and micro-settlement swarms
      // - Multi-altitude orbital clouds with realistic ground shadows
      // =========================================================================

      // Planetary Geometry:
      // Scaled up to command ~42% of the hero viewport height at its apex (~58% down),
      // with a majestic planetary radius sweeping smoothly across the screen width.
      const earthCenterX = width * 0.50;
      const earthRadius = Math.max(width * 1.55, height * 2.15, 1450);
      const earthTopApexY = height * 0.58;
      const earthCenterY = earthTopApexY + earthRadius;

      // Function to calculate exact Earth horizon Y for any screen X
      const getEarthY = (x: number) => {
        const dx = x - earthCenterX;
        const dySq = earthRadius * earthRadius - dx * dx;
        if (dySq <= 0) return height;
        return earthCenterY - Math.sqrt(dySq);
      };

      // -------------------------------------------------------------------------
      // A. Luminous Blue Multi-Tier Atmospheric Rayleigh & Mie Scattering Halo
      // Radiates smoothly above the curved horizon limb into deep cosmic space
      // -------------------------------------------------------------------------
      ctx.globalCompositeOperation = 'screen';
      const atmoLayers = [
        { offset: 84, alpha: 0.10, color: 'rgba(2, 132, 199, ' },   // Outer mesosphere/exosphere sapphire
        { offset: 58, alpha: 0.22, color: 'rgba(14, 165, 233, ' },  // Upper stratosphere royal azure
        { offset: 36, alpha: 0.44, color: 'rgba(56, 189, 248, ' },  // Stratosphere electric cyan-blue
        { offset: 18, alpha: 0.68, color: 'rgba(103, 232, 249, ' }, // Ionosphere intense cyan
        { offset: 6,  alpha: 0.88, color: 'rgba(186, 230, 253, ' }, // Lower troposphere pale cyan
        { offset: 1,  alpha: 0.98, color: 'rgba(224, 242, 254, ' }, // Peak incandescent limb glow
      ];

      for (const layer of atmoLayers) {
        const grad = ctx.createLinearGradient(0, earthTopApexY - layer.offset, 0, earthTopApexY + 95);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(0.25, `${layer.color}${layer.alpha * 0.55})`);
        grad.addColorStop(0.65, `${layer.color}${layer.alpha})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(earthCenterX, earthCenterY, earthRadius + layer.offset, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ethereal Nocturnal Airglow Fringe (Authentic ISS green-cyan upper atmospheric luminescence)
      ctx.save();
      const airglowGrad = ctx.createLinearGradient(0, 0, width, 0);
      airglowGrad.addColorStop(0, 'rgba(34, 211, 238, 0.15)');
      airglowGrad.addColorStop(0.35, 'rgba(52, 211, 153, 0.32)');
      airglowGrad.addColorStop(0.65, 'rgba(34, 211, 238, 0.42)');
      airglowGrad.addColorStop(0.85, 'rgba(56, 189, 248, 0.35)');
      airglowGrad.addColorStop(1, 'rgba(34, 211, 238, 0.15)');

      ctx.strokeStyle = airglowGrad;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(earthCenterX, earthCenterY, earthRadius + 8.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // -------------------------------------------------------------------------
      // B. Solid Planetary Body & Deep Ocean Foundation
      // -------------------------------------------------------------------------
      ctx.globalCompositeOperation = 'source-over';
      ctx.save();

      // Define Earth spherical clipping path
      ctx.beginPath();
      ctx.arc(earthCenterX, earthCenterY, earthRadius, 0, Math.PI * 2);
      ctx.closePath();

      // Deep ocean gradient with authentic spherical shading
      const oceanGrad = ctx.createRadialGradient(
        earthCenterX,
        earthCenterY - earthRadius * 0.94,
        earthRadius * 0.05,
        earthCenterX,
        earthCenterY,
        earthRadius
      );
      oceanGrad.addColorStop(0, '#020d20');    // Upper ocean midnight navy
      oceanGrad.addColorStop(0.35, '#010818'); // Deep ocean abyss
      oceanGrad.addColorStop(0.75, '#000410'); // Abyssal plain
      oceanGrad.addColorStop(1, '#000106');    // Deep night shadow

      ctx.fillStyle = oceanGrad;
      ctx.fill();

      // Clip all internal planetary features to Earth's sphere
      ctx.clip();

      // Continental Landmass Silhouettes & Coastal Shelves
      ctx.fillStyle = '#031024';
      const continents = [
        // Western Continental Zone (Americas / Pacific rim)
        [
          [width * 0.02, earthTopApexY + 95],
          [width * 0.08, earthTopApexY + 58],
          [width * 0.15, earthTopApexY + 42],
          [width * 0.22, earthTopApexY + 36],
          [width * 0.28, earthTopApexY + 48],
          [width * 0.32, earthTopApexY + 68],
          [width * 0.26, earthTopApexY + 115],
          [width * 0.14, earthTopApexY + 130],
          [width * 0.06, earthTopApexY + 120],
        ],
        // Central Continental Zone (Europe / Africa / Mediterranean)
        [
          [width * 0.36, earthTopApexY + 65],
          [width * 0.44, earthTopApexY + 42],
          [width * 0.52, earthTopApexY + 28],
          [width * 0.60, earthTopApexY + 35],
          [width * 0.56, earthTopApexY + 85],
          [width * 0.48, earthTopApexY + 110],
          [width * 0.38, earthTopApexY + 105],
        ],
        // Eastern Continental Zone (Asia / Indian Subcontinent / East Asian Megacities)
        [
          [width * 0.62, earthTopApexY + 52],
          [width * 0.70, earthTopApexY + 32],
          [width * 0.78, earthTopApexY + 24],
          [width * 0.86, earthTopApexY + 34],
          [width * 0.94, earthTopApexY + 54],
          [width * 0.99, earthTopApexY + 85],
          [width * 0.88, earthTopApexY + 120],
          [width * 0.76, earthTopApexY + 115],
          [width * 0.66, earthTopApexY + 90],
        ],
      ];

      for (const poly of continents) {
        ctx.beginPath();
        ctx.moveTo(poly[0][0], poly[0][1]);
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(poly[i][0], poly[i][1]);
        }
        ctx.closePath();
        ctx.fill();

        // Coastal shelf shallow water bioluminescent gradient
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.14)';
        ctx.lineWidth = 2.0;
        ctx.stroke();
      }

      // -------------------------------------------------------------------------
      // C. Photorealistic Satellite Night-Lights Layer (NASA Earth at Night)
      // Mapped along the curved horizon using vertical projective strips
      // -------------------------------------------------------------------------
      if (textureLoaded && earthTexture.naturalWidth > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.92;
        const stripW = 2.0;
        const numStrips = Math.ceil(width / stripW);
        for (let i = 0; i < numStrips; i++) {
          const x = i * stripW;
          const yTop = getEarthY(x + stripW * 0.5);
          const h = height - yTop + 45;
          const sx = (i / numStrips) * earthTexture.naturalWidth;
          const sw = (stripW / width) * earthTexture.naturalWidth;
          ctx.drawImage(
            earthTexture,
            sx, 0, sw, earthTexture.naturalHeight,
            x, yTop, stripW + 0.5, h
          );
        }
        ctx.restore();
      }

      // -------------------------------------------------------------------------
      // D. DETAILED PROCEDURAL CITY-LIGHT OVERLAYS (REALISTIC NASA NIGHT EARTH)
      // - Connected transcontinental arterial corridors & coastal highway ribbons
      // - Secondary regional grid networks and capillary feeder veins
      // - Hierarchical metropolitan hubs (White CBD core + amber halo + light dome)
      // - 280+ procedural micro-pinpoint settlements and rural clusters
      // - Offshore maritime routes & coastal vessel pinpricks
      // -------------------------------------------------------------------------
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      // 1. Primary Transcontinental Arterial Corridors (Highways & Transit Veins)
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
      ctx.lineWidth = 0.85;

      const arterialRoutes = [
        // Western Arterial Spine (Pacific Coast & Transcontinental corridor)
        [
          [width * 0.04, earthTopApexY + 85],
          [width * 0.09, earthTopApexY + 68],
          [width * 0.15, earthTopApexY + 48],
          [width * 0.20, earthTopApexY + 40],
          [width * 0.26, earthTopApexY + 44],
          [width * 0.31, earthTopApexY + 58],
        ],
        [
          [width * 0.15, earthTopApexY + 48],
          [width * 0.18, earthTopApexY + 68],
          [width * 0.22, earthTopApexY + 88],
          [width * 0.25, earthTopApexY + 112],
        ],
        [
          [width * 0.09, earthTopApexY + 68],
          [width * 0.12, earthTopApexY + 92],
          [width * 0.17, earthTopApexY + 118],
        ],
        // Central Continental Corridor (Dense European / Mediterranean grid)
        [
          [width * 0.38, earthTopApexY + 58],
          [width * 0.44, earthTopApexY + 40],
          [width * 0.49, earthTopApexY + 30],
          [width * 0.54, earthTopApexY + 36],
          [width * 0.59, earthTopApexY + 48],
        ],
        [
          [width * 0.49, earthTopApexY + 30],
          [width * 0.51, earthTopApexY + 54],
          [width * 0.48, earthTopApexY + 78],
          [width * 0.45, earthTopApexY + 104],
        ],
        [
          [width * 0.44, earthTopApexY + 40],
          [width * 0.42, earthTopApexY + 64],
          [width * 0.39, earthTopApexY + 88],
        ],
        [
          [width * 0.54, earthTopApexY + 36],
          [width * 0.56, earthTopApexY + 62],
          [width * 0.53, earthTopApexY + 86],
        ],
        // Eastern Megalopolis Network (Indo-Gangetic / Coastal East Asian Megacities)
        [
          [width * 0.64, earthTopApexY + 50],
          [width * 0.70, earthTopApexY + 34],
          [width * 0.76, earthTopApexY + 26],
          [width * 0.82, earthTopApexY + 30],
          [width * 0.88, earthTopApexY + 44],
          [width * 0.94, earthTopApexY + 64],
          [width * 0.98, earthTopApexY + 85],
        ],
        [
          [width * 0.76, earthTopApexY + 26],
          [width * 0.80, earthTopApexY + 50],
          [width * 0.84, earthTopApexY + 72],
          [width * 0.86, earthTopApexY + 102],
        ],
        [
          [width * 0.70, earthTopApexY + 34],
          [width * 0.73, earthTopApexY + 60],
          [width * 0.75, earthTopApexY + 86],
        ],
        [
          [width * 0.88, earthTopApexY + 44],
          [width * 0.91, earthTopApexY + 70],
          [width * 0.92, earthTopApexY + 98],
        ],
        // Transcontinental cross-links
        [
          [width * 0.31, earthTopApexY + 58],
          [width * 0.35, earthTopApexY + 62],
          [width * 0.38, earthTopApexY + 58],
        ],
        [
          [width * 0.59, earthTopApexY + 48],
          [width * 0.62, earthTopApexY + 52],
          [width * 0.64, earthTopApexY + 50],
        ],
      ];

      for (const route of arterialRoutes) {
        ctx.beginPath();
        ctx.moveTo(route[0][0], route[0][1]);
        for (let i = 1; i < route.length; i++) {
          ctx.lineTo(route[i][0], route[i][1]);
        }
        ctx.stroke();
      }

      // 2. Secondary Regional Grid Corridors & Feeder Arteries
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.42)';
      ctx.lineWidth = 0.55;
      for (const route of arterialRoutes) {
        ctx.beginPath();
        for (let i = 0; i < route.length - 1; i++) {
          const p1 = route[i];
          const p2 = route[i + 1];
          const midX = (p1[0] + p2[0]) * 0.5;
          const midY = (p1[1] + p2[1]) * 0.5;
          const ox = midX + (random() - 0.5) * 16;
          const oy = midY + (random() - 0.5) * 14;
          ctx.moveTo(midX, midY);
          ctx.lineTo(ox, oy);

          // Sub-feeder capillary
          if (random() > 0.4) {
            const ox2 = ox + (random() - 0.5) * 10;
            const oy2 = oy + (random() - 0.5) * 8;
            ctx.lineTo(ox2, oy2);
          }
        }
        ctx.stroke();
      }

      // 3. Hierarchical Metropolitan Megalopolises & Hubs
      // (Incandescent white core + saturated sodium-vapor halo + diffuse urban light dome)
      const majorMegalopolises = [
        // Western Hubs
        { x: width * 0.09, y: earthTopApexY + 68, r: 1.8, dome: 24, name: 'Metro W1' },
        { x: width * 0.15, y: earthTopApexY + 48, r: 2.2, dome: 28, name: 'Metro W2' },
        { x: width * 0.20, y: earthTopApexY + 40, r: 1.9, dome: 22, name: 'Metro W3' },
        { x: width * 0.26, y: earthTopApexY + 44, r: 1.7, dome: 20, name: 'Metro W4' },
        { x: width * 0.18, y: earthTopApexY + 68, r: 1.6, dome: 18, name: 'Metro W5' },
        { x: width * 0.22, y: earthTopApexY + 88, r: 1.4, dome: 16, name: 'Metro W6' },

        // Central Hubs (Europe / Near East)
        { x: width * 0.38, y: earthTopApexY + 58, r: 1.7, dome: 20, name: 'Metro C1' },
        { x: width * 0.44, y: earthTopApexY + 40, r: 2.0, dome: 26, name: 'Metro C2' },
        { x: width * 0.49, y: earthTopApexY + 30, r: 2.4, dome: 30, name: 'Metro C3' },
        { x: width * 0.54, y: earthTopApexY + 36, r: 2.1, dome: 25, name: 'Metro C4' },
        { x: width * 0.59, y: earthTopApexY + 48, r: 1.8, dome: 22, name: 'Metro C5' },
        { x: width * 0.51, y: earthTopApexY + 54, r: 1.6, dome: 19, name: 'Metro C6' },
        { x: width * 0.48, y: earthTopApexY + 78, r: 1.5, dome: 18, name: 'Metro C7' },

        // Eastern Hubs (Asia / Indo-Gangetic & East Asia)
        { x: width * 0.64, y: earthTopApexY + 50, r: 1.8, dome: 22, name: 'Metro E1' },
        { x: width * 0.70, y: earthTopApexY + 34, r: 2.2, dome: 28, name: 'Metro E2' },
        { x: width * 0.76, y: earthTopApexY + 26, r: 2.5, dome: 32, name: 'Metro E3' },
        { x: width * 0.82, y: earthTopApexY + 30, r: 2.3, dome: 29, name: 'Metro E4' },
        { x: width * 0.88, y: earthTopApexY + 44, r: 2.1, dome: 26, name: 'Metro E5' },
        { x: width * 0.94, y: earthTopApexY + 64, r: 1.9, dome: 24, name: 'Metro E6' },
        { x: width * 0.80, y: earthTopApexY + 50, r: 1.7, dome: 20, name: 'Metro E7' },
        { x: width * 0.84, y: earthTopApexY + 72, r: 1.6, dome: 19, name: 'Metro E8' },
        { x: width * 0.91, y: earthTopApexY + 70, r: 1.5, dome: 17, name: 'Metro E9' },
      ];

      for (const hub of majorMegalopolises) {
        // Atmospheric Light Dome (Diffuse skyglow above major metropolitan area)
        const domeGrad = ctx.createRadialGradient(hub.x, hub.y, 0, hub.x, hub.y, hub.dome);
        domeGrad.addColorStop(0, 'rgba(251, 191, 36, 0.35)');
        domeGrad.addColorStop(0.35, 'rgba(245, 158, 11, 0.16)');
        domeGrad.addColorStop(0.75, 'rgba(217, 119, 6, 0.05)');
        domeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = domeGrad;
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, hub.dome, 0, Math.PI * 2);
        ctx.fill();

        // Saturated Golden-Amber Sodium-Vapor Halo
        ctx.fillStyle = 'rgba(251, 191, 36, 0.78)';
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, hub.r * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Mid-density urban core
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, hub.r * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Incandescent pure white CBD core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, hub.r * 0.75, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Extensive Micro-City Swarms, Towns, and Rural Cluster Pinpoints (280+ procedural nodes)
      // Clustered realistically within continental boundaries
      const continentZones = [
        { minX: 0.03, maxX: 0.32, minYOffset: 36, maxYOffset: 120, count: 85 },
        { minX: 0.36, maxX: 0.60, minYOffset: 26, maxYOffset: 110, count: 95 },
        { minX: 0.62, maxX: 0.98, minYOffset: 22, maxYOffset: 115, count: 120 },
      ];

      for (const zone of continentZones) {
        for (let i = 0; i < zone.count; i++) {
          const nx = width * (zone.minX + random() * (zone.maxX - zone.minX));
          const horizonY = getEarthY(nx);
          const ny = horizonY + zone.minYOffset + random() * (zone.maxYOffset - zone.minYOffset);

          // Verify point lies within Earth boundary
          if (ny < horizonY + 4 || ny > height) continue;

          const pr = 0.55 + random() * 0.75;
          const roll = random();

          // Varied realistic color temperature:
          // 65% sodium-vapor golden amber, 25% modern LED cool white, 10% warm incandescent
          if (roll < 0.65) {
            ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
          } else if (roll < 0.90) {
            ctx.fillStyle = 'rgba(240, 249, 255, 0.92)';
          } else {
            ctx.fillStyle = 'rgba(254, 215, 170, 0.88)';
          }

          ctx.beginPath();
          ctx.arc(nx, ny, pr, 0, Math.PI * 2);
          ctx.fill();

          // Occasional micro-halo for clustered settlements
          if (roll > 0.82) {
            ctx.fillStyle = 'rgba(251, 191, 36, 0.28)';
            ctx.beginPath();
            ctx.arc(nx, ny, pr * 2.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 5. Maritime Coastal Vessel Pinpricks & Offshore Shipping Lanes
      const maritimePoints = [
        { x: width * 0.16, y: earthTopApexY + 135 },
        { x: width * 0.19, y: earthTopApexY + 142 },
        { x: width * 0.33, y: earthTopApexY + 95 },
        { x: width * 0.35, y: earthTopApexY + 115 },
        { x: width * 0.58, y: earthTopApexY + 115 },
        { x: width * 0.61, y: earthTopApexY + 130 },
        { x: width * 0.68, y: earthTopApexY + 125 },
        { x: width * 0.73, y: earthTopApexY + 140 },
        { x: width * 0.86, y: earthTopApexY + 130 },
        { x: width * 0.96, y: earthTopApexY + 110 },
      ];
      ctx.fillStyle = 'rgba(224, 242, 254, 0.75)';
      for (const pt of maritimePoints) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // -------------------------------------------------------------------------
      // E. Realistic Atmospheric Clouds (Orbital Weather Systems)
      // Delicate semi-translucent wisps with realistic planetary shadows underneath
      // -------------------------------------------------------------------------
      ctx.save();

      // 1. Cloud Ground Shadow Layer (Casting soft shadows 3.2px below onto oceans & terrain)
      ctx.fillStyle = 'rgba(0, 3, 10, 0.42)';
      const cloudPuffs = [
        // Equatorial weather deck (curving with latitude)
        { x: width * 0.14, y: earthTopApexY + 36, rx: 65, ry: 15, rot: -0.04 },
        { x: width * 0.26, y: earthTopApexY + 30, rx: 75, ry: 16, rot: -0.02 },
        { x: width * 0.40, y: earthTopApexY + 24, rx: 80, ry: 17, rot: 0.00 },
        { x: width * 0.56, y: earthTopApexY + 26, rx: 85, ry: 16, rot: 0.02 },
        { x: width * 0.72, y: earthTopApexY + 28, rx: 90, ry: 17, rot: 0.04 },
        { x: width * 0.88, y: earthTopApexY + 38, rx: 70, ry: 16, rot: 0.06 },

        // Mid-latitude storm clouds
        { x: width * 0.20, y: earthTopApexY + 68, rx: 70, ry: 19, rot: -0.03 },
        { x: width * 0.46, y: earthTopApexY + 62, rx: 80, ry: 20, rot: 0.01 },
        { x: width * 0.68, y: earthTopApexY + 70, rx: 75, ry: 19, rot: 0.03 },
        { x: width * 0.84, y: earthTopApexY + 78, rx: 65, ry: 18, rot: 0.05 },

        // Oceanic wisps
        { x: width * 0.32, y: earthTopApexY + 98, rx: 90, ry: 22, rot: -0.02 },
        { x: width * 0.60, y: earthTopApexY + 104, rx: 95, ry: 24, rot: 0.02 },
      ];

      // Draw shadows slightly offset
      for (const cp of cloudPuffs) {
        ctx.beginPath();
        ctx.ellipse(cp.x, cp.y + 3.4, cp.rx * 0.95, cp.ry * 0.95, cp.rot, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Cyclonic Low-Pressure Vortex over Ocean (Logarithmic spiral storm)
      const cycloneX = width * 0.33;
      const cycloneY = earthTopApexY + 54;
      ctx.fillStyle = 'rgba(235, 243, 255, 0.20)';
      for (let arm = 0; arm < 3; arm++) {
        const startAng = arm * (Math.PI * 2 / 3);
        for (let st = 0; st < 26; st++) {
          const rad = 4 + st * 2.4;
          const ang = startAng + st * 0.16;
          const cx = cycloneX + Math.cos(ang) * rad * 1.5;
          const cy = cycloneY + Math.sin(ang) * rad * 0.6;
          const r = 2.0 + st * 0.32;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Semi-Translucent Cloud Formations
      for (const cp of cloudPuffs) {
        // Outer soft wisp
        ctx.fillStyle = 'rgba(230, 240, 255, 0.16)';
        ctx.beginPath();
        ctx.ellipse(cp.x, cp.y, cp.rx, cp.ry, cp.rot, 0, Math.PI * 2);
        ctx.fill();

        // Inner denser cloud core
        ctx.fillStyle = 'rgba(245, 250, 255, 0.25)';
        ctx.beginPath();
        ctx.ellipse(cp.x + 3, cp.y - 1.5, cp.rx * 0.55, cp.ry * 0.5, cp.rot, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Subtle High-Altitude Cirrus Streaks (Jet Stream)
      ctx.strokeStyle = 'rgba(235, 245, 255, 0.14)';
      ctx.lineWidth = 1.3;
      const cirrusTracks = [
        [
          [width * 0.08, earthTopApexY + 22],
          [width * 0.23, earthTopApexY + 18],
          [width * 0.38, earthTopApexY + 14],
          [width * 0.54, earthTopApexY + 16],
        ],
        [
          [width * 0.50, earthTopApexY + 46],
          [width * 0.66, earthTopApexY + 48],
          [width * 0.80, earthTopApexY + 54],
          [width * 0.94, earthTopApexY + 66],
        ],
      ];
      for (const track of cirrusTracks) {
        ctx.beginPath();
        ctx.moveTo(track[0][0], track[0][1]);
        for (let i = 1; i < track.length; i++) {
          ctx.lineTo(track[i][0], track[i][1]);
        }
        ctx.stroke();
      }

      ctx.restore(); // Exit Earth sphere clipping region

      // -------------------------------------------------------------------------
      // F. LUMINOUS BLUE MULTI-LAYERED ATMOSPHERIC LIMB EDGE
      // Brilliant electric cyan, sapphire, and pure white razor-edge
      // following the exact spherical curvature of Earth's horizon
      // -------------------------------------------------------------------------
      ctx.globalCompositeOperation = 'screen';
      ctx.save();

      // Broad outer atmospheric corona wash
      const outerRimGrad = ctx.createLinearGradient(0, 0, width, 0);
      outerRimGrad.addColorStop(0, 'rgba(2, 132, 199, 0.60)');
      outerRimGrad.addColorStop(0.32, 'rgba(56, 189, 248, 0.98)');
      outerRimGrad.addColorStop(0.635, 'rgba(255, 255, 255, 1.0)');
      outerRimGrad.addColorStop(0.78, 'rgba(103, 232, 249, 0.98)');
      outerRimGrad.addColorStop(1, 'rgba(37, 99, 235, 0.65)');

      ctx.strokeStyle = outerRimGrad;
      ctx.lineWidth = 10.5;
      ctx.beginPath();
      ctx.arc(earthCenterX, earthCenterY, earthRadius + 0.8, 0, Math.PI * 2);
      ctx.stroke();

      // Sharp electric cyan mid-band
      ctx.strokeStyle = 'rgba(56, 189, 248, 1.0)';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(earthCenterX, earthCenterY, earthRadius + 0.2, 0, Math.PI * 2);
      ctx.stroke();

      // Bright cyan-white inner glow
      ctx.strokeStyle = 'rgba(186, 230, 253, 1.0)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(earthCenterX, earthCenterY, earthRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Dazzling pure white razor-edge
      ctx.strokeStyle = 'rgba(255, 255, 255, 1.0)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(earthCenterX, earthCenterY, earthRadius - 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // =========================================================================
      // 6. CINEMATIC SUNRISE EMERGING DIRECTLY FROM BEHIND THE HORIZON
      // Positioned on the Earth's curved limb at ~63.5% width (pinned to horizon curve)
      // Concentrated warm-white sunlight, realistic atmospheric scattering, horizon bloom
      // =========================================================================
      const sunriseX = width * 0.635;
      const sunriseY = getEarthY(sunriseX); // Pins sunrise EXACTLY onto the horizon curve!

      // A. Crepuscular Volumetric Light Rays (Subtle solar fan radiating into deep space)
      ctx.globalCompositeOperation = 'screen';
      const rayAngles = [-0.65, -0.48, -0.32, -0.16, 0.0, 0.16, 0.32, 0.48, 0.65];
      const rayLength = Math.min(width * 0.42, 420);

      for (const ang of rayAngles) {
        const endX = sunriseX + Math.sin(ang) * rayLength;
        const endY = sunriseY - Math.cos(ang) * rayLength * 0.85;

        const rayGrad = ctx.createLinearGradient(sunriseX, sunriseY, endX, endY);
        rayGrad.addColorStop(0, 'rgba(186, 230, 253, 0.32)');
        rayGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.14)');
        rayGrad.addColorStop(0.7, 'rgba(14, 165, 233, 0.04)');
        rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(sunriseX - 4, sunriseY);
        ctx.lineTo(endX - 25, endY);
        ctx.lineTo(endX + 25, endY);
        ctx.lineTo(sunriseX + 4, sunriseY);
        ctx.closePath();
        ctx.fill();
      }

      // B. Subtle Warm Dawn Light where Sunrise meets Earth Atmosphere
      const warmDawnGrad = ctx.createRadialGradient(sunriseX, sunriseY, 0, sunriseX, sunriseY, 95);
      warmDawnGrad.addColorStop(0, 'rgba(255, 251, 235, 0.98)');
      warmDawnGrad.addColorStop(0.25, 'rgba(254, 215, 170, 0.60)');
      warmDawnGrad.addColorStop(0.55, 'rgba(251, 146, 60, 0.28)');
      warmDawnGrad.addColorStop(0.85, 'rgba(249, 115, 22, 0.09)');
      warmDawnGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = warmDawnGrad;
      ctx.beginPath();
      ctx.arc(sunriseX, sunriseY, 95, 0, Math.PI * 2);
      ctx.fill();

      // C. Broad Horizon Anamorphic Atmospheric Flare (Tracing curved planetary rim)
      const flareWidth = Math.min(width * 0.65, 680);
      const flareGrad = ctx.createLinearGradient(
        sunriseX - flareWidth * 0.5,
        sunriseY,
        sunriseX + flareWidth * 0.5,
        sunriseY
      );
      flareGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      flareGrad.addColorStop(0.2, 'rgba(56, 189, 248, 0.30)');
      flareGrad.addColorStop(0.42, 'rgba(186, 230, 253, 0.90)');
      flareGrad.addColorStop(0.50, 'rgba(255, 255, 255, 1.0)');
      flareGrad.addColorStop(0.58, 'rgba(186, 230, 253, 0.90)');
      flareGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.30)');
      flareGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = flareGrad;
      ctx.beginPath();
      ctx.ellipse(sunriseX, sunriseY, flareWidth * 0.5, 5.2, -0.02, 0, Math.PI * 2);
      ctx.fill();

      // D. Concentric Solar Corona Wash
      const coronaGrad = ctx.createRadialGradient(sunriseX, sunriseY, 0, sunriseX, sunriseY, 135);
      coronaGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
      coronaGrad.addColorStop(0.2, 'rgba(224, 242, 254, 0.88)');
      coronaGrad.addColorStop(0.45, 'rgba(56, 189, 248, 0.58)');
      coronaGrad.addColorStop(0.75, 'rgba(2, 132, 199, 0.24)');
      coronaGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');

      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(sunriseX, sunriseY, 135, 0, Math.PI * 2);
      ctx.fill();

      // E. Blinding Solar Core Emerging Directly over the Horizon Edge
      const sunCoreGrad = ctx.createRadialGradient(sunriseX, sunriseY, 0, sunriseX, sunriseY, 30);
      sunCoreGrad.addColorStop(0, '#ffffff');
      sunCoreGrad.addColorStop(0.35, '#fffbeb');
      sunCoreGrad.addColorStop(0.65, '#e0f2fe');
      sunCoreGrad.addColorStop(0.85, '#38bdf8');
      sunCoreGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = sunCoreGrad;
      ctx.beginPath();
      ctx.arc(sunriseX, sunriseY, 30, 0, Math.PI * 2);
      ctx.fill();

      // =========================================================================
      // 7. HIGH-CONTRAST LEFT VIGNETTE (PRESERVES TEXT READABILITY WITHOUT OBSCURING EARTH)
      // =========================================================================
      ctx.globalCompositeOperation = 'source-over';
      const textVignette = ctx.createLinearGradient(0, 0, width * 0.60, 0);
      textVignette.addColorStop(0, 'rgba(1, 3, 10, 0.85)');
      textVignette.addColorStop(0.35, 'rgba(1, 4, 15, 0.68)');
      textVignette.addColorStop(0.70, 'rgba(1, 4, 15, 0.20)');
      textVignette.addColorStop(1, 'rgba(1, 4, 15, 0)');

      ctx.fillStyle = textVignette;
      ctx.fillRect(0, 0, width * 0.60, height);

      // Top Atmosphere Vignette (Seamless navbar transition)
      const topVignette = ctx.createLinearGradient(0, 0, 0, 75);
      topVignette.addColorStop(0, 'rgba(1, 3, 10, 0.95)');
      topVignette.addColorStop(1, 'rgba(1, 3, 10, 0)');
      ctx.fillStyle = topVignette;
      ctx.fillRect(0, 0, width, 75);
    };

    render();

    // =========================================================================
    // SUBTLE EVENT-DRIVEN MOUSE PARALLAX SYSTEM
    // - Responds smoothly to mouse movements across the hero section
    // - Heightens astronomical depth across distinct cosmic layers
    // - NO continuous animation loops: uses single-tick rAF event batching only
    // - Gracefully returns to origin when cursor exits the section
    // =========================================================================
    const heroSection = document.getElementById('hero-landing-section') || canvas.closest('section');
    
    let targetX = 0;
    let targetY = 0;

    const updateParallax = () => {
      parallaxRafId = null;

      // 1. Distant space canvas & stars (Tier 1: Subtle deep drift, ~±4px)
      if (canvasWrapperRef.current) {
        canvasWrapperRef.current.style.transform = `translate3d(${targetX * -4.5}px, ${targetY * -3}px, 0)`;
      }
      // 2. Ambient cosmic light gradients (Tier 2: Soft opposite illumination shift, ~±7px)
      if (ambientGradientsRef.current) {
        ambientGradientsRef.current.style.transform = `translate3d(${targetX * 7.5}px, ${targetY * 5}px, 0)`;
      }
      // 3. Primary purple nebula gas clouds (Tier 3: Mid-depth drift, ~±12px)
      if (nebulaPrimaryRef.current) {
        nebulaPrimaryRef.current.style.transform = `translate3d(${targetX * -12}px, ${targetY * -8}px, 0)`;
      }
      // 4. Volumetric stardust filaments & cosmic veil (Tier 4: Closer depth drift, ~±18px)
      if (nebulaDeepRef.current) {
        nebulaDeepRef.current.style.transform = `translate3d(${targetX * -18}px, ${targetY * -12}px, 0)`;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!heroSection) return;
      const rect = heroSection.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      // Calculate normalized cursor coordinates (-1 to 1) from the hero center
      targetX = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width - 0.5) * 2));
      targetY = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height - 0.5) * 2));

      // Batch single rAF update only when mouse events fire (no ongoing loop)
      if (parallaxRafId === null) {
        parallaxRafId = requestAnimationFrame(updateParallax);
      }
    };

    const handleMouseLeave = () => {
      targetX = 0;
      targetY = 0;
      if (parallaxRafId === null) {
        parallaxRafId = requestAnimationFrame(updateParallax);
      }
    };

    if (heroSection) {
      heroSection.addEventListener('mousemove', handleMouseMove, { passive: true });
      heroSection.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    }

    const onResize = () => {
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(render);
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
      if (parallaxRafId !== null) {
        cancelAnimationFrame(parallaxRafId);
      }
      if (heroSection) {
        heroSection.removeEventListener('mousemove', handleMouseMove);
        heroSection.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#000207]">
      {/* 1. Deep Dark-Navy Base Gradient with Layered Rich Purple Nebula CSS Radial Gradients */}
      <div 
        ref={ambientGradientsRef}
        className="absolute -inset-8 pointer-events-none z-[1] transition-transform duration-500 ease-out will-change-transform"
        style={{
          background: `
            radial-gradient(ellipse 110% 65% at 50% 74%, rgba(6, 12, 34, 0.85) 0%, rgba(2, 5, 20, 0.92) 40%, rgba(0, 2, 8, 0.98) 75%, #000207 100%),
            radial-gradient(ellipse 80% 55% at 65% 62%, rgba(147, 51, 234, 0.25) 0%, rgba(107, 33, 168, 0.14) 38%, transparent 75%),
            radial-gradient(circle 650px at 52% 70%, rgba(126, 34, 206, 0.22) 0%, rgba(88, 28, 135, 0.14) 42%, transparent 75%),
            radial-gradient(circle 540px at 78% 24%, rgba(168, 85, 247, 0.20) 0%, rgba(107, 33, 168, 0.12) 42%, transparent 72%),
            radial-gradient(circle 440px at 45% 72%, rgba(112, 26, 117, 0.18) 0%, rgba(59, 7, 100, 0.10) 45%, transparent 75%),
            radial-gradient(circle 420px at 18% 18%, rgba(2, 6, 23, 0.90) 0%, transparent 70%),
            linear-gradient(180deg, #000104 0%, #00020a 28%, #010416 68%, #000105 100%)
          `
        }}
      />

      {/* 2. Primary Layered Cosmic Gas Cloud Texture Overlay */}
      <div 
        ref={nebulaPrimaryRef}
        className="absolute -inset-8 pointer-events-none z-[2] opacity-45 mix-blend-screen transition-transform duration-500 ease-out will-change-transform"
        style={{
          backgroundImage: 'url(/assets/purple-nebula-texture.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 70%',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* 3. Secondary Deep Volumetric Gas & Filament Texture Overlay (Adds rich depth & filaments) */}
      <div 
        ref={nebulaDeepRef}
        className="absolute -inset-10 pointer-events-none z-[3] opacity-42 mix-blend-screen transition-transform duration-700 ease-out will-change-transform"
        style={{
          backgroundImage: 'url(/assets/purple-nebula-deep.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 65%',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* 4. Photorealistic Cinematic Space Canvas (Stars, Planet Horizon, Subtle Secondary Nebula) */}
      <div 
        ref={canvasWrapperRef}
        className="absolute -inset-4 pointer-events-none z-[4] transition-transform duration-300 ease-out will-change-transform"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover pointer-events-none"
        />
      </div>

      {/* 5. Deep Contrast Vignette (Preserving dark cinematic theme & high foreground contrast for left text, while letting Earth horizon shine brilliantly) */}
      <div 
        className="absolute inset-0 pointer-events-none z-[5]"
        style={{
          background: `
            radial-gradient(ellipse 120% 65% at 50% 36%, transparent 45%, rgba(0, 1, 5, 0.42) 78%, rgba(0, 1, 4, 0.85) 100%),
            linear-gradient(90deg, rgba(0, 1, 5, 0.85) 0%, rgba(0, 1, 5, 0.35) 30%, transparent 60%)
          `
        }}
      />

      {/* 5. Bottom Planetary Tagline Overlays (Preserved, Perfectly Integrated) */}
      <div className="absolute bottom-2.5 sm:bottom-3.5 inset-x-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 pointer-events-none z-[10]">
        {/* Bottom Left: SAME YOU. BUT MORE POSSIBILITIES. */}
        <div className="flex items-start gap-2 sm:gap-2.5 text-slate-200 font-mono select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          <div className="w-0.5 h-8 sm:h-9 bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,1)] shrink-0" />
          <div className="leading-tight">
            <div className="text-[9.5px] sm:text-[10px] font-extrabold tracking-widest text-white">
              SAME YOU.
            </div>
            <div className="text-[9.5px] sm:text-[10px] font-semibold tracking-wider text-slate-200">
              BUT MORE POSSIBILITIES.
            </div>
            <div className="text-[8.5px] sm:text-[9px] text-slate-400 mt-0.5 font-normal tracking-wide">
              Powered by AI. Built for what's next.
            </div>
          </div>
        </div>

        {/* Bottom Right: LEARN BUILD GROW SUCCEED */}
        <div className="text-[8.5px] sm:text-[9.5px] tracking-[0.25em] sm:tracking-[0.3em] font-mono font-bold text-slate-300 uppercase select-none flex items-center gap-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          <span className="text-cyan-400 text-xs">✦</span>
          <span>LEARN BUILD GROW SUCCEED</span>
        </div>
      </div>
    </div>
  );
};
