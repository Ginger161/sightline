import landmarkData from '../data/venues/aso-pavilion-landmarks.json' with { type: 'json' };

// Filter landmarks to exclude high tables / catering tables for a clean Mega-Church layout
export const landmarks = landmarkData.landmarks.filter(l => l.type !== 'highTable' && l.type !== 'servingTable');

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
  
  // 1. Generate Main Floor Fan Seats in 3 Equal Sections (Left, Center, Right) with 2 Aisles
  const rows = 15;
  const aisleAngleWidth = 0.035; // ~1.3m clear walking aisle

  for (let r = 0; r < rows; r++) {
    const radius = 23 + r;
    const dTheta = 0.55 / radius;
    const maxTheta = Math.asin(Math.min(10.25, radius * Math.sin(Math.PI / 4.5)) / radius);

    const usableAngle = 2 * maxTheta - 2 * aisleAngleWidth;
    const sectionAngle = usableAngle / 3;

    const sections = [
      { name: 'Left', minT: -maxTheta, maxT: -maxTheta + sectionAngle, prefix: 'L' },
      { name: 'Center', minT: -sectionAngle / 2, maxT: sectionAngle / 2, prefix: 'C' },
      { name: 'Right', minT: maxTheta - sectionAngle, maxT: maxTheta, prefix: 'R' }
    ];

    sections.forEach((sec) => {
      const numCols = Math.floor((sec.maxT - sec.minT) / dTheta);
      for (let c = 0; c < numCols; c++) {
        const theta = sec.minT + (c + 0.5) * dTheta;
        if (theta > sec.maxT) continue;

        const x = radius * Math.sin(theta);
        const z = focalZ + radius * Math.cos(theta);

        if (Math.abs(x) > 10.25) continue;

        const isOverlappingLandmark = landmarks.some(l => {
          const dx = l.position[0] - x;
          const dz = l.position[2] - z;
          return Math.sqrt(dx*dx + dz*dz) < 0.65;
        });

        if (isOverlappingLandmark) continue;

        const rowLetter = String.fromCharCode(65 + (r % 26));
        const id = `MC-${sec.prefix}-${rowLetter}${c + 1}`;

        let tier = 'Standard';
        let price = 50000;
        if (r < 5) { tier = 'Premium'; price = 150000; }
        else if (r < 10) { tier = 'Preferred'; price = 100000; }

        seats.push({
          id,
          section: `main-${sec.name.toLowerCase()}`,
          block: sec.name,
          row: r,
          col: c,
          position: { x, y: 0, z },
          rotation: theta,
          rotationX: 0,
          tier,
          price,
          status: (r === 2 && c % 4 === 0) ? 'sold' : (r === 4 && c % 6 === 0) ? 'held' : 'available'
        });
      }
    });
  }

  // 2. Generate Balcony Seats (5 Stepped Rows in Mezzanine z = 14.85 to 19.25)
  // Step 1: z = 14.85m, y = 4.50m (Railing at 13.5m provides 1.35m legroom clearance)
  // Step 2: z = 15.95m, y = 4.95m
  // Step 3: z = 17.05m, y = 5.40m
  // Step 4: z = 18.15m, y = 5.85m
  // Step 5: z = 19.25m, y = 6.30m
  const balconyRows = 5;
  for (let r = 0; r < balconyRows; r++) {
    const seatZCenter = 14.85 + r * 1.10;
    const yElevation = 4.50 + r * 0.45;
    const radius = Math.hypot(0, seatZCenter - focalZ);
    const dTheta = 0.55 / radius;
    const numCols = 2 * Math.floor((Math.PI / 4.8) / dTheta) + 1;
    const centerColIndex = Math.floor(numCols / 2);

    for (let c = 0; c < numCols; c++) {
      const relativeCol = c - centerColIndex;
      const theta = relativeCol * dTheta;
      const x = radius * Math.sin(theta);
      const seatZ = focalZ + radius * Math.cos(theta);

      if (Math.abs(x) > 10.0 || seatZ < 14.3 || seatZ > 19.6) continue;

      const id = `BAL-B${r + 1}-${c + 1}`;

      seats.push({
        id,
        section: 'balcony',
        row: r,
        col: c,
        relativeCol,
        position: { x, y: yElevation, z: seatZ },
        rotation: theta,
        rotationX: 0, // Flat on horizontal stepped risers
        tier: 'Balcony',
        price: 75000,
        status: (r === 1 && c % 3 === 0) ? 'sold' : 'available'
      });
    }
  }

  // 3D Height-Aware Sightline Obstruction Calculation
  const obstructors = landmarks.filter(l => l.obstructsView);
  const NUM_POINTS = 20;
  const stageZ = -15;
  const stageY = 1.0; // Stage top elevation
  const stagePoints = [];
  for (let i = 0; i < NUM_POINTS; i++) {
    const fraction = i / (NUM_POINTS - 1);
    const x = -6 + fraction * 12;
    stagePoints.push({ x, y: stageY, z: stageZ });
  }

  for (const seat of seats) {
    const eyeX = seat.position.x;
    const eyeY = (seat.position.y || 0) + 1.1; // Eye level 1.1m above seat base
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
            // Check 3D sightline ray elevation at projection point t
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
export const hasBalcony = true;
