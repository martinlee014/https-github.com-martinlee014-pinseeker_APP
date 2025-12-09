import { RoundHistory } from "../types";

const KEY_USER = 'pinseeker_current_user';
const KEY_SETTINGS_UNIT = 'pinseeker_unit_system';

export const StorageService = {
  getCurrentUser: (): string | null => {
    return localStorage.getItem(KEY_USER);
  },
  
  setCurrentUser: (username: string) => {
    localStorage.setItem(KEY_USER, username);
  },
  
  clearCurrentUser: () => {
    localStorage.removeItem(KEY_USER);
  },

  getUseYards: (): boolean => {
    return localStorage.getItem(KEY_SETTINGS_UNIT) === 'yards';
  },

  setUseYards: (useYards: boolean) => {
    localStorage.setItem(KEY_SETTINGS_UNIT, useYards ? 'yards' : 'meters');
  },

  saveHistory: (username: string, history: RoundHistory) => {
    const key = `history_${username}`;
    const existingStr = localStorage.getItem(key);
    const existing: RoundHistory[] = existingStr ? JSON.parse(existingStr) : [];
    existing.unshift(history); // Add to top
    localStorage.setItem(key, JSON.stringify(existing));
  },

  getHistory: (username: string): RoundHistory[] => {
    const key = `history_${username}`;
    const str = localStorage.getItem(key);
    return str ? JSON.parse(str) : [];
  },
  
  // Temp game state for recovery
  saveTempState: (username: string, state: any) => {
    localStorage.setItem(`temp_game_${username}`, JSON.stringify(state));
  },
  
  getTempState: (username: string) => {
    const s = localStorage.getItem(`temp_game_${username}`);
    return s ? JSON.parse(s) : null;
  },
  
  clearTempState: (username: string) => {
    localStorage.removeItem(`temp_game_${username}`);
  }
};