import React from 'react';
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
          title="Starting a Round"
          items={[
            'Tap the "START NEW ROUND" button on the main dashboard.',
            'The app will automatically load the first hole of Duvenhof Golf Club.',
            'If you have an unfinished round, you will be prompted to restore it.'
          ]}
        />

        <Section 
          title="Playing a Hole"
          items={[
            'The map shows your current position (Blue), predicted landing zone (Target), and the Green (Red Flag).',
            'Use the Club Selector at the bottom to choose your club. The dispersion ellipse (blue oval) updates automatically.',
            'Use the "AIM" slider to adjust your shot direction relative to the pin.',
            'The "Plays Like" distance accounts for wind (simulate wind via the wind icon in top right).'
          ]}
        />

        <Section 
          title="Recording Shots"
          items={[
            'Walk to your ball and tap "Record Shot (GPS)" to save your actual location.',
            'If GPS is unavailable or inaccurate, long-press anywhere on the map to manually drop your ball location.',
            'A dotted white line will track your shot history for the current hole.'
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