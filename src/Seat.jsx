import React from 'react';
import { Edges, Html } from '@react-three/drei';

export default function Seat({ position, rotation, obstructionLevel, status, isLocked, isTicketed }) {
  const scale = 1.05;
  let color = "#C19D67";
  let edgeColor = "#1B2430";
  
  if (isTicketed) {
    color = "#FFD166"; // Distinct Yellow
  } else if (isLocked) {
    color = "#4A5056"; // Dim tint
    edgeColor = "rgba(27, 36, 48, 0.4)";
  } else if (status === 'sold') {
    color = "#4A5056"; // Dark slate
  } else if (status === 'held' || status === 'reserved') {
    color = "#9FA4A9"; // Lighter slate
  } else {
    if (obstructionLevel === 'heavy') color = "#6E2A34";
    else if (obstructionLevel === 'partial') color = "#97634D";
  }
  
  const ignoreRaycast = () => null;

  return (
    <group 
      position={[position.x, position.y, position.z]} 
      rotation={rotation || [0, 0, 0]}
      scale={[scale, scale, scale]}
    >
      {/* Seat Bottom */}
      <mesh position={[0, 0.225, 0]} raycast={ignoreRaycast}>
        <boxGeometry args={[0.5, 0.45, 0.5]} />
        <meshStandardMaterial color={color} roughness={1} />
        <Edges color={edgeColor} />
      </mesh>
      
      {/* Seat Back */}
      <mesh position={[0, 0.675, 0.2]} raycast={ignoreRaycast}>
        <boxGeometry args={[0.5, 0.45, 0.1]} />
        <meshStandardMaterial color={color} roughness={1} />
        <Edges color={edgeColor} />
      </mesh>

      {/* Left Armrest */}
      <mesh position={[-0.225, 0.575, -0.05]} raycast={ignoreRaycast}>
        <boxGeometry args={[0.05, 0.25, 0.4]} />
        <meshStandardMaterial color={color} roughness={1} />
        <Edges color={edgeColor} />
      </mesh>

      {/* Right Armrest */}
      <mesh position={[0.225, 0.575, -0.05]} raycast={ignoreRaycast}>
        <boxGeometry args={[0.05, 0.25, 0.4]} />
        <meshStandardMaterial color={color} roughness={1} />
        <Edges color={edgeColor} />
      </mesh>

      {/* Lock Icon Overlay */}
      {isLocked && (
        <Html center position={[0, 0.8, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            fontSize: '16px',
            opacity: 0.8,
            textShadow: '0px 2px 4px rgba(0,0,0,0.5)'
          }}>
            🔒
          </div>
        </Html>
      )}
    </group>
  );
}
