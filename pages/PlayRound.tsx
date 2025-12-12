import { useState, useEffect, useContext, useMemo, useRef, Fragment } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Polygon, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { AppContext } from '../App';
import { DUVENHOF_HOLES } from '../constants';
import { StorageService } from '../services/storage';
import * as MathUtils from '../services/mathUtils';
import { ClubStats, HoleScore, ShotRecord, RoundHistory, LatLng } from '../types';
import ClubSelector from '../components/ClubSelector';
import { ScoreModal, ShotConfirmModal, HoleSelectorModal, FullScorecardModal } from '../components/Modals';
import { Flag, Navigation, Wind, ChevronLeft, Grid, RefreshCw, ListChecks, ArrowLeft, ArrowRight, BrainCircuit, Target, ArrowDownToLine } from 'lucide-react';

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
  iconSize: [0, 0], 
  iconAnchor: [0, 0] 
});

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

const MapInitializer = ({ center, isReplay, pointsToFit }: { center: LatLng, isReplay: boolean, pointsToFit?: LatLng[] }) => {
    const map = useMap();
    
    useEffect(() => {
        if (isReplay && pointsToFit && pointsToFit.length > 0) {
            let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
            pointsToFit.forEach(p => {
                if (p.lat < minLat) minLat = p.lat;
                if (p.lat > maxLat) maxLat = p.lat;
                if (p.lng < minLng) minLng = p.lng;
                if (p.lng > maxLng) maxLng = p.lng;
            });
            
            const bounds = L.latLngBounds(
                L.latLng(minLat, minLng),
                L.latLng(maxLat, maxLng)
            );
            
            map.fitBounds(bounds, { padding: [50, 50], animate: false });
        } else {
            map.setView([center.lat, center.lng], 18, { animate: false });
        }
    }, [center, isReplay, map, pointsToFit]);
    return null;
}

const MapEvents = ({ onMapClick, onMapLongPress }: any) => {
  useMapEvents({
    click: (e) => onMapClick(e.latlng),
    contextmenu: (e) => onMapLongPress(e.latlng)
  });
  return null;
};

const PlayRound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, useYards, bag } = useContext(AppContext);

  const replayRound = location.state?.round as RoundHistory | undefined;
  const initialHoleIdx = location.state?.initialHoleIndex || 0;
  const isReplay = !!replayRound;

  const [currentHoleIdx, setCurrentHoleIdx] = useState(initialHoleIdx);
  const [shots, setShots] = useState<ShotRecord[]>([]);
  const [scorecard, setScorecard] = useState<HoleScore[]>([]);
  
  const [currentBallPos, setCurrentBallPos] = useState<LatLng>(DUVENHOF_HOLES[initialHoleIdx]?.tee || { lat: 0, lng: 0 });
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

  const hole = DUVENHOF_HOLES[currentHoleIdx];

  // If bag updates (e.g. from settings), ensure selected club is valid or reset
  useEffect(() => {
    if (bag.length > 0) {
      const exists = bag.find(c => c.name === selectedClub.name);
      if (!exists) setSelectedClub(bag[0]);
    }
  }, [bag]);

  useEffect(() => {
    if (isReplay && replayRound) {
      setShots(replayRound.shots);
      setScorecard(replayRound.scorecard);
      if(DUVENHOF_HOLES[initialHoleIdx]) {
        setCurrentBallPos(DUVENHOF_HOLES[initialHoleIdx].tee);
      }
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
    }
  }, []);

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

  if (!hole) return <div className="p-10 text-white">Loading Hole Data...</div>;

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

  const holeShots = useMemo(() => shots.filter(s => s.holeNumber === hole.number), [shots, hole.number]);
  const replayPoints = useMemo(() => {
      if (!isReplay) return [];
      return [hole.tee, hole.green, ...holeShots.map(s => s.to)];
  }, [isReplay, hole, holeShots]);

  // Initial club selection recommendation logic
  useEffect(() => {
    if (!isReplay && bag.length > 0) {
      const dist = distToGreen;
      // Simple logic for default selection:
      if (dist < 50) {
        setSelectedClub(bag[bag.length - 1]); 
      } else {
        const suitable = [...bag].reverse().find(c => c.carry >= dist - 10);
        setSelectedClub(suitable || bag[0]); 
      }
    }
  }, [currentBallPos, currentHoleIdx, isReplay]);

  // --- Next Shot Prediction Logic ---
  const nextClubSuggestion = useMemo(() => {
    if (distLandingToGreen < 20) return "Putter";
    
    // Sort bag ascending (Shortest -> Longest)
    const sorted = [...bag].sort((a,b) => a.carry - b.carry);
    
    // Find first club with carry >= remaining distance
    const match = sorted.find(c => c.carry >= distLandingToGreen);
    
    if (match) return match.name;
    // If distance is longer than driver, suggest Driver/Longest
    return sorted[sorted.length-1].name;
  }, [distLandingToGreen, bag]);

  const outcomeDescription = useMemo(() => {
    const d = useYards ? distLandingToGreen * 1.09361 : distLandingToGreen;
    const unit = useYards ? 'yd' : 'm';
    const val = Math.round(d);
    
    if (val < 20) return "Greenside (Chip/Putt)";
    if (val < 100) return "Wedge Range";
    if (val < 150) return "Scoring Iron";
    if (val < 200) return "Long Iron/Hybrid";
    return "Layup / Par 5";
  }, [distLandingToGreen, useYards]);


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
    if (!pendingShot) {
      console.error("No pending shot to confirm");
      return;
    }
    
    const targetHole = hole || DUVENHOF_HOLES[currentHoleIdx];
    if (!targetHole) {
      alert("Error: Hole data missing.");
      return;
    }

    try {
        const newShot: ShotRecord = {
          holeNumber: targetHole.number,
          shotNumber: shotNum,
          from: currentBallPos || targetHole.tee, // Fallback if pos is lost
          to: pendingShot.pos,
          clubUsed: selectedClub.name,
          distance: pendingShot.dist
        };
        
        setShots(prev => [...prev, newShot]);
        setCurrentBallPos(pendingShot.pos);
        setShotNum(prev => prev + 1);
        setAimAngle(0);
        setPendingShot(null); 
    } catch(err) {
        console.error("Error saving shot:", err);
        alert("Failed to save shot. See console.");
    }
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

  return (
    <div className="h-full relative bg-gray-900 flex flex-col overflow-hidden">
      {/* Main Map Area - Full Screen & Absolute */}
      <div className="absolute inset-0 z-0 bg-black w-full h-full">
        <div 
            style={{ 
                width: '100%', 
                height: '100%', 
                transform: `rotate(${mapRotation}deg) scale(1.4)`, 
                transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' 
            }}
        >
            <MapContainer 
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
                    <Fragment key={i}>
                        <Marker position={[s.from.lat, s.from.lng]} icon={startIcon} />
                        <Polyline 
                          positions={[[s.from.lat, s.from.lng], [s.to.lat, s.to.lng]]} 
                          color="black" 
                          weight={4} 
                          opacity={0.3} 
                        />
                        <Polyline 
                          positions={curvePoints.map(p => [p.lat, p.lng])} 
                          color="white" 
                          weight={2} 
                          opacity={0.8} 
                        />
                        {isReplay ? (
                            <Marker 
                              position={[s.to.lat, s.to.lng]} 
                              icon={createReplayLabelIcon(`${s.clubUsed} - ${MathUtils.formatDistance(s.distance, useYards)}`, -mapRotation)} 
                            />
                        ) : (
                            <Marker position={[s.to.lat, s.to.lng]} icon={targetIcon} />
                        )}
                    </Fragment>
                  );
              })}

              {!isReplay && (
                  <>
                      <Marker position={[currentBallPos.lat, currentBallPos.lng]} icon={shotNum === 1 ? startMarkerIcon : ballIcon} />
                      <Polyline 
                          positions={[[currentBallPos.lat, currentBallPos.lng], [predictedLanding.lat, predictedLanding.lng]]} 
                          color="black" weight={4} opacity={0.2} 
                      />
                      <Polyline 
                          positions={MathUtils.getArcPoints(currentBallPos, predictedLanding).map(p => [p.lat, p.lng])} 
                          color="#3b82f6" weight={3} 
                      />
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

      {/* Top Bar with Controls */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-3 pointer-events-none flex justify-between items-start">
        <div className="pointer-events-auto flex flex-col gap-2">
           <button onClick={() => navigate(-1)} className="bg-black/50 p-2 rounded-full text-white backdrop-blur-md border border-white/5 hover:bg-black/70 transition-colors">
             <ChevronLeft size={20} />
           </button>
           {!isReplay && (
            <>
             <button onClick={() => setShowHoleSelect(true)} className="bg-black/50 p-2 rounded-full text-white backdrop-blur-md border border-white/5 mt-1 hover:bg-black/70">
               <Grid size={20} />
             </button>
             <button onClick={() => setShowFullCard(true)} className="bg-black/50 p-2 rounded-full text-white backdrop-blur-md border border-white/5 mt-1 hover:bg-black/70">
               <ListChecks size={20} />
             </button>
            </>
           )}
        </div>

        <div className="text-center mt-1 drop-shadow-lg pointer-events-none">
          <h2 className="text-2xl font-black text-white drop-shadow-md">HOLE {hole.number}</h2>
          <div className="flex items-center justify-center gap-2 text-xs font-bold bg-black/60 rounded-full px-3 py-1 backdrop-blur-md inline-flex border border-white/10 shadow-lg">
            <span className="text-gray-300">PAR {hole.par}</span>
            <span className="text-gray-500">|</span>
            <span className="text-green-400">{MathUtils.formatDistance(distToGreen, useYards)}</span>
          </div>
        </div>

        <div className="pointer-events-auto flex flex-col gap-2">
           {!isReplay && (
              <button onClick={() => setShowScoreModal(true)} className="bg-green-600/90 p-2 rounded-full text-white shadow-lg shadow-green-900/50 backdrop-blur-md border border-white/10 hover:bg-green-500">
                  <Flag size={20} fill="white"/>
              </button>
           )}
           <button onClick={() => setShowWind(!showWind)} className={`bg-black/50 p-2 rounded-full backdrop-blur-md border border-white/5 hover:bg-black/70 ${showWind ? 'text-blue-400' : 'text-gray-400'}`}>
              <Wind size={20} />
           </button>
        </div>
      </div>

      {showWind && (
        <div className="absolute top-20 right-14 z-[1000] bg-black/80 backdrop-blur-md p-3 rounded-xl border border-gray-700 w-40 text-xs text-gray-300 shadow-xl">
            <div className="mb-1 flex justify-between"><span>Speed</span> <span>{windSpeed} m/s</span></div>
            <input type="range" min="0" max="20" value={windSpeed} onChange={(e) => setWindSpeed(parseInt(e.target.value))} className="w-full accent-blue-500 mb-2 h-1 bg-gray-600 rounded-lg appearance-none" />
            <div className="mb-1 flex justify-between"><span>Direction</span> <span>{windDir}°</span></div>
            <input type="range" min="0" max="360" value={windDir} onChange={(e) => setWindDir(parseInt(e.target.value))} className="w-full accent-blue-500 h-1 bg-gray-600 rounded-lg appearance-none" />
        </div>
      )}

      {/* Bottom Controls - Floating Glassmorphism */}
      {!isReplay ? (
        <div className="absolute bottom-0 w-full z-20 pb-8 pt-6 px-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent backdrop-blur-[2px]">
            {/* Shot Info & Aim Slider */}
            <div className="flex items-center gap-4 mb-4 bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/5 shadow-lg">
                <div className="text-gray-300 text-xs uppercase font-bold tracking-wider flex items-center gap-2 whitespace-nowrap px-2">
                   Shot {shotNum}
                   {shotNum === 1 && (
                     <button onClick={setTeeToGPS} className="text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 border border-blue-500/30 hover:bg-blue-900/50">
                       <RefreshCw size={10} /> GPS
                     </button>
                   )}
                </div>
                <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs font-bold text-gray-500">AIM</span>
                    <input 
                        type="range" min="-45" max="45" value={aimAngle} onChange={(e) => setAimAngle(parseInt(e.target.value))}
                        className="flex-1 accent-green-600 h-2 bg-gray-700/50 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs font-bold text-white w-8 text-right">{aimAngle}°</span>
                </div>
            </div>
            
            {/* Strategy & Club Selector */}
            <div className="flex gap-3 mb-4 h-36">
                {/* Revised Strategy Card: Shows Current Shot Outcome & Next Shot Recommendation */}
                <div className="flex-1 bg-gray-900/80 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex flex-col justify-between shadow-xl relative overflow-hidden">
                    <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-1">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Projected Outcome</span>
                        <BrainCircuit size={14} className="text-blue-400" />
                    </div>
                    
                    {/* Current Shot Stats */}
                    <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="flex flex-col items-start">
                            <span className="text-[9px] uppercase text-gray-500 font-bold">Total Carry</span>
                            <span className="text-base font-bold text-white leading-none mt-1">{MathUtils.formatDistance(playsLike, useYards)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] uppercase text-yellow-500 font-bold">Leaves</span>
                            <span className="text-base font-bold text-yellow-400 leading-none mt-1">{MathUtils.formatDistance(distLandingToGreen, useYards)}</span>
                        </div>
                    </div>
                    
                    {/* Next Shot Prediction Box */}
                    <div className="mt-2 bg-black/40 rounded-lg p-2 flex items-center justify-between border border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-gray-400 mb-0.5">Next Shot</span>
                            <span className="text-[10px] text-gray-300 leading-tight">{outcomeDescription}</span>
                        </div>
                        <div className="text-right pl-2 border-l border-white/10">
                            <span className="text-[9px] text-green-400 block uppercase font-bold mb-0.5">Rec. Club</span>
                            <span className="text-sm font-bold text-white">{nextClubSuggestion}</span>
                        </div>
                    </div>
                </div>

                {/* Club Selector Container */}
                <div className="w-[35%] flex flex-col">
                    <div className="flex-1 relative h-full">
                       <ClubSelector 
                            clubs={bag} 
                            selectedClub={selectedClub} 
                            onSelect={setSelectedClub} 
                            useYards={useYards}
                        />
                        {/* Custom overlay for Club Selector */}
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-green-700/80 backdrop-blur-md rounded-2xl shadow-xl border border-green-500/30">
                            <span className="text-[9px] text-green-200 uppercase font-bold tracking-widest mb-1 opacity-80">Select</span>
                            <span className="text-2xl font-black text-white leading-none tracking-tight text-center px-1">{selectedClub.name}</span>
                            <div className="h-0.5 w-8 bg-green-400/50 my-2 rounded-full"></div>
                            <span className="text-[10px] text-white font-bold">{MathUtils.formatDistance(useYards ? selectedClub.carry * 1.09361 : selectedClub.carry, useYards)}</span>
                        </div>
                         <style>{`
                            .relative select { 
                                opacity: 0; 
                                position: absolute; 
                                inset: 0; 
                                height: 100%; 
                                width: 100%; 
                                z-index: 10;
                                cursor: pointer;
                            }
                        `}</style>
                    </div>
                </div>
            </div>

            <button 
                onClick={initiateGPSShot}
                className="w-full bg-blue-600/90 hover:bg-blue-500 backdrop-blur-sm text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 border border-blue-400/20 active:scale-95 active:shadow-none"
            >
                <Navigation size={18} /> Record Shot Location (GPS)
            </button>
        </div>
      ) : (
        <div className="absolute bottom-0 w-full z-20 bg-gradient-to-t from-black via-black/90 to-transparent p-4 pb-8 flex items-center justify-between pointer-events-none">
           <button 
             onClick={() => currentHoleIdx > 0 && loadHole(currentHoleIdx - 1)}
             disabled={currentHoleIdx === 0}
             className={`pointer-events-auto p-3 rounded-xl flex items-center gap-2 font-bold backdrop-blur-md border border-white/10 shadow-lg ${currentHoleIdx === 0 ? 'text-gray-500 bg-gray-900/50' : 'text-white bg-gray-800/80 hover:bg-gray-700/80'}`}
           >
             <ArrowLeft size={20} /> Prev
           </button>
           
           <span className="text-gray-400 text-xs font-bold bg-black/80 px-4 py-1.5 rounded-full backdrop-blur-sm border border-gray-800 uppercase tracking-widest shadow-xl">Replay Mode</span>

           <button 
             onClick={() => currentHoleIdx < DUVENHOF_HOLES.length - 1 && loadHole(currentHoleIdx + 1)}
             disabled={currentHoleIdx === DUVENHOF_HOLES.length - 1}
             className={`pointer-events-auto p-3 rounded-xl flex items-center gap-2 font-bold backdrop-blur-md border border-white/10 shadow-lg ${currentHoleIdx === DUVENHOF_HOLES.length - 1 ? 'text-gray-500 bg-gray-900/50' : 'text-white bg-green-600/90 hover:bg-green-500/90'}`}
           >
             Next <ArrowRight size={20} />
           </button>
        </div>
      )}

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
           clubs={bag}
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