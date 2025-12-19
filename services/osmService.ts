import { LatLng, GolfHole } from '../types';

export interface DiscoveredCourse {
  id: string;
  name: string;
  lat: number;
  lng: number;
  tags: any;
}

/**
 * OsmService uses the Overpass API to fetch golf course features.
 */
export const OsmService = {
  /**
   * Finds golf course boundaries/centers within a radius
   */
  findNearbyCourses: async (lat: number, lng: number, radiusMeters: number = 30000): Promise<DiscoveredCourse[]> => {
    const query = `
      [out:json][timeout:25];
      (
        node["leisure"="golf_course"](around:${radiusMeters},${lat},${lng});
        way["leisure"="golf_course"](around:${radiusMeters},${lat},${lng});
        relation["leisure"="golf_course"](around:${radiusMeters},${lat},${lng});
      );
      out center;
    `;

    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("OSM Fetch Failed");
    const data = await response.json();
    
    return data.elements.map((el: any) => ({
      id: el.id.toString(),
      name: el.tags.name || "Unnamed Course",
      lat: el.lat || el.center.lat,
      lng: el.lon || el.center.lng,
      tags: el.tags
    }));
  },

  /**
   * Search for a course by name, optionally filtered by country code
   */
  searchCoursesByName: async (name: string, countryCode?: string): Promise<DiscoveredCourse[]> => {
    const countryFilter = countryCode ? `["addr:country"="${countryCode.toUpperCase()}"]` : "";
    const query = `
      [out:json][timeout:25];
      (
        node["leisure"="golf_course"]["name"~"${name}",i]${countryFilter};
        way["leisure"="golf_course"]["name"~"${name}",i]${countryFilter};
        relation["leisure"="golf_course"]["name"~"${name}",i]${countryFilter};
      );
      out center;
    `;

    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("OSM Fetch Failed");
    const data = await response.json();
    
    return data.elements.map((el: any) => ({
      id: el.id.toString(),
      name: el.tags.name || "Unnamed Course",
      lat: el.lat || el.center.lat,
      lng: el.lon || el.center.lng,
      tags: el.tags
    }));
  },

  /**
   * Fetch specific hole positions (tees/greens) for a selected course area
   */
  fetchHoleData: async (lat: number, lng: number, radiusMeters: number = 2000): Promise<GolfHole[]> => {
    const query = `
      [out:json][timeout:25];
      (
        node["golf"~"tee|green"](around:${radiusMeters},${lat},${lng});
        way["golf"~"tee|green"](around:${radiusMeters},${lat},${lng});
      );
      out center;
    `;

    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("OSM Fetch Failed");
    
    const data = await response.json();
    const elements = data.elements;

    const tees: { [key: string]: LatLng } = {};
    const greens: { [key: string]: LatLng } = {};

    elements.forEach((el: any) => {
      const pos = { lat: el.lat || el.center.lat, lng: el.lon || el.center.lng };
      const holeNum = el.tags.ref || el.tags.hole;
      const type = el.tags.golf;

      if (holeNum && !isNaN(parseInt(holeNum))) {
        if (type === 'tee') tees[holeNum] = pos;
        if (type === 'green') greens[holeNum] = pos;
      }
    });

    const holes: GolfHole[] = [];
    for (let i = 1; i <= 18; i++) {
      holes.push({
        number: i,
        par: 4,
        tee: tees[i.toString()] || { lat: 0, lng: 0 },
        green: greens[i.toString()] || { lat: 0, lng: 0 }
      });
    }

    return holes;
  }
};
