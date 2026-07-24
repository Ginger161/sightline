import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';

const focalZ = -30.0;
const thetaMax = 0.25;
const thickness = 0.3;

const stepsData = [
  { id: 'step-1', rIn: 43.50, rOut: 45.40, topY: 4.50 },
  { id: 'step-2', rIn: 45.40, rOut: 46.50, topY: 4.95 },
  { id: 'step-3', rIn: 46.50, rOut: 47.60, topY: 5.40 },
  { id: 'step-4', rIn: 47.60, rOut: 48.70, topY: 5.85 },
  { id: 'step-5', rIn: 48.70, rOut: 49.80, topY: 6.30 },
];

export default React.memo(function BalconyStructure() {

  // Pre-generate curved extruded step platform geometries and risers
  const { stepGeometries, riserGeometries, railingGeometries } = useMemo(() => {
    const thetaStart = Math.PI / 2 - thetaMax;
    const thetaEnd = Math.PI / 2 + thetaMax;

    const sGeoms = stepsData.map(s => {
      const shape = new THREE.Shape();
      shape.absarc(0, 0, s.rOut, thetaStart, thetaEnd, false);
      shape.absarc(0, 0, s.rIn, thetaEnd, thetaStart, true);

      const geom = new THREE.ExtrudeGeometry(shape, {
        depth: thickness,
        bevelEnabled: false,
        curveSegments: 32
      });
      geom.rotateX(Math.PI / 2);
      return { id: s.id, geom, topY: s.topY };
    });

    const rGeoms = stepsData.slice(1).map((s, idx) => {
      const prevY = stepsData[idx].topY;
      const height = s.topY - prevY;
      const rRiser = s.rIn;

      const shape = new THREE.Shape();
      shape.absarc(0, 0, rRiser + 0.04, thetaStart, thetaEnd, false);
      shape.absarc(0, 0, rRiser - 0.04, thetaEnd, thetaStart, true);

      const geom = new THREE.ExtrudeGeometry(shape, {
        depth: height,
        bevelEnabled: false,
        curveSegments: 32
      });
      geom.rotateX(Math.PI / 2);
      return { id: `riser-${idx + 1}`, geom, topY: s.topY };
    });

    // Curved Railing Top Rail & Glass Panel
    const railingRadius = 43.50;
    const railShape = new THREE.Shape();
    railShape.absarc(0, 0, railingRadius + 0.04, thetaStart, thetaEnd, false);
    railShape.absarc(0, 0, railingRadius - 0.04, thetaEnd, thetaStart, true);

    const topRailGeom = new THREE.ExtrudeGeometry(railShape, {
      depth: 0.08,
      bevelEnabled: false,
      curveSegments: 32
    });
    topRailGeom.rotateX(Math.PI / 2);

    const glassPanelGeom = new THREE.ExtrudeGeometry(railShape, {
      depth: 0.70,
      bevelEnabled: false,
      curveSegments: 32
    });
    glassPanelGeom.rotateX(Math.PI / 2);

    return {
      stepGeometries: sGeoms,
      riserGeometries: rGeoms,
      railingGeometries: { topRailGeom, glassPanelGeom }
    };
  }, []);

  return (
    <group position={[0, 0, focalZ]}>
      {/* Curved Step Platforms */}
      {stepGeometries.map(s => (
        <mesh key={s.id} geometry={s.geom} position={[0, s.topY, 0]}>
          <meshStandardMaterial color="#C9C4B8" roughness={1} />
          <Edges color="#A09A8F" />
        </mesh>
      ))}

      {/* Vertical Curved Risers */}
      {riserGeometries.map(r => (
        <mesh key={r.id} geometry={r.geom} position={[0, r.topY, 0]}>
          <meshStandardMaterial color="#1B2430" roughness={0.8} />
          <Edges color="#4B5F7A" />
        </mesh>
      ))}

      {/* Curved Front Safety Railing */}
      <group position={[0, 4.95, 0]}>
        <mesh geometry={railingGeometries.topRailGeom} position={[0, 0.4, 0]}>
          <meshStandardMaterial color="#B08D57" roughness={0.5} />
          <Edges color="#6E2A34" />
        </mesh>
        <mesh geometry={railingGeometries.glassPanelGeom} position={[0, 0, 0]}>
          <meshStandardMaterial color="#1B2430" transparent opacity={0.4} roughness={0.2} />
          <Edges color="#4B5F7A" />
        </mesh>
      </group>

      {/* Under-balcony Support Columns (at Focal Center + 30 offset => z = 13.5m and z = 17.0m) */}
      {[-9, -3, 3, 9].map((xPos) => (
        <React.Fragment key={`balcony-col-group-${xPos}`}>
          <mesh position={[xPos, 2.15, 43.5]}>
            <cylinderGeometry args={[0.25, 0.25, 4.3, 16]} />
            <meshStandardMaterial color="#1B2430" roughness={0.8} />
            <Edges color="#4B5F7A" />
          </mesh>
          <mesh position={[xPos, 2.6, 47.0]}>
            <cylinderGeometry args={[0.25, 0.25, 5.2, 16]} />
            <meshStandardMaterial color="#1B2430" roughness={0.8} />
            <Edges color="#4B5F7A" />
          </mesh>
        </React.Fragment>
      ))}
    </group>
  );
});
