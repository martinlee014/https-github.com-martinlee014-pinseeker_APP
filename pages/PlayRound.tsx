
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
import { Flag, Wind, ChevronLeft, Grid, ListChecks, ArrowLeft, ArrowRight, ChevronDown, MapPin, Ruler, Trash2, PenTool, Type, Highlighter, X, Check, Eraser, Home, Signal, SignalHigh, SignalLow, SignalMedium } from 'lucide-react';

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

const measureTargetIcon = new L.DivIcon({
  className: 'custom-measure-icon',
  html: "<div style='background-color:transparent; width: 20px; height: 20px; border: 3px solid #60a5fa; border-radius: 50%; box-shadow: 0 0 4px black; display:flex; align-items:center; justify-content:center;'><div style='width:6px; height:6px; background-color:#60a5fa; border-radius:50%'></div></div>",
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const draggableMeasureStartIcon = new L.DivIcon({
  className: 'measure-start-drag',
  html: `
    <div style="
      width: 48px; 
      height: 48px; 
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: move;
    ">
      <div style="
        width: 28px; 
        height: 28px; 
        background-color: white; 
        border-radius: 50%; 
        border: 5px solid #3b82f6; 
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.6), 0 4px 8px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 8px; height: 8px; background-color: #3b82f6; border-radius: 50%;"></div>
      </div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24]
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

const userLocationIcon = new L.DivIcon({
  className: 'user-location-icon',
  html: `
    <div class="relative flex items-center justify-center w-6 h-6">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white shadow-sm"></span>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

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
  iconAnchor: [10, 10]
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
  iconAnchor: [0, 24]
});

const GolfBagIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M7 6h10v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6z" />
    <path d="M9 6V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    <path d="M9 4l-2 2" />
    <path d="M15 4l2 2" />
    <path d="M17 10l2 2a2 2 0 0 1 0 3l-2 2" />
    <path d="M10 12h4" />
    <path d="M10 16h4" />
  </svg>
);

const RotatedMapHandler = ({ 
    rotation, 
    isMeasureMode,
    currentBallPos,
    measureTarget,
    onLongPress,
    onClick,
    onMoveStartPoint,
    onMoveTargetPoint
}: { 
    rotation: number, 
    isMeasureMode: boolean,
    currentBallPos: LatLng,
    measureTarget: LatLng | null,
    onLongPress: (latlng: LatLng) => void,
    onClick: (latlng: LatLng) => void,
    onMoveStartPoint: (latlng: LatLng) => void,
    onMoveTargetPoint: (latlng: LatLng) => void
}) => {
  const map = useMap();
  const isDragging = useRef(false);
  const dragType = useRef<'map' | 'marker-start' | 'marker-target'>('map');
  const lastPos = useRef<{x: number, y: number} | null>(null);
  
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

    // Correctly convert screen coordinates to LatLng in a rotated container
    const calculateLatLng = (clientPos: {x: number, y: number}) => {
        const rect = container.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const dx = clientPos.x - cx;
        const dy = clientPos.y - cy;

        // Invert rotation
        const angleRad = (-rotation * Math.PI) / 180;
        const rotatedX = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
        const rotatedY = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);

        const mapSize = map.getSize();
        const leafPoint = L.point(mapSize.x / 2 + rotatedX, mapSize.y / 2 + rotatedY);
        return map.containerPointToLatLng(leafPoint);
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      e.stopPropagation();
      if (window.TouchEvent && e instanceof TouchEvent && e.touches.length > 1) {
          isMultiTouch.current = true;
          if (longPressTimer.current) clearTimeout(longPressTimer.current);
          isDragging.current = false;
          return;
      }

      isDragging.current = true;
      hasMovedSignificantly.current = false;
      isMultiTouch.current = false;
      const pos = getClientPos(e);
      lastPos.current = pos;
      startClientPos.current = pos;

      const target = e.target as HTMLElement;

      // Detection for draggable markers in Measure Mode
      if (isMeasureMode) {
          const rect = container.getBoundingClientRect();
          const theta = rotation * (Math.PI / 180);

          const checkMarkerDist = (latlng: LatLng) => {
              const pt = map.latLngToContainerPoint([latlng.lat, latlng.lng]);
              const mapSize = map.getSize();
              const mcx = mapSize.x / 2;
              const mcy = mapSize.y / 2;
              const rdx = pt.x - mcx;
              const rdy = pt.y - mcy;
              
              // Project map point to screen point
              const screenX = rect.left + mcx + (rdx * Math.cos(theta) - rdy * Math.sin(theta));
              const screenY = rect.top + mcy + (rdx * Math.sin(theta) + rdy * Math.cos(theta));
              
              return Math.sqrt(Math.pow(pos.x - screenX, 2) + Math.pow(pos.y - screenY, 2));
          };

          if (checkMarkerDist(currentBallPos) < 40) {
              dragType.current = 'marker-start';
              if (navigator.vibrate) navigator.vibrate(10);
              return;
          }
          if (measureTarget && checkMarkerDist(measureTarget) < 40) {
              dragType.current = 'marker-target';
              if (navigator.vibrate) navigator.vibrate(10);
              return;
          }
      }

      dragType.current = 'map';
      const isInteractive = target.closest('.leaflet-interactive') || target.closest('.leaflet-popup-pane');
      if (!isInteractive) {
          longPressTimer.current = setTimeout(() => {
              isDragging.current = false;
              if (!hasMovedSignificantly.current && !isMultiTouch.current) {
                  const latlng = calculateLatLng(pos);
                  if (navigator.vibrate) navigator.vibrate(50);
                  onLongPress({ lat: latlng.lat, lng: latlng.lng });
              }
          }, 600);
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (window.TouchEvent && e instanceof TouchEvent && e.touches.length > 1) {
          isMultiTouch.current = true;
          if (longPressTimer.current) clearTimeout(longPressTimer.current);
          isDragging.current = false;
          return;
      }

      const currentPos = getClientPos(e);
      if (startClientPos.current) {
          const moveDist = Math.sqrt(Math.pow(currentPos.x - startClientPos.current.x, 2) + Math.pow(currentPos.y - startClientPos.current.y, 2));
          if (moveDist > 10) { 
              hasMovedSignificantly.current = true;
              if (longPressTimer.current) clearTimeout(longPressTimer.current);
          }
      }

      if (!isDragging.current || !lastPos.current) return;
      if(e.cancelable) e.preventDefault(); 

      const deltaX = currentPos.x - lastPos.current.x;
      const deltaY = currentPos.y - lastPos.current.y;

      if (dragType.current === 'map') {
          const theta = -rotation * (Math.PI / 180); 
          const rotatedDx = deltaX * Math.cos(theta) - deltaY * Math.sin(theta);
          const rotatedDy = deltaX * Math.sin(theta) + deltaY * Math.cos(theta);
          map.panBy([-rotatedDx, -rotatedDy], { animate: false });
      } else {
          // Manual Marker Drag
          const latlng = calculateLatLng(currentPos);
          if (dragType.current === 'marker-start') onMoveStartPoint(latlng);
          else onMoveTargetPoint(latlng);
      }
      
      lastPos.current = currentPos;
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
      if (isMultiTouch.current) {
          isDragging.current = false;
          return;
      }
      if (startClientPos.current && !hasMovedSignificantly.current && dragType.current === 'map') {
         const target = e.target as HTMLElement;
         const isInteractive = target.closest('.leaflet-interactive') || target.closest('.leaflet-popup-pane');
         if (!isInteractive) {
             const latlng = calculateLatLng(startClientPos.current);
             onClick({ lat: latlng.lat, lng: latlng.lng });
         }
      }
      isDragging.current = false;
      dragType.current = 'map';
      lastPos.current = null;
      startClientPos.current = null;
    };

    container.addEventListener('mousedown', handleStart);
    container.addEventListener('touchstart', handleStart, { passive: false });
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);

    return () => {
      container.removeEventListener('mousedown', handleStart);
      container.removeEventListener('touchstart', handleStart);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [map, rotation, isMeasureMode, currentBallPos, measureTarget, onLongPress, onClick, onMoveStartPoint, onMoveTargetPoint]);

  return null;
};

const MapInitializer = ({ center, isReplay, pointsToFit }: { center: LatLng, isReplay: boolean, pointsToFit?: LatLng[] }) => {
    const map = useMap();
    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => map.invalidateSize());
        resizeObserver.observe(map.getContainer());
        setTimeout(() => map.invalidateSize(), 250);
        return () => resizeObserver.disconnect();
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

type AnnotationTool = 'text' | 'pin' | 'draw' | 'eraser';

const PlayRound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, useYards, bag } = useContext(AppContext);

  const replayRound = location.state?.round as RoundHistory | undefined;
  const initialHoleIdx = location.state?.initialHoleIndex || 0;
  const passedCourse = location.state?.course as GolfCourse | undefined;

  const isReplay = !!replayRound;

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
  const [isMeasureMode, setIsMeasureMode] = useState(false);
  const [measureTarget, setMeasureTarget] = useState<LatLng | null>(null);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [annotations, setAnnotations] = useState<MapAnnotation[]>([]);
  const [activeTool, setActiveTool] = useState<AnnotationTool>('text');
  const [drawingPoints, setDrawingPoints] = useState<LatLng[]>([]);
  const [showTextInput, setShowTextInput] = useState<{lat: number, lng: number} | null>(null);
  const [textInputValue, setTextInputValue] = useState("");
  const [shotToDelete, setShotToDelete] = useState<ShotRecord | null>(null);
  const [liveLocation, setLiveLocation] = useState<LatLng | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsSignalLevel, setGpsSignalLevel] = useState<0 | 1 | 2 | 3>(0);
  const watchIdRef = useRef<number | null>(null);
  const gpsPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressAction = useRef(false);

  const hole = activeCourse.holes[currentHoleIdx];

  useEffect(() => {
    if (passedCourse) setActiveCourse(passedCourse);
    if (isReplay && replayRound) {
        setShots(replayRound.shots);
        setScorecard(replayRound.scorecard);
        const h = activeCourse.holes[initialHoleIdx];
        if (h) setCurrentBallPos(h.tee);
    } else {
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
            } else if (hole) setCurrentBallPos(hole.tee);
        } else if (hole) setCurrentBallPos(hole.tee);
    }
  }, []);

  useEffect(() => {
    if (isReplay || !navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition((p) => {
        const { latitude, longitude, accuracy } = p.coords;
        setLiveLocation({ lat: latitude, lng: longitude });
        setGpsAccuracy(accuracy);
        if (accuracy <= 10) setGpsSignalLevel(3);
        else if (accuracy <= 30) setGpsSignalLevel(2);
        else setGpsSignalLevel(1);
    }, () => setGpsSignalLevel(0), { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 });
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [isReplay]);

  useEffect(() => {
      if (hole && shotNum === 1 && !pendingShot) {
          const isAtTee = currentBallPos.lat === hole.tee.lat && currentBallPos.lng === hole.tee.lng;
          if (!isAtTee && shots.filter(s => s.holeNumber === hole.number).length === 0) {
              setCurrentBallPos(hole.tee);
          }
      }
  }, [currentHoleIdx, activeCourse]);

  useEffect(() => {
    if (hole && activeCourse) setAnnotations(StorageService.getAnnotations(activeCourse.id, hole.number));
  }, [currentHoleIdx, activeCourse]);

  useEffect(() => {
    if (bag.length > 0) {
      const updatedClub = bag.find(c => c.name === selectedClub.name);
      setSelectedClub(updatedClub || bag[0]);
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

  const { destination: predictedLanding } = useMemo(() => MathUtils.calculateWindAdjustedShot(
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
  const replayPoints = useMemo(() => isReplay ? [hole.tee, hole.green, ...holeShots.map(s => s.to)] : [], [isReplay, hole, holeShots]);

  const guideLinePoints = useMemo(() => [[predictedLanding.lat, predictedLanding.lng], [hole.green.lat, hole.green.lng]], [predictedLanding, hole]);
  const guideLabelPos = useMemo(() => ({
      lat: predictedLanding.lat + (hole.green.lat - predictedLanding.lat) * 0.33,
      lng: predictedLanding.lng + (hole.green.lng - predictedLanding.lng) * 0.33
  }), [predictedLanding, hole]);

  const activeMeasureTarget = measureTarget || predictedLanding;
  const measureDist1 = useMemo(() => MathUtils.calculateDistance(currentBallPos, activeMeasureTarget), [currentBallPos, activeMeasureTarget]);
  const measureDist2 = useMemo(() => MathUtils.calculateDistance(activeMeasureTarget, hole.green), [activeMeasureTarget, hole]);
  const labelPos1 = useMemo(() => ({ lat: (currentBallPos.lat + activeMeasureTarget.lat) / 2, lng: (currentBallPos.lng + activeMeasureTarget.lng) / 2 }), [currentBallPos, activeMeasureTarget]);
  const labelPos2 = useMemo(() => ({ lat: (activeMeasureTarget.lat + hole.green.lat) / 2, lng: (activeMeasureTarget.lng + hole.green.lng) / 2 }), [activeMeasureTarget, hole]);

  const currentLayupStrategy = useMemo(() => MathUtils.calculateLayupStrategy(distToGreen, bag, shotNum), [distToGreen, bag, shotNum]);

  useEffect(() => {
    if (!isReplay && bag.length > 0 && !isMeasureMode) {
      const dist = distToGreen;
      if (dist < 50) setSelectedClub(bag[bag.length - 1]);
      else {
        let validClubs = shotNum > 1 ? bag.filter(c => !c.name.toLowerCase().includes('driver')) : bag;
        const sortedValid = [...validClubs].sort((a,b) => b.carry - a.carry);
        let suitable = [...sortedValid].reverse().find(c => c.carry >= dist - 10) || (currentLayupStrategy ? currentLayupStrategy.club1 : sortedValid[0]);
        if (suitable) setSelectedClub(suitable);
      }
    }
  }, [currentBallPos, currentHoleIdx, isReplay, isMeasureMode, shotNum, distToGreen]);

  const nextClubSuggestion = useMemo(() => {
    if (currentLayupStrategy && shotNum > 1 && bag.length > 1) {
        const longestValid = bag.find(c => !c.name.toLowerCase().includes('driver')) || bag[0];
        if (distToGreen > longestValid.carry + 10) return `${currentLayupStrategy.club1.name} + ${currentLayupStrategy.club2.name}`;
    }
    if (distLandingToGreen < 20) return "Putter";
    const validForNext = bag.filter(c => !c.name.toLowerCase().includes('driver'));
    if (validForNext.length === 0) return "Club";
    const sorted = [...validForNext].sort((a,b) => a.carry - b.carry);
    return (sorted.find(c => c.carry >= distLandingToGreen) || sorted[sorted.length-1]).name;
  }, [distLandingToGreen, bag, currentLayupStrategy, distToGreen, shotNum]);

  const handleMapClick = (latlng: any) => {
    if (isReplay) return;
    if (isNoteMode) {
        if (activeTool === 'pin') {
            const newNote: MapAnnotation = { id: crypto.randomUUID(), courseId: activeCourse.id, holeNumber: hole.number, type: 'icon', subType: 'flag', points: [{lat: latlng.lat, lng: latlng.lng}] };
            StorageService.saveAnnotation(newNote);
            setAnnotations(prev => [...prev, newNote]);
        } else if (activeTool === 'draw') setDrawingPoints(prev => [...prev, {lat: latlng.lat, lng: latlng.lng}]);
        return;
    }
    if (isMeasureMode) {
        if (MathUtils.calculateDistance(currentBallPos, { lat: latlng.lat, lng: latlng.lng }) < 5) return;
        setMeasureTarget({ lat: latlng.lat, lng: latlng.lng });
        return;
    }
    const bearingToClick = MathUtils.calculateBearing(currentBallPos, { lat: latlng.lat, lng: latlng.lng });
    let diff = bearingToClick - baseBearing;
    if (diff > 180) diff -= 360; else if (diff < -180) diff += 360;
    setAimAngle(diff);
  };

  const handleManualDrop = (latlng: any) => {
    if (isReplay || isMeasureMode) return;
    if (isNoteMode) {
        if (activeTool === 'text') { setShowTextInput({lat: latlng.lat, lng: latlng.lng}); setTextInputValue(""); }
        return;
    }
    const pos = { lat: latlng.lat, lng: latlng.lng };
    setPendingShot({ pos, isGPS: false, dist: MathUtils.calculateDistance(currentBallPos, pos) });
  };

  const initiateGPSShot = () => {
    const success = (pos: any) => {
        const gpsPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPendingShot({ pos: gpsPos, isGPS: true, dist: MathUtils.calculateDistance(currentBallPos, gpsPos) });
    };
    if (liveLocation && gpsAccuracy && gpsAccuracy < 50) success({ coords: { latitude: liveLocation.lat, longitude: liveLocation.lng } });
    else navigator.geolocation.getCurrentPosition(success, (err) => alert("GPS Error: " + err.message), { enableHighAccuracy: true, timeout: 5000 });
  };

  const setTeeToGPS = () => {
    const success = (pos: any) => {
        setCurrentBallPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    };
    if (liveLocation && gpsAccuracy && gpsAccuracy < 50) success({ coords: { latitude: liveLocation.lat, longitude: liveLocation.lng } });
    else navigator.geolocation.getCurrentPosition(success, (err) => alert("GPS Error: " + err.message));
  };

  const handleMeasureGPS = () => {
      if (liveLocation) { setCurrentBallPos(liveLocation); if (navigator.vibrate) navigator.vibrate(50); return; }
      navigator.geolocation.getCurrentPosition((pos) => {
          setCurrentBallPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          if (navigator.vibrate) navigator.vibrate(50);
      }, (err) => alert("GPS Error: " + err.message));
  };

  const handleGPSButtonStart = (e: React.MouseEvent | React.TouchEvent) => {
    isLongPressAction.current = false;
    gpsPressTimer.current = setTimeout(() => {
        isLongPressAction.current = true;
        setTeeToGPS();
    }, 1000);
  };

  const handleGPSButtonEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (gpsPressTimer.current) {
        clearTimeout(gpsPressTimer.current);
        gpsPressTimer.current = null;
    }
    if (!isLongPressAction.current) initiateGPSShot();
    isLongPressAction.current = false;
  };

  const confirmShot = () => {
    if (!pendingShot) return;
    setShots(prev => [...prev, { holeNumber: hole.number, shotNumber: shotNum, from: currentBallPos, to: pendingShot.pos, clubUsed: selectedClub.name, distance: pendingShot.dist, plannedInfo: { target: predictedLanding, dispersion: { width: selectedClub.depthError * 2, depth: selectedClub.sideError * 2, rotation: 90 - shotBearing } } }]);
    setCurrentBallPos(pendingShot.pos);
    setShotNum(prev => prev + 1);
    setAimAngle(0);
    setPendingShot(null);
  };

  const deleteAnnotation = (id: string) => {
    if (window.confirm("Delete this annotation?")) {
        StorageService.deleteAnnotation(id);
        setAnnotations(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleDeleteShot = () => {
    if (!shotToDelete) return;
    const isMostRecent = shots.filter(s => s.holeNumber === hole.number).pop() === shotToDelete;
    setShots(prev => prev.filter(s => s !== shotToDelete));
    if (isMostRecent) { setCurrentBallPos(shotToDelete.from); setShotNum(Math.max(1, shotToDelete.shotNumber)); }
    setShotToDelete(null);
  };

  const saveHoleScore = (totalScore: number, putts: number, pens: number) => {
    const newScore = { holeNumber: hole.number, par: hole.par, shotsTaken: Math.max(0, totalScore - putts - pens), putts, penalties: pens };
    setScorecard(prev => [...prev.filter(s => s.holeNumber !== hole.number), newScore]);
    setShowScoreModal(false);
    if (currentHoleIdx < activeCourse.holes.length - 1) loadHole(currentHoleIdx + 1); else finishRound();
  };

  const loadHole = (idx: number) => {
    setCurrentHoleIdx(idx);
    setCurrentBallPos(activeCourse.holes[idx].tee);
    setShotNum(1); setAimAngle(0); setMeasureTarget(null); setIsMeasureMode(false); setIsNoteMode(false); setShowHoleSelect(false);
  };

  const finishRound = () => {
    if(!user) return;
    const history = { id: crypto.randomUUID(), date: new Date().toLocaleString(), courseName: activeCourse.name, scorecard, shots };
    StorageService.saveHistory(user, history);
    StorageService.clearTempState(user);
    navigate('/summary', { state: { round: history } });
  };

  const toggleMeasureMode = () => {
      const newState = !isMeasureMode;
      setIsMeasureMode(newState);
      setIsNoteMode(false);
      if (newState) { setAimAngle(0); setMeasureTarget(predictedLanding); }
  };

  const handleWindCircleInteract = (e: any) => {
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const cx = rect.width / 2, cy = rect.height / 2;
      const pos = e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
      const x = pos.x - rect.left - cx, y = pos.y - rect.top - cy;
      let angleDeg = Math.atan2(y, x) * (180 / Math.PI) + 90;
      if (angleDeg < 0) angleDeg += 360;
      setWindDir(Math.round((baseBearing + angleDeg) % 360));
  };

  return (
    <div className="h-full relative bg-gray-900 flex flex-col overflow-hidden select-none touch-none" onContextMenu={(e) => e.preventDefault()}>
      <div className="absolute inset-0 z-0 bg-black w-full h-full overflow-hidden">
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: '150vmax', height: '150vmax', transformOrigin: 'center center', transform: `translate(-50%, -50%) rotate(${mapRotation}deg)`, transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)', willChange: 'transform' }}>
            <MapContainer key={`${activeCourse.id}-${currentHoleIdx}`} center={[hole.tee.lat, hole.tee.lng]} zoom={18} maxZoom={22} className="h-full w-full bg-black" zoomControl={false} attributionControl={false} dragging={false} doubleClickZoom={false}>
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxNativeZoom={19} maxZoom={22} noWrap={true} />
              <RotatedMapHandler 
                rotation={mapRotation} 
                isMeasureMode={isMeasureMode}
                currentBallPos={currentBallPos}
                measureTarget={measureTarget}
                onLongPress={handleManualDrop} 
                onClick={handleMapClick}
                onMoveStartPoint={setCurrentBallPos}
                onMoveTargetPoint={setMeasureTarget}
              />
              <MapInitializer center={currentBallPos} isReplay={isReplay} pointsToFit={replayPoints} />
              {!isReplay && liveLocation && <Marker position={[liveLocation.lat, liveLocation.lng]} icon={userLocationIcon} zIndexOffset={1000} />}
              <Marker position={[hole.green.lat, hole.green.lng]} icon={flagIcon} />
              {annotations.map(note => {
                 const handlers = isNoteMode ? { click: () => activeTool === 'eraser' && deleteAnnotation(note.id) } : {};
                 if (note.type === 'path') return <Polyline key={note.id} positions={note.points.map(p => [p.lat, p.lng])} pathOptions={{ color: '#facc15', weight: 3, dashArray: '5,5', opacity: 0.8 }} eventHandlers={handlers} />;
                 if (note.type === 'text') return <Marker key={note.id} position={[note.points[0].lat, note.points[0].lng]} icon={createAnnotationTextIcon(note.text || "", -mapRotation)} eventHandlers={handlers} />;
                 if (note.type === 'icon') return <Marker key={note.id} position={[note.points[0].lat, note.points[0].lng]} icon={userFlagIcon} eventHandlers={handlers} />;
                 return null;
              })}
              {isNoteMode && drawingPoints.length > 0 && (
                  <>
                      {drawingPoints.map((p, i) => <Marker key={i} position={[p.lat, p.lng]} icon={measureTargetIcon} />)}
                      <Polyline positions={drawingPoints.map(p => [p.lat, p.lng])} pathOptions={{ color: '#facc15', weight: 2, dashArray: '2,4' }} />
                  </>
              )}
              {holeShots.map((s, i) => (
                  <Fragment key={i}>
                      <Marker position={[s.from.lat, s.from.lng]} icon={s.shotNumber === 1 ? startMarkerIcon : ballIcon} />
                      <Polyline positions={MathUtils.getArcPoints(s.from, s.to).map(p => [p.lat, p.lng])} pathOptions={{ color: "white", weight: 2, opacity: 0.8 }} />
                      {isReplay ? <Marker position={[s.to.lat, s.to.lng]} icon={createReplayLabelIcon(`${s.clubUsed} - ${MathUtils.formatDistance(s.distance, useYards)}`, -mapRotation)} /> : <Marker position={[s.to.lat, s.to.lng]} icon={targetIcon} eventHandlers={{ contextmenu: (e) => { e.originalEvent.preventDefault(); setShotToDelete(s); } }} />}
                  </Fragment>
              ))}
              {!isReplay && !isMeasureMode && !isNoteMode && (
                  <>
                      <Marker position={[currentBallPos.lat, currentBallPos.lng]} icon={shotNum === 1 ? startMarkerIcon : ballIcon} />
                      <Polyline positions={[[currentBallPos.lat, currentBallPos.lng], [predictedLanding.lat, predictedLanding.lng]]} pathOptions={{ color: "#3b82f6", weight: 3, dashArray: "5, 5" }} />
                      <Polygon positions={ellipsePoints} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2, weight: 1 }} />
                      <Marker position={[predictedLanding.lat, predictedLanding.lng]} icon={createArrowIcon(shotBearing)} />
                      <Polyline positions={guideLinePoints as any} pathOptions={{ color: "#fbbf24", weight: 2, dashArray: "4, 6", opacity: 0.8 }} />
                      <Marker position={[guideLabelPos.lat, guideLabelPos.lng]} icon={createDistanceLabelIcon(`Leaves ${MathUtils.formatDistance(distLandingToGreen, useYards)}`, -mapRotation)} />
                  </>
              )}
              {!isReplay && isMeasureMode && activeMeasureTarget && (
                  <>
                      <Marker position={[currentBallPos.lat, currentBallPos.lng]} icon={draggableMeasureStartIcon} zIndexOffset={1000} />
                      <Marker position={[activeMeasureTarget.lat, activeMeasureTarget.lng]} icon={measureTargetIcon} />
                      <Polyline positions={[[currentBallPos.lat, currentBallPos.lng], [activeMeasureTarget.lat, activeMeasureTarget.lng]]} pathOptions={{ color: "#60a5fa", weight: 4, opacity: 1 }} />
                      <Polyline positions={[[activeMeasureTarget.lat, activeMeasureTarget.lng], [hole.green.lat, hole.green.lng]]} pathOptions={{ color: "#ffffff", weight: 3, dashArray: "8, 8", opacity: 0.8 }} />
                      <Marker position={[labelPos1.lat, labelPos1.lng]} icon={createDistanceLabelIcon(MathUtils.formatDistance(measureDist1, useYards), -mapRotation, '#60a5fa')} />
                      <Marker position={[labelPos2.lat, labelPos2.lng]} icon={createDistanceLabelIcon(MathUtils.formatDistance(measureDist2, useYards), -mapRotation, '#ffffff')} />
                  </>
              )}
            </MapContainer>
        </div>
      </div>
      <div className="absolute top-0 left-0 right-0 z-[1000] p-3 pointer-events-none flex justify-between items-start">
        <div className="pointer-events-auto flex flex-col gap-2">
           <button onClick={() => navigate(-1)} className="bg-black/50 p-2 rounded-full text-white backdrop-blur-md border border-white/5"><ChevronLeft size={20} /></button>
           <button onClick={() => navigate('/dashboard')} className="bg-black/50 p-2 rounded-full text-white backdrop-blur-md border border-white/5"><Home size={20} /></button>
           {!isReplay && <><button onClick={() => navigate('/settings/clubs', { state: { fromGame: true } })} className="bg-black/50 p-2 rounded-full text-white backdrop-blur-md border border-white/5 mt-1"><GolfBagIcon size={20} /></button><button onClick={() => setShowHoleSelect(true)} className="bg-black/50 p-2 rounded-full text-white backdrop-blur-md border border-white/5 mt-1"><Grid size={20} /></button><button onClick={() => setShowFullCard(true)} className="bg-black/50 p-2 rounded-full text-white backdrop-blur-md border border-white/5 mt-1"><ListChecks size={20} /></button></>}
        </div>
        <div className="text-center mt-1 drop-shadow-lg pointer-events-none">
          <div className="flex items-center justify-center gap-1.5 mb-1 opacity-80">{isReplay ? <span className="text-[10px] text-gray-400 bg-black/60 px-2 rounded-md">REPLAY</span> : <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-md">{gpsSignalLevel === 3 ? <Signal size={14} className="text-blue-500" /> : <SignalLow size={14} className="text-red-500" />}<span className="text-[10px] font-mono text-gray-300">{gpsAccuracy ? `±${Math.round(gpsAccuracy)}m` : 'NO GPS'}</span></div>}</div>
          <h2 className="text-2xl font-black text-white">HOLE {hole.number}</h2>
          <div className="flex items-center justify-center gap-2 text-xs font-bold bg-black/60 rounded-full px-3 py-1 backdrop-blur-md border border-white/10 shadow-lg"><span className="text-gray-300">PAR {hole.par}</span><span className="text-gray-500">|</span><span className="text-white">{MathUtils.formatDistance(distToGreen, useYards)}</span></div>
        </div>
        <div className="pointer-events-auto flex flex-col gap-2 items-end">
           {!isReplay && <><button onClick={() => setShowScoreModal(true)} className="bg-green-600/90 p-2.5 rounded-full text-white shadow-lg shadow-green-900/50"><Flag size={20} fill="white"/></button><button onClick={toggleMeasureMode} className={`p-2.5 rounded-full shadow-lg ${isMeasureMode ? 'bg-blue-600 text-white' : 'bg-black/50 text-blue-400'}`}><Ruler size={20} /></button><button onClick={() => setIsNoteMode(!isNoteMode)} className={`p-2.5 rounded-full shadow-lg ${isNoteMode ? 'bg-yellow-600 text-white' : 'bg-black/50 text-yellow-400'}`}><PenTool size={20} /></button><button onClick={() => setShowWind(!showWind)} className="bg-black/50 p-2.5 rounded-full text-gray-400"><Wind size={20} /></button></>}
        </div>
      </div>
      {showWind && <div className="absolute top-20 right-14 z-[1000] bg-black/90 backdrop-blur-xl p-4 rounded-2xl border border-gray-700 w-48 text-gray-300 shadow-2xl flex flex-col gap-4"><div className="flex items-center justify-between border-b border-gray-800 pb-2"><span className="font-bold text-white text-sm flex items-center gap-2"><Wind size={16}/> Wind</span><span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded">{windSpeed} m/s</span></div><input type="range" min="0" max="20" value={windSpeed} onChange={(e) => setWindSpeed(parseInt(e.target.value))} className="w-full accent-blue-500 h-2 bg-gray-700 rounded-lg appearance-none" /><div className="relative w-32 h-32 mx-auto select-none touch-none" onMouseDown={handleWindCircleInteract} onMouseMove={(e) => e.buttons === 1 && handleWindCircleInteract(e)} onTouchMove={handleWindCircleInteract}><div className="absolute inset-0 rounded-full border-2 border-gray-700 bg-gray-800/50 shadow-inner"></div><div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform" style={{ transform: `rotate(${windDir - baseBearing}deg)` }}><div className="relative h-full w-full"><div className="absolute top-2 left-1/2 -translate-x-1/2"><div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[20px] border-b-blue-500"></div><div className="w-1 h-14 bg-blue-500 mx-auto opacity-80"></div></div></div></div><div className="absolute top-1/2 left-1/2 w-4 h-4 bg-gray-200 rounded-full border-2 border-gray-600 -translate-x-1/2 -translate-y-1/2 shadow-lg z-10"></div></div></div>}
      {!isReplay && !isNoteMode && (
        <div className="absolute bottom-0 w-full z-30 pt-2 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-black/95 via-black/80 to-transparent">
            {isMeasureMode ? (
                <div className="flex gap-3 h-20 items-stretch mb-2"><div className="flex-1 bg-gray-900 rounded-2xl border border-blue-500/40 flex items-center justify-between px-4"><div className="flex-1 text-center border-r border-gray-700 py-2"><div className="text-[10px] text-blue-200 uppercase font-bold tracking-widest mb-1 opacity-80">From You</div><div className="text-3xl font-black text-blue-400 leading-none">{MathUtils.formatDistance(measureDist1, useYards)}</div></div><div className="flex-1 text-center py-2"><div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1 opacity-80">To Pin</div><div className="text-3xl font-black text-white leading-none">{MathUtils.formatDistance(measureDist2, useYards)}</div></div></div><button onClick={handleMeasureGPS} className="w-20 bg-blue-600 text-white rounded-2xl flex flex-col items-center justify-center"><MapPin size={24} /><span className="text-[9px] font-bold">MY LOC</span></button></div>
            ) : (
                <>
                    <div className="flex items-center gap-3 mb-3 bg-gray-900/90 backdrop-blur-md p-2 rounded-xl border border-white/5"><div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider pl-1">Shot {shotNum}</div><div className="flex items-center gap-2 flex-1"><span className="text-[10px] font-bold text-gray-500">AIM</span><input type="range" min="-45" max="45" value={aimAngle} onChange={(e) => setAimAngle(parseInt(e.target.value))} className="flex-1 accent-white h-1 bg-gray-700 rounded-lg appearance-none" /><span className="text-[10px] font-bold text-gray-300 w-6 text-right">{aimAngle}°</span></div></div>
                    <div className="flex gap-3 h-16 items-stretch"><div className="flex-1 relative bg-gray-900 rounded-2xl border border-white/5 overflow-hidden flex"><div className="absolute inset-0 z-10 opacity-0"><ClubSelector clubs={bag} selectedClub={selectedClub} onSelect={setSelectedClub} useYards={useYards} /></div><div className="flex-1 flex flex-col justify-center pl-4 pr-1 border-r border-white/5 pointer-events-none"><span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Club</span><div className="text-xl font-bold text-white truncate leading-none">{selectedClub.name}</div><div className="text-[10px] text-gray-500 mt-1">{MathUtils.formatDistance(useYards ? selectedClub.carry * 1.09361 : selectedClub.carry, useYards)}</div></div><div className="flex-1 flex flex-col justify-center items-end pr-4 pl-1 pointer-events-none bg-gray-800/30"><span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Leaves</span><div className="text-xl font-bold text-white leading-none">{MathUtils.formatDistance(distLandingToGreen, useYards)}</div><div className="text-[10px] text-gray-500 mt-1 text-right truncate w-full"><span className="text-white font-medium">{nextClubSuggestion}</span></div></div></div><button onMouseDown={handleGPSButtonStart} onMouseUp={handleGPSButtonEnd} onTouchStart={handleGPSButtonStart} onTouchEnd={handleGPSButtonEnd} className="w-16 bg-emerald-600 text-white rounded-2xl flex flex-col items-center justify-center"><MapPin size={24} fill="currentColor" /><span className="text-[8px] font-bold opacity-70">GPS</span></button></div>
                </>
            )}
        </div>
      )}
      {showHoleSelect && <HoleSelectorModal holes={activeCourse.holes} currentIdx={currentHoleIdx} onSelect={loadHole} onClose={() => setShowHoleSelect(false)} />}
      {showScoreModal && <ScoreModal par={hole.par} holeNum={hole.number} recordedShots={Math.max(0, shotNum - 1)} onSave={saveHoleScore} onClose={() => setShowScoreModal(false)} />}
      {showFullCard && <FullScorecardModal holes={activeCourse.holes} scorecard={scorecard} onFinishRound={finishRound} onClose={() => setShowFullCard(false)} />}
      {pendingShot && <ShotConfirmModal dist={MathUtils.formatDistance(pendingShot.dist, useYards)} club={selectedClub} clubs={bag} isGPS={pendingShot.isGPS} isLongDistWarning={pendingShot.dist > 500} onChangeClub={setSelectedClub} onConfirm={confirmShot} onCancel={() => setPendingShot(null)} />}
    </div>
  );
};

export default PlayRound;
