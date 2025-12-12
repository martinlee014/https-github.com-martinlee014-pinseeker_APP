import { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../App';
import { ClubStats } from '../types';
import { ChevronLeft, Plus, Trash2, Save, X, Edit3, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';

const ClubManagement = () => {
  const { bag, updateBag, useYards } = useContext(AppContext);
  const navigate = useNavigate();
  const [editingClub, setEditingClub] = useState<ClubStats | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [carry, setCarry] = useState(0);
  const [sideError, setSideError] = useState(0);
  const [depthError, setDepthError] = useState(0);

  const openEditor = (club: ClubStats, isNewClub: boolean = false) => {
    setEditingClub(club);
    setIsNew(isNewClub);
    setName(club.name);
    setCarry(club.carry);
    setSideError(club.sideError);
    setDepthError(club.depthError);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const newClub: ClubStats = {
      name,
      carry: Number(carry),
      sideError: Number(sideError),
      depthError: Number(depthError)
    };

    let newBag = [...bag];
    if (isNew) {
      newBag.push(newClub);
      // Sort by carry distance descending
      newBag.sort((a, b) => b.carry - a.carry);
    } else {
      // Find index of editingClub in original bag (assuming name was unique-ish, or just map)
      // Since we don't have IDs, we map by the object reference we stored in editingClub
      // Or safer: map index. But here we can filter out the old one and add new one.
      const index = bag.findIndex(c => c === editingClub);
      if (index !== -1) {
        newBag[index] = newClub;
      }
      newBag.sort((a, b) => b.carry - a.carry);
    }

    updateBag(newBag);
    setEditingClub(null);
  };

  const handleDelete = (club: ClubStats) => {
    if (confirm(`Remove ${club.name} from your bag?`)) {
      const newBag = bag.filter(c => c !== club);
      updateBag(newBag);
    }
  };

  const handleReset = () => {
    if (confirm("Reset all clubs to default values?")) {
        const defaults = StorageService.resetBag();
        updateBag(defaults);
    }
  };

  // Convert unit for display
  const displayVal = (val: number) => useYards ? Math.round(val * 1.09361) : Math.round(val);
  const unit = useYards ? 'yd' : 'm';

  // --- Visualizer Component ---
  const DispersionVisualizer = () => {
    // Reduced size for better mobile fit
    const width = 220;
    const height = 220;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 2; // 1 meter = 2 pixels (fits 50m radius in 100px)

    // Grid lines
    const gridLines = [];
    const step = 10; // 10 meters/yards lines for cleaner look at smaller scale
    const maxDist = 50; 

    for (let i = -maxDist; i <= maxDist; i += step) {
        const pos = i * scale;
        // Vertical
        gridLines.push(
            <line 
                key={`v${i}`} 
                x1={centerX + pos} y1={0} 
                x2={centerX + pos} y2={height} 
                stroke={i === 0 ? "#4b5563" : "#374151"} 
                strokeWidth={i === 0 ? 2 : 1}
                strokeDasharray={i === 0 ? "" : "4 4"}
            />
        );
        // Horizontal
        gridLines.push(
            <line 
                key={`h${i}`} 
                x1={0} y1={centerY + pos} 
                x2={width} y2={centerY + pos} 
                stroke={i === 0 ? "#4b5563" : "#374151"} 
                strokeWidth={i === 0 ? 2 : 1}
                strokeDasharray={i === 0 ? "" : "4 4"}
            />
        );
    }

    // Ellipse dimensions (converted to pixels)
    // sideError is radius X, depthError is radius Y
    const rx = sideError * scale;
    const ry = depthError * scale;

    return (
        <div className="flex flex-col items-center bg-black/50 p-3 rounded-xl border border-gray-800 backdrop-blur-md shadow-lg">
            <div className="relative border border-gray-700 rounded-lg overflow-hidden bg-gray-900" style={{ width, height }}>
                <svg width={width} height={height}>
                    {gridLines}
                    {/* Target Center */}
                    <circle cx={centerX} cy={centerY} r={3} fill="#fbbf24" stroke="white" strokeWidth={1.5} />
                    
                    {/* Dispersion Ellipse */}
                    <ellipse 
                        cx={centerX} 
                        cy={centerY} 
                        rx={Math.max(2, rx)} 
                        ry={Math.max(2, ry)} 
                        fill="rgba(59, 130, 246, 0.3)" 
                        stroke="#3b82f6" 
                        strokeWidth={2} 
                    />
                    
                    {/* Labels */}
                    <text x={centerX + width/2 - 18} y={centerY - 5} fill="gray" fontSize="9">{maxDist}{unit}</text>
                    <text x={centerX + 5} y={12} fill="gray" fontSize="9">{maxDist}{unit}</text>
                </svg>
                <div className="absolute bottom-1 right-2 text-[9px] text-gray-500">
                    Grid: {step}{unit}
                </div>
            </div>
            <div className="mt-2 text-center text-xs text-blue-400 font-bold">
                &plusmn;{displayVal(sideError)}{unit} &times; &plusmn;{displayVal(depthError)}{unit}
            </div>
        </div>
    )
  };

  if (editingClub) {
    return (
        <div className="flex flex-col h-full bg-gray-900">
            <div className="flex items-center justify-between p-4 pb-2 shrink-0">
                <button onClick={() => setEditingClub(null)} className="p-2 bg-gray-800 rounded-lg">
                    <ChevronLeft className="text-white" />
                </button>
                <h1 className="text-xl font-bold text-white">{isNew ? 'New Club' : 'Edit Club'}</h1>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 overflow-y-auto relative">
                {/* Visualizer - Sticky Top */}
                <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50 pb-4 pt-2 px-4 shadow-xl flex justify-center">
                    <DispersionVisualizer />
                </div>

                {/* Form Controls */}
                <div className="p-4 space-y-4">
                    <div className="space-y-5 bg-gray-800 p-4 rounded-xl border border-gray-700">
                        <div>
                            <label className="text-xs text-gray-400 font-bold block mb-1">Club Name</label>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white font-bold focus:border-green-500 outline-none"
                                placeholder="e.g. Driver"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs text-gray-400 font-bold">Total Carry ({unit})</label>
                                <span className="text-green-400 font-bold">{displayVal(carry)}</span>
                            </div>
                            <input 
                                type="range" min="10" max="350" step="1" 
                                value={useYards ? carry * 1.09361 : carry} 
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setCarry(useYards ? val / 1.09361 : val);
                                }}
                                className="w-full accent-green-500 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                 <label className="text-xs text-blue-300 font-bold block mb-2">Width Scatter</label>
                                 <input 
                                    type="range" min="0" max="50" step="1" 
                                    value={useYards ? sideError * 1.09361 : sideError} 
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setSideError(useYards ? val / 1.09361 : val);
                                    }}
                                    className="w-full accent-blue-500 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                 />
                            </div>
                            <div>
                                 <label className="text-xs text-blue-300 font-bold block mb-2">Depth Scatter</label>
                                 <input 
                                    type="range" min="0" max="40" step="1" 
                                    value={useYards ? depthError * 1.09361 : depthError} 
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setDepthError(useYards ? val / 1.09361 : val);
                                    }}
                                    className="w-full accent-blue-500 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                 />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 pt-2 shrink-0 bg-gray-900">
                <button 
                    onClick={handleSave}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                >
                    <Save size={20} /> Save Changes
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-gray-800 rounded-lg">
          <ChevronLeft className="text-white" />
        </button>
        <h1 className="text-2xl font-bold text-white">My Bag</h1>
        <button onClick={handleReset} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white">
           <RotateCcw size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-20">
        {bag.map((club, idx) => (
            <div key={idx} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center justify-between">
                <div>
                    <div className="text-lg font-black text-white">{club.name}</div>
                    <div className="text-sm text-green-400 font-bold">{displayVal(club.carry)}{unit} Carry</div>
                    <div className="text-[10px] text-gray-500 mt-1">
                        &plusmn;{displayVal(club.sideError)} / &plusmn;{displayVal(club.depthError)} {unit}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => openEditor(club, false)}
                        className="p-2 bg-blue-900/30 text-blue-400 rounded-lg hover:bg-blue-900/50"
                    >
                        <Edit3 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(club)}
                        className="p-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        ))}
      </div>

      <button 
        onClick={() => openEditor({ name: 'New Club', carry: 150, sideError: 15, depthError: 10 }, true)}
        className="fixed right-6 bg-green-600 text-white p-4 rounded-full shadow-xl shadow-green-900/50 hover:scale-105 transition-transform"
        style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default ClubManagement;