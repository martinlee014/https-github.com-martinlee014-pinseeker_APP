import React, { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { RoundHistory, HoleScore } from '../types';
import { ChevronLeft, Share2, AlertCircle } from 'lucide-react';

const RoundSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { round } = location.state as { round: RoundHistory } || {};

  if (!round) return <div className="p-10 text-center">No data available</div>;

  const totalScore = round.scorecard.reduce((acc, h) => acc + h.shotsTaken + h.putts + h.penalties, 0);
  const totalPar = round.scorecard.reduce((acc, h) => acc + h.par, 0);
  const diff = totalScore - totalPar;
  const putts = round.scorecard.reduce((acc, h) => acc + h.putts, 0);
  const penalties = round.scorecard.reduce((acc, h) => acc + h.penalties, 0);
  
  const gir = round.scorecard.filter(h => (h.shotsTaken) <= (h.par - 2)).length;
  const girPercent = Math.round((gir / round.scorecard.length) * 100);

  const StatCard = ({ label, value, sub, color }: any) => (
    <div className="bg-gray-800 p-4 rounded-xl flex-1 border border-gray-700">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{sub}</div>
    </div>
  );

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/dashboard')} className="p-2 bg-gray-800 rounded-lg">
          <ChevronLeft className="text-white" />
        </button>
        <h1 className="font-bold text-white tracking-widest">ROUND SUMMARY</h1>
        <button className="p-2 bg-gray-800 rounded-lg">
          <Share2 className="text-white" size={20} />
        </button>
      </div>

      <div className="text-center">
        <div className="text-gray-400">{round.courseName}</div>
        <div className="text-sm text-gray-600">{round.date}</div>
      </div>

      <div className="flex gap-4">
        <StatCard 
            label="SCORE" 
            value={totalScore} 
            sub={diff > 0 ? `+${diff}` : diff} 
            color="text-white" 
        />
        <StatCard 
            label="GIR" 
            value={`${girPercent}%`} 
            sub={`${gir}/${round.scorecard.length}`} 
            color="text-green-400" 
        />
      </div>
      <div className="flex gap-4">
        <StatCard 
            label="PUTTS" 
            value={putts} 
            sub={`Avg ${(putts/18).toFixed(1)}`} 
            color="text-orange-400" 
        />
        <StatCard 
            label="PENALTIES" 
            value={penalties} 
            sub="Lost Strokes" 
            color="text-red-400" 
        />
      </div>

      <div className="space-y-2">
          <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-2">Hole by Hole Analysis</h3>
          {round.scorecard.map((h, i) => {
              const score = h.shotsTaken + h.putts + h.penalties;
              let badgeColor = "border-transparent text-white";
              if (score < h.par) badgeColor = "border-red-500 border-2 rounded-full w-8 h-8 flex items-center justify-center text-red-500";
              else if (score > h.par) badgeColor = "border-blue-500 border-2 w-8 h-8 flex items-center justify-center text-blue-500";
              else badgeColor = "bg-gray-700 w-8 h-8 flex items-center justify-center rounded text-green-400";

              return (
                  <div 
                    key={h.holeNumber} 
                    onClick={() => navigate('/play', { state: { round, initialHoleIndex: i } })}
                    className="bg-gray-900 border border-gray-800 p-3 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-800"
                  >
                      <div className="flex items-center gap-4">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center font-bold text-xs text-white">
                              {h.holeNumber}
                          </div>
                          <div>
                              <div className="text-sm text-gray-300">Par {h.par}</div>
                              {h.penalties > 0 && <span className="text-xs text-red-500">{h.penalties} Pen</span>}
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <div className="text-right text-xs text-gray-500">
                              <div>{h.putts} Putts</div>
                              {h.shotsTaken <= (h.par - 2) && <div className="text-green-600 font-bold">GIR</div>}
                          </div>
                          <div className={badgeColor}>
                             <span className="font-bold">{score}</span>
                          </div>
                      </div>
                  </div>
              )
          })}
      </div>
    </div>
  );
};

export default RoundSummary;