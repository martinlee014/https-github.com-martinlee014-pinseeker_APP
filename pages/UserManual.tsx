
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
          title="Managing Courses (New!)"
          items={[
            'Navigate to Settings > Course Database to view or add new courses.',
            'Tap the "+" button to enter the Course Editor.',
            'Type a location (e.g., "Pebble Beach") to find the course on the map.',
            'Select a hole, then tap "Map" or "GPS" to set the Tee Box and Green locations.',
            'Verify distances and Par in the summary screen before saving.'
          ]}
        />

        <Section 
          title="Club Management"
          items={[
            'Go to Settings > Club Management to customize your golf bag.',
            'Tap the "+" button to add a new club, or the Edit icon to modify an existing one.',
            'Use the "Network Table" visualizer to define your dispersion. Adjust the "Width Scatter" (Left/Right miss) and "Depth Scatter" (Short/Long miss) sliders.',
            'The blue ellipse on the grid represents your likely landing zone (68% confidence). This data is used to calculate strategy recommendations during your round.',
            'Ensure "Carry" distances are accurate for the best club recommendations.'
          ]}
        />

        <Section 
          title="Advanced Tools (New!)"
          items={[
            'Measurement Mode: Tap the Ruler icon (top right) to enter measurement mode. Tap anywhere on the map to measure the distance from your ball to that point, and from that point to the green.',
            'Wind Vane: Tap the Wind icon to open the compass. Drag the ring to set the wind direction relative to North. The blue arrow indicates the wind flow.'
          ]}
        />

        <Section 
          title="Playing a Hole"
          items={[
            'The map shows your current position (Blue), predicted landing zone (Target), and the Green (Red Flag).',
            'Use the Club Selector at the bottom to choose your club. The dispersion ellipse (blue oval) updates based on your Club Management settings.',
            'Use the "AIM" slider to adjust your shot direction relative to the pin.',
            'The "Plays Like" distance accounts for wind (simulate wind via the wind icon in top right).'
          ]}
        />

        <Section 
          title="Recording Shots & Undo"
          items={[
            'Walk to your ball and tap the GPS button to save your actual location.',
            'If GPS is unavailable or inaccurate, long-press anywhere on the map to manually drop your ball location.',
            'Undo: If you record a shot incorrectly, long-press the yellow shot marker on the map. A dialog will appear allowing you to delete it. Deleting the most recent shot will reset your position to the previous spot.'
          ]}
        />

        <Section 
          title="Finishing a Hole"
          items={[
            'Tap the Flag icon in the top right corner when you are done putting.',
            'Enter total Putts and Penalties.',
            'The score is calculated automatically and saved to your scorecard.'
          ]}
        />
      </div>
    </div>
  );
};

export default UserManual;
