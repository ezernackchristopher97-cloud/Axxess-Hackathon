/**
 * Bora Framework Mobile Integration
 * Neural Entropy Diagnostics - AIModelG3 Architecture
 * 
 * This module provides client-side entropy computation and visualization
 * for the mobile app, mirroring the server-side Bora framework.
 */

// Quaternion class for signal encoding
export class Quaternion {
  constructor(
    public w: number,
    public x: number,
    public y: number,
    public z: number
  ) {}

  static fromEuler(roll: number, pitch: number, yaw: number): Quaternion {
    const cy = Math.cos(yaw * 0.5);
    const sy = Math.sin(yaw * 0.5);
    const cp = Math.cos(pitch * 0.5);
    const sp = Math.sin(pitch * 0.5);
    const cr = Math.cos(roll * 0.5);
    const sr = Math.sin(roll * 0.5);

    return new Quaternion(
      cr * cp * cy + sr * sp * sy,
      sr * cp * cy - cr * sp * sy,
      cr * sp * cy + sr * cp * sy,
      cr * cp * sy - sr * sp * cy
    );
  }

  multiply(q: Quaternion): Quaternion {
    return new Quaternion(
      this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z,
      this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y,
      this.w * q.y - this.x * q.z + this.y * q.w + this.z * q.x,
      this.w * q.z + this.x * q.y - this.y * q.x + this.z * q.w
    );
  }

  normalize(): Quaternion {
    const mag = Math.sqrt(this.w ** 2 + this.x ** 2 + this.y ** 2 + this.z ** 2);
    return new Quaternion(this.w / mag, this.x / mag, this.y / mag, this.z / mag);
  }

  toToroidal(): { theta: number; phi: number } {
    const theta = 2 * Math.atan2(
      Math.sqrt(this.x ** 2 + this.y ** 2),
      Math.sqrt(this.w ** 2 + this.z ** 2)
    );
    const phi = Math.atan2(this.y, this.x) - Math.atan2(this.z, this.w);
    return { theta, phi };
  }

  toArray(): [number, number, number, number] {
    return [this.w, this.x, this.y, this.z];
  }
}

// Entropy computation functions
export function computeShannonEntropy(data: number[]): number {
  const total = data.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  
  const probabilities = data.map(v => v / total);
  return -probabilities.reduce((sum, p) => {
    if (p > 0) {
      return sum + p * Math.log2(p);
    }
    return sum;
  }, 0);
}

export function computeSampleEntropy(data: number[], m: number = 2, r: number = 0.2): number {
  const N = data.length;
  const std = Math.sqrt(data.reduce((sum, x) => sum + x * x, 0) / N - Math.pow(data.reduce((a, b) => a + b, 0) / N, 2));
  const tolerance = r * std;

  function countMatches(template: number[], length: number): number {
    let count = 0;
    for (let i = 0; i < N - length; i++) {
      let match = true;
      for (let j = 0; j < length; j++) {
        if (Math.abs(data[i + j] - template[j]) > tolerance) {
          match = false;
          break;
        }
      }
      if (match) count++;
    }
    return count;
  }

  let A = 0, B = 0;
  for (let i = 0; i < N - m; i++) {
    const template = data.slice(i, i + m);
    B += countMatches(template, m);
    A += countMatches([...template, data[i + m]], m + 1);
  }

  if (B === 0 || A === 0) return 0;
  return -Math.log(A / B);
}

export function computeApproximateEntropy(data: number[], m: number = 2, r: number = 0.2): number {
  const N = data.length;
  const std = Math.sqrt(data.reduce((sum, x) => sum + x * x, 0) / N - Math.pow(data.reduce((a, b) => a + b, 0) / N, 2));
  const tolerance = r * std;

  function phi(dimension: number): number {
    const patterns: number[][] = [];
    for (let i = 0; i <= N - dimension; i++) {
      patterns.push(data.slice(i, i + dimension));
    }

    let sum = 0;
    for (let i = 0; i < patterns.length; i++) {
      let count = 0;
      for (let j = 0; j < patterns.length; j++) {
        let match = true;
        for (let k = 0; k < dimension; k++) {
          if (Math.abs(patterns[i][k] - patterns[j][k]) > tolerance) {
            match = false;
            break;
          }
        }
        if (match) count++;
      }
      sum += Math.log(count / patterns.length);
    }
    return sum / patterns.length;
  }

  return phi(m) - phi(m + 1);
}

// Vicsek order parameter computation
export function computeVicsekOrder(velocities: { vx: number; vy: number }[]): number {
  if (velocities.length === 0) return 0;
  
  let sumVx = 0, sumVy = 0;
  let sumSpeed = 0;
  
  for (const v of velocities) {
    sumVx += v.vx;
    sumVy += v.vy;
    sumSpeed += Math.sqrt(v.vx ** 2 + v.vy ** 2);
  }
  
  if (sumSpeed === 0) return 0;
  
  const avgVelocityMag = Math.sqrt(sumVx ** 2 + sumVy ** 2) / velocities.length;
  const avgSpeed = sumSpeed / velocities.length;
  
  return avgVelocityMag / avgSpeed;
}

// Two-layer filtering architecture
export interface FilterResult {
  passed: boolean;
  score: number;
  details: string;
}

export function applyL1CoherenceFilter(data: number[], threshold: number = 0.3): FilterResult {
  const entropy = computeShannonEntropy(data);
  const maxEntropy = Math.log2(data.length);
  const normalizedEntropy = entropy / maxEntropy;
  
  const passed = normalizedEntropy < threshold;
  return {
    passed,
    score: normalizedEntropy,
    details: `L1 Coherence: ${(normalizedEntropy * 100).toFixed(2)}% (threshold: ${(threshold * 100).toFixed(2)}%)`
  };
}

export function applyL2StabilityFilter(data: number[], windowSize: number = 10): FilterResult {
  const windows: number[] = [];
  for (let i = 0; i <= data.length - windowSize; i++) {
    const window = data.slice(i, i + windowSize);
    windows.push(computeShannonEntropy(window));
  }
  
  const mean = windows.reduce((a, b) => a + b, 0) / windows.length;
  const variance = windows.reduce((sum, x) => sum + (x - mean) ** 2, 0) / windows.length;
  const stability = 1 / (1 + variance);
  
  const passed = stability > 0.5;
  return {
    passed,
    score: stability,
    details: `L2 Stability: ${(stability * 100).toFixed(2)}% (variance: ${variance.toFixed(4)})`
  };
}

// Absurdity scoring
export function computeAbsurdityScore(
  entropy: number,
  vicsekOrder: number,
  l1Result: FilterResult,
  l2Result: FilterResult
): number {
  // Combine metrics into absurdity score (0-1, lower is better)
  const entropyComponent = Math.min(entropy / 10, 1) * 0.3;
  const orderComponent = (1 - vicsekOrder) * 0.3;
  const filterComponent = (
    (l1Result.passed ? 0 : 0.2) +
    (l2Result.passed ? 0 : 0.2)
  );
  
  return Math.min(entropyComponent + orderComponent + filterComponent, 1);
}

// Brain region definitions for visualization
export const BRAIN_REGIONS = [
  { id: 'frontal_left', name: 'Left Frontal Lobe', position: { x: -0.3, y: 0.4, z: 0.2 } },
  { id: 'frontal_right', name: 'Right Frontal Lobe', position: { x: 0.3, y: 0.4, z: 0.2 } },
  { id: 'parietal_left', name: 'Left Parietal Lobe', position: { x: -0.3, y: 0.2, z: 0.4 } },
  { id: 'parietal_right', name: 'Right Parietal Lobe', position: { x: 0.3, y: 0.2, z: 0.4 } },
  { id: 'temporal_left', name: 'Left Temporal Lobe', position: { x: -0.5, y: 0, z: 0 } },
  { id: 'temporal_right', name: 'Right Temporal Lobe', position: { x: 0.5, y: 0, z: 0 } },
  { id: 'occipital_left', name: 'Left Occipital Lobe', position: { x: -0.2, y: -0.4, z: 0.2 } },
  { id: 'occipital_right', name: 'Right Occipital Lobe', position: { x: 0.2, y: -0.4, z: 0.2 } },
  { id: 'cerebellum_left', name: 'Left Cerebellum', position: { x: -0.2, y: -0.3, z: -0.3 } },
  { id: 'cerebellum_right', name: 'Right Cerebellum', position: { x: 0.2, y: -0.3, z: -0.3 } },
  { id: 'hippocampus_left', name: 'Left Hippocampus', position: { x: -0.2, y: 0, z: -0.1 } },
  { id: 'hippocampus_right', name: 'Right Hippocampus', position: { x: 0.2, y: 0, z: -0.1 } },
  { id: 'thalamus', name: 'Thalamus', position: { x: 0, y: 0.1, z: 0 } },
  { id: 'brainstem', name: 'Brainstem', position: { x: 0, y: -0.2, z: -0.2 } },
];

// Color mapping for entropy visualization
export function entropyToColor(entropy: number, min: number = 0, max: number = 1): string {
  const normalized = Math.max(0, Math.min(1, (entropy - min) / (max - min)));
  
  // Viridis-like color scale
  const r = Math.round(68 + normalized * (253 - 68));
  const g = Math.round(1 + normalized * (231 - 1));
  const b = Math.round(84 + normalized * (37 - 84));
  
  return `rgb(${r}, ${g}, ${b})`;
}

// Regime detection
export type Regime = 'neural' | 'quantum' | 'hybrid';

export function detectRegime(entropy: number, vicsekOrder: number): Regime {
  if (entropy < 0.3 && vicsekOrder > 0.7) {
    return 'neural';
  } else if (entropy > 0.7 || vicsekOrder < 0.3) {
    return 'quantum';
  }
  return 'hybrid';
}

// EEG frequency bands
export const EEG_BANDS = {
  delta: { min: 0.5, max: 4, name: 'Delta' },
  theta: { min: 4, max: 8, name: 'Theta' },
  alpha: { min: 8, max: 13, name: 'Alpha' },
  beta: { min: 13, max: 30, name: 'Beta' },
  gamma: { min: 30, max: 100, name: 'Gamma' },
};

// Coherence computation between channels
export function computeCoherence(signal1: number[], signal2: number[]): number {
  if (signal1.length !== signal2.length || signal1.length === 0) return 0;
  
  const n = signal1.length;
  const mean1 = signal1.reduce((a, b) => a + b, 0) / n;
  const mean2 = signal2.reduce((a, b) => a + b, 0) / n;
  
  let cov = 0, var1 = 0, var2 = 0;
  for (let i = 0; i < n; i++) {
    const d1 = signal1[i] - mean1;
    const d2 = signal2[i] - mean2;
    cov += d1 * d2;
    var1 += d1 * d1;
    var2 += d2 * d2;
  }
  
  if (var1 === 0 || var2 === 0) return 0;
  return Math.abs(cov / Math.sqrt(var1 * var2));
}

// Export all utilities
export const BoraFramework = {
  Quaternion,
  computeShannonEntropy,
  computeSampleEntropy,
  computeApproximateEntropy,
  computeVicsekOrder,
  applyL1CoherenceFilter,
  applyL2StabilityFilter,
  computeAbsurdityScore,
  entropyToColor,
  detectRegime,
  computeCoherence,
  BRAIN_REGIONS,
  EEG_BANDS,
};

export default BoraFramework;
