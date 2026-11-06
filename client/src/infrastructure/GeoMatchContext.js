import React, { createContext, useContext, useEffect, useState } from 'react';
import stringSimilarity from 'string-similarity';

const GeoContext = createContext();
export const useGeoContext = () => useContext(GeoContext);

const GEOJSON_SOURCE = 'https://services1.arcgis.com/RbMX0mRVOFNTdLzd/arcgis/rest/services/Maine_Town_and_Townships_Boundary_Polygons/FeatureServer/0/query';
const GEOJSON_PAGE_SIZE = 2000;

export const GeoProvider = ({ children }) => {
  const [geoData, setGeoData] = useState(null);
  const [townNames, setTownNames] = useState([]);
  const [matchMaps, setMatchMaps] = useState({}); // cache: { datasetKey: matchMap }
  const [currentMatchMap, setCurrentMatchMap] = useState({});

  useEffect(() => {
    const load = async () => {
      const features = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const queryUrl = new URL(GEOJSON_SOURCE);
        queryUrl.search = new URLSearchParams({
          where: '1=1',
          outFields: 'TOWN,GEOCODE',
          returnGeometry: 'true',
          f: 'geojson',
          resultOffset: String(offset),
          resultRecordCount: String(GEOJSON_PAGE_SIZE),
        }).toString();

        const geoRes = await fetch(queryUrl.toString());
        if (!geoRes.ok) {
          throw new Error(`Failed to load geojson: ${geoRes.status} ${geoRes.statusText}`);
        }

        const geo = await geoRes.json();
        features.push(...(geo.features || []));

        hasMore = Boolean(geo.properties?.exceededTransferLimit) && (geo.features || []).length > 0;
        offset += GEOJSON_PAGE_SIZE;
      }

      const geo = { type: 'FeatureCollection', features };
      setGeoData(geo);

      const names = geo.features
        .map(f => f.properties?.TOWN?.toLowerCase())
        .filter(Boolean);

      setTownNames(names);
    };
    load().catch((error) => {
      console.error('Failed to load Maine boundary GeoJSON:', error);
    });
  }, []);

  const computeMatchMap = (datasetKey, voteKeys) => {
    if (matchMaps[datasetKey]) {
      setCurrentMatchMap(matchMaps[datasetKey]);
      return;
    }

    const newMap = {};
    townNames.forEach(town => {
      const { bestMatch } = stringSimilarity.findBestMatch(town, voteKeys);
      if (bestMatch.rating > 0.6) {
        newMap[town] = bestMatch.target;
      }
    });

    setMatchMaps(prev => ({ ...prev, [datasetKey]: newMap }));
    setCurrentMatchMap(newMap);
  };

  return (
    <GeoContext.Provider value={{ geoData, townNames, matchMap: currentMatchMap, computeMatchMap }}>
      {children}
    </GeoContext.Provider>
  );
};
