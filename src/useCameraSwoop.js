import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Easing function for smooth acceleration and deceleration
function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function useCameraSwoop(status, targetSeatPos, lookAtTarget, onComplete) {
  const { camera } = useThree();
  
  // State refs for the animation
  const animState = useRef({
    startTime: null,
    startPos: new THREE.Vector3(),
    startQuat: new THREE.Quaternion(),
    endPos: new THREE.Vector3(),
    endQuat: new THREE.Quaternion(),
    isAnimating: false,
    duration: 1.5 // 1.5 seconds swoop
  });


  // Setup animation when status changes to 'transitioning'
  useEffect(() => {
    if (status === 'transitioning' && targetSeatPos && lookAtTarget) {
      // GUARD: Force reset state
      animState.current.isAnimating = false;

      // Start animation from current to the seat
      animState.current.startPos.copy(camera.position);
      animState.current.startQuat.copy(camera.quaternion);

      // 2. Compute end position (seat position + 1.1m for seated eye level)
      animState.current.endPos.set(
        targetSeatPos[0],
        targetSeatPos[1] + 1.1,
        targetSeatPos[2]
      );

      // 3. Compute end quaternion (looking at the stage)
      const dummyCamera = new THREE.PerspectiveCamera();
      dummyCamera.position.copy(animState.current.endPos);
      dummyCamera.lookAt(lookAtTarget[0], lookAtTarget[1], lookAtTarget[2]);
      animState.current.endQuat.copy(dummyCamera.quaternion);

      // 4. Start animation
      // Use performance.now() as requested
      animState.current.startTime = performance.now();
      animState.current.isAnimating = true;
      console.log(`[useCameraSwoop] Started transitioning. startTime=${animState.current.startTime}`);
    }
  }, [status, targetSeatPos, lookAtTarget, camera]);

  // Execute animation loop
  useFrame((state) => {
    if (!animState.current.isAnimating) return;

    const now = performance.now();
    const elapsed = (now - animState.current.startTime) / 1000; // in seconds
    let progress = elapsed / animState.current.duration;

    if (progress >= 1.0) {
      // Animation complete
      progress = 1.0;
      animState.current.isAnimating = false;
      console.log(`[useCameraSwoop useFrame] Animation complete. Snapping to end values.`);
      
      // Snap exactly to final values
      camera.position.copy(animState.current.endPos);
      camera.quaternion.copy(animState.current.endQuat);
      
      // Pass the status that just completed so the controller knows what state to enter
      if (onComplete) onComplete(status);
    } else {
      // Interpolate smoothly
      const easedProgress = easeInOutCubic(progress);
      
      camera.position.lerpVectors(
        animState.current.startPos,
        animState.current.endPos,
        easedProgress
      );
      
      camera.quaternion.slerpQuaternions(
        animState.current.startQuat,
        animState.current.endQuat,
        easedProgress
      );
    }
  });
}
