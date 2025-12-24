import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
// Removed ESM imports to avoid "Aborted(Module.arguments)" errors
// We rely on the global scripts loaded in index.html (window.Hands, window.Camera, etc.)

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]
];

const HandTracker: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevHandPos = useRef<{x: number, y: number} | null>(null);

  const setHandState = useStore((state) => state.setHandState);
  const setMode = useStore((state) => state.setMode);
  const setFocusing = useStore((state) => state.setFocusing);
  const addSceneRotation = useStore((state) => state.addSceneRotation);
  const resetSceneRotation = useStore((state) => state.resetSceneRotation);
  
  const mode = useStore((state) => state.mode);
  const modeRef = useRef(mode);
  
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const [debugInfo, setDebugInfo] = useState("Initializing...");

  useEffect(() => {
    let camera: any = null; 
    let hands: any = null;

    const init = async () => {
        // Access global Hands class from window
        const HandsClass = (window as any).Hands;
        if (!HandsClass) {
            setDebugInfo("Libs loading...");
            // Retry after a short delay if libs aren't ready
            setTimeout(init, 500);
            return;
        }
        
        hands = new HandsClass({
            locateFile: (file: string) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            },
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        hands.onResults(onResults);

        if (videoRef.current) {
            const CameraClass = (window as any).Camera;
            
            if (CameraClass) {
                camera = new CameraClass(videoRef.current, {
                    onFrame: async () => {
                        if (videoRef.current && hands) {
                            await hands.send({ image: videoRef.current });
                        }
                    },
                    width: 320,
                    height: 240,
                });
                camera.start()
                .then(() => setDebugInfo("Camera Started"))
                .catch((err: any) => setDebugInfo(`Cam Error: ${err.message}`));
            } else {
                setDebugInfo("Camera Utils Load Failed");
            }
        }
    };

    // Small delay to ensure scripts are evaluated
    setTimeout(init, 500);

    return () => {
      if (camera) camera.stop();
      if (hands) hands.close();
    };
  }, []);

  const onResults = (results: any) => {
    if (!canvasRef.current || !videoRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasRef.current;
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    
    ctx.translate(width, 0);
    ctx.scale(-1, 1);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      const win = window as any;
      if (win.drawConnectors) win.drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#00FFFF', lineWidth: 2 });
      if (win.drawLandmarks) win.drawLandmarks(ctx, landmarks, { color: '#FF00FF', lineWidth: 1, radius: 2 });

      detectGesture(landmarks);
      setHandState({ isPresent: true, landmarks });
    } else {
      setHandState({ isPresent: false, gesture: 'NONE' as any, landmarks: [] });
      prevHandPos.current = null;
      setFocusing(false);
      setDebugInfo("Searching...");
    }
    ctx.restore();
  };

  const dist = (p1: any, p2: any) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
  };

  const detectGesture = (landmarks: any[]) => {
    const wrist = landmarks[0];

    const isFolded = (tipIdx: number, pipIdx: number) => {
        return dist(landmarks[tipIdx], wrist) < dist(landmarks[pipIdx], wrist);
    };

    const indexFolded = isFolded(8, 6);
    const middleFolded = isFolded(12, 10);
    const ringFolded = isFolded(16, 14);
    const pinkyFolded = isFolded(20, 18);

    const foldedCount = (indexFolded ? 1 : 0) + (middleFolded ? 1 : 0) + (ringFolded ? 1 : 0) + (pinkyFolded ? 1 : 0);

    const pinchDist = dist(landmarks[4], landmarks[8]);
    const isPinchAction = pinchDist < 0.1; 

    const currentMode = modeRef.current;

    let gesture = 'NONE';
    let newMode = currentMode;
    let newIsFocusing = false;

    if (isPinchAction && !middleFolded) {
        gesture = 'PINCH';
        if (currentMode === 'SCATTER') {
            newIsFocusing = true;
        }
    }
    else if (foldedCount >= 3) {
        gesture = 'FIST';
        newMode = 'TREE';
        resetSceneRotation();
    }
    else if (foldedCount <= 1) {
        gesture = 'OPEN';
        newMode = 'SCATTER';
    }

    if (newMode !== currentMode) {
        setMode(newMode);
        modeRef.current = newMode;
    }
    
    setFocusing(newIsFocusing);
    setHandState({ gesture: gesture as any, pinchDistance: pinchDist });

    setDebugInfo(`G:${gesture} | M:${newMode} | P:${pinchDist.toFixed(2)}`);

    const currentCenter = landmarks[9]; 
    if (gesture === 'OPEN' && prevHandPos.current) {
        const dx = currentCenter.x - prevHandPos.current.x;
        const dy = currentCenter.y - prevHandPos.current.y;
        addSceneRotation(dx * 5.0, dy * 5.0); 
    }
    prevHandPos.current = { x: currentCenter.x, y: currentCenter.y };
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
      <video ref={videoRef} className="hidden" playsInline muted />
      <div className="glass-panel rounded-xl overflow-hidden p-1 w-48 h-36 relative">
        <canvas ref={canvasRef} width={320} height={240} className="w-full h-full object-cover" />
        <div className="absolute top-1 left-2 text-[10px] text-cyan-400 font-mono">
           HAND VISION
        </div>
        <div className="absolute bottom-1 right-2 text-[10px] text-white font-mono bg-black/50 px-1 rounded">
            {debugInfo}
        </div>
      </div>
    </div>
  );
};

export default HandTracker;