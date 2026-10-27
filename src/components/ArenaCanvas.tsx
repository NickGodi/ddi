import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Point, SimulationResult, Explosion, Projectile } from '../types';
import { simulateTrajectory } from '../formulas';
import { Crosshair, Move, Sparkles, Volume2, VolumeX, Eye, ShieldAlert, Target } from 'lucide-react';

interface ArenaCanvasProps {
  playerPos: Point;
  targetPos: Point;
  onPlayerPosChange: (pos: Point) => void;
  onTargetPosChange: (pos: Point) => void;
  angle: number;
  power: number;
  wind: number;
  facingRight: boolean;
  showThreeLines: boolean;
  onToggleThreeLines: () => void;
  onFire: () => void;
  isFiring: boolean;
  lang: 'pt' | 'en';
}

export const ArenaCanvas: React.FC<ArenaCanvasProps> = ({
  playerPos,
  targetPos,
  onPlayerPosChange,
  onTargetPosChange,
  angle,
  power,
  wind,
  facingRight,
  showThreeLines,
  onToggleThreeLines,
  onFire,
  isFiring,
  lang,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Interaction mode: 'none' | 'dragging_player' | 'dragging_target'
  const [dragMode, setDragMode] = useState<'none' | 'player' | 'target'>('none');
  const [activeTool, setActiveTool] = useState<'select' | 'place_player' | 'place_target'>('select');
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<Array<{ id: string; text: string; x: number; y: number; opacity: number; color: string }>>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [screenShake, setScreenShake] = useState(0);

  // In-flight projectile animation state
  const projectilesRef = useRef<Projectile[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Terrain generation: baseline sine hills + craters array
  const cratersRef = useRef<Array<{ x: number; y: number; r: number }>>([]);

  // Base terrain height formula (higher Y = lower on screen)
  const baseTerrainHeight = useCallback((x: number) => {
    // 2-wave smooth hill terrain with valley in the center
    const h1 = Math.sin(x * 0.005) * 45;
    const h2 = Math.cos(x * 0.012) * 25;
    return 360 + h1 + h2;
  }, []);

  // Total terrain height at X including craters
  const getTerrainYAtX = useCallback((x: number) => {
    let y = baseTerrainHeight(x);
    for (const c of cratersRef.current) {
      const dist = Math.abs(x - c.x);
      if (dist < c.r) {
        // Depth at center
        const depth = Math.sqrt(c.r * c.r - dist * dist) * 0.85;
        y = Math.max(y, c.y + depth);
      }
    }
    return y;
  }, [baseTerrainHeight]);

  // Adjust player and target onto terrain if outside
  useEffect(() => {
    const pY = getTerrainYAtX(playerPos.x);
    if (Math.abs(playerPos.y - pY) > 8) {
      onPlayerPosChange({ x: playerPos.x, y: pY });
    }
  }, [playerPos.x, getTerrainYAtX, onPlayerPosChange, playerPos.y]);

  useEffect(() => {
    const tY = getTerrainYAtX(targetPos.x);
    if (Math.abs(targetPos.y - tY) > 8) {
      onTargetPosChange({ x: targetPos.x, y: tY });
    }
  }, [targetPos.x, getTerrainYAtX, onTargetPosChange, targetPos.y]);

  // Audio synthesis using Web Audio API for authentic game sound without external assets
  const playSfx = useCallback((type: 'fire' | 'hit' | 'explosion') => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'fire') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.19);
      } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(587, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.26);
      } else if (type === 'explosion') {
        // Noise buffer for impact
        const bufferSize = ctx.sampleRate * 0.35;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, now);
        filter.frequency.linearRampToValueAtTime(60, now + 0.3);
        noise.connect(filter);
        filter.connect(gain);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        noise.start(now);
        noise.stop(now + 0.35);
      }
    } catch {
      // AudioContext could be blocked by browser policy before first interaction
    }
  }, [soundEnabled]);

  // Launch projectile
  const launchShot = useCallback(() => {
    playSfx('fire');
    const rad = (angle * Math.PI) / 180;
    const speed = (power / 100) * 26.5;
    const dir = facingRight ? 1 : -1;

    const newProjectiles: Projectile[] = [];

    // Main projectile
    newProjectiles.push({
      x: playerPos.x,
      y: playerPos.y - 12,
      vx: speed * Math.cos(rad) * dir,
      vy: -speed * Math.sin(rad),
      trail: [],
      active: true,
      color: '#38bdf8',
    });

    // If 3 lines active, launch the tridental spread!
    if (showThreeLines) {
      const radHigh = ((angle + 2.2) * Math.PI) / 180;
      const radLow = ((angle - 2.2) * Math.PI) / 180;

      newProjectiles.push({
        x: playerPos.x,
        y: playerPos.y - 12,
        vx: speed * Math.cos(radHigh) * dir,
        vy: -speed * Math.sin(radHigh),
        trail: [],
        active: true,
        color: '#f59e0b',
      });

      newProjectiles.push({
        x: playerPos.x,
        y: playerPos.y - 12,
        vx: speed * Math.cos(radLow) * dir,
        vy: -speed * Math.sin(radLow),
        trail: [],
        active: true,
        color: '#ec4899',
      });
    }

    projectilesRef.current = newProjectiles;
  }, [angle, power, facingRight, playerPos, showThreeLines, playSfx]);

  // Handle external fire trigger
  useEffect(() => {
    if (isFiring) {
      launchShot();
    }
  }, [isFiring, launchShot]);

  // Handle keyboard shortcuts (Delete to shoot, Shift to hold 3-lines, Tab to switch targets)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'Delete') {
        e.preventDefault();
        onFire();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        // Switch target position preset or flip
        const canvasW = canvasRef.current?.width || 900;
        const newX = targetPos.x < canvasW / 2 ? canvasW - 140 : canvasW / 2 + 100;
        const newY = getTerrainYAtX(newX);
        onTargetPosChange({ x: newX, y: newY });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onFire, targetPos.x, getTerrainYAtX, onTargetPosChange]);

  // Main rendering loop (Trajectory line, ground, tanks, explosions, in-flight bullets)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // 1. SKY BACKGROUND WITH STARS AND COMBAT VIBE
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#090d16');
      skyGrad.addColorStop(0.5, '#0f172a');
      skyGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle background grid / distance lines
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const unitPx = 50;
      for (let x = 0; x < width; x += unitPx) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        // Screen unit numbers at top
        const unitNum = Math.round(x / unitPx);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(`${unitNum}`, x + 4, 14);
      }
      ctx.restore();

      // 2. TERRAIN RENDERING (Green grass cap + earth gradient)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, getTerrainYAtX(0));

      for (let x = 1; x <= width; x += 4) {
        ctx.lineTo(x, getTerrainYAtX(x));
      }
      ctx.lineTo(width, height);
      ctx.closePath();

      const earthGrad = ctx.createLinearGradient(0, 300, 0, height);
      earthGrad.addColorStop(0, '#15803d');
      earthGrad.addColorStop(0.08, '#166534');
      earthGrad.addColorStop(0.25, '#362415');
      earthGrad.addColorStop(1, '#1c130b');
      ctx.fillStyle = earthGrad;
      ctx.fill();

      // Grassy border glow
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, getTerrainYAtX(0));
      for (let x = 1; x <= width; x += 4) {
        ctx.lineTo(x, getTerrainYAtX(x));
      }
      ctx.stroke();
      ctx.restore();

      // 3. TRAJECTORY ARCS (Real-time ballistic prediction)
      const mainSim = simulateTrajectory(
        playerPos,
        angle,
        power,
        wind,
        facingRight,
        targetPos,
        getTerrainYAtX,
        width,
        height
      );

      // Helper to draw single ballistic trajectory arc
      const drawArc = (points: Array<{ x: number; y: number }>, color: string, isDashed: boolean, width: number) => {
        if (points.length < 2) return;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        if (isDashed) {
          ctx.setLineDash([6, 4]);
        }
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        ctx.restore();
      };

      // Draw 3 lines if active (Top, Mid, Low spread)
      if (showThreeLines) {
        const highSim = simulateTrajectory(
          playerPos,
          Math.min(89, angle + 2.2),
          power,
          wind,
          facingRight,
          targetPos,
          getTerrainYAtX,
          width,
          height
        );
        const lowSim = simulateTrajectory(
          playerPos,
          Math.max(5, angle - 2.2),
          power,
          wind,
          facingRight,
          targetPos,
          getTerrainYAtX,
          width,
          height
        );

        drawArc(highSim.points, 'rgba(245, 158, 11, 0.55)', true, 1.5);
        drawArc(lowSim.points, 'rgba(236, 72, 153, 0.55)', true, 1.5);
      }

      // Draw main trajectory arc
      drawArc(mainSim.points, mainSim.hitTarget ? '#22c55e' : '#38bdf8', false, 2.5);

      // Trajectory apex indicator
      if (mainSim.points.length > 5) {
        let highestPoint = mainSim.points[0];
        for (const pt of mainSim.points) {
          if (pt.y < highestPoint.y) highestPoint = pt;
        }
        ctx.save();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.beginPath();
        ctx.arc(highestPoint.x, highestPoint.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(`Apex: ${Math.round(canvas.height - highestPoint.y)}px`, highestPoint.x - 25, highestPoint.y - 8);
        ctx.restore();
      }

      // Impact Point Reticle
      if (mainSim.impactPoint) {
        const ip = mainSim.impactPoint;
        ctx.save();
        ctx.strokeStyle = mainSim.hitTarget ? '#4ade80' : '#f43f5e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ip.x, ip.y, 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(ip.x - 12, ip.y);
        ctx.lineTo(ip.x + 12, ip.y);
        ctx.moveTo(ip.x, ip.y - 12);
        ctx.lineTo(ip.x, ip.y + 12);
        ctx.stroke();

        // Label
        ctx.fillStyle = mainSim.hitTarget ? '#4ade80' : '#f43f5e';
        ctx.font = 'bold 11px JetBrains Mono';
        ctx.fillText(
          mainSim.hitTarget ? '🎯 HIT' : `MISSED by ${mainSim.distanceToTarget}px`,
          ip.x + 14,
          ip.y - 6
        );
        ctx.restore();
      }

      // 4. DRAW PLAYER TANK (Green Ring + DDTank Body + Cannon Arm)
      {
        const pY = getTerrainYAtX(playerPos.x);
        ctx.save();
        ctx.translate(playerPos.x, pY);

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing selection ring (DDTool Blue aura)
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, -14, 22, 0, Math.PI * 2);
        ctx.stroke();

        // Tank base (Chassis) - Blue
        ctx.fillStyle = '#1e40af';
        ctx.fillRect(-16, -10, 32, 10);
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.arc(-10, -2, 4, 0, Math.PI * 2);
        ctx.arc(0, -2, 4, 0, Math.PI * 2);
        ctx.arc(10, -2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Turret Dome - Blue
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(0, -12, 10, Math.PI, 0);
        ctx.fill();

        // Cannon barrel angled
        const rad = (angle * Math.PI) / 180;
        const dir = facingRight ? 1 : -1;
        const barrelLen = 22;
        const bx = Math.cos(rad) * barrelLen * dir;
        const by = -Math.sin(rad) * barrelLen;

        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(bx, -12 + by);
        ctx.stroke();

        // Angle arc visualizer above tank
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -12, 28, facingRight ? -rad : Math.PI - rad, facingRight ? 0 : Math.PI, !facingRight);
        ctx.stroke();

        // Player Tag
        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 11px Chakra Petch';
        ctx.textAlign = 'center';
        ctx.fillText(`JOGADOR AZUL (${angle}°)`, 0, -42);
        ctx.restore();
      }

      // 5. DRAW TARGET / ENEMY TANK (Red Ring + Enemy Marker)
      {
        const tY = getTerrainYAtX(targetPos.x);
        ctx.save();
        ctx.translate(targetPos.x, tY);

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing red target ring (DDTool red aura)
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -14, 22, 0, Math.PI * 2);
        ctx.stroke();

        // Enemy Tank
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(-16, -10, 32, 10);
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.arc(-10, -2, 4, 0, Math.PI * 2);
        ctx.arc(0, -2, 4, 0, Math.PI * 2);
        ctx.arc(10, -2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Enemy Dome
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -12, 10, Math.PI, 0);
        ctx.fill();

        // Enemy Target Marker
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 11px Chakra Petch';
        ctx.textAlign = 'center';
        ctx.fillText('ALVO / INIMIGO', 0, -42);
        ctx.restore();
      }

      // 6. DISTANCE & ELEVATION BRACKET
      {
        const pY = getTerrainYAtX(playerPos.x);
        const tY = getTerrainYAtX(targetPos.x);
        const dx = Math.abs(targetPos.x - playerPos.x);
        const dy = pY - tY; // positive = target higher

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(playerPos.x, pY - 14);
        ctx.lineTo(targetPos.x, pY - 14);
        ctx.stroke();

        if (Math.abs(dy) > 10) {
          ctx.beginPath();
          ctx.moveTo(targetPos.x, pY - 14);
          ctx.lineTo(targetPos.x, tY - 14);
          ctx.stroke();
        }

        // Distance text
        const midX = (playerPos.x + targetPos.x) / 2;
        const distUnits = (dx / 50).toFixed(1);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 12px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`Dist: ${distUnits} un (${Math.round(dx)}px)`, midX, pY - 22);

        if (Math.abs(dy) > 10) {
          ctx.fillStyle = dy > 0 ? '#38bdf8' : '#fb923c';
          ctx.textAlign = 'left';
          ctx.fillText(`ΔH: ${(dy / 50).toFixed(1)} un`, targetPos.x + 12, (pY + tY) / 2);
        }
        ctx.restore();
      }

      // 7. IN-FLIGHT BULLETS PHYSICS UPDATE & DRAW
      if (projectilesRef.current.length > 0) {
        const gravity = 0.38;
        const windAcc = wind * 0.045;
        let anyActive = false;

        for (const proj of projectilesRef.current) {
          if (!proj.active) continue;
          anyActive = true;

          // Physics step
          proj.vx += windAcc;
          proj.vy += gravity;
          proj.x += proj.vx;
          proj.y += proj.vy;
          proj.trail.push({ x: proj.x, y: proj.y });
          if (proj.trail.length > 15) proj.trail.shift();

          // Draw trail
          ctx.save();
          ctx.strokeStyle = proj.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          for (let i = 0; i < proj.trail.length; i++) {
            const p = proj.trail[i];
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();

          // Draw projectile bullet
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Check target hit
          const tY = getTerrainYAtX(targetPos.x);
          const dTarget = Math.hypot(proj.x - targetPos.x, proj.y - (tY - 14));
          const groundY = getTerrainYAtX(proj.x);

          if (dTarget < 24) {
            proj.active = false;
            playSfx('hit');
            setScreenShake(6);

            // Add crater
            cratersRef.current.push({ x: proj.x, y: proj.y, r: 28 });
            if (cratersRef.current.length > 8) cratersRef.current.shift();

            // Spawn explosion & floating damage
            setExplosions((prev) => [
              ...prev,
              {
                id: Math.random().toString(),
                x: proj.x,
                y: proj.y,
                radius: 35,
                createdAt: Date.now(),
                color: '#ef4444',
              },
            ]);

            const dmg = Math.floor(2200 + Math.random() * 950);
            setFloatingTexts((prev) => [
              ...prev,
              {
                id: Math.random().toString(),
                text: `💥 CRÍTICO! -${dmg}`,
                x: proj.x,
                y: proj.y - 20,
                opacity: 1,
                color: '#facc15',
              },
            ]);
          } else if (proj.y >= groundY || proj.x < -100 || proj.x > width + 100 || proj.y > height + 100) {
            proj.active = false;
            playSfx('explosion');
            setScreenShake(3);

            // Ground crater
            cratersRef.current.push({ x: proj.x, y: groundY, r: 24 });
            if (cratersRef.current.length > 8) cratersRef.current.shift();

            setExplosions((prev) => [
              ...prev,
              {
                id: Math.random().toString(),
                x: proj.x,
                y: groundY,
                radius: 26,
                createdAt: Date.now(),
                color: '#f97316',
              },
            ]);
          }
        }

        if (!anyActive) {
          projectilesRef.current = [];
        }
      }

      // 8. EXPLOSION PARTICLES & CRATERS
      const now = Date.now();
      setExplosions((prev) =>
        prev.filter((exp) => {
          const age = now - exp.createdAt;
          if (age > 450) return false;
          const progress = age / 450;
          ctx.save();
          ctx.beginPath();
          ctx.arc(exp.x, exp.y, exp.radius * progress, 0, Math.PI * 2);
          ctx.fillStyle = exp.color;
          ctx.globalAlpha = 1 - progress;
          ctx.fill();
          ctx.restore();
          return true;
        })
      );

      // 9. FLOATING DAMAGE NUMBERS
      setFloatingTexts((prev) =>
        prev
          .map((item) => {
            const nextY = item.y - 1;
            const nextOpacity = item.opacity - 0.02;
            ctx.save();
            ctx.fillStyle = item.color;
            ctx.globalAlpha = Math.max(0, nextOpacity);
            ctx.font = 'bold 15px Chakra Petch';
            ctx.textAlign = 'center';
            ctx.fillText(item.text, item.x, nextY);
            ctx.restore();
            return { ...item, y: nextY, opacity: nextOpacity };
          })
          .filter((item) => item.opacity > 0)
      );

      // Decrement screenshake
      if (screenShake > 0) {
        setScreenShake((s) => Math.max(0, s - 0.5));
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    animFrameIdRef.current = animId;

    return () => cancelAnimationFrame(animId);
  }, [
    playerPos,
    targetPos,
    angle,
    power,
    wind,
    facingRight,
    showThreeLines,
    getTerrainYAtX,
    screenShake,
    playSfx,
  ]);

  // Handle Canvas mouse interaction
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Shift click or place_player tool
    if (e.shiftKey || activeTool === 'place_player') {
      const terrainY = getTerrainYAtX(x);
      onPlayerPosChange({ x, y: terrainY });
      return;
    }

    // Direct placement tool
    if (activeTool === 'place_target') {
      const terrainY = getTerrainYAtX(x);
      onTargetPosChange({ x, y: terrainY });
      return;
    }

    // Check hit on player or target to drag
    const pY = getTerrainYAtX(playerPos.x);
    const dPlayer = Math.hypot(x - playerPos.x, y - pY);
    if (dPlayer < 35) {
      setDragMode('player');
      return;
    }

    const tY = getTerrainYAtX(targetPos.x);
    const dTarget = Math.hypot(x - targetPos.x, y - tY);
    if (dTarget < 35) {
      setDragMode('target');
      return;
    }

    // Default left click moves the target (like DDTool ~ + left click)
    const terrainY = getTerrainYAtX(x);
    onTargetPosChange({ x, y: terrainY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragMode === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const x = Math.max(20, Math.min(canvas.width - 20, (e.clientX - rect.left) * scaleX));
    const terrainY = getTerrainYAtX(x);

    if (dragMode === 'player') {
      onPlayerPosChange({ x, y: terrainY });
    } else if (dragMode === 'target') {
      onTargetPosChange({ x, y: terrainY });
    }
  };

  const handleMouseUp = () => {
    setDragMode('none');
  };

  const resetTerrain = () => {
    cratersRef.current = [];
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl transition-transform ${
        screenShake > 0 ? 'translate-x-1 -translate-y-1' : ''
      }`}
    >
      {/* Top Overlay Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left tools */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-lg pointer-events-auto">
          <button
            onClick={() => setActiveTool('select')}
            title="Modo Seleção / Arrastar"
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTool === 'select' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'pt' ? 'Arrastar' : 'Drag'}</span>
          </button>

          <button
            onClick={() => setActiveTool('place_player')}
            title="Posicionar Jogador Azul (Shift + Clique)"
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTool === 'place_player' ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            <span className="hidden sm:inline">{lang === 'pt' ? 'Jogador Azul' : 'Player Blue'}</span>
          </button>

          <button
            onClick={() => setActiveTool('place_target')}
            title="Posicionar Inimigo (~ + Clique)"
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTool === 'place_target' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">{lang === 'pt' ? 'Alvo Inimigo' : 'Enemy'}</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Toggle 3 lines (Original DDTool feature) */}
          <button
            onClick={onToggleThreeLines}
            title={lang === 'pt' ? 'Alternar 3 Linhas (Tiro 1-2 Spread / Tecla Shift)' : 'Toggle 3 Lines (Shift Key)'}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              showThreeLines
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'pt' ? '3 Linhas (Shift)' : '3 Lines'}</span>
          </button>
        </div>

        {/* Right audio & reset */}
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/60 shadow-lg pointer-events-auto">
          <button
            onClick={resetTerrain}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800"
            title="Limpar crateras do terreno"
          >
            {lang === 'pt' ? 'Resetar Terreno' : 'Reset Ground'}
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded"
            title={soundEnabled ? 'Silenciar Efeitos' : 'Ativar Efeitos'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Element */}
      <canvas
        ref={canvasRef}
        width={940}
        height={480}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-auto cursor-crosshair block select-none"
      />

      {/* Bottom Hint Banner */}
      <div className="bg-slate-900/95 border-t border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[10px]">Clique</kbd>
            <span>{lang === 'pt' ? 'Mover Alvo' : 'Move Target'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[10px]">Shift + Clique</kbd>
            <span>{lang === 'pt' ? 'Mover Você' : 'Move Player'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[10px]">Del</kbd>
            <span>{lang === 'pt' ? 'Disparar' : 'Fire'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[10px]">Tab</kbd>
            <span>{lang === 'pt' ? 'Trocar Alvo' : 'Switch Target'}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{lang === 'pt' ? 'Simulador Físico Ativo' : 'Ballistics Engine Ready'}</span>
        </div>
      </div>
    </div>
  );
};
