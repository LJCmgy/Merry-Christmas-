import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { ParticleSystem } from './ParticleSystem';
import { useStore } from '../store';
import '../types';

const SceneContent = () => {
    const isTimeTravel = useStore(state => state.isTimeTravel);

    return (
        <>
            <OrbitControls 
                enableZoom={!isTimeTravel} 
                enablePan={!isTimeTravel}
                autoRotate={!isTimeTravel}
                autoRotateSpeed={0.5}
            />
            
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#00ffff" />
            <pointLight position={[-10, -10, -10]} intensity={1.5} color="#ff00ff" />
            
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Environment preset="night" />

            <ParticleSystem />

            <EffectComposer disableNormalPass>
                <Bloom 
                    luminanceThreshold={0.2} 
                    mipmapBlur 
                    intensity={1.5} 
                    radius={0.6}
                />
                <Vignette eskil={false} offset={0.1} darkness={0.5} />
            </EffectComposer>
        </>
    );
};

const Experience: React.FC = () => {
  return (
    <div className="w-full h-screen relative bg-black">
      <Canvas
        camera={{ position: [0, 0, 40], fov: 60 }}
        dpr={[1, 2]}
        gl={{ antialias: false, toneMappingExposure: 1.5 }}
      >
        <Suspense fallback={null}>
            <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Experience;