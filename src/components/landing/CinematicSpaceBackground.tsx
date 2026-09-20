import React, { useEffect, useRef } from 'react';

export const CinematicSpaceBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;

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
      // 1. BASE DEEP SPACE CANVAS (OBSIDIAN & ULTRA-DEEP MIDNIGHT BLUE)
      // =========================================================================
      const baseGrad = ctx.createLinearGradient(0, 0, 0, height);
      baseGrad.addColorStop(0, '#01030a');
      baseGrad.addColorStop(0.35, '#010617');
      baseGrad.addColorStop(0.7, '#020921');
      baseGrad.addColorStop(1, '#01040f');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // =========================================================================
      // 2. PROCEDURAL GALAXY EMISSION NEBULAE & COSMIC DUST CLOUDS
      // Dense multi-scale soft gas stamps with rich blue, cyan, and violet tones
      // =========================================================================
      ctx.globalCompositeOperation = 'screen';

      // A. Major Galactic Arm sweeping from Upper-Left diagonally to Center & Right
      const nebulaePuffs = [
        // Upper-Right Great Blue Nebula Core
        { x: width * 0.82, y: height * 0.22, r: width * 0.38, col: 'rgba(30, 64, 175, 0.45)' },
        { x: width * 0.78, y: height * 0.18, r: width * 0.28, col: 'rgba(37, 99, 235, 0.55)' },
        { x: width * 0.85, y: height * 0.28, r: width * 0.24, col: 'rgba(14, 165, 233, 0.42)' },
        { x: width * 0.72, y: height * 0.15, r: width * 0.22, col: 'rgba(126, 34, 206, 0.28)' },
        { x: width * 0.90, y: height * 0.35, r: width * 0.30, col: 'rgba(2, 132, 199, 0.38)' },

        // Center Cosmic Cradle (Behind Digital Twin)
        { x: width * 0.52, y: height * 0.38, r: width * 0.32, col: 'rgba(14, 165, 233, 0.40)' },
        { x: width * 0.48, y: height * 0.34, r: width * 0.26, col: 'rgba(37, 99, 235, 0.48)' },
        { x: width * 0.56, y: height * 0.42, r: width * 0.22, col: 'rgba(99, 102, 241, 0.32)' },
        { x: width * 0.50, y: height * 0.28, r: width * 0.20, col: 'rgba(6, 182, 212, 0.35)' },

        // Upper-Left Framing Star Cloud (Subtle to keep text readable)
        { x: width * 0.18, y: height * 0.18, r: width * 0.28, col: 'rgba(30, 58, 138, 0.28)' },
        { x: width * 0.22, y: height * 0.24, r: width * 0.20, col: 'rgba(56, 189, 248, 0.22)' },
        { x: width * 0.12, y: height * 0.12, r: width * 0.22, col: 'rgba(79, 70, 229, 0.18)' },

        // Diagonal Interstellar Bridge
        { x: width * 0.35, y: height * 0.28, r: width * 0.25, col: 'rgba(14, 165, 233, 0.25)' },
        { x: width * 0.65, y: height * 0.25, r: width * 0.28, col: 'rgba(37, 99, 235, 0.35)' },
      ];

      for (const neb of nebulaePuffs) {
        const rad = ctx.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.r);
        rad.addColorStop(0, neb.col);
        rad.addColorStop(0.45, neb.col.replace(/[\d\.]+\)$/, (m) => `${parseFloat(m) * 0.55})`));
        rad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = rad;
        ctx.beginPath();
        ctx.arc(neb.x, neb.y, neb.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // B. Fine Milky Way Cloud Texture (Hundreds of micro-puffs forming realistic gaseous filaments)
      const filamentCount = 280;
      for (let i = 0; i < filamentCount; i++) {
        const t = random();
        // Slanted galactic plane
        const gx = width * (0.15 + t * 0.8 + (random() - 0.5) * 0.22);
        const gy = height * (0.05 + t * 0.6 + (random() - 0.5) * 0.18);
        const gr = 30 + random() * 95;

        // Color variance: electric cyan, cobalt, violet, azure
        const colors = [
          'rgba(56, 189, 248, ',
          'rgba(14, 165, 233, ',
          'rgba(37, 99, 235, ',
          'rgba(99, 102, 241, ',
          'rgba(147, 51, 234, '
        ];
        const colPick = colors[Math.floor(random() * colors.length)];
        const alpha = 0.035 + random() * 0.07;

        const gGrad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        gGrad.addColorStop(0, `${colPick}${alpha * 1.5})`);
        gGrad.addColorStop(0.5, `${colPick}${alpha * 0.6})`);
        gGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gGrad;
        ctx.beginPath();
        ctx.arc(gx, gy, gr, 0, Math.PI * 2);
        ctx.fill();
      }

      // =========================================================================
      // 3. DENSE REALISTIC STARFIELD (3,200+ STARS ACROSS MULTIPLE DEPTH TIERS)
      // =========================================================================
      ctx.globalCompositeOperation = 'source-over';

      const starPalette = ['#ffffff', '#f0f9ff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#c7d2fe', '#fed7aa'];

      // Tier 1: 2,400 Microscopic Background Galaxy Pinpricks
      for (let i = 0; i < 2400; i++) {
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

      // Tier 2: 700 Midground Stellar Navigators
      for (let i = 0; i < 700; i++) {
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

      // Tier 3: 110 Luminous Foreground Stars with Natural Optical Halos
      for (let i = 0; i < 110; i++) {
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
      }

      // =========================================================================
      // 4. SUBTLE SECONDARY PLANET (LOWER RIGHT SKY, PROPORTIONED AS IN REFERENCE)
      // =========================================================================
      const px = width * 0.88;
      const py = height * 0.48;
      const pr = Math.min(width, height) * 0.038; // ~35px

      // Planet Shadow Body
      const pGrad = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.3, 0, px, py, pr);
      pGrad.addColorStop(0, '#334155');
      pGrad.addColorStop(0.4, '#1e293b');
      pGrad.addColorStop(0.8, '#0f172a');
      pGrad.addColorStop(1, '#020617');

      ctx.globalAlpha = 1.0;
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric Rim facing the Horizon Sunrise (Left & Bottom edge)
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.clip();

      const pRim = ctx.createLinearGradient(px + pr, py - pr, px - pr, py + pr);
      pRim.addColorStop(0, 'rgba(0, 0, 0, 0)');
      pRim.addColorStop(0.65, 'rgba(56, 189, 248, 0.2)');
      pRim.addColorStop(0.9, 'rgba(56, 189, 248, 0.85)');
      pRim.addColorStop(1, 'rgba(255, 255, 255, 0.95)');

      ctx.fillStyle = pRim;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Subtle Outer Corona on Planet
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, pr + 0.8, 0, Math.PI * 2);
      ctx.stroke();

      // =========================================================================
      // 5. PHOTOREALISTIC CINEMATIC EARTH FROM ORBIT (LOWER 22-30% OF HERO)
      // Genuine orbital perspective matching NASA space photography:
      // - Realistic planetary curvature with expansive radius
      // - Deep midnight ocean & dark continental landmasses
      // - NASA satellite night city lights mapped along the curved surface
      // - Glistening connected metropolitan transport arteries & micro-pinpoints
      // - Realistic turbulent cloud weather fronts & cyclonic vortex with shadows
      // - Multi-tier electric cyan atmospheric rim following the entire curvature
      // - Physical Rayleigh scattering fading into space
      // =========================================================================

      // Planetary Geometry:
      // Large spherical curvature centered below the screen, creating an authentic
      // orbital view occupying ~27% at apex down to ~16% at screen edges.
      const earthCenterX = width * 0.50;
      const earthRadius = Math.max(width * 1.55, height * 1.95, 1450);
      const earthTopApexY = height * 0.73; // Apex sits at ~73% down the Hero
      const earthCenterY = earthTopApexY + earthRadius;

      // Function to calculate exact Earth horizon Y for any screen X
      const getEarthY = (x: number) => {
        const dx = x - earthCenterX;
        const dySq = earthRadius * earthRadius - dx * dx;
        if (dySq <= 0) return height;
        return earthCenterY - Math.sqrt(dySq);
      };

      // -------------------------------------------------------------------------
      // A. Atmospheric Rayleigh Scattering (Soft cyan/blue exosphere haze)
      // Radiates smoothly above the horizon curve into deep cosmic space
      // -------------------------------------------------------------------------
      ctx.globalCompositeOperation = 'screen';
      const atmoLayers = [
        { offset: 48, alpha: 0.04, color: 'rgba(2, 132, 199, ' },
        { offset: 32, alpha: 0.10, color: 'rgba(14, 165, 233, ' },
        { offset: 18, alpha: 0.20, color: 'rgba(56, 189, 248, ' },
        { offset: 8,  alpha: 0.38, color: 'rgba(103, 232, 249, ' },
        { offset: 2,  alpha: 0.60, color: 'rgba(224, 242, 254, ' },
      ];

      for (const layer of atmoLayers) {
        const grad = ctx.createLinearGradient(0, earthTopApexY - layer.offset, 0, earthTopApexY + 80);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(0.3, `${layer.color}${layer.alpha * 0.6})`);
        grad.addColorStop(0.7, `${layer.color}${layer.alpha})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(earthCenterX, earthCenterY, earthRadius + layer.offset, 0, Math.PI * 2);
        ctx.fill();
      }

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
      oceanGrad.addColorStop(0, '#031024');    // Upper ocean midnight
      oceanGrad.addColorStop(0.35, '#020a1c'); // Deep ocean abyss
      oceanGrad.addColorStop(0.75, '#010512'); // Abyssal plain
      oceanGrad.addColorStop(1, '#000208');    // Deep night shadow

      ctx.fillStyle = oceanGrad;
      ctx.fill();

      // Clip all internal planetary features to Earth's sphere
      ctx.clip();

      // -------------------------------------------------------------------------
      // C. Photorealistic Satellite Night-Lights Layer (NASA Earth at Night)
      // Mapped along the curved horizon using vertical projective strips
      // -------------------------------------------------------------------------
      if (textureLoaded && earthTexture.naturalWidth > 0) {
        ctx.save();
        ctx.globalAlpha = 0.94;
        const stripW = 2.5;
        const numStrips = Math.ceil(width / stripW);
        for (let i = 0; i < numStrips; i++) {
          const x = i * stripW;
          const yTop = getEarthY(x + stripW * 0.5);
          const h = height - yTop + 30;
          const sx = (i / numStrips) * earthTexture.naturalWidth;
          const sw = (stripW / width) * earthTexture.naturalWidth;
          ctx.drawImage(
            earthTexture,
            sx, 0, sw, earthTexture.naturalHeight,
            x, yTop, stripW + 0.5, h
          );
        }
        ctx.restore();
      } else {
        // High-fidelity continental landmass fallback if texture is pending
        ctx.fillStyle = '#051122';
        const fallbackContinents = [
          [
            [width * 0.04, earthTopApexY + 80],
            [width * 0.12, earthTopApexY + 45],
            [width * 0.22, earthTopApexY + 38],
            [width * 0.32, earthTopApexY + 55],
            [width * 0.26, earthTopApexY + 95],
            [width * 0.10, earthTopApexY + 110],
          ],
          [
            [width * 0.38, earthTopApexY + 52],
            [width * 0.48, earthTopApexY + 32],
            [width * 0.58, earthTopApexY + 40],
            [width * 0.52, earthTopApexY + 85],
            [width * 0.42, earthTopApexY + 90],
          ],
          [
            [width * 0.65, earthTopApexY + 48],
            [width * 0.76, earthTopApexY + 30],
            [width * 0.88, earthTopApexY + 44],
            [width * 0.98, earthTopApexY + 75],
            [width * 0.86, earthTopApexY + 105],
            [width * 0.72, earthTopApexY + 95],
          ],
        ];
        for (const poly of fallbackContinents) {
          ctx.beginPath();
          ctx.moveTo(poly[0][0], poly[0][1]);
          for (let i = 1; i < poly.length; i++) {
            ctx.lineTo(poly[i][0], poly[i][1]);
          }
          ctx.closePath();
          ctx.fill();
        }
      }

      // -------------------------------------------------------------------------
      // D. Connected Night-Side City Lights & Metropolitan Transport Networks
      // Authentic golden/amber webs, glowing megalopolises, branching transit veins
      // -------------------------------------------------------------------------
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      // 1. Fine Branching Transit Corridors & Road Networks (Hairline 0.7px)
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.lineWidth = 0.7;

      const arterialRoutes = [
        // Western network
        [
          [width * 0.08, earthTopApexY + 72],
          [width * 0.13, earthTopApexY + 52],
          [width * 0.18, earthTopApexY + 44],
          [width * 0.24, earthTopApexY + 48],
          [width * 0.29, earthTopApexY + 62],
        ],
        [
          [width * 0.18, earthTopApexY + 44],
          [width * 0.21, earthTopApexY + 66],
          [width * 0.25, earthTopApexY + 82],
        ],
        // Central corridor
        [
          [width * 0.40, earthTopApexY + 54],
          [width * 0.45, earthTopApexY + 38],
          [width * 0.50, earthTopApexY + 32],
          [width * 0.55, earthTopApexY + 42],
          [width * 0.60, earthTopApexY + 58],
        ],
        [
          [width * 0.50, earthTopApexY + 32],
          [width * 0.52, earthTopApexY + 60],
          [width * 0.49, earthTopApexY + 80],
        ],
        // Eastern megalopolis network
        [
          [width * 0.66, earthTopApexY + 56],
          [width * 0.72, earthTopApexY + 40],
          [width * 0.78, earthTopApexY + 32],
          [width * 0.84, earthTopApexY + 38],
          [width * 0.90, earthTopApexY + 54],
          [width * 0.95, earthTopApexY + 74],
        ],
        [
          [width * 0.78, earthTopApexY + 32],
          [width * 0.82, earthTopApexY + 58],
          [width * 0.86, earthTopApexY + 76],
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

      // Secondary micro-capillary feeders
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.28)';
      ctx.lineWidth = 0.45;
      for (const route of arterialRoutes) {
        ctx.beginPath();
        for (let i = 0; i < route.length - 1; i++) {
          const p1 = route[i];
          const p2 = route[i + 1];
          const midX = (p1[0] + p2[0]) * 0.5;
          const midY = (p1[1] + p2[1]) * 0.5;
          const ox = midX + (random() - 0.5) * 12;
          const oy = midY + (random() - 0.5) * 10;
          ctx.moveTo(midX, midY);
          ctx.lineTo(ox, oy);
        }
        ctx.stroke();
      }

      // 2. Crisp Micro-Pinpoints at Key Metropolitan Hubs (Radii 0.8 - 1.6px, zero oversized discs)
      const hubPoints = [
        { x: width * 0.13, y: earthTopApexY + 52, r: 1.4 },
        { x: width * 0.18, y: earthTopApexY + 44, r: 1.6 },
        { x: width * 0.24, y: earthTopApexY + 48, r: 1.2 },
        { x: width * 0.21, y: earthTopApexY + 66, r: 1.1 },
        { x: width * 0.45, y: earthTopApexY + 38, r: 1.5 },
        { x: width * 0.50, y: earthTopApexY + 32, r: 1.6 },
        { x: width * 0.55, y: earthTopApexY + 42, r: 1.3 },
        { x: width * 0.52, y: earthTopApexY + 60, r: 1.0 },
        { x: width * 0.72, y: earthTopApexY + 40, r: 1.5 },
        { x: width * 0.78, y: earthTopApexY + 32, r: 1.6 },
        { x: width * 0.84, y: earthTopApexY + 38, r: 1.5 },
        { x: width * 0.90, y: earthTopApexY + 54, r: 1.3 },
        { x: width * 0.82, y: earthTopApexY + 58, r: 1.1 },
      ];

      for (const hub of hubPoints) {
        // Incandescent micro-core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, hub.r, 0, Math.PI * 2);
        ctx.fill();

        // Very tight golden sodium-vapor fringe (max 2.8px radius)
        ctx.fillStyle = 'rgba(251, 191, 36, 0.45)';
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, hub.r * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // -------------------------------------------------------------------------
      // E. Realistic Atmospheric Clouds (Orbital Weather Systems)
      // Delicate semi-translucent wisps with realistic planetary shadows underneath
      // -------------------------------------------------------------------------
      ctx.save();

      // 1. Cloud Ground Shadow Layer (Casting soft shadows 3.2px below onto oceans & terrain)
      ctx.fillStyle = 'rgba(0, 3, 10, 0.35)';
      const cloudPuffs = [
        // Equatorial weather deck (curving with latitude)
        { x: width * 0.16, y: earthTopApexY + 32, rx: 55, ry: 14, rot: -0.04 },
        { x: width * 0.28, y: earthTopApexY + 28, rx: 65, ry: 15, rot: -0.02 },
        { x: width * 0.42, y: earthTopApexY + 24, rx: 70, ry: 16, rot: 0.00 },
        { x: width * 0.58, y: earthTopApexY + 26, rx: 75, ry: 15, rot: 0.02 },
        { x: width * 0.74, y: earthTopApexY + 28, rx: 80, ry: 16, rot: 0.04 },
        { x: width * 0.88, y: earthTopApexY + 36, rx: 60, ry: 15, rot: 0.06 },

        // Mid-latitude storm clouds
        { x: width * 0.22, y: earthTopApexY + 64, rx: 60, ry: 18, rot: -0.03 },
        { x: width * 0.48, y: earthTopApexY + 58, rx: 70, ry: 19, rot: 0.01 },
        { x: width * 0.68, y: earthTopApexY + 66, rx: 65, ry: 18, rot: 0.03 },
        { x: width * 0.84, y: earthTopApexY + 74, rx: 55, ry: 17, rot: 0.05 },

        // Oceanic wisps
        { x: width * 0.35, y: earthTopApexY + 92, rx: 80, ry: 20, rot: -0.02 },
        { x: width * 0.62, y: earthTopApexY + 96, rx: 85, ry: 22, rot: 0.02 },
      ];

      // Draw shadows slightly offset
      for (const cp of cloudPuffs) {
        ctx.beginPath();
        ctx.ellipse(cp.x, cp.y + 3.2, cp.rx * 0.95, cp.ry * 0.95, cp.rot, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Cyclonic Low-Pressure Vortex over Ocean (Logarithmic spiral storm)
      const cycloneX = width * 0.34;
      const cycloneY = earthTopApexY + 52;
      ctx.fillStyle = 'rgba(235, 243, 255, 0.18)';
      for (let arm = 0; arm < 3; arm++) {
        const startAng = arm * (Math.PI * 2 / 3);
        for (let st = 0; st < 24; st++) {
          const rad = 4 + st * 2.2;
          const ang = startAng + st * 0.16;
          const cx = cycloneX + Math.cos(ang) * rad * 1.5;
          const cy = cycloneY + Math.sin(ang) * rad * 0.6;
          const r = 2.0 + st * 0.3;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Semi-Translucent Cloud Formations
      for (const cp of cloudPuffs) {
        // Outer soft wisp
        ctx.fillStyle = 'rgba(230, 240, 255, 0.14)';
        ctx.beginPath();
        ctx.ellipse(cp.x, cp.y, cp.rx, cp.ry, cp.rot, 0, Math.PI * 2);
        ctx.fill();

        // Inner denser cloud core
        ctx.fillStyle = 'rgba(245, 250, 255, 0.22)';
        ctx.beginPath();
        ctx.ellipse(cp.x + 3, cp.y - 1.5, cp.rx * 0.55, cp.ry * 0.5, cp.rot, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Subtle High-Altitude Cirrus Streaks (Jet Stream)
      ctx.strokeStyle = 'rgba(235, 245, 255, 0.12)';
      ctx.lineWidth = 1.2;
      const cirrusTracks = [
        [
          [width * 0.10, earthTopApexY + 22],
          [width * 0.25, earthTopApexY + 18],
          [width * 0.40, earthTopApexY + 15],
          [width * 0.55, earthTopApexY + 17],
        ],
        [
          [width * 0.52, earthTopApexY + 45],
          [width * 0.68, earthTopApexY + 48],
          [width * 0.82, earthTopApexY + 54],
          [width * 0.94, earthTopApexY + 65],
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
      // F. Razor-Sharp Electric Cyan & Dazzling White Atmospheric Limb Edge
      // Multi-layer optical edge following Earth's spherical curvature exactly
      // -------------------------------------------------------------------------
      ctx.globalCompositeOperation = 'screen';
      ctx.save();

      // Broad outer atmospheric glow line
      const outerRimGrad = ctx.createLinearGradient(0, 0, width, 0);
      outerRimGrad.addColorStop(0, 'rgba(2, 132, 199, 0.4)');
      outerRimGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.95)');
      outerRimGrad.addColorStop(0.63, 'rgba(255, 255, 255, 1.0)');
      outerRimGrad.addColorStop(0.75, 'rgba(103, 232, 249, 0.95)');
      outerRimGrad.addColorStop(1, 'rgba(37, 99, 235, 0.45)');

      ctx.strokeStyle = outerRimGrad;
      ctx.lineWidth = 5.0;
      ctx.beginPath();
      ctx.arc(earthCenterX, earthCenterY, earthRadius + 0.5, 0, Math.PI * 2);
      ctx.stroke();

      // Sharp electric cyan mid line
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.95)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(earthCenterX, earthCenterY, earthRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Dazzling pure white razor-edge
      ctx.strokeStyle = 'rgba(255, 255, 255, 1.0)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(earthCenterX, earthCenterY, earthRadius - 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // =========================================================================
      // 6. CINEMATIC SUNRISE EMERGING DIRECTLY FROM BEHIND THE HORIZON
      // Positioned on the Earth's curved limb at ~63% width (no floating star)
      // Includes crepuscular light rays, warm atmospheric interface, anamorphic flare
      // =========================================================================
      const sunriseX = width * 0.63;
      const sunriseY = getEarthY(sunriseX); // Pins sunrise EXACTLY onto the horizon curve!

      // A. Crepuscular Volumetric Light Rays (Subtle solar fan radiating into deep space)
      ctx.globalCompositeOperation = 'screen';
      const rayAngles = [-0.65, -0.48, -0.32, -0.16, 0.0, 0.16, 0.32, 0.48, 0.65];
      const rayLength = Math.min(width * 0.42, 420);

      for (const ang of rayAngles) {
        const endX = sunriseX + Math.sin(ang) * rayLength;
        const endY = sunriseY - Math.cos(ang) * rayLength * 0.85;

        const rayGrad = ctx.createLinearGradient(sunriseX, sunriseY, endX, endY);
        rayGrad.addColorStop(0, 'rgba(186, 230, 253, 0.28)');
        rayGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.12)');
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
      const warmDawnGrad = ctx.createRadialGradient(sunriseX, sunriseY, 0, sunriseX, sunriseY, 90);
      warmDawnGrad.addColorStop(0, 'rgba(255, 247, 237, 0.95)');
      warmDawnGrad.addColorStop(0.25, 'rgba(254, 215, 170, 0.55)');
      warmDawnGrad.addColorStop(0.55, 'rgba(251, 146, 60, 0.25)');
      warmDawnGrad.addColorStop(0.85, 'rgba(249, 115, 22, 0.08)');
      warmDawnGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = warmDawnGrad;
      ctx.beginPath();
      ctx.arc(sunriseX, sunriseY, 90, 0, Math.PI * 2);
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
      flareGrad.addColorStop(0.2, 'rgba(56, 189, 248, 0.28)');
      flareGrad.addColorStop(0.42, 'rgba(186, 230, 253, 0.85)');
      flareGrad.addColorStop(0.50, 'rgba(255, 255, 255, 1.0)');
      flareGrad.addColorStop(0.58, 'rgba(186, 230, 253, 0.85)');
      flareGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.28)');
      flareGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = flareGrad;
      ctx.beginPath();
      ctx.ellipse(sunriseX, sunriseY, flareWidth * 0.5, 5.0, -0.02, 0, Math.PI * 2);
      ctx.fill();

      // D. Concentric Solar Corona Wash
      const coronaGrad = ctx.createRadialGradient(sunriseX, sunriseY, 0, sunriseX, sunriseY, 130);
      coronaGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      coronaGrad.addColorStop(0.2, 'rgba(224, 242, 254, 0.85)');
      coronaGrad.addColorStop(0.45, 'rgba(56, 189, 248, 0.55)');
      coronaGrad.addColorStop(0.75, 'rgba(2, 132, 199, 0.22)');
      coronaGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');

      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(sunriseX, sunriseY, 130, 0, Math.PI * 2);
      ctx.fill();

      // E. Blinding Solar Core Emerging Directly over the Horizon Edge
      const sunCoreGrad = ctx.createRadialGradient(sunriseX, sunriseY, 0, sunriseX, sunriseY, 28);
      sunCoreGrad.addColorStop(0, '#ffffff');
      sunCoreGrad.addColorStop(0.45, '#e0f2fe');
      sunCoreGrad.addColorStop(0.80, '#38bdf8');
      sunCoreGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = sunCoreGrad;
      ctx.beginPath();
      ctx.arc(sunriseX, sunriseY, 28, 0, Math.PI * 2);
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

    const onResize = () => {
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(render);
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* 1. Photorealistic Cinematic Space Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* 2. Bottom Planetary Tagline Overlays (Preserved, Perfectly Integrated) */}
      <div className="absolute bottom-5 sm:bottom-7 inset-x-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pointer-events-none z-[10]">
        {/* Bottom Left: SAME YOU. BUT MORE POSSIBILITIES. */}
        <div className="flex items-start gap-2.5 sm:gap-3 text-slate-200 font-mono select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          <div className="w-0.5 h-9 sm:h-10 bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,1)] shrink-0" />
          <div className="leading-tight">
            <div className="text-[10px] sm:text-[11px] font-extrabold tracking-widest text-white">
              SAME YOU.
            </div>
            <div className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-200">
              BUT MORE POSSIBILITIES.
            </div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 font-normal tracking-wide">
              Powered by AI. Built for what's next.
            </div>
          </div>
        </div>

        {/* Bottom Right: LEARN BUILD GROW SUCCEED */}
        <div className="text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] font-mono font-bold text-slate-300 uppercase select-none flex items-center gap-1.5 sm:gap-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          <span className="text-cyan-400 text-xs">✦</span>
          <span>LEARN BUILD GROW SUCCEED</span>
        </div>
      </div>
    </div>
  );
};
