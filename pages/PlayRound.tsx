import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Polygon, useMap, useMapEvents } from 'react-leaflet';
import L, { LatLngBoundsExpression } from 'leaflet';
import { AppContext } from '../App';
import { DUVENHOF_HOLES, DEFAULT_BAG } from '../constants';
import { StorageService } from '../services/storage';
import * as MathUtils from '../services/mathUtils';
import { ClubStats, HoleScore, ShotRecord, RoundHistory, LatLng } from '../types';
import ClubSelector from '../components/ClubSelector';
import { ScoreModal, ShotConfirmModal, HoleSelectorModal, FullScorecardModal } from '../components/Modals';
import { Flag, Navigation, Wind, ChevronLeft, Target, Grid, AlertCircle, RefreshCw, Compass, ListChecks, ArrowLeft, ArrowRight } from 'lucide-react';

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

const targetIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#fbbf24; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px black;'></div>",
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

// Clean Start Marker (Replaces the realistic Tee)
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

// Custom Ball Icon (Ball on Ground)
const ballIcon = new L.DivIcon({
  className: 'custom-ball-icon',
  html: `
    <div style="width: 14px; height: 14px; background-color: white; border-radius: 50%; border: 2px solid #333; box-shadow: 2px 2px 4px rgba(0,0,0,0.6);"></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

// Dynamic Replay Icon that accepts rotation to stay upright
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
    '>
      ${text}
    </div>`,
  iconSize: [0, 0], // Size 0 so anchor is exactly at point
  iconAnchor: [0, 0] 
});

// --- Map Helpers ---

const RotatedMapHandler = ({ rotation }: { rotation: number }) => {
  const map = useMap();
  const isDragging = useRef(false);
  const lastPos = useRef<{x: number, y: number} | null>(null);

  useEffect(() => {
    const container = map.getContainer();

    const getClientPos = (e: MouseEvent | TouchEvent) => {
      if (window.TouchEvent && e instanceof TouchEvent) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      if ((e as MouseEvent).button === 2) return; 
      isDragging.current = true;
      lastPos.current = getClientPos(e);
      if(e.cancelable) e.preventDefault(); 
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current || !lastPos.current) return;
      if(e.cancelable) e.preventDefault();

      const currentPos = getClientPos(e);
      const deltaX = currentPos.x - lastPos.current.x;
      const deltaY = currentPos.y - lastPos.current.y;

      // Apply inverse rotation to drag vector
      const theta = -rotation * (Math.PI / 180); 
      const rotatedDx = deltaX * Math.cos(theta) - deltaY * Math.sin(theta);
      const rotatedDy = deltaX * Math.sin(theta) + deltaY * Math.cos(theta);

      map.panBy([-rotatedDx, -rotatedDy], { animate: false });
      lastPos.current = currentPos;
    };

    const handleEnd = () => {
      isDragging.current = false;
      lastPos.current = null;
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
  }, [map, rotation]);

  return null;
};

// Controls view fitting. 
// In Play Mode: Centers on Ball.
// In Replay Mode: Fits bounds to show Tee, Green, and all Shots.
const MapInitializer = ({ center, isReplay, pointsToFit }: { center: LatLng, isReplay: boolean, pointsToFit?: LatLng[] }) => {
    const map = useMap();
    
    useEffect(() => {
        if (isReplay && pointsToFit && pointsToFit.length > 0) {
            // Calculate bounds
            let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
            pointsToFit.forEach(p => {
                if (p.lat < minLat) minLat = p.lat;
                if (p.lat > maxLat) maxLat = p.lat;
                if (p.lng < minLng) minLng = p.lng;
                if (p.lng > maxLng) maxLng = p.lng;
            });
            
            // Add some padding
            const bounds = L.latLngBounds(
                L.latLng(minLat, minLng),
                L.latLng(maxLat, maxLng)
            );
            
            map.fitBounds(bounds, { padding: [50, 50], animate: false });
        } else {
            // Standard Play Mode behavior
            map.setView([center.lat, center.lng], 18, { animate: false });
        }
    }, [center, isReplay, map, pointsToFit]); // Dependency array ensures this runs when inputs change
    return null;
}

const MapEvents = ({ onMapClick, onMapLongPress }: any) => {
  useMapEvents({
    click: (e) => onMapClick(e.latlng),
    contextmenu: (e) => onMapLongPress(e.latlng)
  });
  return null;
};

// --- Main Component ---

const PlayRound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, useYards } = useContext(AppContext);

  // Setup
  const replayRound = location.state?.round as RoundHistory | undefined;
  const initialHoleIdx = location.state?.initialHoleIndex || 0;
  const isReplay = !!replayRound;

  // State
  const [currentHoleIdx, setCurrentHoleIdx] = useState(initialHoleIdx);
  const [shots, setShots] = useState<ShotRecord[]>([]);
  const [scorecard, setScorecard] = useState<HoleScore[]>([]);
  
  const [currentBallPos, setCurrentBallPos] = useState<LatLng>(DUVENHOF_HOLES[initialHoleIdx].tee);
  const [selectedClub, setSelectedClub] = useState<ClubStats>(DEFAULT_BAG[0]);
  const [aimAngle, setAimAngle] = useState(0);
  const [shotNum, setShotNum] = useState(1);
  
  // Modals & Confirmation
  const [showHoleSelect, setShowHoleSelect] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showFullCard, setShowFullCard] = useState(false);
  const [pendingShot, setPendingShot] = useState<{ pos: LatLng, isGPS: boolean, dist: number } | null>(null);
  
  // Environment
  const [windSpeed, setWindSpeed] = useState(5);
  const [windDir, setWindDir] = useState(180);
  const [showWind, setShowWind] = useState(false);

  const hole = DUVENHOF_HOLES[currentHoleIdx];

  // --- Initialization (Run Once) ---
  useEffect(() => {
    if (isReplay && replayRound) {
      setShots(replayRound.shots);
      setScorecard(replayRound.scorecard);
      // For Replay, default to tee is fine, but MapInitializer will handle bounds fitting
      setCurrentBallPos(DUVENHOF_HOLES[initialHoleIdx].tee);
    } else {
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.get('restore') === 'true' && user) {
        const saved = StorageService.getTempState(user);
        if (saved) {
          setCurrentHoleIdx(saved.currentHoleIndex);
          setShots(saved.shots);
          setScorecard(saved.scorecard);
          setShotNum(saved.currentShotNum);
          setCurrentBallPos(saved.currentBallPos);
        }
      }
      // If not restore, state defaults are already correct (Hole 0, Tee 0)
    }
  }, []); // Empty dependency array: Run ONCE on mount

  // Persistence
  useEffect(() => {
    if (!isReplay && user) {
      StorageService.saveTempState(user, {
        currentHoleIndex: currentHoleIdx,
        currentShotNum: shotNum,
        currentBallPos,
        scorecard,
        shots
      });
    }
  }, [currentHoleIdx, shotNum, currentBallPos, scorecard, shots, isReplay, user]);

  // Calculations
  const distToGreen = useMemo(() => MathUtils.calculateDistance(currentBallPos, hole.green), [currentBallPos, hole]);
  const baseBearing = useMemo(() => MathUtils.calculateBearing(currentBallPos, hole.green), [currentBallPos, hole]);
  const shotBearing = baseBearing + aimAngle;

  const mapRotation = -baseBearing;

  const { destination: predictedLanding, playsLike } = useMemo(() => MathUtils.calculateWindAdjustedShot(
    currentBallPos, 
    selectedClub.carry, 
    shotBearing, 
    windSpeed, 
    windDir
  ), [currentBallPos, selectedClub, shotBearing, windSpeed, windDir]);

  const distLandingToGreen = useMemo(() => 
    MathUtils.calculateDistance(predictedLanding, hole.green), 
  [predictedLanding, hole]);

  const ellipsePoints = useMemo(() => MathUtils.getEllipsePoints(
    predictedLanding, 
    selectedClub.sideError, 
    selectedClub.depthError, 
    90 - shotBearing
  ).map(p => [p.lat, p.lng] as [number, number]), [predictedLanding, selectedClub, shotBearing]);

  // Replay Points for auto-fitting
  const holeShots = useMemo(() => shots.filter(s => s.holeNumber === hole.number), [shots, hole.number]);
  const replayPoints = useMemo(() => {
      if (!isReplay) return [];
      return [hole.tee, hole.green, ...holeShots.map(s => s.to)];
  }, [isReplay, hole, holeShots]);

  // Auto Club
  useEffect(() => {
    if (!isReplay) {
      const dist = distToGreen;
      if (dist < 50) {
        setSelectedClub(DEFAULT_BAG[DEFAULT_BAG.length - 1]); 
      } else {
        const suitable = [...DEFAULT_BAG].reverse().find(c => c.carry >= dist - 10);
        setSelectedClub(suitable || DEFAULT_BAG[0]); 
      }
    }
  }, [currentBallPos, currentHoleIdx, isReplay]);

  // --- Interaction Handlers ---

  const handleMapClick = (latlng: any) => {
    if (isReplay) return;
    const clicked: LatLng = { lat: latlng.lat, lng: latlng.lng };
    const bearingToClick = MathUtils.calculateBearing(currentBallPos, clicked);
    let diff = bearingToClick - baseBearing;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    setAimAngle(diff);
  };

  const handleManualDrop = (latlng: any) => {
    if (isReplay) return;
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

  const confirmShot = () => {
    if (!pendingShot) return;
    const newShot: ShotRecord = {
      holeNumber: hole.number,
      shotNumber: shotNum,
      from: currentBallPos,
      to: pendingShot.pos,
      clubUsed: selectedClub.name,
      distance: pendingShot.dist
    };
    setShots(prev => [...prev, newShot]);
    setCurrentBallPos(pendingShot.pos);
    setShotNum(prev => prev + 1);
    setPendingShot(null);
    setAimAngle(0);
  };

  const setTeeToGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const gpsPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCurrentBallPos(gpsPos);
      alert("Tee position updated to current location.");
    });
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
    if (currentHoleIdx < DUVENHOF_HOLES.length - 1) {
      loadHole(currentHoleIdx + 1);
    } else {
      finishRound();
    }
  };

  const loadHole = (idx: number) => {
    setCurrentHoleIdx(idx);
    setCurrentBallPos(DUVENHOF_HOLES[idx].tee);
    setShotNum(1);
    setAimAngle(0);
    setShowHoleSelect(false);
  };

  const finishRound = () => {
    if(!user) return;
    const history: RoundHistory = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
      courseName: "Duvenhof Golf Club",
      scorecard,
      shots
    };
    StorageService.saveHistory(user, history);
    StorageService.clearTempState(user);
    navigate('/summary', { state: { round: history } });
  };

  // --- Rendering ---

  return (
    <div className="h-full relative bg-gray-900 flex flex-col overflow-hidden">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-3 bg-gradient-to-b from-black/90 to-transparent flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-2">
           <button onClick={() => navigate(-1)} className="bg-black/50 p-2 rounded-full text-white backdrop-blur-sm">
             <ChevronLeft size={20} />
           </button>
           {!isReplay && (
            <>
             <button onClick={() => setShowHoleSelect(true)} className="bg-black/50 p-2 rounded-full text-white backdrop-blur-sm mt-1">
               <Grid size={20} />
             </button>
             <button onClick={() => setShowFullCard(true)} className="bg-black/50 p-2 rounded-full text-white backdrop-blur-sm mt-1">
               <ListChecks size={20} />
             </button>
            </>
           )}
        </div>

        <div className="text-center mt-1">
          <h2 className="text-2xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] shadow-black">HOLE {hole.number}</h2>
          <div className="flex items-center justify-center gap-2 text-xs font-bold bg-black/60 rounded-full px-3 py-1 backdrop-blur-md inline-flex border border-gray-700">
            <span className="text-gray-300">PAR {hole.par}</span>
            <span className="text-gray-600">|</span>
            <span className="text-green-400">{MathUtils.formatDistance(distToGreen, useYards)}</span>
          </div>
        </div>

        <div className="pointer-events-auto flex flex-col gap-2">
           {!isReplay && (
              <button onClick={() => setShowScoreModal(true)} className="bg-green-600 p-2 rounded-full text-white shadow-lg shadow-green-900/50">
                  <Flag size={20} fill="white"/>
              </button>
           )}
           <button onClick={() => setShowWind(!showWind)} className={`bg-black/50 p-2 rounded-full ${showWind ? 'text-blue-400' : 'text-gray-400'}`}>
              <Wind size={20} />
           </button>
        </div>
      </div>

      {/* Wind Panel */}
      {showWind && (
        <div className="absolute top-20 right-14 z-[1000] bg-black/80 backdrop-blur p-3 rounded-xl border border-gray-700 w-40 text-xs text-gray-300">
            <div className="mb-1 flex justify-between"><span>Speed</span> <span>{windSpeed} m/s</span></div>
            <input type="range" min="0" max="20" value={windSpeed} onChange={(e) => setWindSpeed(parseInt(e.target.value))} className="w-full accent-blue-500 mb-2 h-1 bg-gray-600 rounded-lg appearance-none" />
            <div className="mb-1 flex justify-between"><span>Direction</span> <span>{windDir}°</span></div>
            <input type="range" min="0" max="360" value={windDir} onChange={(e) => setWindDir(parseInt(e.target.value))} className="w-full accent-blue-500 h-1 bg-gray-600 rounded-lg appearance-none" />
        </div>
      )}

      {/* Map Container Wrapper with Rotation */}
      <div className="flex-1 relative z-0 overflow-hidden bg-black w-full h-full">
        <div 
            style={{ 
                width: '100%', 
                height: '100%', 
                transform: `rotate(${mapRotation}deg) scale(1.4)`, 
                transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' 
            }}
        >
            <MapContainer 
                // CRITICAL FIX: Adding key={currentHoleIdx} forces the Map to completely unmount and remount 
                // when switching holes. This prevents the "Shake" effect caused by CSS rotation conflicts 
                // with Leaflet's internal positioning system during major view transitions.
                key={currentHoleIdx}
                center={[hole.tee.lat, hole.tee.lng]} 
                zoom={18} 
                className="h-full w-full bg-black" 
                zoomControl={false}
                attributionControl={false}
                dragging={false} 
                doubleClickZoom={false}
            >
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
              
              <RotatedMapHandler rotation={mapRotation} />
              
              <MapInitializer 
                center={currentBallPos} 
                isReplay={isReplay} 
                pointsToFit={replayPoints} 
              />
              
              <MapEvents onMapClick={handleMapClick} onMapLongPress={handleManualDrop} />

              <Marker position={[hole.green.lat, hole.green.lng]} icon={flagIcon} />
              
              {holeShots.map((s, i) => {
                  const curvePoints = MathUtils.getArcPoints(s.from, s.to);
                  const startIcon = s.shotNumber === 1 ? startMarkerIcon : ballIcon;

                  return (
                    <React.Fragment key={i}>
                        <Marker position={[s.from.lat, s.from.lng]} icon={startIcon} />
                        
                        {/* Shadow: Straight line on the ground */}
                        <Polyline 
                          positions={[[s.from.lat, s.from.lng], [s.to.lat, s.to.lng]]} 
                          color="black" 
                          weight={4} 
                          opacity={0.3} 
                        />
                        
                        {/* Flight: Curved line */}
                        <Polyline 
                          positions={curvePoints.map(p => [p.lat, p.lng])} 
                          color="white" 
                          weight={2} 
                          opacity={0.8} 
                        />
                        
                        {isReplay ? (
                            <Marker 
                              position={[s.to.lat, s.to.lng]} 
                              // Pass the NEGATIVE of map rotation to counter-rotate the text
                              icon={createReplayLabelIcon(`${s.clubUsed} - ${MathUtils.formatDistance(s.distance, useYards)}`, -mapRotation)} 
                            />
                        ) : (
                            <Marker position={[s.to.lat, s.to.lng]} icon={targetIcon} />
                        )}
                    </React.Fragment>
                  );
              })}

              {!isReplay && (
                  <>
                      {/* Use appropriate icon for current position based on shot number */}
                      <Marker position={[currentBallPos.lat, currentBallPos.lng]} icon={shotNum === 1 ? startMarkerIcon : ballIcon} />
                      
                      {/* Shadow for planned shot */}
                      <Polyline 
                          positions={[[currentBallPos.lat, currentBallPos.lng], [predictedLanding.lat, predictedLanding.lng]]} 
                          color="black" weight={4} opacity={0.2} 
                      />
                      
                      {/* Arc for planned shot */}
                      <Polyline 
                          positions={MathUtils.getArcPoints(currentBallPos, predictedLanding).map(p => [p.lat, p.lng])} 
                          color="#3b82f6" weight={3} 
                      />

                      {/* Line to Green (Ground) */}
                      <Polyline 
                          positions={[[predictedLanding.lat, predictedLanding.lng], [hole.green.lat, hole.green.lng]]} 
                          color="#fbbf24" weight={2} dashArray="4,4"
                      />

                      <Polygon positions={ellipsePoints} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2, weight: 1 }} />
                      <Marker position={[predictedLanding.lat, predictedLanding.lng]} icon={targetIcon} />
                  </>
              )}
            </MapContainer>
        </div>
      </div>

      {/* Bottom Controls */}
      {!isReplay ? (
        <div className="bg-gray-900 border-t border-gray-800 p-4 pb-8 space-y-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10">
            <div className="flex items-center justify-between">
                <div className="text-gray-400 text-xs uppercase font-bold tracking-wider flex items-center gap-2">
                   Shot {shotNum}
                   {shotNum === 1 && (
                     <button onClick={setTeeToGPS} className="text-blue-500 bg-blue-900/30 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 border border-blue-900">
                       <RefreshCw size={10} /> Set GPS
                     </button>
                   )}
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-blue-400 text-xs">Carry: </span>
                        <span className="text-white font-bold text-sm">{MathUtils.formatDistance(playsLike, useYards)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-500 text-xs">Leave: </span>
                        <span className="text-white font-bold text-sm">{MathUtils.formatDistance(distLandingToGreen, useYards)}</span>
                    </div>
                </div>
            </div>
            
            <ClubSelector 
                clubs={DEFAULT_BAG} 
                selectedClub={selectedClub} 
                onSelect={setSelectedClub} 
                useYards={useYards}
            />

            <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-500 w-8">AIM</span>
                <input 
                    type="range" min="-45" max="45" value={aimAngle} onChange={(e) => setAimAngle(parseInt(e.target.value))}
                    className="flex-1 accent-green-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs font-bold text-white w-8 text-right">{aimAngle}°</span>
            </div>

            <button 
                onClick={initiateGPSShot}
                className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
            >
                <Navigation size={18} /> Record Shot (GPS)
            </button>
            <div className="text-[10px] text-gray-600 text-center">Long press map for manual drop</div>
        </div>
      ) : (
        /* Replay Mode Navigation Bar */
        <div className="bg-gray-900 border-t border-gray-800 p-4 pb-8 z-10 flex items-center justify-between">
           <button 
             onClick={() => currentHoleIdx > 0 && loadHole(currentHoleIdx - 1)}
             disabled={currentHoleIdx === 0}
             className={`p-3 rounded-xl flex items-center gap-2 font-bold ${currentHoleIdx === 0 ? 'text-gray-600 bg-gray-800' : 'text-white bg-gray-800 hover:bg-gray-700'}`}
           >
             <ArrowLeft size={20} /> Prev Hole
           </button>
           
           <span className="text-gray-400 text-sm font-bold">REPLAY MODE</span>

           <button 
             onClick={() => currentHoleIdx < DUVENHOF_HOLES.length - 1 && loadHole(currentHoleIdx + 1)}
             disabled={currentHoleIdx === DUVENHOF_HOLES.length - 1}
             className={`p-3 rounded-xl flex items-center gap-2 font-bold ${currentHoleIdx === DUVENHOF_HOLES.length - 1 ? 'text-gray-600 bg-gray-800' : 'text-white bg-green-600 hover:bg-green-500'}`}
           >
             Next Hole <ArrowRight size={20} />
           </button>
        </div>
      )}

      {/* Modals */}
      {showHoleSelect && (
        <HoleSelectorModal 
           holes={DUVENHOF_HOLES} 
           currentIdx={currentHoleIdx} 
           onSelect={loadHole} 
           onClose={() => setShowHoleSelect(false)} 
        />
      )}

      {showScoreModal && (
        <ScoreModal 
           par={hole.par} 
           holeNum={hole.number} 
           onSave={saveHoleScore} 
           onClose={() => setShowScoreModal(false)} 
        />
      )}
      
      {showFullCard && (
        <FullScorecardModal
          holes={DUVENHOF_HOLES}
          scorecard={scorecard}
          onFinishRound={finishRound}
          onClose={() => setShowFullCard(false)}
        />
      )}

      {pendingShot && (
        <ShotConfirmModal 
           dist={MathUtils.formatDistance(pendingShot.dist, useYards)}
           club={selectedClub}
           clubs={DEFAULT_BAG}
           isGPS={pendingShot.isGPS}
           isLongDistWarning={pendingShot.dist > 500}
           onChangeClub={setSelectedClub}
           onConfirm={confirmShot}
           onCancel={() => setPendingShot(null)}
        />
      )}
    </div>
  );
};

export default PlayRound;