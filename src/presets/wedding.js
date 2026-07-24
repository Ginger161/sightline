import landmarkData from '../data/venues/aso-pavilion-landmarks.json' with { type: 'json' };

// Room landmarks filtering out old banquet tables & old stage, and repositioning speakers to perimeter walls
const baseLandmarks = landmarkData.landmarks
  .filter(l => l.type !== 'highTable' && l.type !== 'servingTable' && l.type !== 'stage')
  .map(l => {
    // Reposition speakers to side walls away from center aisle
    if (l.id === 'speakerL') return { ...l, position: [-5.5, 0.5, -17.0] };
    if (l.id === 'speakerR') return { ...l, position: [5.5, 0.5, -17.0] };
    if (l.id === 'poleSpeaker1') return { ...l, position: [-10.8, 0, -8.0] };
    if (l.id === 'poleSpeaker2') return { ...l, position: [10.8, 0, -8.0] };
    if (l.id === 'poleSpeaker3') return { ...l, position: [-10.8, 0, 2.0] };
    if (l.id === 'poleSpeaker4') return { ...l, position: [10.8, 0, 2.0] };
    if (l.id === 'poleSpeaker5') return { ...l, position: [10.8, 0, 12.0] }; // Moved from center aisle (0, 0, -1) to perimeter wall
    return l;
  });

// 1. Couple's Platform & Processional Carpet Landmarks
const platformLandmark = { "id": "sweetheartPlatform", "name": "Couple's Platform", "type": "sweetheartPlatform", "position": [0, 0, -18], "labelStyle": "html" };
const processionalCarpetLandmark = { "id": "processionalCarpet", "name": "Processional Carpet Runner", "type": "carpet", "position": [0, 0, 2.0], "labelStyle": "none" };

// VIP Head Tables (Positioned around Couple's Platform with central opening)
const vipTableLandmarks = [
  { id: 'vipTable1', name: 'VIP Table 1', type: 'highTable', position: [-4.0, 0, -13.5], labelStyle: 'html' },
  { id: 'vipTable2', name: 'VIP Table 2', type: 'highTable', position: [4.0, 0, -13.5], labelStyle: 'html' },
  { id: 'vipTable3', name: 'VIP Table 3', type: 'highTable', position: [-8.5, 0, -14.5], labelStyle: 'html' },
  { id: 'vipTable4', name: 'VIP Table 4', type: 'highTable', position: [8.5, 0, -14.5], labelStyle: 'html' },
];

// Staggered Main Floor Dining Tables Grid with Processional Center Aisle
const staggeredTableLandmarks = [];
const tableRows = [
  { z: -9.5, xs: [-8.5, -3.2, 3.2, 8.5] },
  { z: -5.5, xs: [-7.0, -2.8, 2.8, 7.0] },
  { z: -1.5, xs: [-8.5, -2.6, 2.6, 8.5] },
  { z: 2.5,  xs: [-7.0, -2.8, 2.8, 7.0] },
  { z: 6.5,  xs: [-8.5, -3.2, 3.2, 8.5] },
  { z: 10.5, xs: [-7.0, -2.8, 2.8, 7.0] },
  { z: 14.5, xs: [-8.5, -3.2, 3.2, 8.5] },
];

let tIdx = 1;
tableRows.forEach((r) => {
  r.xs.forEach((x) => {
    // Check overlap with pillars
    const isNearPillar = baseLandmarks.some(l => {
      if (l.type !== 'pillar') return false;
      const dx = l.position[0] - x;
      const dz = l.position[2] - r.z;
      return Math.hypot(dx, dz) < 1.8;
    });

    if (!isNearPillar) {
      staggeredTableLandmarks.push({
        id: `weddingTable${tIdx}`,
        name: `Table ${tIdx}`,
        type: 'highTable',
        position: [x, 0, r.z],
        labelStyle: 'html'
      });
      tIdx++;
    }
  });
});

// Catering & Serving Zone Landmarks (Near Rear Entrance)
const cateringZoneLandmarks = [
  { id: 'servingTable1', name: 'Serving Table 1', type: 'servingTable', position: [-8, 0, 19.5], labelStyle: 'html' },
  { id: 'servingTable2', name: 'Serving Table 2', type: 'servingTable', position: [-4, 0, 19.5], labelStyle: 'html' },
  { id: 'servingTable3', name: 'Serving Table 3', type: 'servingTable', position: [4, 0, 19.5], labelStyle: 'html' },
  { id: 'servingTable4', name: 'Serving Table 4', type: 'servingTable', position: [8, 0, 19.5], labelStyle: 'html' },
  { id: 'cateringTable1', name: 'Catering Table 1', type: 'highTable', position: [-9, 0, 17.5], labelStyle: 'html' },
  { id: 'cateringTable2', name: 'Catering Table 2', type: 'highTable', position: [-5, 0, 16.5], labelStyle: 'html' },
  { id: 'cateringTable5', name: 'Catering Table 5', type: 'highTable', position: [5, 0, 16.5], labelStyle: 'html' },
  { id: 'cateringTable6', name: 'Catering Table 6', type: 'highTable', position: [9, 0, 17.5], labelStyle: 'html' },
];

export const landmarks = [
  ...baseLandmarks,
  platformLandmark,
  processionalCarpetLandmark,
  ...vipTableLandmarks,
  ...staggeredTableLandmarks,
  ...cateringZoneLandmarks
];

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
  const cateringTables = cateringZoneLandmarks.filter(l => l.type === 'highTable');
  const allTables = [...vipTableLandmarks, ...staggeredTableLandmarks, ...cateringTables];

  // Generate 8 seats around each round table
  for (const table of allTables) {
    const isVip = table.id.startsWith('vipTable');
    const isCatering = table.id.startsWith('cateringTable');
    let prefix = table.id;
    if (prefix.startsWith('vipTable')) prefix = 'VIP' + prefix.replace('vipTable', '');
    else if (prefix.startsWith('weddingTable')) prefix = 'T' + prefix.replace('weddingTable', '');
    else if (prefix.startsWith('cateringTable')) prefix = 'CAT' + prefix.replace('cateringTable', '');

    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      const x = table.position[0] + 0.8 * Math.sin(angle);
      const z = table.position[2] + 0.8 * Math.cos(angle);
      
      const isOverlapping = landmarks.some(l => {
        if (l.id === table.id) return false;
        const dx = l.position[0] - x;
        const dz = l.position[2] - z;
        return Math.hypot(dx, dz) < 0.65;
      });

      if (isOverlapping) continue;

      seats.push({
        id: `${prefix}-${i + 1}`,
        tableId: table.id,
        tablePosition: table.position,
        section: 'table',
        position: { x, y: 0, z },
        rotation: angle,
        rotationX: 0,
        tier: isVip ? 'VIP Sweetheart' : isCatering ? 'Catering Cocktail' : 'Reception Standard',
        price: isVip ? 250000 : 50000,
        status: (i === 1) ? 'sold' : (i === 3) ? 'reserved' : 'available'
      });
    }
  }

  // 3D Sightline Obstruction Calculation targeting Couple's Platform
  const obstructors = landmarks.filter(l => l.obstructsView);
  const NUM_POINTS = 20;
  const platformZ = -18;
  const platformY = 0.6;
  const stagePoints = [];
  for (let i = 0; i < NUM_POINTS; i++) {
    const fraction = i / (NUM_POINTS - 1);
    const x = -2.5 + fraction * 5.0; // 5m wide platform target
    stagePoints.push({ x, y: platformY, z: platformZ });
  }

  for (const seat of seats) {
    const eyeX = seat.position.x;
    const eyeY = 1.1; // Eye level 1.1m above ground
    const eyeZ = seat.position.z;
    let blockedPoints = 0;

    for (const point of stagePoints) {
      let pointBlocked = false;
      for (const obs of obstructors) {
        if (obs.id === seat.tableId) continue;
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
      if (pointBlocked) blockedPoints++;
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
export const hasBalcony = false;
