import { create } from 'zustand';
import * as THREE from 'three';
import { AppMode, HandGesture, HandState } from './types';

interface AppState {
  mode: AppMode;
  isTimeTravel: boolean;
  isFocusing: boolean;
  targetPhotoIndex: number | null; // For Time Travel sequence
  focusTargetId: number | null; // For Pinch Focus interaction
  handState: HandState;
  
  // New: Scene Rotation state
  sceneRotation: { x: number; y: number };
  
  // Actions
  setMode: (mode: AppMode) => void;
  setTimeTravel: (active: boolean) => void;
  setFocusing: (active: boolean) => void;
  setFocusTarget: (id: number | null) => void;
  setHandState: (state: Partial<HandState>) => void;
  advancePhotoIndex: (totalPhotos: number) => void;
  resetPhotoIndex: () => void;
  addSceneRotation: (deltaX: number, deltaY: number) => void;
  resetSceneRotation: () => void;
}

export const useStore = create<AppState>((set) => ({
  mode: 'TREE',
  isTimeTravel: false,
  isFocusing: false,
  targetPhotoIndex: null,
  focusTargetId: null,
  handState: {
    gesture: 'NONE',
    isPresent: false,
    pinchDistance: 0,
    landmarks: []
  },
  sceneRotation: { x: 0, y: 0 },

  setMode: (mode) => set({ mode }),
  
  setTimeTravel: (active) => set((state) => ({ 
    isTimeTravel: active,
    // When time travel starts, force Scatter mode for better traversal
    mode: active ? 'SCATTER' : state.mode 
  })),

  setFocusing: (active) => set({ isFocusing: active }),
  setFocusTarget: (id) => set({ focusTargetId: id }),

  setHandState: (newState) => set((state) => ({
    handState: { ...state.handState, ...newState }
  })),

  advancePhotoIndex: (totalPhotos) => set((state) => {
    const nextIndex = (state.targetPhotoIndex === null) ? 0 : state.targetPhotoIndex + 1;
    if (nextIndex >= totalPhotos) {
      // Finished tour
      return { targetPhotoIndex: null, isTimeTravel: false };
    }
    return { targetPhotoIndex: nextIndex };
  }),

  resetPhotoIndex: () => set({ targetPhotoIndex: null }),

  addSceneRotation: (deltaY, deltaX) => set((state) => ({
    sceneRotation: {
        x: state.sceneRotation.x + deltaX, // Mouse/Hand Y movement controls X axis rotation (Pitch)
        y: state.sceneRotation.y + deltaY  // Mouse/Hand X movement controls Y axis rotation (Yaw)
    }
  })),

  resetSceneRotation: () => set({ sceneRotation: { x: 0, y: 0 } }),
}));