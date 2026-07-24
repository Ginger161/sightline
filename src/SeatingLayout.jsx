import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { useCameraState, useHoverState } from './CameraState';
import Seat from './Seat';
import FloatingLabel from './FloatingLabel';
import { getPreset } from './presets';

export function checkIsNeighbor(seat, targetSeat) {
  if (!seat || !targetSeat || seat.id === targetSeat.id) return false;

  if (seat.tableId && targetSeat.tableId) {
    return seat.tableId === targetSeat.tableId;
  }

  if (!seat.tableId && !targetSeat.tableId) {
    const targetCol = targetSeat.relativeCol !== undefined ? targetSeat.relativeCol : targetSeat.col;
    const seatCol = seat.relativeCol !== undefined ? seat.relativeCol : seat.col;

    return seat.section === targetSeat.section &&
      targetCol !== undefined && seatCol !== undefined &&
      Math.abs(seat.row - targetSeat.row) <= 1 &&
      Math.abs(seatCol - targetCol) <= 1;
  }

  return false;
}

// Pre-compute geometries
const bottomGeom = new THREE.BoxGeometry(0.5, 0.45, 0.5);
bottomGeom.translate(0, 0.225, 0);

const backGeom = new THREE.BoxGeometry(0.5, 0.45, 0.1);
backGeom.translate(0, 0.675, 0.2);

const leftArmGeom = new THREE.BoxGeometry(0.05, 0.25, 0.4);
leftArmGeom.translate(-0.225, 0.575, -0.05);

const rightArmGeom = new THREE.BoxGeometry(0.05, 0.25, 0.4);
rightArmGeom.translate(0.225, 0.575, -0.05);

const mergedSeatGeometry = BufferGeometryUtils.mergeGeometries([bottomGeom, backGeom, leftArmGeom, rightArmGeom]);
const seatEdgesGeometry = new THREE.EdgesGeometry(mergedSeatGeometry);

const dummy = new THREE.Object3D();

export default React.memo(function SeatingLayout() {
  const { status, targetSeat, swoopToSeat, showLabel, activeLabel, setHoveredSeatId, ticketedSeatId, activePreset } = useCameraState() || {};
  const preset = getPreset(activePreset);
  const seats = preset?.seats;

  const meshRef = useRef();
  
  const [hoveredId, setHoveredId] = useState(null);
  const hoverTimeoutRef = useRef(null);
  const [isTouchDevice] = useState(() => window.matchMedia('(hover: none) and (pointer: coarse)').matches);

  // Generate the static edges for all seats once
  const allEdgesGeom = useMemo(() => {
    const edgeGeoms = seats.map(seat => {
      const geom = seatEdgesGeometry.clone();
      if (seat.rotationX) {
        geom.applyMatrix4(new THREE.Matrix4().makeRotationX(seat.rotationX));
      }
      if (seat.rotation) {
        geom.applyMatrix4(new THREE.Matrix4().makeRotationY(seat.rotation));
      }
      geom.applyMatrix4(new THREE.Matrix4().makeTranslation(seat.position.x, seat.position.y || 0, seat.position.z));
      return geom;
    });
    return BufferGeometryUtils.mergeGeometries(edgeGeoms);
  }, [seats]);

  // Initialize the instanced mesh matrices and colors
  useLayoutEffect(() => {
    if (meshRef.current && seats.length > 0) {
      const colorObj = new THREE.Color();
      
      seats.forEach((seat, i) => {
        // Set transform
        dummy.position.set(seat.position.x, seat.position.y || 0, seat.position.z);
        dummy.rotation.set(seat.rotationX || 0, seat.rotation || 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        
        // Set permanent color
        let hex = "#B08D57"; // Base unhovered desktop color
        
        if (ticketedSeatId === seat.id) {
          hex = "#FFD166"; // Ticketed seat is always distinctly yellow globally
        }
        
        if (isTouchDevice && ticketedSeatId !== seat.id) {
           // On touch devices, reveal statuses and obstructions permanently
           if (seat.status === 'sold') hex = "#4A5056";
           else if (seat.status === 'held' || seat.status === 'reserved') hex = "#9FA4A9";
           else if (seat.obstructionLevel === 'heavy') hex = "#6E2A34";
           else if (seat.obstructionLevel === 'partial') hex = "#97634D";
        }
        
        colorObj.set(hex);
        meshRef.current.setColorAt(i, colorObj);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [seats, ticketedSeatId, isTouchDevice]);

  const handlePointerMove = (e) => {
    e.stopPropagation();
    if (e.instanceId !== undefined) {
      const seat = seats[e.instanceId];
      if (!seat) return;
      const isLocked = ticketedSeatId && seat.id !== ticketedSeatId;
      
      if (status === 'orbit') {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
        if (hoveredId !== seat.id) {
          setHoveredId(seat.id);
          if (setHoveredSeatId) setHoveredSeatId(seat.id);
        }
        document.body.style.cursor = isLocked ? 'auto' : 'pointer';
      } else if (status === 'pov') {
        if (isLocked) {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
          }
          if (hoveredId !== seat.id) {
            setHoveredId(seat.id);
            if (setHoveredSeatId) setHoveredSeatId(seat.id);
          }
          document.body.style.cursor = 'auto';
          return;
        }

        const isNeighbor = checkIsNeighbor(seat, targetSeat);
        if (isNeighbor) {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
          }
          if (hoveredId !== seat.id) {
            setHoveredId(seat.id);
            if (setHoveredSeatId) setHoveredSeatId(seat.id);
          }
          document.body.style.cursor = 'pointer';
        } else {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
          hoverTimeoutRef.current = setTimeout(() => {
            setHoveredId(null);
            if (setHoveredSeatId) setHoveredSeatId(null);
            document.body.style.cursor = 'auto';
          }, 50);
        }
      }
    }
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredId(null);
      if (setHoveredSeatId) setHoveredSeatId(null);
      document.body.style.cursor = 'auto';
    }, 50);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (e.instanceId !== undefined) {
      const seat = seats[e.instanceId];
      if (!seat) return;
      if (ticketedSeatId && seat.id !== ticketedSeatId) return;

      if (status === 'orbit' && swoopToSeat) {
        let target = [0, 1.1, -14];
        if (seat.section === 'table' && seat.tablePosition) {
          target = [seat.tablePosition[0], 1.1, seat.tablePosition[2]];
        }
        swoopToSeat(seat, target);
      } else if (status === 'pov') {
        const isNeighbor = checkIsNeighbor(seat, targetSeat);
        if (isNeighbor && showLabel) {
          let text = `${seat.id} | ${seat.tier} | ₦${seat.price.toLocaleString('en-NG')}`;
          if (seat.status === 'sold') text += `\nSold`;
          else if (seat.status === 'held') text += `\nHeld`;
          else if (seat.status === 'reserved') text += `\nReserved`;
          
          if (seat.obstructionLevel === 'heavy') text += `\n⚠️ Heavy Obstruction`;
          else if (seat.obstructionLevel === 'partial') text += `\n⚠️ Partial View`;
          showLabel(seat.id, text);
        }
      }
    }
  };

  const hoveredSeat = seats.find(s => s.id === hoveredId);
  const activeLabelSeat = seats.find(s => s.id === activeLabel?.id);

  return (
    <group>
      <instancedMesh 
        ref={meshRef} 
        args={[mergedSeatGeometry, null, seats.length]}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <meshStandardMaterial color="#ffffff" roughness={1} />
      </instancedMesh>
      
      {allEdgesGeom && (
        <lineSegments geometry={allEdgesGeom}>
          <lineBasicMaterial color="#1B2430" />
        </lineSegments>
      )}

      {/* Ghost Hover Seat */}
      {hoveredSeat && (
         <Seat 
           position={hoveredSeat.position} 
           rotation={[hoveredSeat.rotationX || 0, hoveredSeat.rotation || 0, 0]} 
           obstructionLevel={hoveredSeat.obstructionLevel}
           status={hoveredSeat.status}
           isLocked={ticketedSeatId && hoveredSeat.id !== ticketedSeatId}
           isTicketed={ticketedSeatId === hoveredSeat.id}
         />
      )}

      {/* Active Floating Label */}
      {activeLabelSeat && (
         <group position={[activeLabelSeat.position.x, activeLabelSeat.position.y + 1.2, activeLabelSeat.position.z]}>
           <FloatingLabel text={activeLabel.text} position={[0, 0, 0]} />
         </group>
      )}
    </group>
  );
});
