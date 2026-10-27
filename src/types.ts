export type Language = 'pt' | 'en';

export interface Point {
  x: number;
  y: number;
}

export type FormulaType = '65' | '50' | '90' | '30' | '20' | '45';

export interface CalculationResult {
  formulaId: FormulaType;
  formulaName: string;
  recommendedAngle: number;
  recommendedPower: number;
  heightCorrectionAngle: number;
  windCorrectionAngle: number;
  notes: string;
  isAvailable: boolean;
}

export interface SimulationTrajectoryPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  time: number;
}

export interface SimulationResult {
  points: SimulationTrajectoryPoint[];
  impactPoint: Point | null;
  hitTarget: boolean;
  distanceToTarget: number;
  flightTime: number;
  maxAltitude: number;
}

export interface Explosion {
  id: string;
  x: number;
  y: number;
  radius: number;
  createdAt: number;
  color: string;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: Point[];
  active: boolean;
  color: string;
}

export interface ScreenCaptureState {
  isActive: boolean;
  stream: MediaStream | null;
  videoWidth: number;
  videoHeight: number;
  errorMessage: string | null;
}
