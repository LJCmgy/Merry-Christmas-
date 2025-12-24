import React, { useEffect } from 'react';
import { useStore } from '../store';

const UI: React.FC = () => {
  const mode = useStore(state => state.mode);
  const handState = useStore(state => state.handState);
  const isTimeTravel = useStore(state => state.isTimeTravel);
  const setTimeTravel = useStore(state => state.setTimeTravel);
  const resetPhotoIndex = useStore(state => state.resetPhotoIndex);

  // Keyboard shortcut for Time Travel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 't') {
        if (!isTimeTravel) {
            resetPhotoIndex();
            setTimeTravel(true);
        } else {
            setTimeTravel(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTimeTravel, setTimeTravel, resetPhotoIndex]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      {/* Header */}
      <div className="flex flex-col items-center">
        <h1 className="text-4xl md:text-6xl font-bold font-[Cinzel] aurora-text tracking-widest animate-pulse">
          FROZEN AURORA
        </h1>
        <p className="text-cyan-200 font-[Orbitron] text-xs md:text-sm mt-2 opacity-80 tracking-widest">
          INTERACTIVE CHRISTMAS EXPERIENCE
        </p>
      </div>

      {/* Center Notification */}
      {isTimeTravel && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="glass-panel px-8 py-4 rounded-full animate-bounce">
                <span className="text-cyan-100 font-[Orbitron] text-xl tracking-widest shadow-blue-500 drop-shadow-lg">
                    TIME TRAVEL ACTIVE
                </span>
            </div>
        </div>
      )}

      {/* Instructions / Controls */}
      <div className="flex flex-col md:flex-row justify-between items-end w-full">
        
        {/* Left: Instructions */}
        <div className="glass-panel p-4 rounded-lg max-w-sm mb-4 md:mb-0">
           <h3 className="text-cyan-400 font-[Orbitron] mb-2 text-sm border-b border-cyan-800 pb-1">CONTROLS</h3>
           <ul className="text-xs text-blue-100 space-y-2 font-mono">
             <li className="flex items-center">
                <span className="w-6 text-xl">✊</span> 
                <span className="opacity-80">FIST = FORM TREE</span>
             </li>
             <li className="flex items-center">
                <span className="w-6 text-xl">✋</span> 
                <span className="opacity-80">OPEN = SCATTER STARS</span>
             </li>
             <li className="flex items-center">
                <span className="w-6 text-xl">👌</span> 
                <span className="opacity-80">PINCH = FOCUS PHOTO</span>
             </li>
             <li className="flex items-center mt-2 pt-2 border-t border-cyan-800">
                <span className="w-6 font-bold text-cyan-300">T</span> 
                <span className="opacity-80">KEY = TIME TRAVEL</span>
             </li>
           </ul>
        </div>

        {/* Right: Status */}
        <div className="glass-panel p-4 rounded-lg flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
                <span className="text-xs text-cyan-500 font-mono">SYSTEM MODE</span>
                <span className={`text-lg font-[Orbitron] font-bold ${mode === 'TREE' ? 'text-green-400' : 'text-purple-400'}`}>
                    {mode}
                </span>
            </div>
            
            <div className="flex items-center gap-2">
                <span className="text-xs text-cyan-500 font-mono">HAND DETECTED</span>
                <div className={`w-3 h-3 rounded-full ${handState.isPresent ? 'bg-green-500 shadow-[0_0_10px_#00ff00]' : 'bg-red-900'}`} />
            </div>

            <div className="flex items-center gap-2">
                <span className="text-xs text-cyan-500 font-mono">GESTURE</span>
                <span className="text-sm text-white font-bold font-mono min-w-[60px] text-right">
                    {handState.gesture}
                </span>
            </div>

             <button 
                onClick={() => {
                    if(isTimeTravel) setTimeTravel(false);
                    else { resetPhotoIndex(); setTimeTravel(true); }
                }}
                className="mt-2 pointer-events-auto bg-cyan-900/50 hover:bg-cyan-700/50 text-cyan-100 border border-cyan-500 px-4 py-1 rounded text-xs font-[Orbitron] transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,255,255,0.4)]"
            >
                {isTimeTravel ? 'STOP TRAVEL' : 'START TRAVEL'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default UI;
