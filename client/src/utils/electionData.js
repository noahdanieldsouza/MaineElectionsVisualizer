export const normalizeTownKey = (value) => value?.trim().toLowerCase();

export const normalizeVoteRow = (row, voteFieldMap) => {
  const voteMap = {};

  for (const [internalKey, sourceKey] of Object.entries(voteFieldMap)) {
    voteMap[internalKey] = Number(row[sourceKey]) || 0;
  }

  return voteMap;
};

export const buildSingleElectionVoteMap = (rows, voteFieldMap) => {
  const voteMap = {};

  rows.forEach((row) => {
    const key = normalizeTownKey(row.municipality);
    if (!key) return;

    voteMap[key] = normalizeVoteRow(row, voteFieldMap);
  });

  return voteMap;
};

export const buildComparisonVoteMap = (rows) => {
  const voteMap = {};

  rows.forEach((row) => {
    const key = normalizeTownKey(row.municipality);
    if (!key) return;

    const from_dem = Number(row.from_democrat_votes) || 0;
    const from_rep = Number(row.from_republican_votes) || 0;
    const from_other = Number(row.from_other) || 0;
    const to_dem = Number(row.to_democrat_votes) || 0;
    const to_rep = Number(row.to_republican_votes) || 0;
    const to_other = Number(row.to_other) || 0;

    voteMap[key] = {
      from_democrat: from_dem,
      from_republican: from_rep,
      from_other,
      to_democrat: to_dem,
      to_republican: to_rep,
      to_other,
      dem_difference: Number(row.dem_difference) || 0,
      rep_difference: Number(row.rep_difference) || 0,
      other_vote_diff: to_other - from_other,
    };
  });

  return voteMap;
};
