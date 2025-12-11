import { useContext } from 'react';
import { AppContext } from '../App';
import { BookOpen, Ruler, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { useYards, toggleUnits } = useContext(AppContext);
  const navigate = useNavigate();

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <div className="space-y-4">
        {/* Unit Toggle */}
        <div className="bg-gray-900 rounded-xl p-4 flex items-center justify-between border border-gray-800">
            <div className="flex items-center gap-3">
                <div className="bg-gray-800 p-2 rounded-lg">
                    <Ruler className="text-green-500" size={20} />
                </div>
                <div>
                    <div className="font-medium text-white">Measurement Units</div>
                    <div className="text-xs text-gray-500">{useYards ? 'Imperial (Yards)' : 'Metric (Meters)'}</div>
                </div>
            </div>
            <button 
                onClick={toggleUnits}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${useYards ? 'bg-green-600' : 'bg-gray-600'}`}
            >
                <div className={`bg-white w-4 h-4 rounded-full transition-transform ${useYards ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
        </div>

        {/* Club Management */}
        <button 
            onClick={() => navigate('/settings/clubs')}
            className="w-full bg-gray-900 rounded-xl p-4 flex items-center gap-3 border border-gray-800 hover:bg-gray-800 transition-colors group"
        >
            <div className="bg-gray-800 p-2 rounded-lg group-hover:bg-gray-700 transition-colors">
                <Briefcase className="text-yellow-500" size={20} />
            </div>
            <div className="text-left flex-1">
                <div className="font-medium text-white">Club Management</div>
                <div className="text-xs text-gray-500">Edit bag, carry distances & dispersion</div>
            </div>
            <div className="text-gray-600 group-hover:text-white transition-colors">→</div>
        </button>

        {/* Manual */}
        <button 
            onClick={() => navigate('/manual')}
            className="w-full bg-gray-900 rounded-xl p-4 flex items-center gap-3 border border-gray-800 hover:bg-gray-800 transition-colors"
        >
            <div className="bg-gray-800 p-2 rounded-lg">
                <BookOpen className="text-blue-500" size={20} />
            </div>
            <div className="text-left">
                <div className="font-medium text-white">User Manual</div>
                <div className="text-xs text-gray-500">Learn how to use PinSeeker</div>
            </div>
        </button>
      </div>
      
      <div className="text-center text-xs text-gray-600 mt-10">
          PinSeeker Web v6.0.0
      </div>
    </div>
  );
};

export default Settings;