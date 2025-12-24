import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, Image, Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { ParticleData } from '../types';

const PARTICLE_COUNT = 1500;
const PHOTO_COUNT = 50;

// Helper to generate positions
const generateParticles = (count: number, photoCount: number) => {
  const particles: ParticleData[] = [];

  // Helper for Random Scatter
  const randomVector = (scale: number) => {
    return new THREE.Vector3(
      (Math.random() - 0.5) * scale,
      (Math.random() - 0.5) * scale,
      (Math.random() - 0.5) * scale
    );
  };

  for (let i = 0; i < count; i++) {
    const isPhoto = i < photoCount;
    
    // TREE SHAPE: Spiral
    const ratio = i / count;
    const y = -15 + ratio * 35; 
    const radius = 12 * (1 - ratio) + 0.5; // Tapering
    const angle = i * 0.5; // Spiral tightness
    
    const treePos = new THREE.Vector3(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius
    );

    // SCATTER SHAPE: Galaxy / Nebula cloud
    const scatterPos = randomVector(60);

    let type: ParticleData['type'] = 'cube';
    if (isPhoto) type = 'photo';
    else if (Math.random() > 0.7) type = 'sphere';
    else if (Math.random() > 0.9) type = 'cane';

    const color = new THREE.Color().setHSL(Math.random() * 0.2 + 0.5, 0.8, 0.6); // Blues/Cyans

    particles.push({
      id: i,
      treePos,
      scatterPos,
      type,
      color,
      scale: isPhoto ? 3.0 : (Math.random() * 0.4 + 0.1),
      photoUrl: isPhoto ? `https://picsum.photos/id/${(i % 50) + 10}/200/200` : undefined
    });
  }
  return particles;
};

interface PhotoParticleProps {
  data: ParticleData;
  targetPos: THREE.Vector3;
  isTimeTravel: boolean;
  isFocused: boolean;
}

const PhotoParticle: React.FC<PhotoParticleProps> = ({ data, targetPos, isTimeTravel, isFocused }) => {
  const ref = useRef<THREE.Group>(null);
  const camera = useThree(state => state.camera);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  useFrame((state, delta) => {
    if (!ref.current) return;
    
    // 1. Position Interpolation
    ref.current.position.lerp(targetPos, delta * 2);

    // 2. Rotation Interpolation (Slerp)
    // We use a dummy object to calculate the "Goal Rotation" for this frame
    dummy.position.copy(ref.current.position);
    
    if (isTimeTravel || isFocused) {
      // In these modes, the photo should face the camera
      dummy.lookAt(camera.position);
    } else {
      // By default in scatter/tree, face the center of the world
      dummy.lookAt(0, 0, 0);
    }

    // Smoothly rotate towards the goal
    // Delta * 2.0 provides a nice "weighted" feel, not instant
    ref.current.quaternion.slerp(dummy.quaternion, delta * 2.0);
  });

  return (
    <group ref={ref} position={data.scatterPos}>
      <Image 
        url={data.photoUrl!} 
        scale={[data.scale, data.scale]} 
        transparent 
        opacity={0.9} 
      />
    </group>
  );
};

interface InstancedParticleProps {
  data: ParticleData;
}

const InstancedParticle: React.FC<InstancedParticleProps> = ({ data }) => {
  const ref = useRef<any>(null);
  const mode = useStore(state => state.mode);
  const isTimeTravel = useStore(state => state.isTimeTravel);

  useFrame((state, delta) => {
    if (!ref.current) return;
    
    const target = (mode === 'TREE' && !isTimeTravel) ? data.treePos : data.scatterPos;
    
    ref.current.position.lerp(target, delta * 2.5);
    
    ref.current.rotation.x += delta * 0.5;
    ref.current.rotation.y += delta * 0.5;
    
    const s = data.scale + Math.sin(state.clock.elapsedTime * 2 + data.id) * 0.1 * data.scale;
    ref.current.scale.setScalar(s);
  });

  return (
    <Instance
      ref={ref}
      position={data.scatterPos}
      color={data.color}
    />
  );
};


export const ParticleSystem: React.FC = () => {
  const particles = useMemo(() => generateParticles(PARTICLE_COUNT, PHOTO_COUNT), []);
  const mode = useStore(state => state.mode);
  const isTimeTravel = useStore(state => state.isTimeTravel);
  const isFocusing = useStore(state => state.isFocusing);
  const focusTargetId = useStore(state => state.focusTargetId);
  const sceneRotation = useStore(state => state.sceneRotation);
  
  const groupRef = useRef<THREE.Group>(null);

  const photos = particles.filter(p => p.type === 'photo');
  const cubes = particles.filter(p => p.type === 'cube');
  const spheres = particles.filter(p => p.type === 'sphere');
  const canes = particles.filter(p => p.type === 'cane');
  
  useFrame((state, delta) => {
      if (groupRef.current && !isTimeTravel) {
          const targetRotY = sceneRotation.y;
          const targetRotX = sceneRotation.x;
          
          groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, delta * 8);
          groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, delta * 8);
      } else if (groupRef.current && isTimeTravel) {
          groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, delta * 2);
          groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, delta * 2);
      }
  });

  return (
    <group ref={groupRef}>
      {photos.map((p) => (
        <PhotoParticle 
            key={p.id} 
            data={p} 
            targetPos={(mode === 'TREE' && !isTimeTravel) ? p.treePos : p.scatterPos} 
            isTimeTravel={isTimeTravel}
            isFocused={isFocusing && focusTargetId === p.id}
        />
      ))}

      <Instances range={cubes.length}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial toneMapped={false} emissive="#00ffff" emissiveIntensity={0.5} color="#00ffff" roughness={0.2} />
        {cubes.map((p, i) => <InstancedParticle key={i} data={p} />)}
      </Instances>

      <Instances range={spheres.length}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial toneMapped={false} emissive="#800080" emissiveIntensity={0.8} color="#ff00ff" roughness={0.1} />
        {spheres.map((p, i) => <InstancedParticle key={i} data={p} />)}
      </Instances>
      
       <Instances range={canes.length}>
        <cylinderGeometry args={[0.2, 0.2, 3]} />
        <meshStandardMaterial toneMapped={false} emissive="#ffffff" emissiveIntensity={0.6} color="#ffffff" />
        {canes.map((p, i) => <InstancedParticle key={i} data={p} />)}
      </Instances>

      <CameraController photos={photos} />
    </group>
  );
};


const CameraController = ({ photos }: { photos: ParticleData[] }) => {
  const { camera } = useThree();
  
  const mode = useStore(state => state.mode);
  const isTimeTravel = useStore(state => state.isTimeTravel);
  const targetPhotoIndex = useStore(state => state.targetPhotoIndex);
  const advancePhotoIndex = useStore(state => state.advancePhotoIndex);
  
  const isFocusing = useStore(state => state.isFocusing);
  const focusTargetId = useStore(state => state.focusTargetId);
  const setFocusTarget = useStore(state => state.setFocusTarget);

  const timeInCurrentPhoto = useRef(0);
  const isResettingTree = useRef(false);

  // Trigger reset when mode changes to TREE
  useEffect(() => {
    if (mode === 'TREE' && !isTimeTravel) {
        isResettingTree.current = true;
    }
  }, [mode, isTimeTravel]);
  
  // Manage Focus State Logic
  useEffect(() => {
    if (mode === 'SCATTER') {
        if (isFocusing) {
            // Enter Focus: If no target selected, select a random one
            if (focusTargetId === null) {
                const randomPhoto = photos[Math.floor(Math.random() * photos.length)];
                setFocusTarget(randomPhoto.id);
            }
        } else {
            // Exit Focus: Clear target
            setFocusTarget(null);
        }
    }
  }, [isFocusing, mode, photos, focusTargetId, setFocusTarget]);

  useFrame((state, delta) => {
    // 1. Time Travel Mode
    if (isTimeTravel && targetPhotoIndex !== null) {
      const photo = photos[targetPhotoIndex];
      if (photo) {
        // Target is slightly in front of the photo
        const targetPos = photo.scatterPos.clone().add(new THREE.Vector3(0, 0, 5));
        
        camera.position.lerp(targetPos, delta * 2);
        
        const lookAtTarget = new THREE.Vector3().copy(photo.scatterPos);
        camera.lookAt(lookAtTarget);

        if (camera.position.distanceTo(targetPos) < 2) {
             timeInCurrentPhoto.current += delta;
             if (timeInCurrentPhoto.current > 2.5) { 
                 timeInCurrentPhoto.current = 0;
                 advancePhotoIndex(photos.length);
             }
        }
      }
    } 
    // 2. Pinch Focus Mode (in Scatter)
    else if (mode === 'SCATTER' && isFocusing && focusTargetId !== null) {
        const targetPhoto = photos.find(p => p.id === focusTargetId);
        if (targetPhoto) {
            const direction = new THREE.Vector3().subVectors(camera.position, targetPhoto.scatterPos).normalize();
            if (direction.lengthSq() < 0.001) direction.set(0, 0, 1);
            
            const targetCamPos = targetPhoto.scatterPos.clone().add(direction.multiplyScalar(6));
            
            camera.position.lerp(targetCamPos, delta * 3);
            camera.lookAt(targetPhoto.scatterPos);
        }
    }
    // 3. Tree Reset Mode
    else if (mode === 'TREE' && !isTimeTravel && isResettingTree.current) {
         const targetPos = new THREE.Vector3(0, 0, 55);
         camera.position.lerp(targetPos, delta * 3);
         camera.lookAt(0, 0, 0);
         
         if (camera.position.distanceTo(targetPos) < 1) {
             isResettingTree.current = false;
         }
    }
    // 4. Normal Mode
    else {
        // Normal orbit controls handle this
    }
  });

  return null;
};