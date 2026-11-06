const ELECTIONS = [
  {
    id: '2024_president',
    year: '2024',
    type: 'president',
    label: '2024 President',
    table: 'election_results_2024_president',
    democraticColumn: 'democratic',
    republicanColumn: 'republican',
    totalColumn: 'tbc',
  },
  {
    id: '2024_us_senate',
    year: '2024',
    type: 'sen',
    label: '2024 Senate',
    table: 'election_results_2024_senate',
    democraticColumn: 'democratic',
    republicanColumn: 'republican',
    totalColumn: 'tbc',
  },
  {
    id: '2024_state_senate',
    year: '2024',
    type: 'statesen',
    label: '2024 State Senate',
    table: 'election_results_2024_statesen',
    democraticColumn: 'democratic',
    republicanColumn: 'republican',
    totalColumn: 'tbc',
  },
  {
    id: '2020_president',
    year: '2020',
    type: 'pres',
    label: '2020 President',
    table: 'election_results_2020_president',
    democraticColumn: 'democratic',
    republicanColumn: 'republican',
    totalColumn: 'tbc',
  },
];

const byId = new Map(ELECTIONS.map((election) => [election.id, election]));

function listElections() {
  return ELECTIONS.map(({ democraticColumn, republicanColumn, totalColumn, ...rest }) => rest);
}

function getElectionById(id) {
  return byId.get(id);
}

function quoteIdent(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

function buildSingleElectionQuery(election) {
  return `
    SELECT
      TRIM(REPLACE(REPLACE(municipality, 'Twp', ''), 'twp', '')) AS municipality,
      SUM(${quoteIdent(election.democraticColumn)}) AS democrat_votes,
      SUM(${quoteIdent(election.republicanColumn)}) AS republican_votes,
      SUM(${quoteIdent(election.totalColumn)}) - SUM(${quoteIdent(election.republicanColumn)}) - SUM(${quoteIdent(election.democraticColumn)}) AS other
    FROM ${quoteIdent(election.table)}
    WHERE municipality IS NOT NULL AND cty IS NOT NULL
    GROUP BY TRIM(REPLACE(REPLACE(municipality, 'Twp', ''), 'twp', ''));
  `;
}

function buildComparisonQuery(fromElection, toElection) {
  return `
    SELECT
      TRIM(REPLACE(REPLACE(f.municipality, 'Twp', ''), 'twp', '')) AS municipality,
      SUM(f.${quoteIdent(fromElection.democraticColumn)}) AS from_democrat_votes,
      SUM(f.${quoteIdent(fromElection.republicanColumn)}) AS from_republican_votes,
      SUM(t.${quoteIdent(toElection.democraticColumn)}) AS to_democrat_votes,
      SUM(t.${quoteIdent(toElection.republicanColumn)}) AS to_republican_votes,
      SUM(f.${quoteIdent(fromElection.totalColumn)}) - SUM(f.${quoteIdent(fromElection.republicanColumn)}) - SUM(f.${quoteIdent(fromElection.democraticColumn)}) AS from_other,
      SUM(t.${quoteIdent(toElection.democraticColumn)}) - SUM(f.${quoteIdent(fromElection.democraticColumn)}) AS dem_difference,
      SUM(t.${quoteIdent(toElection.republicanColumn)}) - SUM(f.${quoteIdent(fromElection.republicanColumn)}) AS rep_difference,
      SUM(t.${quoteIdent(toElection.totalColumn)}) - SUM(t.${quoteIdent(toElection.republicanColumn)}) - SUM(t.${quoteIdent(toElection.democraticColumn)}) AS to_other
    FROM ${quoteIdent(fromElection.table)} f
    JOIN ${quoteIdent(toElection.table)} t
      ON t.municipality = f.municipality
      AND f.cty = t.cty
    WHERE f.municipality IS NOT NULL AND f.cty IS NOT NULL
    GROUP BY TRIM(REPLACE(REPLACE(f.municipality, 'Twp', ''), 'twp', ''));
  `;
}

module.exports = {
  ELECTIONS,
  listElections,
  getElectionById,
  quoteIdent,
  buildSingleElectionQuery,
  buildComparisonQuery,
};
