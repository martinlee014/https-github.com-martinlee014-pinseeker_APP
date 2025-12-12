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
      width: number; // sideError
      depth: number; // depthError
      rotation: number; // 90 - shotBearing
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
}