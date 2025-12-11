import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, Play, Map as MapIcon, Settings as SettingsIcon } from 'lucide-react';
import { StorageService } from './services/storage';
import { ClubStats } from './types';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PlayRound from './pages/PlayRound';
import RoundSummary from './pages/RoundSummary';
import Settings from './pages/Settings';
import UserManual from './pages/UserManual';
import ClubManagement from './pages/ClubManagement';

// Global Context for simple state sharing
export const AppContext = createContext<{
  user: string | null;
  login: (u: string) => void;
  logout: () => void;
  useYards: boolean;
  toggleUnits: () => void;
  bag: ClubStats[];
  updateBag: (newBag: ClubStats[]) => void;
}>({
  user: null,
  login: () => {},
  logout: () => {},
  useYards: false,
  toggleUnits: () => {},
  bag: [],
  updateBag: () => {},
});

const MainLayout = ({ children }: { children?: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AppContext);

  const isPlayMode = location.pathname.startsWith('/play');

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-black relative shadow-2xl overflow-hidden">
      {/* Header */}
      {!isPlayMode && (
        <header className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800 z-10">
          <div className="flex items-center gap-2" onClick={() => navigate('/dashboard')}>
            <MapIcon className="text-green-500" />
            <span className="font-bold text-xl tracking-wider">PINSEEKER</span>
          </div>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500">
            <LogOut size={20} />
          </button>
        </header>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>

      {/* Bottom Nav - Hide in Play Mode */}
      {!isPlayMode && (
        <nav className="flex justify-around items-center p-3 bg-gray-900 border-t border-gray-800 z-10">
          <NavItem icon={<User size={24} />} label="Dash" path="/dashboard" active={location.pathname === '/dashboard'} />
          <div className="relative -top-5">
             <button 
               onClick={() => navigate('/play')}
               className="bg-green-600 p-4 rounded-full shadow-lg shadow-green-900/50 hover:scale-105 transition-transform border-4 border-black"
             >
               <Play fill="white" className="text-white ml-1" />
             </button>
          </div>
          <NavItem icon={<SettingsIcon size={24} />} label="Settings" path="/settings" active={location.pathname === '/settings'} />
        </nav>
      )}
    </div>
  );
};

const NavItem = ({ icon, label, path, active }: any) => {
  const navigate = useNavigate();
  return (
    <button 
      onClick={() => navigate(path)}
      className={`flex flex-col items-center gap-1 ${active ? 'text-green-400' : 'text-gray-500'}`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}

const App = () => {
  const [user, setUser] = useState<string | null>(StorageService.getCurrentUser());
  const [useYards, setUseYards] = useState<boolean>(StorageService.getUseYards());
  const [bag, setBag] = useState<ClubStats[]>([]);

  // Load bag on mount
  useEffect(() => {
    setBag(StorageService.getBag());
  }, []);

  const login = (username: string) => {
    setUser(username);
    StorageService.setCurrentUser(username);
  };

  const logout = () => {
    setUser(null);
    StorageService.clearCurrentUser();
  };

  const toggleUnits = () => {
    const newVal = !useYards;
    setUseYards(newVal);
    StorageService.setUseYards(newVal);
  };

  const updateBag = (newBag: ClubStats[]) => {
    setBag(newBag);
    StorageService.saveBag(newBag);
  };

  return (
    <AppContext.Provider value={{ user, login, logout, useYards, toggleUnits, bag, updateBag }}>
      <HashRouter>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/dashboard" element={<ProtectedRoute user={user}><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
          <Route path="/play" element={<ProtectedRoute user={user}><MainLayout><PlayRound /></MainLayout></ProtectedRoute>} />
          <Route path="/summary" element={<ProtectedRoute user={user}><MainLayout><RoundSummary /></MainLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute user={user}><MainLayout><Settings /></MainLayout></ProtectedRoute>} />
          <Route path="/settings/clubs" element={<ProtectedRoute user={user}><MainLayout><ClubManagement /></MainLayout></ProtectedRoute>} />
          <Route path="/manual" element={<ProtectedRoute user={user}><MainLayout><UserManual /></MainLayout></ProtectedRoute>} />
        </Routes>
      </HashRouter>
    </AppContext.Provider>
  );
};

const ProtectedRoute = ({ user, children }: { user: string | null, children?: ReactNode }) => {
  if (!user) return <Navigate to="/" />;
  return <>{children}</>;
};

export default App;