import React from 'react';
import { X, Check, AlertTriangle, MapPin, Flag, Trophy } from 'lucide-react';
import { ClubStats, GolfHole, HoleScore } from '../types';

export const ModalOverlay = ({ children, onClose }: { children?: React.ReactNode, onClose?: () => void }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
    <div className="absolute inset-0" onClick={onClose} />
    <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-sm relative z-10 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
      {children}
    </div>
  </div>
);

export const ScoreModal = ({ 
  par, 
  holeNum, 
  onSave, 
  onClose 
}: { 
  par: number, 
  holeNum: number, 
  onSave: (putts: number, pens: number) => void, 
  onClose: () => void 
}) => {
  const [putts, setPutts] = React.useState(2);
  const [pens, setPens] = React.useState(0);

  const Stepper = ({ label, val, setVal }: any) => (
    <div className="flex items-center justify-between bg-gray-800 p-3 rounded-xl mb-3">
      <span className="text-gray-300 font-bold">{label}</span>
      <div className="flex items-center gap-4">
        <button onClick={() => setVal(Math.max(0, val - 1))} className="w-8 h-8 rounded-full bg-gray-700 text-white font-bold">-</button>
        <span className="w-6 text-center text-xl font-bold text-white">{val}</span>
        <button onClick={() => setVal(val + 1)} className="w-8 h-8 rounded-full bg-green-600 text-white font-bold">+</button>
      </div>
    </div>
  );

  return (
    <ModalOverlay onClose={onClose}>
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50 shrink-0">
        <h3 className="text-lg font-bold text-white">Finish Hole {holeNum}</h3>
        <button onClick={onClose}><X className="text-gray-400" /></button>
      </div>
      <div className="p-6 overflow-y-auto">
        <div className="text-center mb-6">
          <span className="text-4xl font-black text-white">{par + (putts - 2) + pens}</span> {/* Rough estimate */}
          <div className="text-gray-500 text-xs uppercase tracking-widest mt-1">Total Score (Est)</div>
        </div>
        <Stepper label="Putts" val={putts} setVal={setPutts} />
        <Stepper label="Penalties" val={pens} setVal={setPens} />
        
        <button 
          onClick={() => onSave(putts, pens)}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2"
        >
          <Check size={20} /> Save Score
        </button>
      </div>
    </ModalOverlay>
  );
};

export const ShotConfirmModal = ({
  dist,
  club,
  isGPS,
  clubs,
  onConfirm,
  onCancel,
  onChangeClub,
  isLongDistWarning
}: {
  dist: string,
  club: ClubStats,
  isGPS: boolean,
  clubs: ClubStats[],
  onConfirm: () => void,
  onCancel: () => void,
  onChangeClub: (c: ClubStats) => void,
  isLongDistWarning: boolean
}) => {
  return (
    <ModalOverlay onClose={onCancel}>
      <div className="p-4 bg-gray-800/50 border-b border-gray-800 shrink-0">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          {isGPS ? <MapPin size={18} className="text-blue-400" /> : <MapPin size={18} className="text-purple-400" />}
          Confirm Shot
        </h3>
      </div>
      
      <div className="p-6 space-y-4 overflow-y-auto">
        {isLongDistWarning && (
           <div className="bg-red-900/30 border border-red-800 p-3 rounded-lg flex items-start gap-3">
             <AlertTriangle className="text-red-500 shrink-0" size={20} />
             <div className="text-xs text-red-200">
               <strong>GPS Warning:</strong> Location is >500m from previous shot. GPS accuracy might be low.
             </div>
           </div>
        )}

        <div className="text-center py-2">
          <div className="text-4xl font-black text-white tracking-tight">{dist}</div>
          <div className="text-gray-500 text-xs uppercase">Distance</div>
        </div>

        <div>
          <label className="text-xs text-gray-400 font-bold mb-1 block">Club Used</label>
          <select 
            className="w-full bg-gray-800 text-white p-3 rounded-lg outline-none border border-gray-700"
            value={club.name}
            onChange={(e) => {
              const c = clubs.find(cl => cl.name === e.target.value);
              if (c) onChangeClub(c);
            }}
          >
            {clubs.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={onCancel} className="flex-1 bg-gray-800 text-gray-300 py-3 rounded-xl font-bold">Cancel</button>
          <button onClick={onConfirm} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold">Confirm</button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export const HoleSelectorModal = ({ holes, currentIdx, onSelect, onClose }: { holes: GolfHole[], currentIdx: number, onSelect: (i: number) => void, onClose: () => void }) => {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="p-4 border-b border-gray-800 shrink-0">
        <h3 className="text-lg font-bold text-white">Select Hole</h3>
      </div>
      <div className="p-4 grid grid-cols-4 gap-3 overflow-y-auto">
        {holes.map((h, i) => (
          <button 
            key={h.number}
            onClick={() => onSelect(i)}
            className={`aspect-square rounded-xl flex flex-col items-center justify-center border ${currentIdx === i ? 'bg-green-600 border-green-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
          >
            <span className="font-bold text-lg">{h.number}</span>
            <span className="text-[10px]">Par {h.par}</span>
          </button>
        ))}
      </div>
    </ModalOverlay>
  );
};

export const FullScorecardModal = ({ 
  holes, 
  scorecard, 
  onFinishRound, 
  onClose 
}: { 
  holes: GolfHole[], 
  scorecard: HoleScore[], 
  onFinishRound: () => void, 
  onClose: () => void 
}) => {
  
  const getTotal = (metric: 'par' | 'score' | 'putts') => {
    if (metric === 'par') return holes.reduce((a, b) => a + b.par, 0);
    return scorecard.reduce((acc, h) => {
      if (metric === 'score') return acc + h.shotsTaken + h.putts + h.penalties;
      if (metric === 'putts') return acc + h.putts;
      return acc;
    }, 0);
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900 shrink-0">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Trophy size={18} className="text-yellow-500"/> Scorecard
        </h3>
        <button onClick={onClose}><X className="text-gray-400" /></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs text-gray-500 uppercase bg-gray-800">
            <tr>
              <th className="px-3 py-2 rounded-l-lg">Hole</th>
              <th className="px-3 py-2">Par</th>
              <th className="px-3 py-2 font-bold text-white">Score</th>
              <th className="px-3 py-2 rounded-r-lg">Putts</th>
            </tr>
          </thead>
          <tbody>
            {holes.map((hole) => {
              const record = scorecard.find(s => s.holeNumber === hole.number);
              const scoreVal = record ? record.shotsTaken + record.putts + record.penalties : null;
              const scoreDisplay = scoreVal !== null ? scoreVal : '-';
              const puttsDisplay = record ? record.putts : '-';
              
              let scoreClass = '';
              if (scoreVal !== null) {
                if (scoreVal < hole.par) scoreClass = 'text-red-400 font-bold';
                else if (scoreVal > hole.par) scoreClass = 'text-blue-400';
                else scoreClass = 'text-white';
              }

              return (
                <tr key={hole.number} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="px-3 py-3 font-medium text-white">{hole.number}</td>
                  <td className="px-3 py-3">{hole.par}</td>
                  <td className={`px-3 py-3 ${scoreClass}`}>{scoreDisplay}</td>
                  <td className="px-3 py-3">{puttsDisplay}</td>
                </tr>
              );
            })}
            <tr className="bg-gray-800 font-bold text-white">
              <td className="px-3 py-3 rounded-l-lg">TOT</td>
              <td className="px-3 py-3">{getTotal('par')}</td>
              <td className="px-3 py-3 text-yellow-400">{getTotal('score')}</td>
              <td className="px-3 py-3 rounded-r-lg">{getTotal('putts')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-800 shrink-0 bg-gray-900">
        <button 
          onClick={onFinishRound}
          className="w-full bg-red-900/80 hover:bg-red-800 text-red-100 border border-red-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <Flag size={20} /> Finish Round & Save
        </button>
      </div>
    </ModalOverlay>
  );
};
