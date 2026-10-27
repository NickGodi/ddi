import { CalculationResult, FormulaType, Point, SimulationTrajectoryPoint, SimulationResult } from './types';

// Standard DDTank power tables for integer distances 1 to 20
export const POWER_TABLE_65: Record<number, number> = {
  1: 13.0, 2: 21.0, 3: 26.0, 4: 31.5, 5: 37.0,
  6: 41.0, 7: 46.0, 8: 51.0, 9: 55.5, 10: 60.0,
  11: 64.0, 12: 68.0, 13: 72.0, 14: 76.0, 15: 80.0,
  16: 83.5, 17: 87.0, 18: 90.5, 19: 94.0, 20: 97.5,
};

export const POWER_TABLE_50: Record<number, number> = {
  1: 14.0, 2: 20.0, 3: 24.5, 4: 28.5, 5: 32.5,
  6: 36.0, 7: 39.5, 8: 43.0, 9: 46.0, 10: 49.0,
  11: 52.0, 12: 55.0, 13: 58.0, 14: 60.5, 15: 63.5,
  16: 66.0, 17: 68.5, 18: 71.0, 19: 73.5, 20: 76.0,
};

export const POWER_TABLE_30: Record<number, number> = {
  1: 14.0, 2: 20.0, 3: 24.0, 4: 28.0, 5: 32.0,
  6: 35.0, 7: 38.0, 8: 41.0, 9: 44.0, 10: 47.0,
  11: 50.0, 12: 52.5, 13: 55.0, 14: 57.5, 15: 60.0,
  16: 62.5, 17: 65.0, 18: 67.0, 19: 69.5, 20: 72.0,
};

export const POWER_TABLE_45: Record<number, number> = {
  1: 15.0, 2: 21.0, 3: 26.0, 4: 30.0, 5: 34.0,
  6: 38.0, 7: 41.5, 8: 45.0, 9: 48.0, 10: 51.5,
  11: 54.5, 12: 57.5, 13: 60.5, 14: 63.0, 15: 66.0,
  16: 68.5, 17: 71.0, 18: 73.5, 19: 76.0, 20: 78.5,
};

export const POWER_TABLE_20: Record<number, number> = {
  1: 12.0, 2: 18.0, 3: 22.0, 4: 26.0, 5: 29.5,
  6: 33.0, 7: 36.5, 8: 40.0, 9: 43.0, 10: 46.0,
  11: 49.0, 12: 52.0, 13: 55.0, 14: 57.5, 15: 60.5,
  16: 63.0, 17: 65.5, 18: 68.0, 19: 70.5, 20: 73.0,
};

// Interpolate power for fractional distances
export function interpolatePower(table: Record<number, number>, dist: number): number {
  if (dist <= 1) return table[1] || 13;
  if (dist >= 20) return table[20] || 95;
  const floor = Math.floor(dist);
  const ceil = Math.ceil(dist);
  if (floor === ceil) return table[floor];
  const p1 = table[floor];
  const p2 = table[ceil];
  const t = dist - floor;
  return Number((p1 + (p2 - p1) * t).toFixed(1));
}

export interface CalculationInput {
  distanceUnits: number; // 1 to 20 units (10 units = 1 screen)
  wind: number; // -5.0 to +5.0 (positive = with wind / tailwind, negative = against / headwind)
  heightDeltaUnits: number; // positive = target is above, negative = target is below
  facingRight: boolean; // shooting direction
  lang: 'pt' | 'en';
}

export function calculateAllFormulas(input: CalculationInput): CalculationResult[] {
  const { distanceUnits, wind, heightDeltaUnits, lang } = input;
  const results: CalculationResult[] = [];
  const effWind = wind;

  // 1. FORMULA 65°
  {
    const windAngle = Math.round(effWind * 2);
    const heightAngle = Math.round(heightDeltaUnits * 0.8);
    const totalAngle = Math.min(89, Math.max(20, 65 + windAngle + heightAngle));
    const power = interpolatePower(POWER_TABLE_65, distanceUnits);

    results.push({
      formulaId: '65',
      formulaName: lang === 'pt' ? 'Fórmula 65°' : '65° Formula',
      recommendedAngle: totalAngle,
      recommendedPower: power,
      heightCorrectionAngle: heightAngle,
      windCorrectionAngle: windAngle,
      notes: lang === 'pt' 
        ? 'A mais confiável para média/longa distância. Ângulo = 65 + (Vento × 2).' 
        : 'Most reliable for mid-to-long range. Angle = 65 + (Wind × 2).',
      isAvailable: totalAngle >= 20 && totalAngle <= 89,
    });
  }

  // 2. HIGH THROW / FORMULA 90°
  {
    const windAngle = Math.round(effWind * 2);
    const distAngle = Math.round(distanceUnits);
    const heightAngle = Math.round(-heightDeltaUnits * 0.5);
    const baseAngle = 90 - distAngle + windAngle + heightAngle;
    const finalAngle = Math.min(89, Math.max(45, baseAngle));
    
    let highPower = 95;
    if (heightDeltaUnits > 0) {
      highPower = Math.min(100, Math.round(95 + heightDeltaUnits * 2.5));
    } else if (heightDeltaUnits < 0) {
      highPower = Math.max(80, Math.round(95 + heightDeltaUnits * 2.5));
    }

    results.push({
      formulaId: '90',
      formulaName: lang === 'pt' ? 'Ângulo Alto (90°)' : 'High Throw (90°)',
      recommendedAngle: finalAngle,
      recommendedPower: highPower,
      heightCorrectionAngle: heightAngle,
      windCorrectionAngle: windAngle,
      notes: lang === 'pt'
        ? 'Tiro vertical quase infalível! Ângulo = 90 - Distância + (Vento × 2). Força 95.'
        : 'Sky drop shot! Angle = 90 - Distance + (Wind × 2). Power 95.',
      isAvailable: finalAngle >= 45 && finalAngle <= 89,
    });
  }

  // 3. FORMULA 50°
  {
    const windAngle = Math.round(effWind * 2);
    const heightAngle = Math.round(heightDeltaUnits * 0.7);
    const totalAngle = Math.min(85, Math.max(15, 50 + windAngle + heightAngle));
    const power = interpolatePower(POWER_TABLE_50, distanceUnits);

    results.push({
      formulaId: '50',
      formulaName: lang === 'pt' ? 'Fórmula 50°' : '50° Formula',
      recommendedAngle: totalAngle,
      recommendedPower: power,
      heightCorrectionAngle: heightAngle,
      windCorrectionAngle: windAngle,
      notes: lang === 'pt'
        ? 'Excelente estabilidade sob vento moderado e terreno irregular.'
        : 'Balanced arc for moderate wind and uneven terrain.',
      isAvailable: totalAngle >= 15 && totalAngle <= 85,
    });
  }

  // 4. FORMULA 30° (LOW ANGLE / DIGGER)
  {
    const windAngle = Math.round(effWind * 1);
    const heightAngle = Math.round(heightDeltaUnits * 0.5);
    const totalAngle = Math.min(65, Math.max(10, 30 + windAngle + heightAngle));
    const power = interpolatePower(POWER_TABLE_30, distanceUnits);

    results.push({
      formulaId: '30',
      formulaName: lang === 'pt' ? 'Fórmula 30° (Escavação)' : '30° Low Angle (Digger)',
      recommendedAngle: totalAngle,
      recommendedPower: power,
      heightCorrectionAngle: heightAngle,
      windCorrectionAngle: windAngle,
      notes: lang === 'pt'
        ? 'Trajetória baixa, imune a ventos fortes, ideal para enterrar o oponente.'
        : 'Low arc, wind-resistant, perfect for digging opponents into craters.',
      isAvailable: totalAngle >= 10 && totalAngle <= 65,
    });
  }

  // 5. FORMULA 45° (HALF SCREEN)
  {
    const windAngle = Math.round(effWind * 2);
    const heightAngle = Math.round(heightDeltaUnits * 0.75);
    const totalAngle = Math.min(85, Math.max(15, 45 + windAngle + heightAngle));
    const power = interpolatePower(POWER_TABLE_45, distanceUnits);

    results.push({
      formulaId: '45',
      formulaName: lang === 'pt' ? 'Fórmula 45° (Meia Tela)' : '45° Formula',
      recommendedAngle: totalAngle,
      recommendedPower: power,
      heightCorrectionAngle: heightAngle,
      windCorrectionAngle: windAngle,
      notes: lang === 'pt'
        ? 'A clássica regra de 45°: ideal para distâncias de 1 a 10 unidades.'
        : 'Classic 45-degree rule, effective at close-to-mid range.',
      isAvailable: totalAngle >= 15 && totalAngle <= 85,
    });
  }

  // 6. FORMULA 20°
  {
    const windAngle = Math.round(effWind * 0.5);
    const heightAngle = Math.round(heightDeltaUnits * 0.4);
    const totalAngle = Math.min(50, Math.max(5, 20 + windAngle + heightAngle));
    const power = interpolatePower(POWER_TABLE_20, distanceUnits);

    results.push({
      formulaId: '20',
      formulaName: lang === 'pt' ? 'Fórmula 20° (Tiro Rasante)' : '20° Formula (Direct)',
      recommendedAngle: totalAngle,
      recommendedPower: power,
      heightCorrectionAngle: heightAngle,
      windCorrectionAngle: windAngle,
      notes: lang === 'pt'
        ? 'Tiro rasteiro de alta velocidade para alvos desobstruídos em plano reto.'
        : 'Ultra-flat velocity shot for flat terrain without obstacles.',
      isAvailable: totalAngle >= 5 && totalAngle <= 50,
    });
  }

  return results;
}

// SOLVER: Computes the exact power required to hit (targetX, targetY)
// from (playerX, playerY) at ANY given angle and wind!
export function solvePowerForCurrentAngle(
  origin: Point,
  target: Point,
  angleDeg: number,
  wind: number,
  facingRight: boolean
): { power: number; timeMs: number; canReach: boolean } {
  let lowPower = 5;
  let highPower = 100;
  let bestPower = 50;
  let closestMiss = 999999;
  const targetDistX = Math.abs(target.x - origin.x);

  // Binary search across 16 iterations
  for (let iter = 0; iter < 16; iter++) {
    const midPower = (lowPower + highPower) / 2;
    const rad = (angleDeg * Math.PI) / 180;
    const speed = (midPower / 100) * 26.5;
    const dir = facingRight ? 1 : -1;

    let vx = speed * Math.cos(rad) * dir;
    let vy = -speed * Math.sin(rad);
    let x = origin.x;
    let y = origin.y - 12;

    const gravity = 0.38;
    const windAcc = wind * 0.045;
    let hitOrPassed = false;
    let distAtTargetX = 0;

    for (let t = 1; t <= 300; t++) {
      vx += windAcc;
      vy += gravity;
      x += vx;
      y += vy;

      const currentDistX = Math.abs(x - origin.x);
      if (currentDistX >= targetDistX || y > target.y + 100) {
        distAtTargetX = currentDistX;
        const err = Math.hypot(x - target.x, y - target.y);
        if (err < closestMiss) {
          closestMiss = err;
          bestPower = midPower;
        }

        // If projectile is below target when reaching X, it lacked power
        if (y > target.y) {
          lowPower = midPower;
        } else {
          highPower = midPower;
        }
        hitOrPassed = true;
        break;
      }
    }

    if (!hitOrPassed) {
      lowPower = midPower;
    }
  }

  const finalPower = Number(Math.max(5, Math.min(100, bestPower)).toFixed(1));
  // DDTank power bar takes ~1800ms for 100% power
  const timeMs = Math.round((finalPower / 100) * 1800);

  return {
    power: finalPower,
    timeMs,
    canReach: closestMiss < 40,
  };
}

// Forward trajectory simulation for canvas rendering
export function simulateTrajectory(
  origin: Point,
  angleDeg: number,
  powerPercent: number, // 0 to 100
  wind: number, // -5.0 to +5.0
  facingRight: boolean,
  target: Point,
  terrainHeightAtX: (x: number) => number,
  canvasWidth: number,
  canvasHeight: number
): SimulationResult {
  const points: SimulationTrajectoryPoint[] = [];
  
  const rad = (angleDeg * Math.PI) / 180;
  const initialSpeed = (powerPercent / 100) * 26.5;
  const dir = facingRight ? 1 : -1;

  let vx = initialSpeed * Math.cos(rad) * dir;
  let vy = -initialSpeed * Math.sin(rad);

  let x = origin.x;
  let y = origin.y - 10;
  const gravity = 0.38;
  const windAcc = wind * 0.045;
  const dt = 1;
  let maxAltitude = y;
  let impactPoint: Point | null = null;
  let hitTarget = false;
  let closestDistToTarget = 999999;
  let flightTime = 0;

  points.push({ x, y, vx, vy, time: 0 });

  for (let t = 1; t <= 300; t++) {
    vx += windAcc * dt;
    vy += gravity * dt;

    x += vx * dt;
    y += vy * dt;

    if (y < maxAltitude) {
      maxAltitude = y;
    }

    points.push({ x, y, vx, vy, time: t });

    const dTarget = Math.hypot(x - target.x, y - (target.y - 12));
    if (dTarget < closestDistToTarget) {
      closestDistToTarget = dTarget;
    }
    if (dTarget < 22) {
      hitTarget = true;
      impactPoint = { x, y };
      flightTime = t;
      break;
    }

    const groundY = terrainHeightAtX(x);
    if (y >= groundY) {
      impactPoint = { x, y: groundY };
      flightTime = t;
      break;
    }

    if (x < -100 || x > canvasWidth + 100 || y > canvasHeight + 100) {
      impactPoint = { x, y };
      flightTime = t;
      break;
    }
  }

  return {
    points,
    impactPoint,
    hitTarget,
    distanceToTarget: Math.round(closestDistToTarget),
    flightTime,
    maxAltitude: Math.round(maxAltitude),
  };
}
