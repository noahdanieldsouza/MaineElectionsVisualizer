import React, { useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { GeoProvider } from './infrastructure/GeoMatchContext';
import { DEFAULT_ELECTION, ELECTIONS, getElectionById } from './config/elections';
import ElectionMap from './data_views/ElectionMap';
import ElectionComparison from './data_views/ElectionComparison';

const App = () => {
  const [selectedOption, setSelectedOption] = useState(DEFAULT_ELECTION);
  const [secondOption, setSecondOption] = useState({ year: null, type: null });
  const [selectedFilter, setSelectedFilter] = useState('close');
  const [dataComparison, setDataComparison] = useState('None');
  const [selectedType, setSelectedType] = useState('votes');

  return (
    <>
      <GeoProvider>
        <div style={{ position: 'relative' }}>
          {/* Dropdown Container */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '60px',
              display: 'flex',
              gap: '12px',
              background: 'white',
              padding: '8px 12px',
              borderRadius: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              zIndex: 1100,
            }}
          >
            {/* First Dropdown */}
            <div>
              <label htmlFor="data-select" style={{ marginRight: '6px' }}>Dataset:</label>
              <select
                id="data-select"
                value={selectedOption.id}
                onChange={(e) => {
                  const found = getElectionById(e.target.value);
                  if (found) {
                    setSelectedOption(found);
                  }
                }}
              >
                {ELECTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Second Dropdown */}
            <div>
              <label htmlFor="filter-select" style={{ marginRight: '6px' }}>Show Me:</label>
              <select
                id="filter-select"
                onChange={(e) => setDataComparison(e.target.value)}
              >
                <option value="None">None</option>
                <option value="party shift from">Party Shift</option>
              </select>
            </div>

            {/* Third Dropdown */}
            <div>
              <label htmlFor="data-select-2" style={{ marginRight: '6px' }}>Dataset 2:</label>
              <select
                id="data-select-2"
                value={secondOption.id || ''}
                onChange={(e) => {
                  const found = getElectionById(e.target.value);
                  setSecondOption(found || { year: null, type: null });
                }}
              >
                <option value="">None</option>
                {ELECTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Second Filter Dropdown */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: '50px',
              left: '60px',
              display: 'flex',
              gap: '12px',
              background: 'white',
              padding: '8px 12px',
              borderRadius: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              zIndex: 1100,
            }}
          >
            <div>
              <label htmlFor="filter-select-main" style={{ marginRight: '6px' }}>Filter By:</label>
              <select
                id="filter-select-main"
                onChange={(e) => setSelectedFilter(e.target.value)}
              >
                <option value="close">Close Races</option>
                <option value="dem">Dem Leading</option>
                <option value="rep">Rep Leading</option>
              </select>
            </div>
            <div>
              <label htmlFor="display-type-select" style={{ marginRight: '6px' }}>Show as:</label>
              <select
                id="display-type-select"
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="votes">votes</option>
                <option value="percent">percent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Conditional Rendering */}
        {!secondOption.year || dataComparison === 'None' ? (
          <ElectionMap key={selectedOption.id} election={selectedOption} filter={selectedFilter} type={selectedType} />
        ) : (
          <ElectionComparison
            key={`${selectedOption.id}-${secondOption.id}-${dataComparison}-${selectedFilter}-${selectedType}`}
            fromElection={selectedOption}
            toElection={secondOption}
            filter={selectedFilter}
            comparison={dataComparison}
            type={selectedType}
          />
        )}
      </GeoProvider>
    </>
  );
};

export default App;
