import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { StorageService } from '../services/storage';
import { OsmService, DiscoveredCourse } from '../services/osmService';
import { ChevronLeft, Search, Globe, MapPin, Check, Loader2, Navigation, Trash2, Play, Plus, Flag } from 'lucide-react';

const COUNTRIES = [
  { code: '', name: 'Global Search', flag: '🌍' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' }, // Added Germany
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'GB', name: 'UK', flag: '🇬🇧' },
  { code: 'US', name: 'USA', flag: '🇺🇸' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'Korea', flag: '🇰🇷' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' }
];

const CourseDiscovery = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [courses, setCourses] = useState<DiscoveredCourse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  useEffect(() => {
    handleLocate();
  }, []);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const nearby = await OsmService.discoverCourses({ 
          lat: pos.coords.latitude, 
          lng: pos.coords.longitude 
        });
        setCourses(nearby);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLocating(false);
      }
    }, () => setIsLocating(false));
  };

  const performSearch = async () => {
    if (!searchTerm && !selectedCountry) return;
    setIsSearching(true);
    try {
      const results = await OsmService.discoverCourses({
        name: searchTerm,
        countryCode: selectedCountry
      });
      setCourses(results);
    } catch (e) {
      alert("Search failed. Try a more specific name.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleImportAndPlay = async (course: DiscoveredCourse) => {
    setImportingId(course.id);
    try {
      const holeData = await OsmService.fetchFullCourseMap(course.lat, course.lng);
      const newCourse = {
        id: `osm_${course.id}`,
        name: course.name,
        holes: holeData,
        isCustom: true,
        createdAt: new Date().toLocaleDateString()
      };
      StorageService.saveCustomCourse(newCourse);
      navigate('/play', { state: { course: newCourse } });
    } catch (e) {
      alert("Course detail parsing failed. Please try manual editor.");
      navigate('/settings/courses/edit', { state: { courseName: course.name, lat: course.lat, lng: course.lng } });
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white pb-24">
      <div className="p-6 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
            <ChevronLeft />
          </button>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Globe className="text-blue-500" size={24} /> DISCOVERY
          </h1>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input 
                type="text" 
                className="w-full bg-black border border-gray-700 p-4 rounded-xl outline-none focus:border-blue-500 pr-12 text-sm"
                placeholder="Course Name (e.g. Mission Hills)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && performSearch()}
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            </div>
            <select 
              className="bg-black border border-gray-700 px-3 rounded-xl outline-none focus:border-blue-500 text-xs font-bold w-32"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.code || 'All'}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={performSearch}
            disabled={isSearching}
            className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
          >
            {isSearching ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
            Deep Scan Courses
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-gray-500 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
            {isLocating ? <Loader2 size={12} className="animate-spin text-blue-500" /> : <Navigation size={12} className="text-blue-500"/>}
            Search Results
          </h3>
          <button onClick={handleLocate} className="text-[10px] text-blue-400 font-bold">Refresh GPS</button>
        </div>

        {courses.length === 0 && !isSearching && !isLocating && (
          <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-dashed border-gray-800">
            <Globe size={48} className="mx-auto mb-4 text-gray-800" />
            <p className="text-sm font-bold uppercase tracking-widest text-gray-600">Start discovery by name</p>
          </div>
        )}

        {courses.map(course => (
          <div key={course.id} className="bg-gray-900/80 border border-gray-800 p-4 rounded-2xl flex items-center justify-between hover:border-blue-500/50 transition-all group">
            <div className="flex-1 min-w-0 mr-4">
              <div className="font-bold text-white truncate text-base">{course.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400 border border-gray-700 uppercase font-black">
                  {course.city || "Course"}
                </span>
                {course.country && <span className="text-[10px] text-gray-600 font-bold">{course.country}</span>}
              </div>
            </div>
            
            <button 
              onClick={() => handleImportAndPlay(course)}
              disabled={importingId !== null}
              className="bg-blue-600/10 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 group-active:scale-95"
            >
              {importingId === course.id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
              {importingId === course.id ? 'Syncing' : 'Import'}
            </button>
          </div>
        ))}
      </div>

      {importingId && (
        <div className="fixed inset-0 z-[5000] bg-black/90 flex flex-col items-center justify-center p-8 backdrop-blur-md">
            <div className="relative mb-8">
              <Loader2 size={80} className="text-blue-500 animate-spin" strokeWidth={1}/>
              <Flag size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-2 text-center">Mapping Terrain</h2>
            <p className="text-gray-400 text-sm text-center max-w-xs leading-relaxed">
              Syncing satellite GPS coordinates for 18 holes. One moment...
            </p>
        </div>
      )}
    </div>
  );
};

export default CourseDiscovery;
