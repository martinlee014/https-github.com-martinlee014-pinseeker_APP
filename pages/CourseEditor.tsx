import { useState, useEffect, useContext, Fragment, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { AppContext } from '../App';
import { StorageService } from '../services/storage';
import { OsmService, DiscoveredCourse } from '../services/osmService';
import * as MathUtils from '../services/mathUtils';
import { GolfCourse, GolfHole } from '../types';
import { ChevronLeft, Save, MapPin, Search, Loader2, ArrowLeft, ArrowRight, Check, X, Edit3, Home, Globe, Navigation, Languages, Compass } from 'lucide-react';
import { ModalOverlay } from '../components/Modals';

// --- Icons Configuration ---
const flagIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const startIcon = new L.DivIcon({
  className: 'custom-start-icon',
  html: `<div style="width: 16px; height: 16px; background-color: #ffffff; border-radius: 50%; border: 4px solid #111827; box-shadow: 0 0 10px rgba(0,0,0,0.5); cursor: move;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const miniTeeIcon = new L.DivIcon({
  className: 'mini-tee-icon',
  html: `<div style="width: 10px; height: 10px; background-color: #9ca3af; border-radius: 50%; border: 2px solid #374151;"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5]
});

const miniGreenIcon = new L.DivIcon({
  className: 'mini-green-icon',
  html: `<div style="width: 10px; height: 10px; background-color: #ef4444; border-radius: 50%; border: 2px solid #7f1d1d;"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5]
});

const createHoleLabel = (text: string, isActive: boolean) => new L.DivIcon({
  className: 'bg-transparent',
  html: `
    <div style="display: flex; justify-content: center; align-items: center; width: 120px; transform: translateX(-50%);">
        <div style="
            background-color: ${isActive ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)'}; 
            color: ${isActive ? '#4ade80' : '#d1d5db'}; 
            font-size: ${isActive ? '11px' : '9px'}; 
            font-weight: bold; 
            padding: 2px 6px; 
            border-radius: 4px; 
            border: 1px solid ${isActive ? '#4ade80' : 'rgba(255,255,255,0.2)'};
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
            ${text}
        </div>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 10] 
});

const createDirectionArrow = (rotation: number, isActive: boolean) => new L.DivIcon({
  className: 'bg-transparent',
  html: `
    <div style="
      transform: rotate(${rotation}deg); 
      width: 0; 
      height: 0; 
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 12px solid ${isActive ? '#ffffff' : '#fbbf24'};
      filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.5));
      opacity: 0.9;
    "></div>
  `,
  iconSize: [12, 12],
  iconAnchor: [6, 6] 
});

const EditorMapEvents = ({ mode, onSetPoint }: { mode: 'tee' | 'green' | null, onSetPoint: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            if (mode) {
                onSetPoint(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
};

const MapUpdater = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, 18, { animate: true }); 
    }, [center, map]);
    return null;
};

// Expanded Comprehensive Country List
const COUNTRIES = [
    { code: '', name: 'Global Search' },
    { code: 'CN', name: 'China 🇨🇳' },
    { code: 'IE', name: 'Ireland 🇮🇪' },
    { code: 'GB', name: 'UK 🇬🇧' },
    { code: 'US', name: 'USA 🇺🇸' },
    { code: 'ES', name: 'Spain 🇪🇸' },
    { code: 'PT', name: 'Portugal 🇵🇹' },
    { code: 'AE', name: 'UAE 🇦🇪' },
    { code: 'TH', name: 'Thailand 🇹🇭' },
    { code: 'JP', name: 'Japan 🇯🇵' },
    { code: 'KR', name: 'Korea 🇰🇷' },
    { code: 'AU', name: 'Australia 🇦🇺' },
    { code: 'DE', name: 'Germany 🇩🇪' },
    { code: 'FR', name: 'France 🇫🇷' },
    { code: 'ZA', name: 'South Africa 🇿🇦' },
    { code: 'CA', name: 'Canada 🇨🇦' }
];

const CourseEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { useYards } = useContext(AppContext);
  const existingCourse = location.state?.course as GolfCourse | undefined;

  const [step, setStep] = useState<'info' | 'map'>('info');
  const [courseName, setCourseName] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [discoveredCourses, setDiscoveredCourses] = useState<DiscoveredCourse[]>([]);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [isMapTransitioning, setIsMapTransitioning] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  
  const [holes, setHoles] = useState<GolfHole[]>(
      Array.from({ length: 18 }, (_, i) => ({
          number: i + 1,
          par: 4,
          tee: { lat: 0, lng: 0 },
          green: { lat: 0, lng: 0 }
      }))
  );

  const [currentHoleIdx, setCurrentHoleIdx] = useState(0);
  const [editMode, setEditMode] = useState<'tee' | 'green' | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.253031, 6.610690]); 

  useEffect(() => {
    if (!existingCourse && navigator.geolocation) {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const myLat = pos.coords.latitude;
            const myLng = pos.coords.longitude;
            setMapCenter([myLat, myLng]);
            setIsLocating(false);
            try {
                // Calling discoverCourses with lat and lng
                const nearby = await OsmService.discoverCourses({ lat: myLat, lng: myLng });
                setDiscoveredCourses(nearby);
            } catch (e) {
                console.error("Discovery failed", e);
            }
        }, () => setIsLocating(false), { timeout: 8000 });
    }
  }, [existingCourse]);

  useEffect(() => {
    if (existingCourse) {
        setExistingId(existingCourse.id);
        setCourseName(existingCourse.name);
        setHoles(existingCourse.holes);
        const firstPoint = existingCourse.holes.find(h => h.tee.lat !== 0);
        if (firstPoint) setMapCenter([firstPoint.tee.lat, firstPoint.tee.lng]);
    }
  }, [existingCourse]);

  const handleSearch = async () => {
      if (!courseName.trim()) return;
      setIsSearching(true);
      try {
          const results = await OsmService.discoverCourses({ name: courseName, countryCode });
          setDiscoveredCourses(results);
          if (results.length === 0) alert("No matching courses found in selected country.");
      } catch (e) {
          alert("Search timed out or failed. Check your connection.");
      } finally {
          setIsSearching(false);
      }
  };

  const selectDiscovered = async (c: DiscoveredCourse) => {
      setIsMapTransitioning(true);
      setCourseName(c.name);
      setMapCenter([c.lat, c.lng]);
      
      // Artificial short delay to allow UI to transition
      setTimeout(async () => {
          setStep('map');
          
          setIsAutoFilling(true);
          try {
              const foundHoles = await OsmService.fetchFullCourseMap(c.lat, c.lng);
              const holesWithData = foundHoles.filter(h => h.tee.lat !== 0 || h.green.lat !== 0).length;
              if (holesWithData > 0) {
                  setHoles(foundHoles);
                  const firstValid = foundHoles.find(h => h.tee.lat !== 0);
                  if (firstValid) setMapCenter([firstValid.tee.lat, firstValid.tee.lng]);
              }
          } catch (e) {
              console.warn("Background satellite fill failed, continuing manually.");
          } finally {
              setIsAutoFilling(false);
              setIsMapTransitioning(false);
          }
      }, 500);
  };

  const handleAutoFill = async () => {
      if (isAutoFilling) return;
      setIsAutoFilling(true);
      try {
          const foundHoles = await OsmService.fetchFullCourseMap(mapCenter[0], mapCenter[1]);
          const holesWithData = foundHoles.filter(h => h.tee.lat !== 0 || h.green.lat !== 0).length;
          
          if (holesWithData === 0) {
              alert("No satellite data found for this location.");
          } else {
              if (window.confirm(`Satellite found ${holesWithData} positions! Apply them to your map?`)) {
                  setHoles(foundHoles);
                  const firstValid = foundHoles.find(h => h.tee.lat !== 0);
                  if (firstValid) setMapCenter([firstValid.tee.lat, firstValid.tee.lng]);
              }
          }
      } catch (e) {
          alert("Satellite service is temporarily busy. Try again in 10s.");
      } finally {
          setIsAutoFilling(false);
      }
  };

  const onPreSave = () => setShowSummary(true);

  const handleFinalSave = () => {
    const newCourse: GolfCourse = {
        id: existingId || crypto.randomUUID(),
        name: courseName || "Unnamed Course",
        holes: holes,
        isCustom: true,
        createdAt: existingCourse?.createdAt || new Date().toLocaleDateString()
    };
    StorageService.saveCustomCourse(newCourse);
    setShowSummary(false);
    navigate('/settings/courses');
  };

  const handleDraftSave = () => {
      const newCourse: GolfCourse = {
        id: existingId || crypto.randomUUID(),
        name: courseName || "Draft Course",
        holes: holes,
        isCustom: true,
        createdAt: existingCourse?.createdAt || new Date().toLocaleDateString()
    };
    StorageService.saveCustomCourse(newCourse);
    setExistingId(newCourse.id);
    alert("Draft saved!");
  };

  const updateHolePoint = (lat: number, lng: number) => {
      const newHoles = [...holes];
      if (editMode === 'tee') newHoles[currentHoleIdx].tee = { lat, lng };
      else if (editMode === 'green') newHoles[currentHoleIdx].green = { lat, lng };
      setHoles(newHoles);
      setEditMode(null); 
  };

  const handleMarkerDragEnd = (e: any, type: 'tee' | 'green', holeIdx: number) => {
      const newPos = e.target.getLatLng();
      const newHoles = [...holes];
      if (type === 'tee') newHoles[holeIdx].tee = { lat: newPos.lat, lng: newPos.lng };
      else newHoles[holeIdx].green = { lat: newPos.lat, lng: newPos.lng };
      setHoles(newHoles);
  };

  const updatePar = (delta: number) => {
      const newHoles = [...holes];
      newHoles[currentHoleIdx].par = Math.min(6, Math.max(3, newHoles[currentHoleIdx].par + delta));
      setHoles(newHoles);
  };

  const currentHole = holes[currentHoleIdx];
  const hasTee = currentHole.tee.lat !== 0;
  const hasGreen = currentHole.green.lat !== 0;

  const summaryStats = useMemo(() => {
    let totalDist = 0, totalPar = 0;
    const holeStats = holes.map(h => {
        let d = 0;
        if (h.tee.lat !== 0 && h.green.lat !== 0) d = MathUtils.calculateDistance(h.tee, h.green);
        if (d > 0) { totalDist += d; totalPar += h.par; }
        return { ...h, dist: d };
    });
    return { holeStats, totalDist, totalPar };
  }, [holes]);

  const transitionOverlay = isMapTransitioning && (
    <div className="fixed inset-0 z-[5000] bg-black/90 flex flex-col items-center justify-center p-8 backdrop-blur-md">
        <div className="relative mb-6">
          <Loader2 size={64} className="text-blue-500 animate-spin" />
          <Globe size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
        </div>
        <h2 className="text-xl font-black text-white tracking-widest uppercase mb-2">Analyzing Terrain</h2>
        <p className="text-gray-400 text-sm text-center">Syncing with high-res satellite database for {courseName}...</p>
    </div>
  );

  if (step === 'info') {
      return (
          <div className="p-6 bg-gray-900 min-h-screen text-white flex flex-col pb-24">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/settings/courses')} className="p-2 bg-gray-800 rounded-lg"><ChevronLeft /></button>
                <button onClick={() => navigate('/dashboard')} className="p-2 bg-gray-800 rounded-lg"><Home size={20}/></button>
                <h1 className="text-2xl font-bold">{existingId ? 'Edit Course' : 'Discovery'}</h1>
              </div>
              
              <div className="space-y-4">
                  <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Search Database</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    className="w-full bg-gray-800 border border-gray-700 p-4 rounded-xl text-white focus:border-green-500 outline-none pr-12 text-sm" 
                                    placeholder="Enter Course Name..." 
                                    value={courseName} 
                                    onChange={e => setCourseName(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
                                />
                                <button onClick={handleSearch} disabled={isSearching} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white">
                                    {isSearching ? <Loader2 className="animate-spin" size={20}/> : <Search size={20} />}
                                </button>
                            </div>
                        </div>
                        <div className="w-32">
                            <label className="block text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Country</label>
                            <select 
                                value={countryCode} 
                                onChange={(e) => setCountryCode(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-blue-500 appearance-none text-xs font-bold"
                            >
                                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                            </select>
                        </div>
                      </div>
                  </div>

                  <div className="pt-4 flex-1">
                      <div className="flex items-center justify-between mb-3 px-1">
                          <h3 className="text-gray-500 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                              {isLocating ? <Loader2 size={12} className="animate-spin text-blue-500" /> : <Navigation size={12} className="text-blue-500"/>} 
                              {isLocating ? 'SCANNING NEARBY...' : 'SUGGESTED COURSES'}
                          </h3>
                          {!isLocating && <button onClick={() => window.location.reload()} className="text-[10px] text-blue-400 font-bold hover:underline">RE-SCAN</button>}
                      </div>
                      
                      <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                          {discoveredCourses.length === 0 && !isLocating && !isSearching && (
                              <div className="text-center py-12 bg-gray-800/20 rounded-2xl border border-dashed border-gray-800">
                                  <Globe size={40} className="mx-auto text-gray-700 mb-3" />
                                  <p className="text-sm text-gray-500 font-medium px-10 leading-relaxed">Type above or let GPS find your local course.</p>
                              </div>
                          )}
                          {discoveredCourses.map(c => (
                              <button 
                                key={c.id} 
                                onClick={() => selectDiscovered(c)}
                                className="w-full bg-gray-800/40 hover:bg-gray-800 border border-gray-700/50 p-4 rounded-xl text-left flex items-center justify-between group transition-all"
                              >
                                  <div className="flex-1 min-w-0 pr-4">
                                      <div className="font-bold text-sm text-white truncate">{c.name}</div>
                                      <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-2">
                                          <span className="bg-gray-900 px-1.5 py-0.5 rounded border border-gray-700 text-blue-400">{c.city || "Course"}</span>
                                          {c.country && <span className="text-gray-600">[{c.country}]</span>}
                                      </div>
                                  </div>
                                  <div className="bg-blue-600/10 p-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white text-blue-500 transition-all">
                                      <Navigation size={16} />
                                  </div>
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
              
              <div className="mt-auto pt-4">
                  <button onClick={() => setStep('map')} className="w-full bg-gray-800 border border-gray-700 text-gray-400 font-bold py-4 rounded-xl text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                      <Edit3 size={16}/> Skip to Manual Mapping
                  </button>
              </div>
              {transitionOverlay}
          </div>
      );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 relative overflow-hidden">
        {/* Dynamic Status Bar for Map View */}
        {isAutoFilling && (
            <div className="absolute top-0 left-0 right-0 z-[2000] bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] py-1.5 text-center flex items-center justify-center gap-2 shadow-lg">
                <Loader2 size={12} className="animate-spin" /> 
                Parsing Satellite Landmarks...
            </div>
        )}

        <div className="flex-1 relative bg-black z-0">
            <MapContainer center={mapCenter} zoom={18} className="h-full w-full" zoomControl={false} maxZoom={22}>
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxNativeZoom={19} maxZoom={22} />
                <MapUpdater center={mapCenter} />
                <EditorMapEvents mode={editMode} onSetPoint={updateHolePoint} />
                {holes.map((hole, idx) => {
                    const isTeeSet = hole.tee.lat !== 0, isGreenSet = hole.green.lat !== 0, isActive = idx === currentHoleIdx;
                    if (!isTeeSet && !isGreenSet) return null;
                    let bearing = 0, midPoint: any = null, dist = 0;
                    if (isTeeSet && isGreenSet) {
                         bearing = MathUtils.calculateBearing(hole.tee, hole.green);
                         dist = MathUtils.calculateDistance(hole.tee, hole.green);
                         midPoint = [(hole.tee.lat + hole.green.lat) / 2, (hole.tee.lng + hole.green.lng) / 2];
                    }
                    return (
                        <Fragment key={hole.number}>
                            {isTeeSet && isGreenSet && <Polyline positions={[[hole.tee.lat, hole.tee.lng], [hole.green.lat, hole.green.lng]]} pathOptions={{ color: isActive ? '#ffffff' : '#fbbf24', weight: isActive ? 3 : 2, dashArray: isActive ? '5,5' : undefined, opacity: isActive ? 0.9 : 0.6 }} />}
                            {isTeeSet && isGreenSet && <Marker position={MathUtils.calculateDestination(hole.tee, dist * 0.8, bearing)} icon={createDirectionArrow(bearing, isActive)} interactive={false} />}
                            {midPoint && <Marker position={midPoint} icon={createHoleLabel(`#${hole.number} P${hole.par} ${MathUtils.formatDistance(dist, useYards)}`, isActive)} interactive={false} />}
                            {isTeeSet && <Marker position={[hole.tee.lat, hole.tee.lng]} icon={isActive ? startIcon : miniTeeIcon} zIndexOffset={isActive ? 1000 : 0} draggable={isActive} eventHandlers={{ dragend: (e) => handleMarkerDragEnd(e, 'tee', idx) }} />}
                            {isGreenSet && <Marker position={[hole.green.lat, hole.green.lng]} icon={isActive ? flagIcon : miniGreenIcon} zIndexOffset={isActive ? 1000 : 0} draggable={isActive} eventHandlers={{ dragend: (e) => handleMarkerDragEnd(e, 'green', idx) }} />}
                        </Fragment>
                    );
                })}
            </MapContainer>
             <div className="absolute top-10 left-4 z-[1000] flex gap-2">
                <button onClick={() => setStep('info')} className="bg-black/60 p-3 rounded-full text-white backdrop-blur-md border border-white/10 hover:bg-black/80"><ChevronLeft size={24} /></button>
                <button onClick={() => navigate('/dashboard')} className="bg-black/60 p-3 rounded-full text-white backdrop-blur-md border border-white/10 hover:bg-black/80"><Home size={24} /></button>
             </div>
             <div className="absolute top-10 right-4 z-[1000] flex flex-col gap-2 items-end">
                <button onClick={handleDraftSave} className="bg-black/60 px-4 py-2 rounded-full text-white text-xs font-bold backdrop-blur-md border border-white/10 hover:bg-black/80 flex items-center gap-2 shadow-lg"><Save size={14} /> Draft</button>
                <button onClick={handleAutoFill} disabled={isAutoFilling} className="bg-blue-600 px-4 py-2 rounded-full text-white text-xs font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50 border border-blue-400">
                    {isAutoFilling ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />} 
                    Auto-Fill
                </button>
             </div>
        </div>
        <div className="flex-none bg-gray-900 border-t border-gray-800 flex flex-col z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-800">
                 <button onClick={() => setCurrentHoleIdx(Math.max(0, currentHoleIdx - 1))} className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded-lg text-white disabled:opacity-30 hover:bg-gray-700 transition-colors" disabled={currentHoleIdx===0}><ArrowLeft size={16} /></button>
                 <div className="flex flex-col items-center">
                     <span className="text-sm font-black text-white tracking-widest uppercase">Hole {currentHole.number}</span>
                     <div className="flex items-center gap-2 mt-0.5"><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">PAR</span><div className="flex items-center bg-gray-950 rounded border border-gray-700/50 overflow-hidden"><button onClick={() => updatePar(-1)} className="px-2 py-0.5 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">-</button><span className={`text-xs font-bold w-5 text-center ${currentHole.par === 3 ? 'text-blue-400' : currentHole.par === 5 ? 'text-yellow-400' : 'text-white'}`}>{currentHole.par}</span><button onClick={() => updatePar(1)} className="px-2 py-0.5 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">+</button></div></div>
                 </div>
                 <button onClick={() => setCurrentHoleIdx(Math.min(17, currentHoleIdx + 1))} className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded-lg text-white disabled:opacity-30 hover:bg-gray-700 transition-colors" disabled={currentHoleIdx===17}><ArrowRight size={16} /></button>
            </div>
            <div className="p-2 grid grid-cols-2 gap-2">
                <div className={`rounded-xl border px-3 py-2 flex flex-col gap-1 transition-colors ${hasTee ? 'border-green-500/30 bg-green-900/10' : 'border-gray-700 bg-gray-800/30'}`}>
                    <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tee Box</span>{hasTee && <Check size={12} className="text-green-500" />}</div>
                    <div className="flex gap-2"><button onClick={() => setEditMode('tee')} className={`flex-1 py-2 rounded-lg text-xs font-bold flex justify-center items-center gap-1.5 transition-all ${editMode === 'tee' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 border border-gray-700'}`}><MapPin size={12} /> Set Position</button></div>
                </div>
                <div className={`rounded-xl border px-3 py-2 flex flex-col gap-1 transition-colors ${hasGreen ? 'border-green-500/30 bg-green-900/10' : 'border-gray-700 bg-gray-800/30'}`}>
                    <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Green</span>{hasGreen && <Check size={12} className="text-green-500" />}</div>
                     <div className="flex gap-2"><button onClick={() => setEditMode('green')} className={`flex-1 py-2 rounded-lg text-xs font-bold flex justify-center items-center gap-1.5 transition-all ${editMode === 'green' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 border border-gray-700'}`}><MapPin size={12} /> Set Position</button></div>
                </div>
            </div>
            <div className="px-2 pb-2"><button onClick={onPreSave} className="w-full bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg uppercase tracking-widest font-black">REVIEW & SAVE COURSE</button></div>
        </div>
        {showSummary && (
            <ModalOverlay onClose={() => setShowSummary(false)}>
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900 shrink-0"><h3 className="text-lg font-bold text-white flex items-center gap-2"><Edit3 size={18} className="text-blue-500"/> Confirm Course Data</h3><button type="button" onClick={() => setShowSummary(false)}><X className="text-gray-400" /></button></div>
                <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
                    <table className="w-full text-sm text-left text-gray-400 mb-4">
                         <thead className="text-xs text-gray-500 uppercase bg-gray-800"><tr><th className="px-2 py-2 rounded-l-lg">Hole</th><th className="px-2 py-2">Dist</th><th className="px-2 py-2 text-center rounded-r-lg">Par</th></tr></thead>
                        <tbody>
                            {summaryStats.holeStats.map((h, i) => (
                                <tr key={i} className={`border-b border-gray-800 ${h.dist === 0 ? 'opacity-30' : ''}`}><td className="px-2 py-3 font-medium text-white">#{h.number}</td><td className="px-2 py-3">{h.dist > 0 ? MathUtils.formatDistance(h.dist, useYards) : '-'}</td><td className="px-2 py-3 text-center"><div className="flex items-center justify-center gap-2"><button className="w-6 h-6 bg-gray-800 rounded text-gray-400 hover:bg-gray-700" onClick={() => { const newHoles = [...holes]; newHoles[i].par = Math.max(3, newHoles[i].par - 1); setHoles(newHoles); }}>-</button><span className={`w-4 font-bold ${h.par === 3 ? 'text-blue-400' : h.par === 5 ? 'text-yellow-400' : 'text-white'}`}>{h.par}</span><button className="w-6 h-6 bg-gray-800 rounded text-gray-400 hover:bg-gray-700" onClick={() => { const newHoles = [...holes]; newHoles[i].par = Math.min(6, newHoles[i].par + 1); setHoles(newHoles); }}>+</button></div></td></tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="bg-gray-800 rounded-xl p-4 flex justify-between items-center mb-2"><div className="text-center"><div className="text-xs text-gray-500 uppercase">Total Dist</div><div className="text-lg font-black text-white">{MathUtils.formatDistance(summaryStats.totalDist, useYards)}</div></div><div className="text-center"><div className="text-xs text-gray-500 uppercase">Total Par</div><div className="text-lg font-black text-green-400">{summaryStats.totalPar}</div></div></div>
                </div>
                <div className="p-4 border-t border-gray-800 shrink-0 bg-gray-900 flex gap-3"><button onClick={() => setShowSummary(false)} className="flex-1 bg-gray-800 text-gray-300 font-bold py-3 rounded-xl border border-gray-700">Edit More</button><button onClick={handleFinalSave} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg">Save Course</button></div>
            </ModalOverlay>
        )}
        {transitionOverlay}
    </div>
  );
};

export default CourseEditor;
