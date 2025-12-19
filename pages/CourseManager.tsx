import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { GolfCourse } from '../types';
import { ChevronLeft, Plus, Map, Trash2, Edit, PlusSquare, Info } from 'lucide-react';

const CourseManager = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<GolfCourse[]>([]);

  useEffect(() => {
    setCourses(StorageService.getCustomCourses());
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
        StorageService.deleteCustomCourse(id);
        setCourses(StorageService.getCustomCourses());
    }
  };

  const handleEdit = (course: GolfCourse) => {
      navigate('/settings/courses/edit', { state: { course } });
  };

  return (
    <div className="p-4 flex flex-col h-full bg-gray-900 min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/settings')} className="p-2 bg-gray-800 rounded-lg text-white">
          <ChevronLeft />
        </button>
        <h1 className="text-2xl font-bold text-white">Course Database</h1>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pb-20">
        {/* Primary Call to Action: Manual Add Entry */}
        <button 
            onClick={() => navigate('/settings/courses/edit')}
            className="w-full bg-gradient-to-br from-green-600/20 to-green-500/5 border border-green-500/30 p-6 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all shadow-lg"
        >
            <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 text-green-400 font-black tracking-widest text-sm mb-1">
                    <PlusSquare size={16} /> NEW COURSE
                </div>
                <div className="text-lg font-bold text-white leading-tight">Create Manual Map</div>
                <p className="text-xs text-gray-500 mt-1">Start defining Tee & Green positions</p>
            </div>
            <div className="bg-green-600 p-3 rounded-full text-white shadow-lg shadow-green-900/40 group-hover:scale-110 transition-transform">
                <Plus size={24} />
            </div>
        </button>

        <div className="flex items-center gap-2 px-1">
            <h3 className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em]">Your Custom Maps</h3>
            <div className="flex-1 h-px bg-gray-800"></div>
        </div>

        {courses.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/20 rounded-2xl border border-dashed border-gray-800">
                <Map size={48} className="mx-auto mb-3 text-gray-700" />
                <p className="text-gray-500 text-sm">No custom courses yet.</p>
                <p className="text-xs text-gray-600 mt-1 px-10 leading-relaxed italic">Tap the button above to manually map your favorite course.</p>
            </div>
        ) : (
            <div className="space-y-3">
                {courses.map(c => (
                    <div key={c.id} className="bg-gray-800/50 p-4 rounded-xl border border-gray-800 flex justify-between items-center group hover:bg-gray-800 transition-colors">
                        <div className="flex-1 min-w-0 pr-4">
                            <div className="font-bold text-white text-base truncate">{c.name}</div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1">
                                <span className="bg-gray-900 px-1.5 py-0.5 rounded border border-gray-700">{c.holes.filter(h => h.tee.lat !== 0).length} Holes</span>
                                <span>•</span>
                                <span>{c.createdAt}</span>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button 
                                onClick={() => handleEdit(c)}
                                className="p-2.5 bg-blue-900/20 text-blue-400 rounded-lg hover:bg-blue-900/40 border border-blue-900/10 transition-colors"
                            >
                                 <Edit size={16} /> 
                            </button>
                            <button 
                                onClick={() => handleDelete(c.id)}
                                className="p-2.5 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40 border border-red-900/10 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl flex gap-3">
            <Info className="text-blue-500 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-blue-200/60 leading-relaxed">
                <strong className="text-blue-300">Tip:</strong> Manual creation works best from home by searching for the course name, then dragging markers to the high-res satellite spots.
            </p>
        </div>
      </div>
    </div>
  );
};

export default CourseManager;