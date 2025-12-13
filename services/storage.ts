
import { RoundHistory, ClubStats, GolfCourse, MapAnnotation } from "../types";
import { DEFAULT_BAG, DUVENHOF_COURSE } from "../constants";

const KEY_USER = 'pinseeker_current_user';
const KEY_SETTINGS_UNIT = 'pinseeker_unit_system';
const KEY_CLUB_BAG = 'pinseeker_club_bag';
const KEY_CUSTOM_COURSES = 'pinseeker_custom_courses';
const KEY_ANNOTATIONS = 'pinseeker_map_annotations';

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

  // --- Club Management ---
  getBag: (): ClubStats[] => {
    const data = localStorage.getItem(KEY_CLUB_BAG);
    if (data) {
      return JSON.parse(data);
    }
    return DEFAULT_BAG;
  },

  saveBag: (bag: ClubStats[]) => {
    localStorage.setItem(KEY_CLUB_BAG, JSON.stringify(bag));
  },

  resetBag: () => {
    localStorage.setItem(KEY_CLUB_BAG, JSON.stringify(DEFAULT_BAG));
    return DEFAULT_BAG;
  },
  
  // --- Course Management ---
  getCustomCourses: (): GolfCourse[] => {
    const data = localStorage.getItem(KEY_CUSTOM_COURSES);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  },

  getAllCourses: (): GolfCourse[] => {
    const custom = StorageService.getCustomCourses();
    return [DUVENHOF_COURSE, ...custom];
  },

  saveCustomCourse: (course: GolfCourse) => {
    const courses = StorageService.getCustomCourses();
    const existingIdx = courses.findIndex(c => c.id === course.id);
    
    if (existingIdx >= 0) {
      courses[existingIdx] = course;
    } else {
      courses.push(course);
    }
    
    localStorage.setItem(KEY_CUSTOM_COURSES, JSON.stringify(courses));
  },

  deleteCustomCourse: (courseId: string) => {
    const courses = StorageService.getCustomCourses();
    const newCourses = courses.filter(c => c.id !== courseId);
    localStorage.setItem(KEY_CUSTOM_COURSES, JSON.stringify(newCourses));
  },
  
  // --- Map Annotations ---
  getAnnotations: (courseId: string, holeNumber: number): MapAnnotation[] => {
    const data = localStorage.getItem(KEY_ANNOTATIONS);
    if (!data) return [];
    const all: MapAnnotation[] = JSON.parse(data);
    return all.filter(a => a.courseId === courseId && a.holeNumber === holeNumber);
  },

  saveAnnotation: (note: MapAnnotation) => {
    const data = localStorage.getItem(KEY_ANNOTATIONS);
    const all: MapAnnotation[] = data ? JSON.parse(data) : [];
    all.push(note);
    localStorage.setItem(KEY_ANNOTATIONS, JSON.stringify(all));
  },

  deleteAnnotation: (noteId: string) => {
    const data = localStorage.getItem(KEY_ANNOTATIONS);
    if (!data) return;
    const all: MapAnnotation[] = JSON.parse(data);
    const filtered = all.filter(a => a.id !== noteId);
    localStorage.setItem(KEY_ANNOTATIONS, JSON.stringify(filtered));
  },
  // -----------------------

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
