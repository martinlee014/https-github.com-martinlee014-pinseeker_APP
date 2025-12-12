
export interface LatLng {
  lat: number;
  lng: number;
}

export interface ClubStats {
  name: string;
  carry: number;
  sideError: number;
  depthError: number;
}

export interface GolfHole {
  number: number;
  par: number;
  tee: LatLng;
  green: LatLng;
}

export interface GolfCourse {
  id: string;
  name: string;
  holes: GolfHole[];
  createdAt?: string;
  isCustom?: boolean;
}

export interface ShotRecord {
  holeNumber: number;
  shotNumber: number;
  from: LatLng;
  to: LatLng;
  clubUsed: string;
  distance: number;
  // New fields for replay analysis
  plannedInfo?: {
    target: LatLng; // The center of the ellipse aimed at
    dispersion: {
      // Note: In the context of the ellipse rotation (90-bearing),
      // 'width' here represents the axis aligned with the shot direction (Depth/Distance Error Diameter)
      // 'depth' here represents the axis perpendicular to the shot (Side/Lateral Error Diameter)
      width: number; 
      depth: number; 
      rotation: number; 
    };
  };
}

export interface HoleScore {
  holeNumber: number;
  par: number;
  shotsTaken: number;
  putts: number;
  penalties: number;
}

export interface RoundHistory {
  id: string;
  date: string;
  courseName: string;
  scorecard: HoleScore[];
  shots: ShotRecord[];
}

export interface GameState {
  currentHoleIndex: number;
  currentShotNum: number;
  currentBallPos: LatLng;
  selectedClub: ClubStats;
  scorecard: HoleScore[];
  shots: ShotRecord[];
  isRoundActive: boolean;
  courseId?: string; // Track which course is being played
}
