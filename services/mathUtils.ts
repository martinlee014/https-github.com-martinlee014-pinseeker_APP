
import { LatLng, ClubStats } from '../types';

const EARTH_RADIUS = 6378137.0; // Meters

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

export const calculateDistance = (p1: LatLng, p2: LatLng): number => {
  const dLat = toRad(p2.lat - p1.lat);
  const dLon = toRad(p2.lng - p1.lng);
  const lat1 = toRad(p1.lat);
  const lat2 = toRad(p2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS * c;
};

export const calculateBearing = (start: LatLng, end: LatLng): number => {
  const lat1 = toRad(start.lat);
  const lat2 = toRad(end.lat);
  const dLon = toRad(end.lng - start.lng);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
};

export const calculateDestination = (start: LatLng, distanceMeters: number, bearingDegrees: number): LatLng => {
  const radLat = toRad(start.lat);
  const radLon = toRad(start.lng);
  const radBearing = toRad(bearingDegrees);
  const angularDist = distanceMeters / EARTH_RADIUS;

  const endLat = Math.asin(
    Math.sin(radLat) * Math.cos(angularDist) +
    Math.cos(radLat) * Math.sin(angularDist) * Math.cos(radBearing)
  );

  const endLon = radLon + Math.atan2(
    Math.sin(radBearing) * Math.sin(angularDist) * Math.cos(radLat),
    Math.cos(angularDist) - Math.sin(radLat) * Math.sin(endLat)
  );

  return {
    lat: toDeg(endLat),
    lng: toDeg(endLon),
  };
};

export const calculateWindAdjustedShot = (
  start: LatLng,
  baseDistance: number,
  bearing: number,
  windSpeed: number,
  windDir: number
): { destination: LatLng; playsLike: number } => {
  const relativeWindAngle = (windDir - bearing + 180) % 360;
  const windRad = toRad(relativeWindAngle);
  
  // Simple physics model
  const headWindComp = windSpeed * Math.cos(windRad);
  const crossWindComp = windSpeed * Math.sin(windRad);
  
  // Effect coefficients (simplified)
  const distEffect = headWindComp * 0.01 * baseDistance; 
  const sideEffect = crossWindComp * 0.005 * baseDistance;
  
  const newDistance = baseDistance - distEffect;
  const bearingShift = toDeg(Math.atan2(sideEffect, newDistance));
  
  return {
    destination: calculateDestination(start, newDistance, bearing + bearingShift),
    playsLike: newDistance
  };
};

export const getEllipsePoints = (center: LatLng, width: number, height: number, rotation: number): LatLng[] => {
  const points: LatLng[] = [];
  const rotationRad = toRad(rotation);
  const segments = 36;

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * 2 * Math.PI;
    const dx = (width / 2) * Math.cos(theta);
    const dy = (height / 2) * Math.sin(theta);
    
    const rx = dx * Math.cos(rotationRad) - dy * Math.sin(rotationRad);
    const ry = dx * Math.sin(rotationRad) + dy * Math.cos(rotationRad);
    
    // Convert back to LatLng (approximate using meters to degrees)
    const dLat = ry / EARTH_RADIUS;
    const dLon = rx / (EARTH_RADIUS * Math.cos(toRad(center.lat)));
    
    points.push({
      lat: center.lat + toDeg(dLat),
      lng: center.lng + toDeg(dLon)
    });
  }
  return points;
};

// Generate curved points for trajectory (Quadratic Bezier)
export const getArcPoints = (start: LatLng, end: LatLng): LatLng[] => {
  const points: LatLng[] = [];
  const numPoints = 20;
  
  // Calculate a control point to create the curve
  // We place it at the midpoint, offset slightly to the side to simulate a visual arc
  // For a "vertical" flight look on a 2D map, standard convention is just a straight line
  // But user requested "arc/curve". We will do a slight "Draw" shape (curve left).
  
  const midLat = (start.lat + end.lat) / 2;
  const midLng = (start.lng + end.lng) / 2;
  
  // Create an offset perpendicular to the path
  const bearing = calculateBearing(start, end);
  const dist = calculateDistance(start, end);
  
  // Offset depends on distance. E.g. 5% of distance.
  const offsetMeters = dist * 0.1; 
  
  // Control point is midpoint shifted 90 degrees relative to bearing
  // Visual effect: A slight curve
  const controlPoint = calculateDestination({lat: midLat, lng: midLng}, offsetMeters, bearing - 90);

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Quadratic Bezier: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
    const lat = (1 - t) * (1 - t) * start.lat + 2 * (1 - t) * t * controlPoint.lat + t * t * end.lat;
    const lng = (1 - t) * (1 - t) * start.lng + 2 * (1 - t) * t * controlPoint.lng + t * t * end.lng;
    points.push({ lat, lng });
  }
  
  return points;
};

export const formatDistance = (meters: number, useYards: boolean): string => {
  if (useYards) {
    return `${Math.round(meters * 1.09361)}yd`;
  }
  return `${Math.round(meters)}m`;
};

// --- STRATEGY ALGORITHMS ---

/**
 * Calculates the optimal two-shot strategy to reach a target.
 * It favors combinations that minimize total side error (dispersion).
 */
export const calculateLayupStrategy = (
  distanceToGreen: number,
  bag: ClubStats[],
  shotNum: number
): { club1: ClubStats; club2: ClubStats; totalSideError: number } | null => {
  
  // 1. Filter valid clubs for the first shot
  // If shot > 1 (fairway/rough), exclude Driver (and maybe Putter)
  let validClubs1 = bag;
  if (shotNum > 1) {
      // Case-insensitive check
      validClubs1 = bag.filter(c => !c.name.toLowerCase().includes('driver') && !c.name.toLowerCase().includes('putter'));
  }

  // 2. Filter valid clubs for second shot (usually anything except Driver)
  const validClubs2 = bag.filter(c => !c.name.toLowerCase().includes('driver'));

  let bestPair = null;
  // We initialize with a high "badness" score.
  // Badness = Total Side Error (Risk) + Weight * Excess Distance (we don't want to fly the green too much)
  let minRiskScore = Infinity;

  // 3. Iterate all pairs
  for (const c1 of validClubs1) {
      for (const c2 of validClubs2) {
          const totalCarry = c1.carry + c2.carry;
          
          // Must reach the green (with a small tolerance, e.g., -5m is okay if it rolls)
          if (totalCarry >= distanceToGreen - 5) {
             
             // Metric: Total Side Dispersion (Width)
             // We want the tightest combined dispersion.
             const totalSideError = c1.sideError + c2.sideError;
             
             // We can also penalize if the total carry is WAY over the green (uncontrolled)
             // But usually you just club down on the second shot. 
             // Let's assume the user hits a full shot for C1 and a controlled shot for C2.
             // So we primarily optimize for lowest combined side error.
             
             if (totalSideError < minRiskScore) {
                 minRiskScore = totalSideError;
                 bestPair = { club1: c1, club2: c2, totalSideError };
             }
          }
      }
  }

  return bestPair;
};

export const getStrategyRecommendation = (
  distanceToGreen: number, 
  bag: ClubStats[], 
  useYards: boolean,
  shotNum: number = 1
): { mainAction: string; subAction?: string } => {
  const unit = useYards ? 'yd' : 'm';
  const val = useYards ? distanceToGreen * 1.09361 : distanceToGreen;
  const dist = Math.round(val);

  if (distanceToGreen < 5) {
      return { mainAction: "Tap-In Range", subAction: "Excellent Shot!" };
  }
  if (distanceToGreen < 20) {
      return { mainAction: "Short Game", subAction: "Up & Down probability high" };
  }
  if (distanceToGreen >= 80 && distanceToGreen <= 110) {
      return { mainAction: "Perfect Layup", subAction: `Leaves full wedge (${dist}${unit})` };
  }
  
  // Check for layup strategy if distance is very long
  // We use a simplified check here, the caller usually handles the specific club names
  const maxCarry = bag[0].carry;
  if (shotNum > 1 && distanceToGreen > maxCarry) {
      return { mainAction: "Layup Required", subAction: "Check recommended combo" };
  }

  if (shotNum === 1 && distanceToGreen > 220) {
      return { mainAction: "Safe Drive", subAction: "Focus on fairway hit" };
  }
  
  return { mainAction: "Approach", subAction: `Leaves ${dist}${unit} to pin` };
};
