import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { useCameraState } from './CameraState';
import Seat from './Seat';
import FloatingLabel from './FloatingLabel';

import landmarkData from './data/venues/aso-pavilion-landmarks.json';

function generateSeats() {
  const seats = [];
  const focalZ = -30;
  
  const allLandmarks = landmarkData.landmarks;
  const highTables = allLandmarks.filter(l => l.type === 'highTable');

  // 1. Generate Table Seats
  for (const table of highTables) {
    let prefix = table.id;
    if (prefix === 'highTable') prefix = 'HT';
    else if (prefix.startsWith('vipTable')) prefix = 'VIP' + prefix.replace('vipTable', '');
    else if (prefix.startsWith('cateringTable')) prefix = 'CAT' + prefix.replace('cateringTable', '');

    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      const x = table.position[0] + 0.8 * Math.sin(angle);
      const z = table.position[2] + 0.8 * Math.cos(angle);
      
      const isOverlapping = allLandmarks.some(l => {
        if (l.id === table.id) return false; // Don't check against its own table
        const dx = l.position[0] - x;
        const dz = l.position[2] - z;
        return Math.sqrt(dx*dx + dz*dz) < 0.65;
      });

      if (isOverlapping) continue;

      seats.push({
        id: `${prefix}-${i + 1}`,
        tableId: table.id,
        tablePosition: table.position,
        section: 'table',
        position: { x, y: 0, z },
        rotation: angle,
        tier: prefix.startsWith('VIP') || prefix === 'HT' ? 'Premium' : 'Standard',
        price: prefix.startsWith('VIP') || prefix === 'HT' ? 250000 : 50000,
        status: (i === 1) ? 'sold' : (i === 3) ? 'reserved' : 'available'
      });
    }
  }

  // 2. Generate Fan Seats
  const rows = 23;
  for (let r = 0; r < rows; r++) {
    const radius = 23 + r;
    const dTheta = 0.55 / radius;
    const numCols = 2 * Math.floor((Math.PI / 4.5) / dTheta) + 1;
    const centerColIndex = Math.floor(numCols / 2);

    for (let c = 0; c < numCols; c++) {
      const relativeCol = c - centerColIndex;
      const theta = relativeCol * dTheta;
      
      const x = radius * Math.sin(theta);
      const z = focalZ + radius * Math.cos(theta);
      
      const isOutsideWalls = Math.abs(x) > 10.25;
      
      // Check overlap against landmarks (including tables)
      const isOverlappingLandmark = allLandmarks.some(l => {
        const dx = l.position[0] - x;
        const dz = l.position[2] - z;
        return Math.sqrt(dx*dx + dz*dz) < 0.65;
      });
      
      // Check overlap against newly generated table seats
      const isOverlappingTableSeat = seats.some(s => {
        if (s.section !== 'table') return false;
        const dx = s.position.x - x;
        const dz = s.position.z - z;
        // Seats are 0.55m wide, so 0.55m clearance center-to-center
        return Math.sqrt(dx*dx + dz*dz) < 0.55;
      });

      if (isOutsideWalls || isOverlappingLandmark || isOverlappingTableSeat) continue;
      
      const id = `${String.fromCharCode(65 + (r % 26))}${r >= 26 ? Math.floor(r/26) : ''}${c + 1}`;
      
      let tier = 'Standard';
      let price = 50000;
      if (r < 6) { tier = 'Premium'; price = 150000; }
      else if (r < 12) { tier = 'Preferred'; price = 100000; }
      
      seats.push({
        id,
        section: 'main',
        row: r,
        col: c,
        relativeCol,
        position: { x, y: 0, z },
        rotation: theta, // Positive theta faces inward
        tier,
        price,
        status: (r === 2 && c % 4 === 0) ? 'sold' : (r === 4 && c % 6 === 0) ? 'held' : 'available'
      });
    }
  }

function pointSegmentDistance(px, pz, ax, az, bx, bz) {
  const l2 = (ax - bx) ** 2 + (az - bz) ** 2;
  if (l2 === 0) return { dist: Math.hypot(px - ax, pz - az), t: 0 };
  
  let t = ((px - ax) * (bx - ax) + (pz - az) * (bz - az)) / l2;
  t = Math.max(0, Math.min(1, t));
  
  const projX = ax + t * (bx - ax);
  const projZ = az + t * (bz - az);
  
  return { dist: Math.hypot(px - projX, pz - projZ), t };
}

  const obstructors = allLandmarks.filter(l => l.obstructsView);
  
  // 1. Stage sample points
  const NUM_POINTS = 20;
  const stageZ = -15;
  const stagePoints = [];
  for (let i = 0; i < NUM_POINTS; i++) {
    const fraction = i / (NUM_POINTS - 1);
    const x = -6 + fraction * 12; // Full 12m width
    stagePoints.push({ x, z: stageZ });
  }

  for (const seat of seats) {
    const sx = seat.position.x;
    const sz = seat.position.z;
    
    let blockedPoints = 0;
    
    // 2. Test each sample point
    for (const point of stagePoints) {
      let pointBlocked = false;
      
      for (const obs of obstructors) {
        const ox = obs.position[0];
        const oz = obs.position[2];
        
        // 3. Footprint + tight buffer
        let bufferRadius = 0.2;
        if (obs.type === 'pillar') {
          bufferRadius = 0.4;
        } else if (obs.type === 'speaker') {
          bufferRadius = 0.5;
        } else if (obs.type === 'poleSpeaker') {
          bufferRadius = 0.3;
        }
        
        const res = pointSegmentDistance(ox, oz, sx, sz, point.x, point.z);
        if (res.t > 0.01 && res.t < 0.99) {
          if (res.dist < bufferRadius) {
            pointBlocked = true;
            break; // Point is blocked by ANY obstructor, move to next point
          }
        }
      }
      
      if (pointBlocked) {
        blockedPoints++;
      }
    }
    
    // 4. Calculate percentage
    const blockedPercentage = (blockedPoints / NUM_POINTS) * 100;
    
    let finalLevel = 'clear';
    if (blockedPercentage >= 40) finalLevel = 'heavy';
    else if (blockedPercentage >= 15) finalLevel = 'partial';
    
    seat.obstructionLevel = finalLevel;
    seat.blockedPercentage = blockedPercentage; // Store for debugging/reporting
  }

  return seats;
}

export const SEATS_DATA = generateSeats();

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
  const { status, targetSeat, swoopToSeat, showLabel, activeLabel, setHoveredSeatId, ticketedSeatId } = useCameraState() || {};
  const meshRef = useRef();
  
  const [hoveredId, setHoveredId] = useState(null);
  const hoverTimeoutRef = useRef(null);
  const [isTouchDevice] = useState(() => window.matchMedia('(hover: none) and (pointer: coarse)').matches);

  // Generate the static edges for all seats once
  const allEdgesGeom = useMemo(() => {
    const edgeGeoms = SEATS_DATA.map(seat => {
      const geom = seatEdgesGeometry.clone();
      if (seat.rotation) {
        geom.applyMatrix4(new THREE.Matrix4().makeRotationY(seat.rotation));
      }
      geom.applyMatrix4(new THREE.Matrix4().makeTranslation(seat.position.x, seat.position.y, seat.position.z));
      return geom;
    });
    return BufferGeometryUtils.mergeGeometries(edgeGeoms);
  }, []);

  // Initialize the instanced mesh matrices and colors
  useLayoutEffect(() => {
    if (meshRef.current) {
      const colorObj = new THREE.Color();
      
      SEATS_DATA.forEach((seat, i) => {
        // Set transform
        dummy.position.set(seat.position.x, seat.position.y, seat.position.z);
        dummy.rotation.set(0, seat.rotation || 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        
        // Set permanent color
        let hex = "#B08D57"; // Base unhovered desktop color
        
        if (ticketedSeatId === seat.id) {
          hex = "#FFD166"; // Ticketed seat is always distinctly yellow globally
        } else if (ticketedSeatId) {
          // If a ticket is held, we optionally dim everything else. 
          // However, the instructions specified the dim tint is shown "on hover" for locked seats.
          // Let's keep the base color normal here, and let Seat.jsx handle the dimming on hover.
          // BUT on mobile, maybe we want them permanently dimmed? For now, we'll just handle status/obstruction.
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
  }, [ticketedSeatId, isTouchDevice]);

  const handlePointerMove = (e) => {
    e.stopPropagation();
    if (e.instanceId !== undefined) {
      const seat = SEATS_DATA[e.instanceId];
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

        let isNeighbor = false;
        if (seat.tableId && targetSeat.tableId) {
          isNeighbor = seat.tableId === targetSeat.tableId && seat.id !== targetSeat.id;
        } else if (!seat.tableId && !targetSeat.tableId) {
          isNeighbor = targetSeat && 
            seat.section === targetSeat.section && 
            Math.abs(seat.row - targetSeat.row) <= 1 && 
            Math.abs(seat.relativeCol - targetSeat.relativeCol) <= 1 && 
            seat.id !== targetSeat.id;
        }
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
      const seat = SEATS_DATA[e.instanceId];
      if (ticketedSeatId && seat.id !== ticketedSeatId) return; // Do nothing if it's locked

      if (status === 'orbit' && swoopToSeat) {
        let target = [0, 1.1, -14]; // Default to stage center
        if (seat.section === 'table' && seat.tablePosition) {
          target = [seat.tablePosition[0], 1.1, seat.tablePosition[2]]; // Look at table center
        }
        swoopToSeat(seat, target);
      } else if (status === 'pov') {
        let isNeighbor = false;
        if (seat.tableId && targetSeat.tableId) {
          isNeighbor = seat.tableId === targetSeat.tableId && seat.id !== targetSeat.id;
        } else if (!seat.tableId && !targetSeat.tableId) {
          isNeighbor = targetSeat && 
            seat.section === targetSeat.section && 
            Math.abs(seat.row - targetSeat.row) <= 1 && 
            Math.abs(seat.relativeCol - targetSeat.relativeCol) <= 1 && 
            seat.id !== targetSeat.id;
        }
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

  const hoveredSeat = SEATS_DATA.find(s => s.id === hoveredId);
  const activeLabelSeat = SEATS_DATA.find(s => s.id === activeLabel?.id);

  return (
    <group>
      <instancedMesh 
        ref={meshRef} 
        args={[mergedSeatGeometry, null, SEATS_DATA.length]}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        {/* Set base color to white so instance colors blend correctly */}
        <meshStandardMaterial color="#ffffff" roughness={1} />
      </instancedMesh>
      
      <lineSegments geometry={allEdgesGeom}>
        <lineBasicMaterial color="#1B2430" />
      </lineSegments>

      {/* Ghost Hover Seat (Renders on top to show highlight and scale safely) */}
      {hoveredSeat && (
         <Seat 
           position={hoveredSeat.position} 
           rotation={[0, hoveredSeat.rotation || 0, 0]} 
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
