import { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { StorageService } from '../services/storage';
import { RoundHistory } from '../types';
import { Plus, ChevronRight, Trophy, Calendar, MapPin, Play, RefreshCw } from 'lucide-react';
import { ModalOverlay } from '../components/Modals';

const Dashboard = () => {
  const { user } = useContext(AppContext);
  const navigate = useNavigate();
  const [history, setHistory] = useState<RoundHistory[]>([]);
  const [showResumeModal, setShowResumeModal] = useState(false);
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

  const startNewRound = () => {
    // If user explicitly clicks Start New, and we still have a temp state, clear it.
    if (user) {
       StorageService.clearTempState(user);
    }
    navigate('/play');
  };

  const resumeRound = () => {
    setShowResumeModal(false);
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
        onClick={startNewRound}
        className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white p-6 rounded-2xl shadow-lg shadow-green-900/20 flex items-center justify-between group transition-all"
      >
        <div className="flex flex-col items-start">
          <span className="font-bold text-xl">START NEW ROUND</span>
          <span className="text-green-100 text-sm opacity-80">Duvenhof Golf Club</span>
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
                  onClick={() => { setShowResumeModal(false); startNewRound(); }}
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