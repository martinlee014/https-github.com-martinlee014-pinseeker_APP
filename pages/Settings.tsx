import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { BookOpen, Ruler, Briefcase, Download, Smartphone, Share, PlusSquare, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ModalOverlay } from '../components/Modals';

const Settings = () => {
  const { useYards, toggleUnits } = useContext(AppContext);
  const navigate = useNavigate();
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isDeviceIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isDeviceIOS);

    // Capture install prompt for Android/Desktop
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      // Automatic prompt available (Android/Chrome Desktop)
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setInstallPrompt(null);
        }
      });
    } else {
      // Fallback: Show manual instructions (iOS or Browser not supporting trigger)
      setShowInstallHelp(true);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <div className="space-y-4">
        {/* Install App Button - Always Visible Now */}
        <button
            onClick={handleInstallClick}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl p-4 flex items-center gap-3 shadow-lg shadow-blue-900/30 group transition-all"
        >
            <div className="bg-white/20 p-2 rounded-lg group-hover:scale-110 transition-transform">
                <Download className="text-white" size={20} />
            </div>
            <div className="text-left flex-1">
                <div className="font-bold text-white">Install App</div>
                <div className="text-xs text-blue-100">
                    {installPrompt ? 'Tap to install' : 'Download to Home Screen'}
                </div>
            </div>
        </button>

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
          PinSeeker Web v7.2.0
      </div>

      {showInstallHelp && (
        <ModalOverlay onClose={() => setShowInstallHelp(false)}>
           <div className="p-6 text-center">
             {isIOS ? (
                 <>
                    <Smartphone className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-white mb-4">Install on iOS</h3>
                    <ol className="text-left text-sm text-gray-300 space-y-4 mb-6">
                        <li className="flex items-center gap-3">
                            <span className="bg-gray-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">1</span>
                            <span>Tap the <strong className="text-blue-400">Share</strong> button in Safari. <Share size={14} className="inline ml-1"/></span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="bg-gray-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">2</span>
                            <span>Scroll down and select <strong className="text-white">Add to Home Screen</strong>. <PlusSquare size={14} className="inline ml-1"/></span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="bg-gray-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">3</span>
                            <span>Tap <strong className="text-blue-400">Add</strong> to finish.</span>
                        </li>
                    </ol>
                 </>
             ) : (
                 <>
                    <Info className="mx-auto text-blue-400 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-white mb-2">Install Manually</h3>
                    <p className="text-gray-400 text-sm mb-6">
                        Your browser doesn't support automatic installation or the app is already installed.
                    </p>
                    <div className="text-left text-sm text-gray-300 bg-gray-800 p-4 rounded-xl mb-6">
                        <p className="mb-2"><strong>Tip:</strong> Look for the "Add to Home Screen" or "Install App" option in your browser menu (usually the three dots icon).</p>
                    </div>
                 </>
             )}
             
             <button 
               onClick={() => setShowInstallHelp(false)}
               className="w-full bg-gray-800 py-3 rounded-xl text-white font-bold hover:bg-gray-700"
             >
               Close
             </button>
           </div>
        </ModalOverlay>
      )}
    </div>
  );
};

export default Settings;