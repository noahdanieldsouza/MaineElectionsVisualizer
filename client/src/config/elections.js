export const ELECTIONS = [
  {
    id: '2024_president',
    year: '2024',
    type: 'president',
    apiPath: '/api/elections/2024_president',
    label: '2024 President',
  },
  {
    id: '2024_us_senate',
    year: '2024',
    type: 'sen',
    apiPath: '/api/elections/2024_us_senate',
    label: '2024 Senate',
  },
  {
    id: '2024_state_senate',
    year: '2024',
    type: 'statesen',
    apiPath: '/api/elections/2024_state_senate',
    label: '2024 State Senate',
  },
   {
    id: '2020_president',
    year: '2020',
    type: 'pres',
    apiPath: '/api/elections/2020_president',
    label: '2020 President',
  },
];

export const DEFAULT_ELECTION = ELECTIONS[0];

export const getElectionById = (id) => ELECTIONS.find((election) => election.id === id);
