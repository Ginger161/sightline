import React, { useRef, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { useCameraSwoop } from './useCameraSwoop';
import { useCameraState } from './CameraState';

export default function CameraController({ children }) {
  const { status, setStatus, targetSeat, lookAtTarget, captureOverviewRef, restoreOverviewRef } = useCameraState();
  
  const orbitControlsRef = useRef(null);
  const savedOrbitTarget = useRef([0, 3, 0]);
  const savedOrbitState = useRef({
    pos: new THREE.Vector3(),
    quat: new THREE.Quaternion()
  });

  const { camera } = useThree();
  const effectRunCount = useRef(0);

  // Derive the target seat position array if it exists
  const targetSeatPos = React.useMemo(() => {
    return targetSeat 
      ? [targetSeat.position.x, targetSeat.position.y, targetSeat.position.z] 
      : null;
  }, [targetSeat?.id]);

  // The custom hook that drives the camera animation
  useCameraSwoop(
    status, 
    targetSeatPos, 
    lookAtTarget, 
    (completedStatus) => {
      if (completedStatus === 'transitioning') {
        setStatus('pov');
      }
    }
  );


  // Register the synchronous capture/restore functions
  useEffect(() => {
    effectRunCount.current += 1;
    console.log(`[EFFECT RUN] Count: ${effectRunCount.current}, Time: ${performance.now().toFixed(2)}ms`);

    captureOverviewRef.current = () => {
      savedOrbitState.current.pos.copy(camera.position);
      savedOrbitState.current.quat.copy(camera.quaternion);
      console.log(`[CAPTURE] Captured pos:`, savedOrbitState.current.pos.toArray(), `quat:`, savedOrbitState.current.quat.toArray());
      if (orbitControlsRef.current) {
        savedOrbitTarget.current = orbitControlsRef.current.target.toArray();
      }
    };
    
    restoreOverviewRef.current = () => {
      camera.position.copy(savedOrbitState.current.pos);
      camera.quaternion.copy(savedOrbitState.current.quat);
      console.log(`[RESTORE] Restored pos:`, savedOrbitState.current.pos.toArray(), `quat:`, savedOrbitState.current.quat.toArray());
      
      console.log(`[RESTORE FLOW] orbitControlsRef.current is:`, orbitControlsRef.current ? "PRESENT" : "NULL");
      if (orbitControlsRef.current) {
        console.log(`[RESTORE FLOW] Target BEFORE:`, orbitControlsRef.current.target.toArray());
        orbitControlsRef.current.target.fromArray(savedOrbitTarget.current);
        orbitControlsRef.current.update();
        console.log(`[RESTORE FLOW] Target AFTER:`, orbitControlsRef.current.target.toArray());
      }
    };
  }, [camera, captureOverviewRef, restoreOverviewRef]);

  // Sync OrbitControls target immediately when it remounts
  useEffect(() => {
    if (status === 'orbit' && orbitControlsRef.current) {
      console.log(`[SYNC] Forcing camera and target state.`);
      // Force the camera back just in case OrbitControls altered it on mount
      camera.position.copy(savedOrbitState.current.pos);
      camera.quaternion.copy(savedOrbitState.current.quat);
      
      orbitControlsRef.current.target.fromArray(savedOrbitTarget.current);
      orbitControlsRef.current.update();
    }
  }, [status, camera]);

  // Bounded panning logic for Orbit mode
  useFrame(() => {
    if (status === 'orbit' && orbitControlsRef.current) {
      const controls = orbitControlsRef.current;
      const target = controls.target;
      
      const clampedX = THREE.MathUtils.clamp(target.x, -8, 8);
      const clampedZ = THREE.MathUtils.clamp(target.z, -14, 12);
      
      if (target.x !== clampedX || target.z !== clampedZ) {
        const dx = clampedX - target.x;
        const dz = clampedZ - target.z;
        
        target.x = clampedX;
        target.z = clampedZ;
        
        camera.position.x += dx;
        camera.position.z += dz;
      }
    }
  });

  // Compute specific POV target and limits dynamically based on the seat
  const povData = React.useMemo(() => {
    if (status === 'pov' && targetSeatPos && lookAtTarget && targetSeat) {
      const camPos = new THREE.Vector3(targetSeatPos[0], targetSeatPos[1] + 1.1, targetSeatPos[2]);
      const lookAt = new THREE.Vector3(...lookAtTarget);
      
      const dir = new THREE.Vector3().subVectors(lookAt, camPos).normalize();
      const target = new THREE.Vector3().copy(camPos).add(dir.multiplyScalar(0.1));
      const azimuth = Math.atan2(-dir.x, -dir.z);
      
      let azimuthLimit = Math.PI / 2.5; // Default limit for fan/row seats
      if (targetSeat.section === 'table') {
        azimuthLimit = Math.PI - 0.05; // Table seats can look almost 180 degrees back
      }
      
      return { target: target.toArray(), azimuth, azimuthLimit };
    }
    return null;
  }, [status, targetSeatPos, lookAtTarget, targetSeat]);

  return (
    <>
      {children}
      
      {/* Overview Controls */}
      {status === 'orbit' && (
        <OrbitControls 
          makeDefault
          ref={orbitControlsRef}
          target={savedOrbitTarget.current}
          enableDamping={true}
          dampingFactor={0.1}
          minDistance={2}
          maxDistance={40}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />
      )}

      {/* POV Restricted Controls */}
      {status === 'pov' && povData && (
        <OrbitControls
          target={povData.target}
          enableDamping={true}
          dampingFactor={0.1}
          enablePan={false}
          minDistance={0.05}
          maxDistance={0.5}
          minAzimuthAngle={povData.azimuth - povData.azimuthLimit}
          maxAzimuthAngle={povData.azimuth + povData.azimuthLimit}
          minPolarAngle={Math.PI / 2 - 0.2}
          maxPolarAngle={Math.PI / 2 + 0.2}
        />
      )}
    </>
  );
}
