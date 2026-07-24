import landmarkData from '../data/venues/aso-pavilion-landmarks.json' with { type: 'json' };

export const landmarks = landmarkData.landmarks;

function pointSegmentDistance(px, pz, ax, az, bx, bz) {
  const l2 = (ax - bx) ** 2 + (az - bz) ** 2;
  if (l2 === 0) return { dist: Math.hypot(px - ax, pz - az), t: 0 };
  
  let t = ((px - ax) * (bx - ax) + (pz - az) * (bz - az)) / l2;
  t = Math.max(0, Math.min(1, t));
  
  const projX = ax + t * (bx - ax);
  const projZ = az + t * (bz - az);
  
  return { dist: Math.hypot(px - projX, pz - projZ), t };
}

function generateSeats() {
  const seats = [];
  const focalZ = -30;
  
  const allLandmarks = landmarks;
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
        if (l.id === table.id) return false;
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
      
      const isOverlappingLandmark = allLandmarks.some(l => {
        const dx = l.position[0] - x;
        const dz = l.position[2] - z;
        return Math.sqrt(dx*dx + dz*dz) < 0.65;
      });
      
      const isOverlappingTableSeat = seats.some(s => {
        if (s.section !== 'table') return false;
        const dx = s.position.x - x;
        const dz = s.position.z - z;
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
        rotation: theta,
        tier,
        price,
        status: (r === 2 && c % 4 === 0) ? 'sold' : (r === 4 && c % 6 === 0) ? 'held' : 'available'
      });
    }
  }

  // 3D Height-Aware Sightline Obstruction Calculation
  const obstructors = landmarks.filter(l => l.obstructsView);
  const NUM_POINTS = 20;
  const stageZ = -15;
  const stageY = 1.0;
  const stagePoints = [];
  for (let i = 0; i < NUM_POINTS; i++) {
    const fraction = i / (NUM_POINTS - 1);
    const x = -6 + fraction * 12;
    stagePoints.push({ x, y: stageY, z: stageZ });
  }

  for (const seat of seats) {
    const eyeX = seat.position.x;
    const eyeY = (seat.position.y || 0) + 1.1;
    const eyeZ = seat.position.z;
    
    let blockedPoints = 0;
    
    for (const point of stagePoints) {
      let pointBlocked = false;
      
      for (const obs of obstructors) {
        const ox = obs.position[0];
        const oz = obs.position[2];
        
        let bufferRadius = 0.2;
        let obsTopY = 3.0;
        if (obs.type === 'pillar') {
          bufferRadius = 0.4;
          obsTopY = 6.0;
        } else if (obs.type === 'speaker') {
          bufferRadius = 0.5;
          obsTopY = 1.8;
        } else if (obs.type === 'poleSpeaker') {
          bufferRadius = 0.3;
          obsTopY = 3.0;
        }
        
        const res = pointSegmentDistance(ox, oz, eyeX, eyeZ, point.x, point.z);
        if (res.t > 0.01 && res.t < 0.99) {
          if (res.dist < bufferRadius) {
            const rayY = eyeY + res.t * (point.y - eyeY);
            if (rayY <= obsTopY + 0.05 && rayY >= -0.1) {
              pointBlocked = true;
              break;
            }
          }
        }
      }
      
      if (pointBlocked) {
        blockedPoints++;
      }
    }
    
    const blockedPercentage = (blockedPoints / NUM_POINTS) * 100;
    
    let finalLevel = 'clear';
    if (blockedPercentage >= 40) finalLevel = 'heavy';
    else if (blockedPercentage >= 15) finalLevel = 'partial';
    
    seat.obstructionLevel = finalLevel;
    seat.blockedPercentage = blockedPercentage;
  }

  return seats;
}

export const seats = generateSeats();
