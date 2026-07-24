import landmarkData from '../data/venues/aso-pavilion-landmarks.json' with { type: 'json' };

// Reposition speakers to perimeter walls
const baseLandmarks = landmarkData.landmarks
  .filter(l => l.type !== 'highTable' && l.type !== 'servingTable')
  .map(l => {
    if (l.id === 'speakerL') return { ...l, position: [-4.0, 0.5, -17.0] };
    if (l.id === 'speakerR') return { ...l, position: [4.0, 0.5, -17.0] };
    if (l.id === 'poleSpeaker1') return { ...l, position: [-10.8, 0, -8.0] };
    if (l.id === 'poleSpeaker2') return { ...l, position: [10.8, 0, -8.0] };
    if (l.id === 'poleSpeaker3') return { ...l, position: [-10.8, 0, 2.0] };
    if (l.id === 'poleSpeaker4') return { ...l, position: [10.8, 0, 2.0] };
    if (l.id === 'poleSpeaker5') return { ...l, position: [10.8, 0, 12.0] };
    return l;
  });

export const landmarks = baseLandmarks;

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

  // 1. Generate Main Floor Seating (14 Straight Rows, 3 Blocks, 2 Aisles)
  const mainRows = 14;
  for (let r = 0; r < mainRows; r++) {
    const seatZ = -13.0 + r * 2.0; // z from -13.0m to +13.0m
    const rowLetter = String.fromCharCode(65 + r);

    // Block 1: Left (7 seats)
    for (let c = 0; c < 7; c++) {
      const x = -7.2 + c * 0.55;
      seats.push({
        id: `CONF-L-${rowLetter}${c + 1}`,
        section: 'main-left',
        block: 'Left',
        row: r,
        col: c,
        position: { x, y: 0, z: seatZ },
        rotation: 0,
        rotationX: 0,
        tier: 'General Admission',
        price: 50000,
        status: (r === 2 && c % 4 === 0) ? 'sold' : 'available'
      });
    }

    // Block 2: Center (9 seats)
    for (let c = 0; c < 9; c++) {
      const x = -2.2 + c * 0.55;
      seats.push({
        id: `CONF-C-${rowLetter}${c + 1}`,
        section: 'main-center',
        block: 'Center',
        row: r,
        col: c,
        position: { x, y: 0, z: seatZ },
        rotation: 0,
        rotationX: 0,
        tier: 'General Admission',
        price: 50000,
        status: (r === 4 && c % 5 === 0) ? 'held' : 'available'
      });
    }

    // Block 3: Right (7 seats)
    for (let c = 0; c < 7; c++) {
      const x = 3.9 + c * 0.55;
      seats.push({
        id: `CONF-R-${rowLetter}${c + 1}`,
        section: 'main-right',
        block: 'Right',
        row: r,
        col: c,
        position: { x, y: 0, z: seatZ },
        rotation: 0,
        rotationX: 0,
        tier: 'General Admission',
        price: 50000,
        status: (r === 1 && c % 3 === 0) ? 'sold' : 'available'
      });
    }
  }

  // 2. Generate U-Shaped Balcony Seating (Rear + Left Side + Right Side)
  // Rear Balcony Section (4 Rows, 25 seats each)
  const rearRows = 4;
  for (let r = 0; r < rearRows; r++) {
    const seatZ = 15.1 + r * 1.25;
    const yElev = 4.50 + r * 0.45;
    for (let c = 0; c < 25; c++) {
      const x = -6.6 + c * 0.55;
      seats.push({
        id: `CONF-BAL-REAR-B${r + 1}-${c + 1}`,
        section: 'balcony-rear',
        block: 'Rear Balcony',
        row: r,
        col: c,
        position: { x, y: yElev, z: seatZ },
        rotation: 0,
        rotationX: 0,
        tier: 'General Admission',
        price: 50000,
        status: (r === 1 && c % 4 === 0) ? 'sold' : 'available'
      });
    }
  }

  // Left Side Balcony Section (3 Stepped Rows dynamically angled toward stage)
  const sideRowsLeft = 3;
  for (let r = 0; r < sideRowsLeft; r++) {
    const x = -9.0 - r * 1.0;
    const yElev = 4.50 + r * 0.45;
    for (let c = 0; c < 12; c++) {
      const seatZ = -9.0 + c * 1.9;
      const rotation = Math.atan2(x, 18.0 + seatZ); // Correct angle toward stage center (+X direction for left side)
      seats.push({
        id: `CONF-BAL-LEFT-L${r + 1}-${c + 1}`,
        section: 'balcony-left',
        block: 'Left Balcony',
        row: r,
        col: c,
        position: { x, y: yElev, z: seatZ },
        rotation,
        rotationX: 0,
        tier: 'General Admission',
        price: 50000,
        status: (c % 5 === 0) ? 'reserved' : 'available'
      });
    }
  }

  // Right Side Balcony Section (3 Stepped Rows dynamically angled toward stage)
  const sideRowsRight = 3;
  for (let r = 0; r < sideRowsRight; r++) {
    const x = 9.0 + r * 1.0;
    const yElev = 4.50 + r * 0.45;
    for (let c = 0; c < 12; c++) {
      const seatZ = -9.0 + c * 1.9;
      const rotation = Math.atan2(x, 18.0 + seatZ); // Correct angle toward stage center (-X direction for right side)
      seats.push({
        id: `CONF-BAL-RIGHT-R${r + 1}-${c + 1}`,
        section: 'balcony-right',
        block: 'Right Balcony',
        row: r,
        col: c,
        position: { x, y: yElev, z: seatZ },
        rotation,
        rotationX: 0,
        tier: 'General Admission',
        price: 50000,
        status: (c % 4 === 0) ? 'sold' : 'available'
      });
    }
  }

  // 3D Height-Aware Sightline Obstruction Calculation
  const obstructors = landmarks.filter(l => l.obstructsView);
  const NUM_POINTS = 20;
  const stageZ = -18;
  const stageY = 1.0;
  const stagePoints = [];
  for (let i = 0; i < NUM_POINTS; i++) {
    const fraction = i / (NUM_POINTS - 1);
    const x = -3.5 + fraction * 7.0; // 7m wide podium stage target
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
export const hasBalcony = true;
