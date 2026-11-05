import React, { useEffect, useRef } from 'react';

// Dedicated festive floating particle types
interface FloatingGhost {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bobOffset: number;
  bobSpeed: number;
  scale: number;
  alpha: number;
  eyeLook: number;
  tailWiggle: number;
  rotation: number;
}

interface FloatingPumpkin {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bobOffset: number;
  bobSpeed: number;
  scale: number;
  alpha: number;
  rotation: number;
  rotSpeed: number;
  glowFlicker: number;
}

interface PumpkinPortal {
  x: number;
  y: number;
  scale: number;
  state: 'APPEARING' | 'PORTAL_OPEN' | 'CLOSING';
  timer: number;
  portalRotation: number;
  hasSpawnedRunners: boolean;
  glowIntensity: number;
}

interface Runner {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gender: 'man' | 'woman';
  frame: number;
  strideSpeed: number;
  scale: number;
  alpha: number;
  exclamation?: string;
  exclamationTimer: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
}

interface EnchantedRealmBackgroundProps {
  enabled?: boolean;
}

export const EnchantedRealmBackground: React.FC<EnchantedRealmBackgroundProps> = ({ enabled = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Entity collections
    const floatingGhosts: FloatingGhost[] = [];
    const floatingPumpkins: FloatingPumpkin[] = [];
    const portals: PumpkinPortal[] = [];
    const runners: Runner[] = [];
    const particles: Particle[] = [];

    // Helper to spawn a floating ghost
    const createGhost = (initialX?: number, initialY?: number): FloatingGhost => {
      const dir = Math.random() > 0.4 ? 1 : -1;
      return {
        x: initialX !== undefined ? initialX : Math.random() * width,
        y: initialY !== undefined ? initialY : Math.random() * height,
        vx: (0.45 + Math.random() * 0.75) * dir,
        vy: -0.15 - Math.random() * 0.35, // gentle buoyant drift upward and across
        bobOffset: Math.random() * Math.PI * 2,
        bobSpeed: 0.025 + Math.random() * 0.02,
        scale: 0.45 + Math.random() * 0.45, // tiny to small
        alpha: 0.65 + Math.random() * 0.3,
        eyeLook: dir,
        tailWiggle: Math.random() * Math.PI,
        rotation: (Math.random() - 0.5) * 0.15
      };
    };

    // Helper to spawn a floating festive pumpkin
    const createPumpkin = (initialX?: number, initialY?: number): FloatingPumpkin => {
      const dir = Math.random() > 0.5 ? 1 : -1;
      return {
        x: initialX !== undefined ? initialX : Math.random() * width,
        y: initialY !== undefined ? initialY : Math.random() * height,
        vx: (0.35 + Math.random() * 0.6) * dir,
        vy: -0.2 - Math.random() * 0.4, // gentle balloon-like float
        bobOffset: Math.random() * Math.PI * 2,
        bobSpeed: 0.02 + Math.random() * 0.02,
        scale: 0.4 + Math.random() * 0.35, // small decorative pumpkins
        alpha: 0.75 + Math.random() * 0.25,
        rotation: (Math.random() - 0.5) * 0.2,
        rotSpeed: (Math.random() - 0.5) * 0.015,
        glowFlicker: Math.random() * Math.PI
      };
    };

    // Populate initial festive floating ghosts (14 entities)
    for (let i = 0; i < 14; i++) {
      floatingGhosts.push(createGhost());
    }

    // Populate initial festive small floating pumpkins (12 entities)
    for (let i = 0; i < 12; i++) {
      floatingPumpkins.push(createPumpkin());
    }

    // Ambient embers
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.3 - Math.random() * 0.5,
        alpha: Math.random() * 0.6 + 0.2,
        size: Math.random() * 2 + 0.8,
        color: Math.random() > 0.5 ? '#f59e0b' : '#c084fc'
      });
    }

    // Spooky Burst Listener (triggered on character generation)
    const handleSpookyBurst = () => {
      // Spawn extra festive ghosts and mini pumpkins near the center
      const centerX = width * 0.5 + (Math.random() - 0.5) * 300;
      const centerY = height * 0.6 + (Math.random() - 0.5) * 150;
      for (let i = 0; i < 4; i++) {
        const g = createGhost(centerX + (Math.random() - 0.5) * 120, centerY + (Math.random() - 0.5) * 80);
        g.vy = -1.2 - Math.random() * 0.8;
        floatingGhosts.push(g);
      }
      for (let i = 0; i < 3; i++) {
        const p = createPumpkin(centerX + (Math.random() - 0.5) * 120, centerY + (Math.random() - 0.5) * 80);
        p.vy = -1.1 - Math.random() * 0.7;
        floatingPumpkins.push(p);
      }
    };
    window.addEventListener('spooky-burst', handleSpookyBurst);

    // Periodic Pumpkin Portal spawner for escaping runners
    let portalTimer = 0;
    const spawnPumpkinPortal = () => {
      const onLeft = Math.random() > 0.35;
      const x = onLeft ? 70 + Math.random() * (width * 0.2) : width - (70 + Math.random() * (width * 0.2));
      const y = height - (90 + Math.random() * 100);

      portals.push({
        x,
        y,
        scale: 0.85 + Math.random() * 0.25,
        state: 'APPEARING',
        timer: 0,
        portalRotation: 0,
        hasSpawnedRunners: false,
        glowIntensity: 0
      });
    };

    setTimeout(spawnPumpkinPortal, 1200);

    const exclamations = ['Run!', 'Flee!', 'Ghosts!', 'To the Forge!', 'Hurry!'];

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Periodic portal spawner
      portalTimer++;
      if (portalTimer > 500 && portals.length < 2) {
        spawnPumpkinPortal();
        portalTimer = 0;
      }

      // 1. Draw Ambient Embers
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Render Festive Small Floating Pumpkins
      for (let i = floatingPumpkins.length - 1; i >= 0; i--) {
        const p = floatingPumpkins[i];
        p.x += p.vx;
        p.y += p.vy + Math.sin(p.bobOffset) * 0.35;
        p.bobOffset += p.bobSpeed;
        p.rotation += p.rotSpeed;
        p.glowFlicker += 0.08;

        // Wrap around viewport boundaries
        if (p.x > width + 60) p.x = -50;
        if (p.x < -60) p.x = width + 50;
        if (p.y < -60) {
          p.y = height + 40;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(p.scale, p.scale);
        ctx.globalAlpha = p.alpha;

        // Pumpkin Warm Golden Halo
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12 + Math.sin(p.glowFlicker) * 4;

        // Main Pumpkin Body
        const pumpkinGrad = ctx.createRadialGradient(-6, -6, 2, 0, 0, 24);
        pumpkinGrad.addColorStop(0, '#fb923c');
        pumpkinGrad.addColorStop(0.7, '#ea580c');
        pumpkinGrad.addColorStop(1, '#9a3412');

        ctx.fillStyle = pumpkinGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ribbed side lobes
        ctx.fillStyle = '#c2410c';
        ctx.beginPath();
        ctx.ellipse(-12, 0, 14, 17, -0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(12, 0, 14, 17, 0.15, 0, Math.PI * 2);
        ctx.fill();

        // Green Stem
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.moveTo(-3, -16);
        ctx.bezierCurveTo(-4, -24, 4, -26, 3, -28);
        ctx.lineTo(1, -28);
        ctx.bezierCurveTo(2, -22, -6, -20, -1, -16);
        ctx.fill();

        // Carved Glowing Eyes and Smile
        const flickerIntensity = 0.85 + Math.sin(p.glowFlicker) * 0.15;
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 8 * flickerIntensity;
        ctx.fillStyle = `rgba(254, 240, 138, ${flickerIntensity})`;

        // Left Eye
        ctx.beginPath();
        ctx.moveTo(-10, -6);
        ctx.lineTo(-4, -8);
        ctx.lineTo(-6, -2);
        ctx.closePath();
        ctx.fill();

        // Right Eye
        ctx.beginPath();
        ctx.moveTo(10, -6);
        ctx.lineTo(4, -8);
        ctx.lineTo(6, -2);
        ctx.closePath();
        ctx.fill();

        // Carved Toothy Smile
        ctx.beginPath();
        ctx.moveTo(-12, 4);
        ctx.lineTo(-7, 9);
        ctx.lineTo(-4, 5);
        ctx.lineTo(0, 10);
        ctx.lineTo(4, 5);
        ctx.lineTo(7, 9);
        ctx.lineTo(12, 4);
        ctx.lineTo(8, 12);
        ctx.lineTo(-8, 12);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // 3. Render Tiny White Floating Ghosts
      for (let i = floatingGhosts.length - 1; i >= 0; i--) {
        const g = floatingGhosts[i];
        g.x += g.vx;
        g.y += g.vy + Math.sin(g.bobOffset) * 0.45;
        g.bobOffset += g.bobSpeed;
        g.tailWiggle += 0.14;

        // Wrap around screen edges
        if (g.x > width + 60) g.x = -50;
        if (g.x < -60) g.x = width + 50;
        if (g.y < -60) {
          g.y = height + 40;
          g.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.rotate(g.rotation);
        ctx.scale(g.scale, g.scale);
        ctx.globalAlpha = g.alpha;

        // Soft white ethereal glow
        ctx.shadowColor = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowBlur = 14;

        // Cute Translucent White Floating Ghost Body
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        // Head dome
        ctx.arc(0, -12, 11, Math.PI, 0, false);
        // Right side down to wavy hem
        ctx.lineTo(11, 8);
        // Wavy drifting tail
        const w1 = Math.sin(g.tailWiggle) * 3.5;
        const w2 = Math.sin(g.tailWiggle + 1.5) * 3.5;
        const w3 = Math.sin(g.tailWiggle + 3) * 3.5;
        ctx.quadraticCurveTo(7 + w1, 15, 3, 8);
        ctx.quadraticCurveTo(0 + w2, 15, -4, 8);
        ctx.quadraticCurveTo(-8 + w3, 15, -11, 8);
        ctx.closePath();
        ctx.fill();

        // Cute Dark Eyes
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0f172a';
        const eyeShift = g.vx > 0 ? 1.5 : -1.5;

        ctx.beginPath();
        ctx.arc(-4 + eyeShift, -12, 1.8, 0, Math.PI * 2);
        ctx.arc(4 + eyeShift, -12, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Cute pink blush cheeks
        ctx.fillStyle = 'rgba(244, 114, 182, 0.6)';
        ctx.beginPath();
        ctx.arc(-6 + eyeShift, -8, 1.5, 0, Math.PI * 2);
        ctx.arc(6 + eyeShift, -8, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 4. Render Portals & Escaping Runners (Enchanted Realm feature)
      for (let i = portals.length - 1; i >= 0; i--) {
        const p = portals[i];
        p.timer++;
        p.portalRotation += 0.04;

        if (p.state === 'APPEARING') {
          p.glowIntensity = Math.min(1, p.timer / 40);
          if (p.timer > 45) {
            p.state = 'PORTAL_OPEN';
            p.timer = 0;
          }
        } else if (p.state === 'PORTAL_OPEN') {
          if (!p.hasSpawnedRunners && p.timer > 20) {
            p.hasSpawnedRunners = true;
            const runDir = p.x < width / 2 ? 1 : -1;

            // Spawn Athletic Man runner
            runners.push({
              x: p.x,
              y: p.y - 10,
              vx: (3.2 + Math.random() * 0.7) * runDir,
              vy: -0.2,
              gender: 'man',
              frame: 0,
              strideSpeed: 0.28,
              scale: 0.9,
              alpha: 1,
              exclamation: exclamations[Math.floor(Math.random() * exclamations.length)],
              exclamationTimer: 70
            });

            // Spawn Athletic Woman runner right behind
            setTimeout(() => {
              runners.push({
                x: p.x - runDir * 20,
                y: p.y - 12,
                vx: (3.4 + Math.random() * 0.6) * runDir,
                vy: -0.2,
                gender: 'woman',
                frame: 0,
                strideSpeed: 0.3,
                scale: 0.88,
                alpha: 1,
                exclamation: 'Hurry!',
                exclamationTimer: 60
              });
            }, 250);
          }

          if (p.timer > 160) {
            p.state = 'CLOSING';
            p.timer = 0;
          }
        } else if (p.state === 'CLOSING') {
          p.glowIntensity = Math.max(0, 1 - p.timer / 40);
          if (p.timer > 45) {
            portals.splice(i, 1);
            continue;
          }
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(p.scale, p.scale);

        // Portal Swirling Vortex
        if (p.state === 'PORTAL_OPEN' || p.state === 'CLOSING') {
          const portalRadius = 38 * (p.state === 'CLOSING' ? p.glowIntensity : Math.min(1, p.timer / 25));

          ctx.save();
          ctx.translate(0, -35);
          ctx.rotate(p.portalRotation);

          const portalGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, portalRadius);
          portalGrad.addColorStop(0, '#e879f9');
          portalGrad.addColorStop(0.5, '#818cf8');
          portalGrad.addColorStop(0.8, '#38bdf8');
          portalGrad.addColorStop(1, 'transparent');

          ctx.fillStyle = portalGrad;
          ctx.beginPath();
          ctx.arc(0, 0, portalRadius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.lineWidth = 1.5;
          for (let r = 0; r < 4; r++) {
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            ctx.arc(0, 0, portalRadius * 0.7, 0, Math.PI * 0.4);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Ground Enchanted Pumpkin
        ctx.globalAlpha = p.glowIntensity;
        const pumpkinGrad = ctx.createRadialGradient(-10, -10, 5, 0, 0, 35);
        pumpkinGrad.addColorStop(0, '#f97316');
        pumpkinGrad.addColorStop(0.7, '#ea580c');
        pumpkinGrad.addColorStop(1, '#9a3412');

        ctx.fillStyle = pumpkinGrad;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 15 * p.glowIntensity;

        ctx.beginPath();
        ctx.ellipse(0, 0, 36, 28, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#c2410c';
        ctx.beginPath();
        ctx.ellipse(-18, 0, 20, 26, -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(18, 0, 20, 26, 0.15, 0, Math.PI * 2);
        ctx.fill();

        // Stem
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.moveTo(-4, -26);
        ctx.bezierCurveTo(-6, -38, 8, -40, 6, -42);
        ctx.lineTo(2, -42);
        ctx.bezierCurveTo(4, -36, -8, -34, -2, -26);
        ctx.fill();

        // Glowing Face
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#fef08a';

        ctx.beginPath();
        ctx.moveTo(-16, -10);
        ctx.lineTo(-8, -14);
        ctx.lineTo(-10, -6);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(16, -10);
        ctx.lineTo(8, -14);
        ctx.lineTo(10, -6);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-20, 6);
        ctx.lineTo(-12, 14);
        ctx.lineTo(-6, 8);
        ctx.lineTo(0, 15);
        ctx.lineTo(6, 8);
        ctx.lineTo(12, 14);
        ctx.lineTo(20, 6);
        ctx.lineTo(14, 18);
        ctx.lineTo(-14, 18);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // 5. Render Athletic Runners
      for (let i = runners.length - 1; i >= 0; i--) {
        const r = runners[i];
        r.x += r.vx;
        r.y += r.vy;
        r.frame += r.strideSpeed;

        if (r.x < -100 || r.x > width + 100) {
          runners.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(r.x, r.y);
        const facing = r.vx > 0 ? 1 : -1;
        ctx.scale(r.scale * facing, r.scale);

        const cycle = r.frame;
        const legLeft = Math.sin(cycle) * 0.7;
        const legRight = Math.sin(cycle + Math.PI) * 0.7;
        const armLeft = Math.sin(cycle + Math.PI) * 0.75;
        const armRight = Math.sin(cycle) * 0.75;
        const torsoLean = 0.22;
        const bob = Math.abs(Math.sin(cycle * 2)) * 3;

        ctx.translate(0, -bob);

        const skinColor = '#fed7aa';
        const hairColor = r.gender === 'man' ? '#78350f' : '#b45309';
        const outfitColor = r.gender === 'man' ? '#0284c7' : '#059669';
        const pantsColor = '#1e293b';

        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Back Arm
        ctx.strokeStyle = skinColor;
        ctx.beginPath();
        ctx.moveTo(0, -32);
        const backElbowX = Math.sin(armRight) * 12;
        const backElbowY = -22 + Math.cos(armRight) * 8;
        ctx.lineTo(backElbowX, backElbowY);
        ctx.lineTo(backElbowX + Math.sin(armRight + 0.4) * 10, backElbowY + 8);
        ctx.stroke();

        // Back Leg
        ctx.strokeStyle = pantsColor;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        const backKneeX = Math.sin(legRight) * 14;
        const backKneeY = -8 + Math.cos(legRight) * 10;
        ctx.lineTo(backKneeX, backKneeY);
        ctx.lineTo(backKneeX + Math.sin(legRight + 0.5) * 14, backKneeY + 12);
        ctx.stroke();

        // Athletic Torso
        ctx.save();
        ctx.rotate(torsoLean);

        ctx.fillStyle = outfitColor;
        ctx.beginPath();
        ctx.roundRect(-7, -35, 14, 20, 3);
        ctx.fill();

        ctx.fillStyle = '#d97706';
        ctx.fillRect(-7, -18, 14, 3);

        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(3, -42, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = hairColor;
        if (r.gender === 'man') {
          ctx.beginPath();
          ctx.arc(2, -44, 7.5, Math.PI, Math.PI * 2);
          ctx.lineTo(-7, -40);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(2, -44, 7.5, Math.PI * 0.8, Math.PI * 2);
          ctx.lineTo(-6, -40);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(-4, -42);
          ctx.quadraticCurveTo(-16 + Math.sin(cycle) * 3, -40, -22, -35);
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = hairColor;
          ctx.stroke();
        }

        ctx.restore();

        // Front Leg
        ctx.strokeStyle = pantsColor;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(2, -18);
        const frontKneeX = Math.sin(legLeft) * 15;
        const frontKneeY = -8 + Math.cos(legLeft) * 11;
        ctx.lineTo(frontKneeX, frontKneeY);
        ctx.lineTo(frontKneeX + Math.sin(legLeft + 0.4) * 15, frontKneeY + 12);
        ctx.stroke();

        // Front Arm
        ctx.strokeStyle = skinColor;
        ctx.beginPath();
        ctx.moveTo(3, -32);
        const frontElbowX = Math.sin(armLeft) * 13;
        const frontElbowY = -22 + Math.cos(armLeft) * 9;
        ctx.lineTo(frontElbowX, frontElbowY);
        ctx.lineTo(frontElbowX + Math.sin(armLeft + 0.4) * 11, frontElbowY + 8);
        ctx.stroke();

        // Speech Bubble
        if (r.exclamation && r.exclamationTimer > 0) {
          r.exclamationTimer--;
          ctx.save();
          ctx.scale(facing, 1);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
          ctx.font = 'bold 10px monospace';
          const txtWidth = ctx.measureText(r.exclamation).width;
          ctx.beginPath();
          ctx.roundRect(-txtWidth / 2 - 4, -62, txtWidth + 8, 16, 4);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.fillText(r.exclamation, -txtWidth / 2, -50);
          ctx.restore();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('spooky-burst', handleSpookyBurst);
      cancelAnimationFrame(animId);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ mixBlendMode: 'screen' }}
      aria-hidden="true"
    />
  );
};
