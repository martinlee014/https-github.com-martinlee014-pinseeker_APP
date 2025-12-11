import { FC } from 'react';
import { ClubStats } from '../types';

interface ClubSelectorProps {
  clubs: ClubStats[];
  selectedClub: ClubStats;
  onSelect: (club: ClubStats) => void;
  useYards: boolean;
}

const ClubSelector: FC<ClubSelectorProps> = ({ clubs, selectedClub, onSelect, useYards }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-2 border border-gray-700">
      <select 
        className="bg-transparent text-white font-bold w-full outline-none"
        value={selectedClub.name}
        onChange={(e) => {
          const club = clubs.find(c => c.name === e.target.value);
          if (club) onSelect(club);
        }}
      >
        {clubs.map(c => {
          const carry = useYards ? c.carry * 1.09361 : c.carry;
          const unit = useYards ? 'yd' : 'm';
          return (
            <option key={c.name} value={c.name} className="bg-gray-800 text-white">
              {c.name} ({Math.round(carry)}{unit})
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default ClubSelector;