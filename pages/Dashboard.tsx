
import { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { StorageService } from '../services/storage';
import { RoundHistory, GolfCourse } from '../types';
import * as MathUtils from '../services/mathUtils';
import { Plus, ChevronRight, Trophy, Calendar, MapPin, Play, RefreshCw, X } from 'lucide-react';
import { ModalOverlay } from '../components/Modals';

const Dashboard = () => {
  const { user } = useContext(AppContext);
  const navigate = useNavigate();
  const [history, setHistory] = useState<RoundHistory[]>([]);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showCourseSelect, setShowCourseSelect] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<GolfCourse[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  const checkRun = useRef(false);

  useEffect(() => {
    if (user) {
      setHistory(StorageService.getHistory(user));
      
      // Check for resume game only once on mount
      if (!checkRun.current) {
        checkRun.current = true;
        const tempState = StorageService.getTempState(user);
        if (tempState) {
          setShowResumeModal(true);
        }
      }
    }
  }, [user, navigate]);

  const handleStartClick = () => {
    // Load courses
    const allCourses = StorageService.getAllCourses();
    setAvailableCourses(allCourses);
    setShowCourseSelect(true);
    setLoadingLocation(true);

    // Try to sort by location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            const userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            
            const sorted = [...allCourses].sort((a, b) => {
                const distA = MathUtils.calculateDistance(userLoc, a.holes[0].tee);
                const distB = MathUtils.calculateDistance(userLoc, b.holes[0].tee);
                return distA - distB;
            });
            setAvailableCourses(sorted);
            setLoadingLocation(false);
        }, () => {
            setLoadingLocation(false); // GPS failed, keep default order
        });
    } else {
        setLoadingLocation(false);
    }
  };

  const selectCourse = (course: GolfCourse) => {
    // If user explicitly clicks Start New, and we still have a temp state, clear it.
    if (user) {
       StorageService.clearTempState(user);
    }
    setShowCourseSelect(false);
    navigate('/play', { state: { course } });
  };

  const resumeRound = () => {
    setShowResumeModal(false);
    // When resuming, we need to load the course data associated with that save if possible
    // For now, the PlayRound logic handles restoring state, but we assume the course data is embedded or static
    navigate('/play?restore=true');
  };

  const calculateTotalScore = (round: RoundHistory) => {
    return round.scorecard.reduce((acc, hole) => acc + hole.shotsTaken + hole.putts + hole.penalties, 0);
  };

  const getScoreColor = (score: number) => {
    const par = 72; // Assuming standard par 72 for total
    if (score < par) return 'text-red-400';
    if (score === par) return 'text-white';
    return 'text-green-400';
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-gray-400 text-sm font-medium">WELCOME BACK</h2>
          <h1 className="text-2xl font-bold text-white">{user}</h1>
        </div>
        <div className="bg-gray-800 px-3 py-1 rounded text-xs text-gray-300">
          HDCP: <span className="text-white font-bold">12.4</span>
        </div>
      </div>

      <button
        onClick={handleStartClick}
        className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white p-6 rounded-2xl shadow-lg shadow-green-900/20 flex items-center justify-between group transition-all"
      >
        <div className="flex flex-col items-start">
          <span className="font-bold text-xl">START NEW ROUND</span>
          <span className="text-green-100 text-sm opacity-80">Select Course & Tee Off</span>
        </div>
        <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
          <Plus size={24} />
        </div>
      </button>

      <div>
        <h3 className="text-gray-500 font-bold text-sm tracking-wider mb-3">RECENT ROUNDS</h3>
        {history.length === 0 ? (
          <div className="text-center py-10 bg-gray-900 rounded-xl border border-gray-800">
            <Trophy className="mx-auto text-gray-700 mb-2" size={32} />
            <p className="text-gray-500">No rounds played yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((round) => {
              const total = calculateTotalScore(round);
              return (
                <div 
                  key={round.id}
                  onClick={() => navigate('/summary', { state: { round } })}
                  className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex items-center justify-between hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-white font-medium">
                      <MapPin size={14} className="text-green-500" />
                      {round.courseName}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar size={12} />
                      {round.date}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(total)}`}>{total}</div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                    <ChevronRight size={20} className="text-gray-600" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCourseSelect && (
        <ModalOverlay onClose={() => setShowCourseSelect(false)}>
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900 shrink-0">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <MapPin size={18} className="text-green-500"/> Select Course
                </h3>
                <button type="button" onClick={() => setShowCourseSelect(false)}><X className="text-gray-400" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingLocation && (
                    <div className="text-center text-xs text-gray-500 animate-pulse mb-2">Locating nearest courses...</div>
                )}
                
                {availableCourses.map((course, idx) => (
                    <button
                        key={course.id}
                        onClick={() => selectCourse(course)}
                        className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 p-4 rounded-xl flex items-center justify-between group transition-all text-left"
                    >
                        <div>
                            <div className="font-bold text-white">{course.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                                {idx === 0 && !loadingLocation ? '📍 Nearest Course' : `${course.holes.length} Holes`}
                            </div>
                        </div>
                        <div className="bg-gray-900 p-2 rounded-lg group-hover:bg-green-600 group-hover:text-white text-gray-500 transition-colors">
                            <Play size={16} fill="currentColor" />
                        </div>
                    </button>
                ))}

                <button
                    onClick={() => navigate('/settings/courses/edit')}
                    className="w-full bg-gray-900/50 hover:bg-gray-800 border border-dashed border-gray-700 p-4 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-all mt-4"
                >
                    <Plus size={16} /> Add New Course
                </button>
            </div>
        </ModalOverlay>
      )}

      {showResumeModal && (
        <ModalOverlay onClose={() => setShowResumeModal(false)}>
           <div className="p-6 bg-gray-900 text-center">
             <Trophy className="mx-auto text-yellow-500 mb-4" size={48} />
             <h2 className="text-xl font-bold text-white mb-2">Unfinished Round Found</h2>
             <p className="text-gray-400 mb-6 text-sm">You have an active round in progress. Would you like to continue where you left off?</p>
             
             <div className="space-y-3">
               <button 
                  onClick={resumeRound}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
               >
                 <Play size={20} fill="white" /> Resume Round
               </button>
               
               <button 
                  onClick={() => { setShowResumeModal(false); handleStartClick(); }}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
               >
                 <RefreshCw size={20} /> Start New Round
               </button>
             </div>
           </div>
        </ModalOverlay>
      )}
    </div>
  );
};

export default Dashboard;
