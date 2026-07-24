import React, { useState, useRef } from 'react';
import { Edges } from '@react-three/drei';
import { useCameraState } from './CameraState';
import FloatingLabel from './FloatingLabel';
import { getPreset } from './presets';
import BalconyStructure from './BalconyStructure';
import ConferenceBalconyStructure from './ConferenceBalconyStructure';

function Landmark({ data }) {
  const { id, name, type, position } = data;
  const { showLabel, activeLabel } = useCameraState() || {};
  const [hovered, setHovered] = useState(false);
  const isActive = activeLabel?.id === id;
  const meshRef = useRef();

  let geometry, labelOffset, yOffset = 0;
  switch (type) {
    case 'pillar':
      geometry = <cylinderGeometry args={[0.4, 0.4, 6, 16]} />;
      yOffset = 3;
      labelOffset = [0, 3.5, 0];
      break;
    case 'speaker':
      geometry = <boxGeometry args={[0.6, 1.2, 0.6]} />;
      yOffset = 0.6;
      labelOffset = [0, 1.1, 0];
      break;
    case 'poleSpeaker':
      yOffset = 2.5;
      labelOffset = [0, 0.5, 0];
      break;
    case 'entrance':
      geometry = <boxGeometry args={[2, 3, 0.2]} />;
      yOffset = 1.5;
      labelOffset = [0, 2.0, 0];
      break;
    case 'exit':
      if (Math.abs(position[0]) > 10) {
        geometry = <boxGeometry args={[0.2, 3, 2]} />;
      } else {
        geometry = <boxGeometry args={[2, 3, 0.2]} />;
      }
      yOffset = 1.5;
      labelOffset = [0, 2.0, 0];
      break;
    case 'backstage':
      geometry = <boxGeometry args={[10, 0.1, 2]} />;
      yOffset = 0.05;
      labelOffset = [0, 0.45, 0];
      break;
    case 'stage':
      geometry = <boxGeometry args={[12, 1, 6]} />;
      yOffset = 0.5;
      labelOffset = [0, 1.0, 0];
      break;
    case 'sweetheartPlatform':
      geometry = <cylinderGeometry args={[2.8, 3.0, 0.6, 32]} />;
      yOffset = 0.3;
      labelOffset = [0, 0.8, 0];
      break;
    case 'highTable':
      geometry = <cylinderGeometry args={[0.6, 0.6, 0.8, 16]} />;
      yOffset = 0.4;
      labelOffset = [0, 0.8, 0];
      break;
    case 'carpet':
      geometry = <planeGeometry args={[2.4, 35]} />;
      yOffset = 0.005;
      labelOffset = [0, 0.2, 0];
      break;
    case 'servingTable':
      geometry = <boxGeometry args={[2.5, 0.9, 0.8]} />;
      yOffset = 0.45;
      labelOffset = [0, 1.0, 0];
      break;
    default:
      geometry = <boxGeometry args={[1, 1, 1]} />;
      yOffset = 0.5;
      labelOffset = [0, 1.0, 0];
  }

  const worldPosition = [position[0], position[1] + yOffset, position[2]];
  const meshRotation = type === 'carpet' ? [-Math.PI / 2, 0, 0] : [0, 0, 0];

  const defaultColor = (type === 'exit' || type === 'carpet') ? '#6E2A34' : type === 'entrance' ? '#B08D57' : (type === 'stage' || type === 'sweetheartPlatform') ? '#1B2430' : '#C9C4B8';
  const hoverColor = (type === 'exit' || type === 'carpet') ? '#8B3542' : type === 'entrance' ? '#d1a86b' : (type === 'stage' || type === 'sweetheartPlatform') ? '#2b394d' : '#DEDBD5';
  const edgeColor = type === 'carpet' ? '#4B1C22' : (type === 'stage' || type === 'sweetheartPlatform') ? '#4B5F7A' : '#A09A8F';

  return (
    <group 
      ref={meshRef}
      position={worldPosition}
      onClick={(e) => {
        e.stopPropagation();
        if (showLabel) showLabel(id, data.description || name);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (!hovered) setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {type === 'poleSpeaker' ? (
        <>
          <mesh position={[0, -1.25, 0]}>
             <cylinderGeometry args={[0.05, 0.05, 2.5, 8]} />
             <meshStandardMaterial color={hovered ? hoverColor : defaultColor} roughness={1} />
             <Edges color={edgeColor} />
          </mesh>
          <mesh position={[0, -0.2, 0]}>
             <boxGeometry args={[0.3, 0.4, 0.3]} />
             <meshStandardMaterial color={hovered ? hoverColor : defaultColor} roughness={1} />
             <Edges color={edgeColor} />
          </mesh>
        </>
      ) : (
        <mesh rotation={meshRotation}>
          {geometry}
          <meshStandardMaterial 
            color={hovered ? hoverColor : defaultColor} 
            transparent={type === 'backstage'} 
            opacity={type === 'backstage' ? 0.3 : 1} 
            roughness={1}
          />
          <Edges color={edgeColor} />
        </mesh>
      )}

      {isActive && (
        <FloatingLabel 
          title={name} 
          text={activeLabel?.text || data.description || name} 
          position={labelOffset} 
        />
      )}
    </group>
  );
}

export default React.memo(function RoomShell() {
  const { setOccluders, activePreset } = useCameraState() || {};
  const preset = getPreset(activePreset);
  const landmarks = preset.landmarks || [];
  
  const floorRef = useRef();
  const northWallRef = useRef();
  const southWallRef = useRef();
  const westWallRef = useRef();
  const eastWallRef = useRef();

  React.useEffect(() => {
    if (setOccluders) {
      setOccluders([
        floorRef,
        northWallRef,
        southWallRef,
        westWallRef,
        eastWallRef
      ]);
    }
  }, [setOccluders]);

  const stopPropagation = (e) => e.stopPropagation();

  return (
    <group>
      {/* Floor */}
      <mesh 
        ref={floorRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}
        onPointerOver={stopPropagation} onPointerMove={stopPropagation} onPointerOut={stopPropagation} onClick={stopPropagation}
      >
        <planeGeometry args={[24, 40]} />
        <meshStandardMaterial color="#E8E4DA" roughness={1} />
        <Edges color="#C9C4B8" />
      </mesh>

      {/* North Wall (Back) */}
      <mesh 
        ref={northWallRef} position={[0, 4.5, -20.25]}
        onPointerOver={stopPropagation} onPointerMove={stopPropagation} onPointerOut={stopPropagation} onClick={stopPropagation}
      >
        <boxGeometry args={[24.5, 9, 0.5]} />
        <meshStandardMaterial color="#C9C4B8" roughness={1} />
        <Edges color="#A09A8F" />
      </mesh>

      {/* South Wall (Front) */}
      <mesh 
        ref={southWallRef} position={[0, 4.5, 20.25]}
        onPointerOver={stopPropagation} onPointerMove={stopPropagation} onPointerOut={stopPropagation} onClick={stopPropagation}
      >
        <boxGeometry args={[24.5, 9, 0.5]} />
        <meshStandardMaterial color="#C9C4B8" roughness={1} />
        <Edges color="#A09A8F" />
      </mesh>

      {/* West Wall (Left) */}
      <mesh 
        ref={westWallRef} position={[-12.25, 4.5, 0]}
        onPointerOver={stopPropagation} onPointerMove={stopPropagation} onPointerOut={stopPropagation} onClick={stopPropagation}
      >
        <boxGeometry args={[0.5, 9, 41]} />
        <meshStandardMaterial color="#C9C4B8" roughness={1} />
        <Edges color="#A09A8F" />
      </mesh>

      {/* East Wall (Right) */}
      <mesh 
        ref={eastWallRef} position={[12.25, 4.5, 0]}
        onPointerOver={stopPropagation} onPointerMove={stopPropagation} onPointerOut={stopPropagation} onClick={stopPropagation}
      >
        <boxGeometry args={[0.5, 9, 41]} />
        <meshStandardMaterial color="#C9C4B8" roughness={1} />
        <Edges color="#A09A8F" />
      </mesh>


      {/* --- GROUND PLANE --- */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color="#8C8A84" roughness={1} />
      </mesh>

      {/* Balcony Structure */}
      {activePreset === 'mega-church' && <BalconyStructure />}
      {activePreset === 'conference-theatre' && <ConferenceBalconyStructure />}

      {/* Dynamic Landmarks */}
      {landmarks.map((landmark) => (
        <Landmark key={landmark.id} data={landmark} />
      ))}
    </group>
  );
});
