
import React, { useState, useEffect, useContext, useMemo, useRef, Fragment } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { AppContext } from '../App';
import { DUVENHOF_COURSE } from '../constants';
import { StorageService } from '../services/storage';
import * as MathUtils from '../services/mathUtils';
import { ClubStats, HoleScore, ShotRecord, RoundHistory, LatLng, GolfCourse, MapAnnotation } from '../types';
import ClubSelector from '../components/ClubSelector';
import { ScoreModal, ShotConfirmModal, HoleSelectorModal, FullScorecardModal, ModalOverlay } from '../components/Modals';
import { Flag, Wind, ChevronLeft, Grid, ListChecks, ArrowLeft, ArrowRight, ChevronDown, MapPin, Ruler, Trash2, PenTool, Type, Highlighter, X, Check, Eraser, Home } from 'lucide-react';

// --- Icons Setup ---
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const flagIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// For user added Flag annotation
const userFlagIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const targetIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#fbbf24; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px black;'></div>",
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

// Icon for the intermediate measurement point
const measureTargetIcon = new L.DivIcon({
  className: 'custom-measure-icon',
  html: "<div style='background-color:transparent; width: 20px; height: 20px; border: 3px solid #60a5fa; border-radius: 50%; box-shadow: 0 0 4px black; display:flex; align-items:center; justify-content:center;'><div style='width:6px; height:6px; background-color:#60a5fa; border-radius:50%'></div></div>",
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const startMarkerIcon = new L.DivIcon({
  className: 'custom-start-icon',
  html: `
    <div style="
      width: 16px; 
      height: 16px; 
      background-color: #ffffff; 
      border-radius: 50%; 
      border: 4px solid #111827; 
      box-shadow: 0 0 0 2px rgba(255,255,255,0.8), 0 4px 6px rgba(0,0,0,0.5);
    "></div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const ballIcon = new L.DivIcon({
  className: 'custom-ball-icon',
  html: `
    <div style="width: 14px; height: 14px; background-color: white; border-radius: 50%; border: 2px solid #333; box-shadow: 2px 2px 4px rgba(0,0,0,0.6);"></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

// Arrow Icon for Planning Mode
const createArrowIcon = (rotation: number) => new L.DivIcon({
  className: 'bg-transparent',
  html: `
    <div style="
      transform: rotate(${rotation}deg); 
      width: 0; 
      height: 0; 
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-bottom: 20px solid #3b82f6;
      filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.5));
      opacity: 0.9;
      pointer-events: none; 
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10] // Center the pivot
});

const createReplayLabelIcon = (text: string, rotation: number) => new L.DivIcon({
  className: 'custom-label-icon',
  html: `
    <div style='
      transform: rotate(${rotation}deg); 
      color: #fff; 
      font-weight: 800;
      font-size: 11px; 
      text-align: center; 
      white-space: nowrap;
      text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 4px black;
      width: 120px;
      margin-left: -60px;
      margin-top: 10px;
      pointer-events: none;
    '>
      ${text}
    </div>`,
  iconSize: [0, 0], 
  iconAnchor: [0, 0] 
});

const createDistanceLabelIcon = (text: string, rotation: number, color: string = '#ffffff') => new L.DivIcon({
  className: 'custom-label-icon',
  html: `
    <div style='
      transform: rotate(${rotation}deg); 
      color: ${color}; 
      font-weight: 700;
      font-size: 10px; 
      text-align: center; 
      white-space: nowrap;
      background-color: rgba(0,0,0,0.8);
      padding: 3px 8px;
      border-radius: 6px;
      display: inline-block;
      border: 1px solid rgba(255,255,255,0.2);
      box-shadow: 0 2px 4px rgba(0,0,0,0.5);
      pointer-events: none;
    '>
      ${text}
    </div>`,
  iconSize: [0, 0], 
  iconAnchor: [20, 15] 
});

const createAnnotationTextIcon = (text: string, rotation: number) => new L.DivIcon({
  className: 'custom-annotation-icon',
  html: `
    <div style='
      transform: rotate(${rotation}deg); 
      display: flex;
      flex-direction: column;
      align-items: center;
    '>
       <div style="
         background-color: rgba(0,0,0,0.8); 
         color: #facc15; 
         padding: 4px 8px; 
         border-radius: 6px; 
         font-size: 12px; 
         font-weight: bold; 
         white-space: nowrap;
         border: 1px solid rgba(250, 204, 21, 0.4);
         box-shadow: 0 2px 4px rgba(0,0,0,0.5);
       ">
        ${text}
       </div>
       <div style="width: 2px; height: 10px; background-color: rgba(250,204,21,0.5);"></div>
       <div style="width: 6px; height: 6px; background-color: #facc15; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 24] // Anchor at the bottom dot
});

// RotatedMapHandler: Handles Pan, Click, and Long Press with CSS Transform correction
const RotatedMapHandler = ({ 
    rotation, 
    onLongPress,
    onClick
}: { 
    rotation: number, 
    onLongPress: (latlng: LatLng) => void,
    onClick: (latlng: LatLng) => void
}) => {
  const map = useMap();
  const isDragging = useRef(false);
  const lastPos = useRef<{x: number, y: number} | null>(null);
  
  // Interaction Refs
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startClientPos = useRef<{x: number, y: number} | null>(null);
  const hasMovedSignificantly = useRef(false);
  const isMultiTouch = useRef(false);

  useEffect(() => {
    const container = map.getContainer();

    const getClientPos = (e: MouseEvent | TouchEvent) => {
      if (window.TouchEvent && e instanceof TouchEvent) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
    };

    const calculateLatLng = (clientPos: {x: number, y: number}) => {
        // --- PRECISION COORDINATE TRANSFORM ---
        const rect = container.getBoundingClientRect();
        // Center of the MAP CONTAINER (not necessarily window center)
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const dx = clientPos.x - cx;
        const dy = clientPos.y - cy;

        // Undo Scale
        const scale = 1.4;
        const unscaledDx = dx / scale;
        const unscaledDy = dy / scale;

        // Undo Rotation
        const angleRad = (-rotation * Math.PI) / 180;
        
        const rotatedX = unscaledDx * Math.cos(angleRad) - unscaledDy * Math.sin(angleRad);
        const rotatedY = unscaledDx * Math.sin(angleRad) + unscaledDy * Math.cos(angleRad);

        const mapSize = map.getSize();
        // Leaflet internal center
        const mapCx = mapSize.x / 2;
        const mapCy = mapSize.y / 2;
        
        const leafPoint = L.point(mapCx + rotatedX, mapCy + rotatedY);
        return map.containerPointToLatLng(leafPoint);
    };

    const handleLongPress = (clientPos: {x: number, y: number}) => {
        const latlng = calculateLatLng(clientPos);
        if (navigator.vibrate) navigator.vibrate(50);
        onLongPress({ lat: latlng.lat, lng: latlng.lng });
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      if ((e as MouseEvent).button === 2) return; 

      if (window.TouchEvent && e instanceof TouchEvent && e.touches.length > 1) {
          isMultiTouch.current = true;
          if (longPressTimer.current) clearTimeout(longPressTimer.current);
          isDragging.current = false;
          startClientPos.current = null; // Invalidate any potential click
          return;
      }

      isDragging.current = true;
      hasMovedSignificantly.current = false;
      isMultiTouch.current = false;
      const pos = getClientPos(e);
      lastPos.current = pos;
      startClientPos.current = pos;

      // Only start Long Press timer if NOT on an interactive element (Marker, Polyline)
      const target = e.target as HTMLElement;
      const isInteractive = target.closest('.leaflet-interactive') || target.closest('.leaflet-popup-pane');
      
      if (!isInteractive) {
          longPressTimer.current = setTimeout(() => {
              isDragging.current = false;
              if (!hasMovedSignificantly.current && !isMultiTouch.current) {
                  handleLongPress(pos);
                  startClientPos.current = null; // Consume event
              }
          }, 600);
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (window.TouchEvent && e instanceof TouchEvent && e.touches.length > 1) {
          isMultiTouch.current = true;
          if (longPressTimer.current) clearTimeout(longPressTimer.current);
          isDragging.current = false;
          startClientPos.current = null; // Invalidate potential click
          return;
      }

      const currentPos = getClientPos(e);

      if (startClientPos.current) {
          const moveDist = Math.sqrt(
              Math.pow(currentPos.x - startClientPos.current.x, 2) + 
              Math.pow(currentPos.y - startClientPos.current.y, 2)
          );
          if (moveDist > 10) { 
              hasMovedSignificantly.current = true;
              if (longPressTimer.current) clearTimeout(longPressTimer.current);
          }
      }

      if (!isDragging.current || !lastPos.current) return;
      if(e.cancelable) e.preventDefault(); 

      const deltaX = currentPos.x - lastPos.current.x;
      const deltaY = currentPos.y - lastPos.current.y;

      const theta = -rotation * (Math.PI / 180); 
      const rotatedDx = deltaX * Math.cos(theta) - deltaY * Math.sin(theta);
      const rotatedDy = deltaX * Math.sin(theta) + deltaY * Math.cos(theta);

      map.panBy([-rotatedDx, -rotatedDy], { animate: false });
      lastPos.current = currentPos;
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }

      // If multitouch occurred at any point, do not trigger click
      if (isMultiTouch.current) {
          isDragging.current = false;
          lastPos.current = null;
          startClientPos.current = null;
          return;
      }

      if (startClientPos.current && !hasMovedSignificantly.current) {
         // If we clicked on an interactive element, we skipped the long press timer logic.
         // But we might still want to trigger click if it wasn't interactive.
         const target = e.target as HTMLElement;
         const isInteractive = target.closest('.leaflet-interactive') || target.closest('.leaflet-popup-pane');
         
         if (!isInteractive) {
             const latlng = calculateLatLng(startClientPos.current);
             onClick({ lat: latlng.lat, lng: latlng.lng });
         }
      }

      isDragging.current = false;
      lastPos.current = null;
      startClientPos.current = null;
    };

    const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault(); // Always block native context menu

        // Filter out contextmenu events that originate from touch interactions 
        // (like 2-finger taps or browser-simulated long presses).
        // We handle Touch Long Press via the timer in handleStart/handleMove.
        // This prevents double-firing and avoids the "Zoom triggers Text Box" bug.
        const isTouch = (e as any).pointerType === 'touch' || (e as any).sourceCapabilities?.firesTouchEvents;
        
        if (!isTouch) {
             // Handle actual Mouse Right-Clicks using our rotation-corrected logic
             const pos = getClientPos(e);
             const latlng = calculateLatLng(pos);
             onLongPress({ lat: latlng.lat, lng: latlng.lng });
        }
    };

    container.addEventListener('mousedown', handleStart);
    container.addEventListener('touchstart', handleStart, { passive: false });
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
    container.addEventListener('contextmenu', handleContextMenu);

    return () => {
      container.removeEventListener('mousedown', handleStart);
      container.removeEventListener('touchstart', handleStart);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
      container.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [map, rotation, onLongPress, onClick]);

  return null;
};

const MapInitializer = ({ center, isReplay, pointsToFit }: { center: LatLng, isReplay: boolean, pointsToFit?: LatLng[] }) => {
    const map = useMap();
    
    // Fix: Force Leaflet to recalculate container size after mount to prevent partial tile loading
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 250);
        return () => clearTimeout(timer);
    }, [map]);

    useEffect(() => {
        if (isReplay && pointsToFit && pointsToFit.length > 0) {
            let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
            pointsToFit.forEach(p => {
                if (p.lat < minLat) minLat = p.lat;
                if (p.lat > maxLat) maxLat = p.lat;
                if (p.lng < minLng) minLng = p.lng;
                if (p.lng > maxLng) maxLng = p.lng;
            });
            const bounds = L.latLngBounds(L.latLng(minLat, minLng), L.latLng(maxLat, maxLng));
            map.fitBounds(bounds, { padding: [50, 50], animate: false });
        } else {
            map.setView([center.lat, center.lng], 18, { animate: false });
        }
    }, [center, isReplay, map, pointsToFit]);
    return null;
}

// --- ANNOTATION TOOLBAR COMPONENT ---
type AnnotationTool = 'text' | 'pin' | 'draw' | 'eraser';

const PlayRound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, useYards, bag } = useContext(AppContext);

  // Retrieve state
  const replayRound = location.state?.round as RoundHistory | undefined;
  const initialHoleIdx = location.state?.initialHoleIndex || 0;
  const passedCourse = location.state?.course as GolfCourse | undefined;

  const isReplay = !!replayRound;

  // Determine which course we are playing
  const [activeCourse, setActiveCourse] = useState<GolfCourse>(passedCourse || DUVENHOF_COURSE);
  const [currentHoleIdx, setCurrentHoleIdx] = useState(initialHoleIdx);
  const [shots, setShots] = useState<ShotRecord[]>([]);
  const [scorecard, setScorecard] = useState<HoleScore[]>([]);
  
  const [currentBallPos, setCurrentBallPos] = useState<LatLng>({ lat: 0, lng: 0 });
  const [selectedClub, setSelectedClub] = useState<ClubStats>(bag[0] || { name: 'Driver', carry: 230, sideError: 45, depthError: 25 });
  const [aimAngle, setAimAngle] = useState(0);
  const [shotNum, setShotNum] = useState(1);
  
  const [showHoleSelect, setShowHoleSelect] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showFullCard, setShowFullCard] = useState(false);
  const [pendingShot, setPendingShot] = useState<{ pos: LatLng, isGPS: boolean, dist: number } | null>(null);
  
  const [windSpeed, setWindSpeed] = useState(5);
  const [windDir, setWindDir] = useState(180);
  const [showWind, setShowWind] = useState(false);

  // --- Measurement Mode State ---
  const [isMeasureMode, setIsMeasureMode] = useState(false);
  const [measureTarget, setMeasureTarget] = useState<LatLng | null>(null);
  
  // --- Note/Annotation Mode State ---
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [annotations, setAnnotations] = useState<MapAnnotation[]>([]);
  const [activeTool, setActiveTool] = useState<AnnotationTool>('text');
  const [drawingPoints, setDrawingPoints] = useState<LatLng[]>([]);
  const [showTextInput, setShowTextInput] = useState<{lat: number, lng: number} | null>(null);
  const [textInputValue, setTextInputValue] = useState("");
  
  // --- Deletion State ---
  const [shotToDelete, setShotToDelete] = useState<ShotRecord | null>(null);

  // GPS Button Logic Refs
  const gpsPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressAction = useRef(false);

  // Annotation Long Press Logic
  const annotationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const annotationStartPos = useRef<{x: number, y: number} | null>(null);

  const hole = activeCourse.holes[currentHoleIdx];

  useEffect(() => {
    // If we have passed a course, use it.
    if (passedCourse) {
        setActiveCourse(passedCourse);
    }
    
    // Initialize state
    if (isReplay && replayRound) {
        setShots(replayRound.shots);
        setScorecard(replayRound.scorecard);
        const h = activeCourse.holes[initialHoleIdx];
        if (h) setCurrentBallPos(h.tee);
    } else {
        // Active Round
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('restore') === 'true' && user) {
            const saved = StorageService.getTempState(user);
            if (saved) {
                if (saved.courseId) {
                   const allCourses = StorageService.getAllCourses();
                   const savedCourse = allCourses.find(c => c.id === saved.courseId);
                   if (savedCourse) setActiveCourse(savedCourse);
                }
                setCurrentHoleIdx(saved.currentHoleIndex);
                setShots(saved.shots);
                setScorecard(saved.scorecard);
                setShotNum(saved.currentShotNum);
                setCurrentBallPos(saved.currentBallPos);
            } else {
                 if (hole) setCurrentBallPos(hole.tee);
            }
        } else {
             if (hole) setCurrentBallPos(hole.tee);
        }
    }
  }, []);

  useEffect(() => {
      if (hole && shotNum === 1 && !pendingShot) {
          const isAtTee = currentBallPos.lat === hole.tee.lat && currentBallPos.lng === hole.tee.lng;
          if (!isAtTee && shots.filter(s => s.holeNumber === hole.number).length === 0) {
              setCurrentBallPos(hole.tee);
          }
      }
  }, [currentHoleIdx, activeCourse]);

  // Load annotations when hole changes
  useEffect(() => {
    if (hole && activeCourse) {
        const notes = StorageService.getAnnotations(activeCourse.id, hole.number);
        setAnnotations(notes);
    }
  }, [currentHoleIdx, activeCourse]);

  useEffect(() => {
    if (bag.length > 0) {
      const exists = bag.find(c => c.name === selectedClub.name);
      if (!exists) setSelectedClub(bag[0]);
    }
  }, [bag]);

  useEffect(() => {
    if (!isReplay && user) {
      StorageService.saveTempState(user, {
        currentHoleIndex: currentHoleIdx,
        currentShotNum: shotNum,
        currentBallPos,
        scorecard,
        shots,
        courseId: activeCourse.id
      });
    }
  }, [currentHoleIdx, shotNum, currentBallPos, scorecard, shots, isReplay, user, activeCourse]);

  if (!hole) return <div className="p-10 text-white">Loading Hole Data...</div>;

  const distToGreen = useMemo(() => MathUtils.calculateDistance(currentBallPos, hole.green), [currentBallPos, hole]);
  const baseBearing = useMemo(() => MathUtils.calculateBearing(currentBallPos, hole.green), [currentBallPos, hole]);
  const shotBearing = baseBearing + aimAngle;
  const mapRotation = -baseBearing;

  const { destination: predictedLanding, playsLike } = useMemo(() => MathUtils.calculateWindAdjustedShot(
    currentBallPos, selectedClub.carry, shotBearing, windSpeed, windDir
  ), [currentBallPos, selectedClub, shotBearing, windSpeed, windDir]);

  const distLandingToGreen = useMemo(() => MathUtils.calculateDistance(predictedLanding, hole.green), [predictedLanding, hole]);

  const ellipsePoints = useMemo(() => MathUtils.getEllipsePoints(
    predictedLanding, 
    selectedClub.depthError * 2, 
    selectedClub.sideError * 2,  
    90 - shotBearing
  ).map(p => [p.lat, p.lng] as [number, number]), [predictedLanding, selectedClub, shotBearing]);

  const holeShots = useMemo(() => shots.filter(s => s.holeNumber === hole.number), [shots, hole.number]);
  const replayPoints = useMemo(() => {
      if (!isReplay) return [];
      return [hole.tee, hole.green, ...holeShots.map(s => s.to)];
  }, [isReplay, hole, holeShots]);

  const guideLinePoints = useMemo(() => [
      [predictedLanding.lat, predictedLanding.lng],
      [hole.green.lat, hole.green.lng]
  ], [predictedLanding, hole]);

  const guideLabelPos = useMemo(() => ({
      lat: predictedLanding.lat + (hole.green.lat - predictedLanding.lat) * 0.33,
      lng: predictedLanding.lng + (hole.green.lng - predictedLanding.lng) * 0.33
  }), [predictedLanding, hole]);

  const activeMeasureTarget = measureTarget || predictedLanding;
  
  const measureDist1 = useMemo(() => MathUtils.calculateDistance(currentBallPos, activeMeasureTarget), [currentBallPos, activeMeasureTarget]);
  const measureDist2 = useMemo(() => MathUtils.calculateDistance(activeMeasureTarget, hole.green), [activeMeasureTarget, hole]);
  
  const labelPos1 = useMemo(() => ({
      lat: (currentBallPos.lat + activeMeasureTarget.lat) / 2,
      lng: (currentBallPos.lng + activeMeasureTarget.lng) / 2
  }), [currentBallPos, activeMeasureTarget]);
  
  const labelPos2 = useMemo(() => ({
      lat: (activeMeasureTarget.lat + hole.green.lat) / 2,
      lng: (activeMeasureTarget.lng + hole.green.lng) / 2
  }), [activeMeasureTarget, hole]);

  useEffect(() => {
    if (!isReplay && bag.length > 0 && !isMeasureMode) {
      const dist = distToGreen;
      if (dist < 50) {
        setSelectedClub(bag[bag.length - 1]); 
      } else {
        const suitable = [...bag].reverse().find(c => c.carry >= dist - 10);
        setSelectedClub(suitable || bag[0]); 
      }
    }
  }, [currentBallPos, currentHoleIdx, isReplay, isMeasureMode]);

  const nextClubSuggestion = useMemo(() => {
    if (distLandingToGreen < 20) return "Putter";
    const sorted = [...bag].sort((a,b) => a.carry - b.carry);
    const match = sorted.find(c => c.carry >= distLandingToGreen);
    if (match) return match.name;
    return sorted[sorted.length-1].name;
  }, [distLandingToGreen, bag]);

  const handleMapClick = (latlng: any) => {
    if (isReplay) return;

    if (isNoteMode) {
        if (activeTool === 'pin') {
            const newNote: MapAnnotation = {
                id: crypto.randomUUID(),
                courseId: activeCourse.id,
                holeNumber: hole.number,
                type: 'icon',
                subType: 'flag',
                points: [{lat: latlng.lat, lng: latlng.lng}],
            };
            StorageService.saveAnnotation(newNote);
            setAnnotations(prev => [...prev, newNote]);
        } else if (activeTool === 'draw') {
            setDrawingPoints(prev => [...prev, {lat: latlng.lat, lng: latlng.lng}]);
        }
        return;
    }
    
    if (isMeasureMode) {
        setMeasureTarget({ lat: latlng.lat, lng: latlng.lng });
        return;
    }

    const clicked: LatLng = { lat: latlng.lat, lng: latlng.lng };
    const bearingToClick = MathUtils.calculateBearing(currentBallPos, clicked);
    let diff = bearingToClick - baseBearing;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    setAimAngle(diff);
  };

  const handleSaveTextNote = () => {
      if (!showTextInput || !textInputValue.trim()) {
          setShowTextInput(null);
          return;
      }
      const newNote: MapAnnotation = {
          id: crypto.randomUUID(),
          courseId: activeCourse.id,
          holeNumber: hole.number,
          type: 'text',
          points: [{lat: showTextInput.lat, lng: showTextInput.lng}],
          text: textInputValue.trim()
      };
      StorageService.saveAnnotation(newNote);
      setAnnotations(prev => [...prev, newNote]);
      setShowTextInput(null);
      setTextInputValue("");
  };

  const handleFinishDrawing = () => {
      if (drawingPoints.length < 2) {
          setDrawingPoints([]);
          return;
      }
      const newNote: MapAnnotation = {
          id: crypto.randomUUID(),
          courseId: activeCourse.id,
          holeNumber: hole.number,
          type: 'path',
          subType: 'rough',
          points: drawingPoints
      };
      StorageService.saveAnnotation(newNote);
      setAnnotations(prev => [...prev, newNote]);
      setDrawingPoints([]);
  };

  const deleteAnnotation = (id: string) => {
     if (confirm("Delete this annotation?")) {
        StorageService.deleteAnnotation(id);
        setAnnotations(prev => prev.filter(a => a.id !== id));
     }
  };

  // --- Helper to create robust long-press handlers for annotations ---
  const createAnnotationHandlers = (id: string) => {
      if (!isNoteMode) return {};

      // Common helper to get coordinates from any event type
      const getEventPos = (evt: any) => {
          if (evt.touches && evt.touches.length > 0) {
              return { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
          }
          return { x: evt.clientX, y: evt.clientY };
      };

      const handleClick = (e: L.LeafletMouseEvent | L.LeafletEvent) => {
          const evt = (e as any).originalEvent;
          if (evt) L.DomEvent.stopPropagation(evt);
          
          if (activeTool === 'eraser') {
              deleteAnnotation(id);
          }
      };

      const handleStart = (e: L.LeafletMouseEvent | L.LeafletEvent) => {
          const originalEvent = (e as any).originalEvent;
          if (originalEvent) {
             L.DomEvent.stopPropagation(originalEvent);
          }
          
          // If we are in eraser mode, we handle delete on CLICK/TAP, not long press.
          if (activeTool === 'eraser') return;

          if (annotationTimer.current) clearTimeout(annotationTimer.current);

          const pos = getEventPos(originalEvent);
          annotationStartPos.current = pos;

          annotationTimer.current = setTimeout(() => {
              if (navigator.vibrate) navigator.vibrate(50);
              deleteAnnotation(id);
              annotationTimer.current = null;
          }, 800);
      };

      const handleMove = (e: L.LeafletMouseEvent | L.LeafletEvent) => {
          if (!annotationTimer.current || !annotationStartPos.current) return;
          
          const evt = (e as any).originalEvent;
          if (!evt) return;

          const pos = getEventPos(evt);
          const dist = Math.sqrt(
              Math.pow(pos.x - annotationStartPos.current.x, 2) + 
              Math.pow(pos.y - annotationStartPos.current.y, 2)
          );

          if (dist > 10) {
              clearTimeout(annotationTimer.current);
              annotationTimer.current = null;
          }
      };

      const handleEnd = () => {
          if (annotationTimer.current) {
              clearTimeout(annotationTimer.current);
              annotationTimer.current = null;
          }
      };

      return {
          click: handleClick,
          mousedown: handleStart,
          touchstart: handleStart,
          mousemove: handleMove,
          touchmove: handleMove,
          mouseup: handleEnd,
          touchend: handleEnd,
          contextmenu: (e: any) => {
              L.DomEvent.stopPropagation(e.originalEvent);
              L.DomEvent.preventDefault(e.originalEvent);
              deleteAnnotation(id);
          }
      };
  };

  const handleManualDrop = (latlng: any) => {
    if (isReplay || isMeasureMode) return;
    
    if (isNoteMode) {
        if (activeTool === 'text') {
            setShowTextInput({lat: latlng.lat, lng: latlng.lng});
            setTextInputValue("");
        }
        return;
    }

    const pos = { lat: latlng.lat, lng: latlng.lng };
    const dist = MathUtils.calculateDistance(currentBallPos, pos);
    setPendingShot({ pos, isGPS: false, dist });
  };

  const initiateGPSShot = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const gpsPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const dist = MathUtils.calculateDistance(currentBallPos, gpsPos);
        setPendingShot({ pos: gpsPos, isGPS: true, dist });
      },
      (err) => alert("GPS Error: " + err.message)
    );
  };

  const setTeeToGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const gpsPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCurrentBallPos(gpsPos);
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
      alert("Start position updated to current GPS location.");
    }, (err) => alert("GPS Error: " + err.message));
  };

  const handleMeasureGPS = () => {
      if (!navigator.geolocation) {
          alert("Geolocation not supported");
          return;
      }
      navigator.geolocation.getCurrentPosition((pos) => {
          const gpsPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentBallPos(gpsPos);
          if (navigator.vibrate) navigator.vibrate(50);
      }, (err) => alert("GPS Error: " + err.message));
  };

  const handleGPSButtonStart = (e: React.MouseEvent | React.TouchEvent) => {
    if(e.cancelable) e.preventDefault();
    isLongPressAction.current = false;
    if (gpsPressTimer.current) clearTimeout(gpsPressTimer.current);

    gpsPressTimer.current = setTimeout(() => {
       isLongPressAction.current = true;
       if (navigator.vibrate) navigator.vibrate(100);
       setTeeToGPS(); 
    }, 800); 
  };

  const handleGPSButtonEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if(e.cancelable) e.preventDefault();
    if (gpsPressTimer.current) {
      clearTimeout(gpsPressTimer.current);
      gpsPressTimer.current = null;
    }
    if (!isLongPressAction.current) {
        initiateGPSShot();
    }
    isLongPressAction.current = false;
  };

  const confirmShot = () => {
    if (!pendingShot) return;
    const targetHole = hole;
    try {
        const newShot: ShotRecord = {
          holeNumber: targetHole.number,
          shotNumber: shotNum,
          from: currentBallPos || targetHole.tee,
          to: pendingShot.pos,
          clubUsed: selectedClub.name,
          distance: pendingShot.dist,
          plannedInfo: {
            target: predictedLanding,
            dispersion: {
              width: selectedClub.depthError * 2, 
              depth: selectedClub.sideError * 2,  
              rotation: 90 - shotBearing
            }
          }
        };
        setShots(prev => [...prev, newShot]);
        setCurrentBallPos(pendingShot.pos);
        setShotNum(prev => prev + 1);
        setAimAngle(0);
        setPendingShot(null); 
    } catch(err) {
        console.error("Error saving shot:", err);
    }
  };

  const handleDeleteShot = () => {
    if (!shotToDelete) return;
    const holeShotsList = shots.filter(s => s.holeNumber === hole.number);
    const isMostRecent = holeShotsList.length > 0 && holeShotsList[holeShotsList.length - 1] === shotToDelete;
    const newShots = shots.filter(s => s !== shotToDelete);
    setShots(newShots);
    if (isMostRecent) {
        setCurrentBallPos(shotToDelete.from);
        setShotNum(Math.max(1, shotToDelete.shotNumber));
    }
    setShotToDelete(null);
  };

  const saveHoleScore = (putts: number, pens: number) => {
    const shotsTaken = shotNum - 1; 
    const newScore: HoleScore = {
      holeNumber: hole.number,
      par: hole.par,
      shotsTaken: Math.max(0, shotsTaken),
      putts,
      penalties: pens
    };
    setScorecard(prev => {
        const filtered = prev.filter(s => s.holeNumber !== hole.number);
        return [...filtered, newScore];
    });
    setShowScoreModal(false);
    if (currentHoleIdx < activeCourse.holes.length - 1) {
      loadHole(currentHoleIdx + 1);
    } else {
      finishRound();
    }
  };

  const loadHole = (idx: number) => {
    setCurrentHoleIdx(idx);
    setCurrentBallPos(activeCourse.holes[idx].tee);
    setShotNum(1);
    setAimAngle(0);
    setMeasureTarget(null);
    setIsMeasureMode(false);
    setIsNoteMode(false);
    setShowHoleSelect(false);
  };

  const finishRound = () => {
    if(!user) return;
    const history: RoundHistory = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
      courseName: activeCourse.name,
      scorecard,
      shots
    };
    StorageService.saveHistory(user, history);
    StorageService.clearTempState(user);
    navigate('/summary', { state: { round: history } });
  };

  const toggleMeasureMode = () => {
      const newState = !isMeasureMode;
      setIsMeasureMode(newState);
      setIsNoteMode(false);
      if (newState) {
          setAimAngle(0);
          setMeasureTarget(predictedLanding); 
      }
  };

  const toggleNoteMode = () => {
      const newState = !isNoteMode;
      setIsNoteMode(newState);
      setIsMeasureMode(false);
      setActiveTool('text'); // Default tool
      setDrawingPoints([]);
      setShowTextInput(null);
  };

  const handleWindCircleInteract = (e: React.MouseEvent | React.TouchEvent) => {
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      
      let clientX, clientY;
      if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
      }

      const x = clientX - rect.left - cx;
      const y = clientY - rect.top - cy;

      let angleRad = Math.atan2(y, x);
      let angleDeg = angleRad * (180 / Math.PI);
      
      angleDeg += 90;
      if (angleDeg < 0) angleDeg += 360;
      
      const newDir = (baseBearing + angleDeg) % 360;
      setWindDir(Math.round(newDir));
  };

  return (
    <div className="h-full relative bg-gray-900 flex flex-col overflow-hidden">
      {/* Map Area */}
      <div className="absolute inset-0 z-0 bg-black w-full h-full">
        <div style={{ width: '100%', height: '100%', transform: `rotate(${mapRotation}deg) scale(1.4)`, transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <MapContainer key={`${activeCourse.id}-${currentHoleIdx}`} center={[hole.tee.lat, hole.tee.lng]} zoom={18} className="h-full w-full bg-black" zoomControl={false} attributionControl={false} dragging={false} doubleClickZoom={false}>
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
              <RotatedMapHandler rotation={mapRotation} onLongPress={handleManualDrop} onClick={handleMapClick} />
              <MapInitializer center={currentBallPos} isReplay={isReplay} pointsToFit={replayPoints} />
              <Marker position={[hole.green.lat, hole.green.lng]} icon={flagIcon} />
              
              {/* User Annotations */}
              {annotations.map(note => {
                 const handlers = createAnnotationHandlers(note.id);
                 if (note.type === 'path' && note.points.length > 1) {
                     return (
                        <Polyline 
                            key={note.id}
                            positions={note.points.map(p => [p.lat, p.lng])}
                            pathOptions={{ color: '#facc15', weight: 3, dashArray: '5,5', opacity: 0.8 }}
                            eventHandlers={handlers}
                            interactive={true}
                        />
                     );
                 } else if (note.type === 'text' && note.points.length > 0 && note.text) {
                     return (
                        <Marker 
                            key={note.id}
                            position={[note.points[0].lat, note.points[0].lng]}
                            icon={createAnnotationTextIcon(note.text, -mapRotation)}
                            eventHandlers={handlers}
                            interactive={true}
                        />
                     );
                 } else if (note.type === 'icon' && note.points.length > 0) {
                     return (
                        <Marker 
                            key={note.id}
                            position={[note.points[0].lat, note.points[0].lng]}
                            icon={userFlagIcon}
                            eventHandlers={handlers}
                            interactive={true}
                        />
                     );
                 }
                 return null;
              })}

              {/* Active Drawing Line */}
              {isNoteMode && drawingPoints.length > 0 && (
                  <>
                      {drawingPoints.map((p, i) => (
                          <Marker key={i} position={[p.lat, p.lng]} icon={measureTargetIcon} />
                      ))}
                      <Polyline positions={drawingPoints.map(p => [p.lat, p.lng])} pathOptions={{ color: '#facc15', weight: 2, dashArray: '2,4' }} />
                  </>
              )}


              {/* Render Past Shots */}
              {holeShots.map((s, i) => {
                  const curvePoints = MathUtils.getArcPoints(s.from, s.to);
                  const startIcon = s.shotNumber === 1 ? startMarkerIcon : ballIcon;
                  
                  let plannedEllipse = [];
                  if (s.plannedInfo) {
                    plannedEllipse = MathUtils.getEllipsePoints(
                      s.plannedInfo.target, 
                      s.plannedInfo.dispersion.width, 
                      s.plannedInfo.dispersion.depth, 
                      s.plannedInfo.dispersion.rotation
                    ).map(p => [p.lat, p.lng] as [number, number]);
                  }

                  return (
                    <Fragment key={i}>
                        <Marker position={[s.from.lat, s.from.lng]} icon={startIcon} />
                        <Polyline positions={[[s.from.lat, s.from.lng], [s.to.lat, s.to.lng]]} pathOptions={{ color: "black", weight: 4, opacity: 0.3 }} interactive={false} />
                        <Polyline positions={curvePoints.map(p => [p.lat, p.lng])} pathOptions={{ color: "white", weight: 2, opacity: 0.8 }} interactive={false} />
                        
                        {isReplay ? (
                            <>
                              <Marker position={[s.to.lat, s.to.lng]} icon={createReplayLabelIcon(`${s.clubUsed} - ${MathUtils.formatDistance(s.distance, useYards)}`, -mapRotation)} interactive={false} />
                              {plannedEllipse.length > 0 && (
                                <Polygon positions={plannedEllipse} pathOptions={{ color: '#fbbf24', fillColor: '#fbbf24', fillOpacity: 0.1, weight: 1, dashArray: '4,4' }} interactive={false} />
                              )}
                            </>
                        ) : (
                            <Marker 
                                position={[s.to.lat, s.to.lng]} 
                                icon={targetIcon} 
                                eventHandlers={{
                                    contextmenu: (e) => {
                                        L.DomEvent.stopPropagation(e.originalEvent);
                                        setShotToDelete(s);
                                    }
                                }}
                            />
                        )}
                    </Fragment>
                  );
              })}

              {/* Strategy Mode Visuals - Updated to be non-interactive so manual drop works through them */}
              {!isReplay && !isMeasureMode && !isNoteMode && (
                  <>
                      <Marker position={[currentBallPos.lat, currentBallPos.lng]} icon={shotNum === 1 ? startMarkerIcon : ballIcon} interactive={false} />
                      <Polyline positions={[[currentBallPos.lat, currentBallPos.lng], [predictedLanding.lat, predictedLanding.lng]]} pathOptions={{ color: "#3b82f6", weight: 3, dashArray: "5, 5" }} interactive={false} />
                      <Polygon positions={ellipsePoints} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2, weight: 1 }} interactive={false} />
                      <Marker position={[predictedLanding.lat, predictedLanding.lng]} icon={createArrowIcon(shotBearing)} interactive={false} />
                      <Polyline positions={guideLinePoints as any} pathOptions={{ color: "#fbbf24", weight: 2, dashArray: "4, 6", opacity: 0.8 }} interactive={false} />
                      <Marker position={[guideLabelPos.lat, guideLabelPos.lng]} icon={createDistanceLabelIcon(`Leaves ${MathUtils.formatDistance(distLandingToGreen, useYards)}`, -mapRotation)} interactive={false} />
                  </>
              )}

              {/* Measurement Mode Visuals */}
              {!isReplay && isMeasureMode && activeMeasureTarget && (
                  <>
                      <Marker position={[currentBallPos.lat, currentBallPos.lng]} icon={ballIcon} interactive={false} />
                      <Marker position={[activeMeasureTarget.lat, activeMeasureTarget.lng]} icon={measureTargetIcon} interactive={false} />
                      <Polyline positions={[[currentBallPos.lat, currentBallPos.lng], [activeMeasureTarget.lat, activeMeasureTarget.lng]]} pathOptions={{ color: "#60a5fa", weight: 4, opacity: 1 }} interactive={false} />
                      <Polyline positions={[[activeMeasureTarget.lat, activeMeasureTarget.lng], [hole.green.lat, hole.green.lng]]} pathOptions={{ color: "#ffffff", weight: 3, dashArray: "8, 8", opacity: 0.8 }} interactive={false} />
                      <Marker position={[labelPos1.lat, labelPos1.lng]} icon={createDistanceLabelIcon(MathUtils.formatDistance(measureDist1, useYards), -mapRotation, '#60a5fa')} interactive={false} />
                      <Marker position={[labelPos2.lat, labelPos2.lng]} icon={createDistanceLabelIcon(MathUtils.formatDistance(measureDist2, useYards), -mapRotation, '#ffffff')} interactive={false} />
                  </>
              )}
            </MapContainer>
        </div>
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-3 pointer-events-none flex justify-between items-start">
        <div className="pointer-events-auto flex flex-col gap-2">
           <button onClick={() => navigate(-1)} className="bg-black/50 p-2 rounded-full text-white backdrop-blur-md border border-white/5 hover:bg-black/70 transition-colors"><ChevronLeft size={20} /></button>
           <button onClick={() => navigate('/dashboard')} className="bg-black/50 p-2 rounded-full text-white backdrop-blur-md border border-white/5 hover:bg-black/70 transition-colors"><Home size={20} /></button>
           {!isReplay && (
            <>
             <button onClick={() => setShowHoleSelect(true)} className="bg-black/50 p-2 rounded-full text-white backdrop-blur-md border border-white/5 mt-1 hover:bg-black/70"><Grid size={20} /></button>
             <button onClick={() => setShowFullCard(true)} className="bg-black/50 p-2 rounded-full text-white backdrop-blur-md border border-white/5 mt-1 hover:bg-black/70"><ListChecks size={20} /></button>
            </>
           )}
        </div>

        <div className="text-center mt-1 drop-shadow-lg pointer-events-none">
          <h2 className="text-2xl font-black text-white drop-shadow-md">HOLE {hole.number}</h2>
          <div className="flex items-center justify-center gap-2 text-xs font-bold bg-black/60 rounded-full px-3 py-1 backdrop-blur-md inline-flex border border-white/10 shadow-lg">
            <span className="text-gray-300">PAR {hole.par}</span><span className="text-gray-500">|</span><span className="text-white">{MathUtils.formatDistance(distToGreen, useYards)}</span>
          </div>
          {isMeasureMode && <div className="mt-2 text-xs text-blue-300 font-bold bg-blue-900/80 px-4 py-1 rounded-full border border-blue-500/30 inline-block shadow-lg animate-pulse">MEASUREMENT MODE</div>}
          {isNoteMode && <div className="mt-2 text-xs text-yellow-300 font-bold bg-yellow-900/80 px-4 py-1 rounded-full border border-yellow-500/30 inline-block shadow-lg animate-pulse">ANNOTATION MODE</div>}
        </div>

        <div className="pointer-events-auto flex flex-col gap-2 items-end">
           {!isReplay && (
             <>
               <button onClick={() => setShowScoreModal(true)} className="bg-green-600/90 p-2.5 rounded-full text-white shadow-lg shadow-green-900/50 backdrop-blur-md border border-white/10 hover:bg-green-500 transition-all active:scale-95"><Flag size={20} fill="white"/></button>
               <button 
                onClick={toggleMeasureMode} 
                className={`p-2.5 rounded-full shadow-lg backdrop-blur-md border border-white/10 transition-all active:scale-95 ${isMeasureMode ? 'bg-blue-600 text-white' : 'bg-black/50 text-blue-400 hover:bg-black/70'}`}
               >
                  <Ruler size={20} />
               </button>
               
               <button 
                onClick={toggleNoteMode} 
                className={`p-2.5 rounded-full shadow-lg backdrop-blur-md border border-white/10 transition-all active:scale-95 ${isNoteMode ? 'bg-yellow-600 text-white' : 'bg-black/50 text-yellow-400 hover:bg-black/70'}`}
               >
                  <PenTool size={20} />
               </button>

               <button onClick={() => setShowWind(!showWind)} className={`p-2.5 rounded-full shadow-lg backdrop-blur-md border border-white/10 transition-all active:scale-95 ${showWind ? 'bg-black/70 text-blue-400' : 'bg-black/50 text-gray-400 hover:bg-black/70'}`}><Wind size={20} /></button>
             </>
           )}
        </div>
      </div>
      
      {showWind && (
        <div className="absolute top-20 right-14 z-[1000] bg-black/90 backdrop-blur-xl p-4 rounded-2xl border border-gray-700 w-48 text-gray-300 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="font-bold text-white text-sm flex items-center gap-2"><Wind size={16}/> Wind</span>
                <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">{windSpeed} m/s</span>
            </div>
            <div>
                <input type="range" min="0" max="20" value={windSpeed} onChange={(e) => setWindSpeed(parseInt(e.target.value))} className="w-full accent-blue-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="relative w-32 h-32 mx-auto select-none touch-none"
                 onMouseDown={(e) => { if(e.buttons===1) handleWindCircleInteract(e); }}
                 onMouseMove={(e) => { if(e.buttons===1) handleWindCircleInteract(e); }}
                 onClick={handleWindCircleInteract}
                 onTouchMove={handleWindCircleInteract}
                 onTouchStart={handleWindCircleInteract}
            >
                <div className="absolute inset-0 rounded-full border-2 border-gray-700 bg-gray-800/50 shadow-inner">
                    {[0, 90, 180, 270].map(d => (
                        <div key={d} className="absolute inset-0 flex justify-center pt-1" style={{ transform: `rotate(${d}deg)` }}>
                            <div className="w-0.5 h-2 bg-gray-600"></div>
                        </div>
                    ))}
                </div>
                <div className="absolute inset-0 pointer-events-none transition-transform duration-300" style={{ transform: `rotate(${-baseBearing}deg)` }}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1 bg-gray-900 text-[10px] font-bold text-red-500 px-1">N</div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-75" 
                     style={{ transform: `rotate(${windDir - baseBearing}deg)` }}>
                    <div className="relative h-full w-full">
                         <div className="absolute top-2 left-1/2 -translate-x-1/2">
                            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[20px] border-b-blue-500 filter drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]"></div>
                            <div className="w-1 h-14 bg-blue-500 mx-auto rounded-b-full opacity-80"></div>
                         </div>
                    </div>
                </div>
                <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-gray-200 rounded-full border-2 border-gray-600 -translate-x-1/2 -translate-y-1/2 shadow-lg z-10"></div>
            </div>
        </div>
      )}

      {/* NEW: ANNOTATION TOOLBAR */}
      {isNoteMode && (
          <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 z-[1000] bg-gray-900/90 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-2 flex gap-2 shadow-2xl scale-110">
              <button 
                onClick={() => setActiveTool('text')}
                className={`p-3 rounded-xl transition-all ${activeTool === 'text' ? 'bg-yellow-500 text-black shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                  <Type size={20} />
              </button>
              <button 
                onClick={() => setActiveTool('pin')}
                className={`p-3 rounded-xl transition-all ${activeTool === 'pin' ? 'bg-yellow-500 text-black shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                  <Flag size={20} />
              </button>
              <button 
                onClick={() => setActiveTool('draw')}
                className={`p-3 rounded-xl transition-all ${activeTool === 'draw' ? 'bg-yellow-500 text-black shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                  <Highlighter size={20} />
              </button>
              <div className="w-px bg-gray-700 mx-1"></div>
              <button 
                onClick={() => setActiveTool('eraser')}
                className={`p-3 rounded-xl transition-all ${activeTool === 'eraser' ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                  <Eraser size={20} />
              </button>
          </div>
      )}
      
      {/* Drawing Actions (Finish/Cancel) */}
      {isNoteMode && activeTool === 'draw' && drawingPoints.length > 0 && (
          <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
               <button 
                 onClick={handleFinishDrawing}
                 className="bg-green-600 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 animate-bounce"
               >
                   <Check size={16}/> Finish Line
               </button>
               <button 
                 onClick={() => setDrawingPoints([])}
                 className="bg-gray-800 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2"
               >
                   <X size={16}/> Clear
               </button>
          </div>
      )}

      {/* Text Input Modal */}
      {showTextInput && (
          <ModalOverlay onClose={() => setShowTextInput(null)}>
              <div className="p-4 bg-gray-900 rounded-xl">
                  <h3 className="text-white font-bold mb-2">Add Note</h3>
                  <textarea 
                    autoFocus
                    value={textInputValue}
                    onChange={(e) => setTextInputValue(e.target.value)}
                    className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:border-yellow-500 outline-none h-24 mb-4 resize-none"
                    placeholder="E.g. Fast green, aiming point..."
                  />
                  <div className="flex gap-2">
                      <button onClick={() => setShowTextInput(null)} className="flex-1 py-2 bg-gray-800 rounded-lg text-gray-400 font-bold">Cancel</button>
                      <button onClick={handleSaveTextNote} className="flex-1 py-2 bg-yellow-500 rounded-lg text-black font-bold">Save Note</button>
                  </div>
              </div>
          </ModalOverlay>
      )}

      {!isReplay && !isNoteMode ? (
        <>
            <div className="absolute bottom-0 w-full z-30 pt-2 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-black/95 via-black/80 to-transparent">
                {isMeasureMode ? (
                    <div className="flex gap-3 h-20 items-stretch mb-2">
                        <div className="flex-1 bg-gray-900 rounded-2xl border border-blue-500/40 shadow-xl flex items-center justify-between px-4">
                            <div className="flex-1 text-center border-r border-gray-700 py-2">
                                <div className="text-[10px] text-blue-200 uppercase font-bold tracking-widest mb-1 opacity-80">From You</div>
                                <div className="text-3xl font-black text-blue-400 leading-none">{MathUtils.formatDistance(measureDist1, useYards)}</div>
                            </div>
                             <div className="flex-1 text-center py-2">
                                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1 opacity-80">To Pin</div>
                                <div className="text-3xl font-black text-white leading-none">{MathUtils.formatDistance(measureDist2, useYards)}</div>
                            </div>
                        </div>
                        <button 
                            onClick={handleMeasureGPS}
                            className="w-20 flex-none bg-blue-600 active:bg-blue-500 text-white rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-blue-900/20 border border-white/5 transition-all select-none"
                        >
                            <MapPin size={24} className="mb-1" />
                            <span className="text-[9px] font-bold uppercase">My Loc</span>
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-3 bg-gray-900/90 backdrop-blur-md p-2 rounded-xl border border-white/5 shadow-lg">
                            <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider pl-1">Shot {shotNum}</div>
                            <div className="flex items-center gap-2 flex-1">
                                <span className="text-[10px] font-bold text-gray-500">AIM</span>
                                <input type="range" min="-45" max="45" value={aimAngle} onChange={(e) => setAimAngle(parseInt(e.target.value))} className="flex-1 accent-white h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                                <span className="text-[10px] font-bold text-gray-300 w-6 text-right">{aimAngle}°</span>
                            </div>
                        </div>
                        <div className="flex gap-3 h-16 items-stretch">
                            <div className="flex-1 relative bg-gray-900 rounded-2xl border border-white/5 shadow-xl overflow-hidden flex">
                                <div className="absolute inset-0 z-10 opacity-0"><ClubSelector clubs={bag} selectedClub={selectedClub} onSelect={setSelectedClub} useYards={useYards} /></div>
                                <div className="flex-1 flex flex-col justify-center pl-4 pr-1 border-r border-white/5 pointer-events-none">
                                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-0.5 flex items-center gap-1">Club <ChevronDown size={8}/></span>
                                    <div className="text-xl font-bold text-white truncate leading-none">{selectedClub.name}</div>
                                    <div className="text-[10px] text-gray-500 mt-1">
                                        {MathUtils.formatDistance(useYards ? selectedClub.carry * 1.09361 : selectedClub.carry, useYards)}
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col justify-center items-end pr-4 pl-1 pointer-events-none bg-gray-800/30">
                                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Leaves</span>
                                    <div className="text-xl font-bold text-white leading-none">{MathUtils.formatDistance(distLandingToGreen, useYards)}</div>
                                    <div className="text-[10px] text-gray-500 mt-1 text-right truncate w-full">
                                        Rec: <span className="text-white font-medium">{nextClubSuggestion}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                            onMouseDown={handleGPSButtonStart}
                            onMouseUp={handleGPSButtonEnd}
                            onMouseLeave={handleGPSButtonEnd}
                            onTouchStart={handleGPSButtonStart}
                            onTouchEnd={handleGPSButtonEnd}
                            className="w-16 flex-none bg-emerald-600 active:bg-emerald-500 text-white rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-emerald-900/20 border border-white/5 transition-all select-none"
                            >
                                <MapPin size={24} fill="currentColor" className="text-white/90 mb-0.5" />
                                <span className="text-[8px] font-bold opacity-70">GPS</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </>
      ) : (
        <div className="absolute bottom-0 w-full z-20 bg-gradient-to-t from-black via-black/90 to-transparent p-4 flex items-center justify-between pointer-events-none" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
           <button onClick={() => currentHoleIdx > 0 && loadHole(currentHoleIdx - 1)} disabled={currentHoleIdx === 0} className={`pointer-events-auto p-3 rounded-xl flex items-center gap-2 font-bold backdrop-blur-md border border-white/10 shadow-lg ${currentHoleIdx === 0 ? 'text-gray-500 bg-gray-900/50' : 'text-white bg-gray-800/80 hover:bg-gray-700/80'}`}><ArrowLeft size={20} /> Prev</button>
           <span className="text-gray-400 text-xs font-bold bg-black/80 px-4 py-1.5 rounded-full backdrop-blur-sm border border-gray-800 uppercase tracking-widest shadow-xl">Replay Mode</span>
           <button onClick={() => currentHoleIdx < activeCourse.holes.length - 1 && loadHole(currentHoleIdx + 1)} disabled={currentHoleIdx === activeCourse.holes.length - 1} className={`pointer-events-auto p-3 rounded-xl flex items-center gap-2 font-bold backdrop-blur-md border border-white/10 shadow-lg ${currentHoleIdx === activeCourse.holes.length - 1 ? 'text-gray-500 bg-gray-900/50' : 'text-white bg-green-600/90 hover:bg-green-500/90'}`}>Next <ArrowRight size={20} /></button>
        </div>
      )}

      {showHoleSelect && <HoleSelectorModal holes={activeCourse.holes} currentIdx={currentHoleIdx} onSelect={loadHole} onClose={() => setShowHoleSelect(false)} />}
      {showScoreModal && <ScoreModal par={hole.par} holeNum={hole.number} onSave={saveHoleScore} onClose={() => setShowScoreModal(false)} />}
      {showFullCard && <FullScorecardModal holes={activeCourse.holes} scorecard={scorecard} onFinishRound={finishRound} onClose={() => setShowFullCard(false)} />}
      {pendingShot && <ShotConfirmModal dist={MathUtils.formatDistance(pendingShot.dist, useYards)} club={selectedClub} clubs={bag} isGPS={pendingShot.isGPS} isLongDistWarning={pendingShot.dist > 500} onChangeClub={setSelectedClub} onConfirm={confirmShot} onCancel={() => setPendingShot(null)} />}
      {shotToDelete && (
        <ModalOverlay onClose={() => setShotToDelete(null)}>
            <div className="p-6 bg-gray-900 text-center rounded-2xl">
                <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                    <Trash2 className="text-red-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Shot?</h3>
                <p className="text-gray-400 text-sm mb-6">
                    Are you sure you want to remove this shot record? 
                    {shots.indexOf(shotToDelete) === shots.length - 1 && " This will reset your position to the previous shot."}
                </p>
                <div className="flex gap-3">
                    <button onClick={() => setShotToDelete(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl border border-gray-700">Cancel</button>
                    <button onClick={handleDeleteShot} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg">Delete</button>
                </div>
            </div>
        </ModalOverlay>
      )}
    </div>
  );
};

export default PlayRound;
