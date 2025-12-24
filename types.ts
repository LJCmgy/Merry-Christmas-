import * as THREE from 'three';

// Fix for React Three Fiber intrinsic elements errors in TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      ambientLight: any;
      pointLight: any;
      boxGeometry: any;
      meshStandardMaterial: any;
      sphereGeometry: any;
      cylinderGeometry: any;
      mesh: any;
      primitive: any;
    }
  }

  // Support for React.JSX namespace (often used in React 18+ types)
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        group: any;
        ambientLight: any;
        pointLight: any;
        boxGeometry: any;
        meshStandardMaterial: any;
        sphereGeometry: any;
        cylinderGeometry: any;
        mesh: any;
        primitive: any;
      }
    }
  }
}

export type AppMode = 'TREE' | 'SCATTER';

export interface ParticleData {
  id: number;
  treePos: THREE.Vector3;
  scatterPos: THREE.Vector3;
  type: 'cube' | 'sphere' | 'cane' | 'photo';
  color: THREE.Color;
  scale: number;
  photoUrl?: string;
}

export type HandGesture = 'FIST' | 'OPEN' | 'PINCH' | 'NONE';

export interface HandState {
  gesture: HandGesture;
  isPresent: boolean;
  pinchDistance: number; // 0 to 1
  landmarks: any[]; // Raw landmarks
}