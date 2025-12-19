import * as THREE from 'three';

export enum AppState {
  TREE = 0,
  EXPLODE = 1,
  IMAGE = 2,
  TEXT = 3
}

export interface Greeting {
  line1: string;
  line2: string;
}

export interface ParticleData {
  currentPos: THREE.Vector3[];
  targetPos: THREE.Vector3[];
  explodeOffsets: THREE.Vector3[];
  speeds: number[];
  phases: number[];
}

export interface ElfData {
  speeds: number[];
  radii: number[];
  heights: number[];
  phases: number[];
  verticalSpeeds: number[];
}