
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { GolfCourse } from '../types';
import { ChevronLeft, Plus, Map, Trash2, Edit } from 'lucide-react';

const CourseManager = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<GolfCourse[]>([]);

  useEffect(() => {
    setCourses(StorageService.getCustomCourses());
  }, []);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this course?")) {
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

      <div className="flex-1 space-y-3 overflow-y-auto pb-20">
        {/* Helper Box */}
        <div className="bg-gray-800/50 p-4 rounded-xl border border-dashed border-gray-700 mb-4">
            <p className="text-xs text-gray-400 leading-relaxed">
                Add new courses to the local database. You can map a course using GPS while on the course, or use the map editor to set it up from home.
            </p>
        </div>

        {courses.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
                <Map size={48} className="mx-auto mb-3 opacity-20" />
                <p>No custom courses yet.</p>
            </div>
        ) : (
            courses.map(c => (
                <div key={c.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
                    <div className="flex-1 min-w-0 pr-4">
                        <div className="font-bold text-white text-lg truncate">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.holes.filter(h => h.tee.lat !== 0).length} Mapped Holes • {c.createdAt}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button 
                            onClick={() => handleEdit(c)}
                            className="p-2 bg-blue-900/20 text-blue-400 rounded-lg hover:bg-blue-900/40"
                        >
                             <Edit size={16} /> 
                        </button>
                        <button 
                            onClick={() => handleDelete(c.id)}
                            className="p-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>

      <button 
        onClick={() => navigate('/settings/courses/edit')}
        className="fixed bottom-6 right-6 bg-green-600 text-white p-4 rounded-full shadow-xl shadow-green-900/50 hover:scale-105 transition-transform z-10"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default CourseManager;
