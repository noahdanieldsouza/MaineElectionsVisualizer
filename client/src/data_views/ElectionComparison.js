import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import axios from 'axios';
import RollingList from './RollingList';
import 'leaflet/dist/leaflet.css';
import { useGeoContext } from '../infrastructure/GeoMatchContext';
import { buildComparisonVoteMap, normalizeTownKey } from '../utils/electionData';

const ElectionComparison = ({ fromElection, toElection, filter, comparison, type }) => {
  const [votes, setVotes] = useState({});
  const { geoData, computeMatchMap, matchMap, townNames } = useGeoContext();

  useEffect(() => {
    if (!fromElection || !toElection || !geoData || townNames.length === 0) return;

    let active = true;

    axios.get(`/api/elections/${fromElection.id}/compare/${toElection.id}?comparison=${encodeURIComponent(comparison || '')}`).then((res) => {
      if (!active) return;

      const voteMap = buildComparisonVoteMap(res.data);
      setVotes(voteMap);
      computeMatchMap(`${fromElection.id}-${toElection.id}`, Object.keys(voteMap));
    });

    return () => {
      active = false;
    };
  }, [comparison, computeMatchMap, fromElection, geoData, toElection, townNames]);

  const getColor = (townName) => {
    const bestMatch = matchMap[townName];
    if (!bestMatch || !votes[bestMatch]) return '#f7f7f7';

    const { from_democrat, from_republican, from_other, to_democrat, to_republican, to_other } = votes[bestMatch];
    const fromTotal = from_democrat + from_republican + from_other;
    const toTotal = to_democrat + to_republican + to_other;

    if (fromTotal === 0 || toTotal === 0) return '#f7f7f7';

    const shift = ((to_democrat / toTotal) * 100 - (from_democrat / fromTotal) * 100) - ((to_republican / toTotal) * 100 - (from_republican / fromTotal) * 100);

    if (Math.abs(shift) < 0.1) return '#f7f7f7';
    if (shift > 15) return '#084081';
    if (shift > 10) return '#0868ac';
    if (shift > 5) return '#2b8cbe';
    if (shift > 0) return '#a6bddb';
    if (shift > -5) return '#fddbc7';
    if (shift > -10) return '#fc9272';
    if (shift > -15) return '#de2d26';
    return '#a50f15';
  };

  const onEachFeature = (feature, layer) => {
    const townName = normalizeTownKey(feature?.properties?.TOWN);
    const bestMatch = matchMap[townName];

    layer.setStyle({
      fillColor: getColor(townName),
      fillOpacity: 0.7,
      weight: 1,
      color: '#999',
    });

    if (!bestMatch || !votes[bestMatch]) {
      layer.bindPopup(`${townName}<br/>No data`);
      return;
    }

    const { from_democrat, from_republican, from_other, to_democrat, to_republican, to_other } = votes[bestMatch];
    const fromTotal = from_democrat + from_republican + from_other;
    const toTotal = to_democrat + to_republican + to_other;

    let popupContent = `${townName}<br/>Invalid vote totals`;
    if (fromTotal > 0 && toTotal > 0) {
      const fromDemPct = (from_democrat / fromTotal) * 100;
      const toDemPct = (to_democrat / toTotal) * 100;
      const fromRepPct = (from_republican / fromTotal) * 100;
      const toRepPct = (to_republican / toTotal) * 100;

      popupContent = `
        ${townName}<br/>
        Democratic Shift: ${(toDemPct - fromDemPct).toFixed(1)}%<br/>
        Republican Shift: ${(toRepPct - fromRepPct).toFixed(1)}%
      `;
    }

    layer.bindPopup(popupContent);
  };

  if (!fromElection || !toElection || !geoData || townNames.length === 0 || Object.keys(votes).length === 0 || Object.keys(matchMap).length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <RollingList voteData={votes} filter={filter} type={type} isComparison={true} />
      <MapContainer center={[45.25, -69.445]} zoom={7} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <GeoJSON data={geoData} onEachFeature={onEachFeature} />
      </MapContainer>
    </div>
  );
};

export default ElectionComparison;
