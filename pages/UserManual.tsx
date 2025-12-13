import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserManual = () => {
  const navigate = useNavigate();

  const Section = ({ title, items }: { title: string, items: string[] }) => (
    <div className="mb-6">
      <h3 className="text-green-400 font-bold text-lg mb-3 border-b border-gray-800 pb-2">{title}</h3>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex gap-3 text-gray-300 text-sm leading-relaxed">
            <span className="text-green-600">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="p-4 pb-20">
       <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-gray-800 rounded-lg">
          <ChevronLeft className="text-white" />
        </button>
        <h1 className="text-2xl font-bold text-white">User Manual</h1>
      </div>

      <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
        <p className="text-gray-400 mb-6 italic">
          Welcome to PinSeeker! This app helps you track your golf rounds and analyze your performance with professional-grade dispersion data.
        </p>

        <Section 
          title="Measurement Mode (Rangefinder)"
          items={[
            'Tap the Ruler icon (top right) to enter measurement mode.',
            '**New:** Tap the "MY LOC" button at the bottom to instantly snap the measurement start point to your current GPS position.',
            'Tap anywhere else on the map to measure from your current ball position to that specific point (layup point).',
            'The dashboard displays two distances: "From You" (Start to Target) and "To Pin" (Target to Green).'
          ]}
        />

        <Section 
          title="Annotation Tools"
          items={[
            'Tap the Pen icon (top right) to toggle Annotation Mode.',
            '**Toolbar:** Select Text (T), Flag (Pin), or Draw (Highlighter).',
            '**Draw:** Tap points to create a path, then tap "Finish Line" to save.',
            '**Delete:** Select the Eraser (Red Icon) from the toolbar and tap any annotation to delete it instantly. Alternatively, long-press any annotation (without the Eraser) to verify deletion.'
          ]}
        />

        <Section 
          title="Wind Vane"
          items={[
             'Tap the Wind icon to open the compass overlay.',
             'Drag the ring to align the "N" indicator with true North (or simply align the wind arrow relative to your shot).',
             'The blue arrow visualizes the wind flow direction across the hole.'
          ]}
        />

        <Section 
          title="Recording Shots & GPS"
          items={[
            '**Record Shot:** Walk to your ball and tap the GPS button (bottom right) to save the shot landing spot.',
            '**Move Tee Box:** Long-press (>1 sec) the GPS button to update the *start* position (Tee) to your current location.',
            '**Manual Drop:** If GPS is weak, long-press anywhere on the map to manually drop your ball location.',
            '**Undo:** Long-press the yellow shot marker on the map to delete the most recent shot and reset your position.'
          ]}
        />

        <Section 
          title="Course Management"
          items={[
            'Go to Settings > Course Database to view or add new courses.',
            'Use the Course Editor to map Tee Boxes and Greens for custom courses.',
            'Verify Par and Total Distance in the summary screen before saving.'
          ]}
        />

        <Section 
          title="Club Management"
          items={[
            'Go to Settings > Club Management to customize your golf bag.',
            'Use the "Network Table" visualizer to define your dispersion (Width/Depth scatter).',
            'The blue ellipse on the map represents your likely landing zone based on these settings.'
          ]}
        />
      </div>
    </div>
  );
};

export default UserManual;