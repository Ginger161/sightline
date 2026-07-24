import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';

export default React.memo(function ConferenceBalconyStructure() {
  const thickness = 0.3;

  // Build U-shaped Balcony Platforms: Rear + Left Side + Right Side
  const { platforms, railings } = useMemo(() => {
    const platGeoms = [];
    const railGeoms = [];

    // 1. Rear Stepped Platforms (4 steps, z=14.5 to 19.5, x=[-11.5, 11.5])
    const rearSteps = [
      { y: 4.50, zIn: 14.5, zOut: 15.75 },
      { y: 4.95, zIn: 15.75, zOut: 17.00 },
      { y: 5.40, zIn: 17.00, zOut: 18.25 },
      { y: 5.85, zIn: 18.25, zOut: 19.50 },
    ];

    rearSteps.forEach((s, idx) => {
      const depth = s.zOut - s.zIn;
      const width = 23.0;
      const geom = new THREE.BoxGeometry(width, thickness, depth);
      const zCenter = (s.zIn + s.zOut) / 2;
      platGeoms.push({ id: `rear-step-${idx}`, geom, pos: [0, s.y - thickness / 2, zCenter] });

      // Front railing on first step
      if (idx === 0) {
        const rGeom = new THREE.BoxGeometry(width, 0.9, 0.05);
        railGeoms.push({ id: 'rear-rail', geom: rGeom, pos: [0, s.y + 0.45, s.zIn + 0.025] });
      }
    });

    // 2. Left Side Stepped Platforms (3 steps, x=[-11.5, -8.5], z=[-10.0, 14.5])
    const sideStepsLeft = [
      { y: 4.50, xIn: -9.5, xOut: -8.5 },
      { y: 4.95, xIn: -10.5, xOut: -9.5 },
      { y: 5.40, xIn: -11.5, xOut: -10.5 },
    ];

    sideStepsLeft.forEach((s, idx) => {
      const width = s.xOut - s.xIn;
      const length = 24.5;
      const geom = new THREE.BoxGeometry(width, thickness, length);
      const xCenter = (s.xIn + s.xOut) / 2;
      platGeoms.push({ id: `left-step-${idx}`, geom, pos: [xCenter, s.y - thickness / 2, 2.25] });

      // Inner railing on first side step
      if (idx === 0) {
        const rGeom = new THREE.BoxGeometry(0.05, 0.9, length);
        railGeoms.push({ id: 'left-rail', geom: rGeom, pos: [s.xOut - 0.025, s.y + 0.45, 2.25] });
      }
    });

    // 3. Right Side Stepped Platforms (3 steps, x=[8.5, 11.5], z=[-10.0, 14.5])
    const sideStepsRight = [
      { y: 4.50, xIn: 8.5, xOut: 9.5 },
      { y: 4.95, xIn: 9.5, xOut: 10.5 },
      { y: 5.40, xIn: 10.5, xOut: 11.5 },
    ];

    sideStepsRight.forEach((s, idx) => {
      const width = s.xOut - s.xIn;
      const length = 24.5;
      const geom = new THREE.BoxGeometry(width, thickness, length);
      const xCenter = (s.xIn + s.xOut) / 2;
      platGeoms.push({ id: `right-step-${idx}`, geom, pos: [xCenter, s.y - thickness / 2, 2.25] });

      // Inner railing on first side step
      if (idx === 0) {
        const rGeom = new THREE.BoxGeometry(0.05, 0.9, length);
        railGeoms.push({ id: 'right-rail', geom: rGeom, pos: [s.xIn + 0.025, s.y + 0.45, 2.25] });
      }
    });

    return { platforms: platGeoms, railings: railGeoms };
  }, []);

  return (
    <group>
      {/* Solid U-Shaped Balcony Stepped Platforms */}
      {platforms.map(p => (
        <mesh key={p.id} geometry={p.geom} position={p.pos}>
          <meshStandardMaterial color="#1B2430" roughness={1} />
          <Edges color="#4B5F7A" />
        </mesh>
      ))}

      {/* Glass Safety Railings around U-Shaped Perimeter */}
      {railings.map(r => (
        <mesh key={r.id} geometry={r.geom} position={r.pos}>
          <meshStandardMaterial color="#B08D57" transparent opacity={0.4} roughness={0.2} />
          <Edges color="#B08D57" />
        </mesh>
      ))}
    </group>
  );
});
