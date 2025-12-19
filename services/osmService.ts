import { LatLng, GolfHole } from '../types';

export interface DiscoveredCourse {
  id: string;
  name: string;
  lat: number;
  lng: number;
  country?: string;
  city?: string;
  holeCount?: number;
}

/**
 * OsmService: The global discovery engine for golf infrastructure.
 */
export const OsmService = {
  /**
   * Bulk search for courses nearby or by name/country
   */
  discoverCourses: async (params: { 
    name?: string, 
    countryCode?: string, 
    lat?: number, 
    lng?: number,
    radius?: number 
  }): Promise<DiscoveredCourse[]> => {
    const { name, countryCode, lat, lng, radius = 50000 } = params;
    
    // Improved logic: Use Area filtering for countries instead of tag-based filtering
    let areaDef = '';
    if (countryCode) {
      areaDef = `area["ISO3166-1"="${countryCode.toUpperCase()}"]->.searchArea;`;
    }

    let filter = '["leisure"="golf_course"]';
    if (name) {
      // Use case-insensitive regex for name search
      filter += `["name"~"${name}",i]`;
    }
    
    const scope = countryCode ? '(area.searchArea)' : (lat && lng ? `(around:${radius},${lat},${lng})` : '');
    
    const query = `
      [out:json][timeout:30];
      ${areaDef}
      (
        node${filter}${scope};
        way${filter}${scope};
        relation${filter}${scope};
      );
      out center;
    `;

    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("OSM_SEARCH_ERROR");
    
    const data = await response.json();
    if (!data.elements) return [];

    return data.elements.map((el: any) => ({
      id: el.id.toString(),
      name: el.tags.name || "Unnamed Course",
      lat: el.lat || el.center.lat,
      lng: el.lon || el.center.lng,
      country: el.tags["addr:country"] || countryCode,
      city: el.tags["addr:city"] || el.tags["addr:suburb"] || el.tags["addr:province"],
      holeCount: parseInt(el.tags.holes) || 18
    }));
  },

  /**
   * Deep fetch of all tees and greens within a course boundary
   */
  fetchFullCourseMap: async (lat: number, lng: number, radius: number = 2000): Promise<GolfHole[]> => {
    // We look for any golf-related nodes/ways in the immediate vicinity
    const query = `
      [out:json][timeout:45];
      (
        node["golf"~"tee|green"](around:${radius},${lat},${lng});
        way["golf"~"tee|green"](around:${radius},${lat},${lng});
      );
      out center;
    `;

    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("OSM_HOLE_FETCH_ERROR");
    
    const data = await response.json();
    const elements = data.elements || [];

    const tees: { [key: string]: LatLng } = {};
    const greens: { [key: string]: LatLng } = {};

    elements.forEach((el: any) => {
      const pos = { lat: el.lat || el.center.lat, lng: el.lon || el.center.lng };
      // Some use 'ref', some use 'hole' tags in OSM
      const holeNum = el.tags.ref || el.tags.hole;
      const type = el.tags.golf;

      if (holeNum && !isNaN(parseInt(holeNum))) {
        if (type === 'tee') tees[holeNum] = pos;
        if (type === 'green') greens[holeNum] = pos;
      }
    });

    const holes: GolfHole[] = [];
    // Standard 18 hole set
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
