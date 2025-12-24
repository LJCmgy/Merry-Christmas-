import React from 'react';
import Experience from './components/Experience';
import UI from './components/UI';
import HandTracker from './components/HandTracker';

const App: React.FC = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#000510]">
      {/* 3D Scene */}
      <Experience />
      
      {/* User Interface Layer */}
      <UI />
      
      {/* Logic Layer (Invisible/Overlay) */}
      <HandTracker />
    </div>
  );
};

export default App;
