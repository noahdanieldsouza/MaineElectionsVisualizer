import React from "react";

/**
 * RollingList - robust, clear handling of:
 * - single-dataset mode (non-comparison) with fields like dem_votes / republican / other
 * - comparison mode with to*from* raw counts and optional *_difference fields
 * - sorting by filter: 'close', 'dem', 'rep'
 * - display type: 'votes' or 'percent' (percent = share of total * 100)
 */

/* ---------- helper key lists (common variants) ---------- */
const KEYS = {
  dem: [
    "democrat",
    "dem_votes",
    "dem_votes_total",
    "dem",
    "dem_vote",
    "democrat_votes",
    "demVotes",
  ],
  rep: [
    "republican",
    "rep_votes",
    "rep",
    "rep_vote",
    "republican_votes",
    "repVotes",
  ],
  other: ["other", "other_votes", "other_vote", "otherVotes"],
  toDem: ["toDem", "to_dem", "to_democrat", "to_dem_votes", "toDemocrat"],
  fromDem: ["fromDem", "from_dem", "from_democrat", "from_dem_votes"],
  toRep: ["toRep", "to_rep", "to_republican", "to_rep_votes", "toRepublican"],
  fromRep: ["fromRep", "from_rep", "from_republican", "from_rep_votes"],
  toOther: ["toOther", "to_other", "to_other_votes"],
  fromOther: ["fromOther", "from_other", "from_other_votes"],
  demDiff: ["dem_difference", "dem_diff", "demDiff"],
  repDiff: ["rep_difference", "rep_diff", "repDiff"],
  otherDiff: ["other_difference", "other_vote_diff", "otherDiff", "other_vote_diff"],
};

/* ---------- utility helpers ---------- */
const getNum = (obj = {}, keys = []) => {
  for (const k of keys) {
    if (k in obj) {
      const n = Number(obj[k]);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
};

const formatSigned = (n) => (n >= 0 ? `+${n}` : `${n}`);
const formatSignedFixed = (n, decimals = 1) =>
  `${n >= 0 ? "+" : ""}${Number(n).toFixed(decimals)}`;

/* ---------- percent/share calculations ---------- */
const nonComparisonPercentShares = (votes) => {
  const dem = getNum(votes, KEYS.dem);
  const rep = getNum(votes, KEYS.rep);
  const other = getNum(votes, KEYS.other);
  const total = dem + rep + other;
  return {
    democrat: total ? (dem / total) * 100 : 0,
    republican: total ? (rep / total) * 100 : 0,
    other: total ? (other / total) * 100 : 0,
  };
};

const comparisonPercentChanges = (votes) => {
  // read to/from raw counts (robust to key variants)
  const toDem = getNum(votes, KEYS.toDem);
  const fromDem = getNum(votes, KEYS.fromDem);
  const toRep = getNum(votes, KEYS.toRep);
  const fromRep = getNum(votes, KEYS.fromRep);
  const toOther = getNum(votes, KEYS.toOther);
  const fromOther = getNum(votes, KEYS.fromOther);

  const toTotal = toDem + toRep + toOther;
  const fromTotal = fromDem + fromRep + fromOther;

  const pct = (n, total) => (total ? (n / total) * 100 : 0);

  const demChange = pct(toDem, toTotal) - pct(fromDem, fromTotal);
  const repChange = pct(toRep, toTotal) - pct(fromRep, fromTotal);
  const otherChange = pct(toOther, toTotal) - pct(fromOther, fromTotal);

  return {
    democrat: demChange,
    republican: repChange,
    other: otherChange,
  };
};

const comparisonVoteDiffs = (votes) => {
  // prefer explicit provided diff fields, fall back to to - from
  const demDiffProvided = getNum(votes, KEYS.demDiff);
  const repDiffProvided = getNum(votes, KEYS.repDiff);
  const otherDiffProvided = getNum(votes, KEYS.otherDiff);

  const toDem = getNum(votes, KEYS.toDem);
  const fromDem = getNum(votes, KEYS.fromDem);
  const toRep = getNum(votes, KEYS.toRep);
  const fromRep = getNum(votes, KEYS.fromRep);
  const toOther = getNum(votes, KEYS.toOther);
  const fromOther = getNum(votes, KEYS.fromOther);

  return {
    democrat: demDiffProvided || (toDem - fromDem),
    republican: repDiffProvided || (toRep - fromRep),
    other: otherDiffProvided || (toOther - fromOther),
  };
};

/* ---------- metric for sorting ---------- */
function getTownMetric(votes, { isComparison, filter, type }) {
  if (isComparison) {
    if (type === "percent") {
      const ch = comparisonPercentChanges(votes);
      if (filter === "close") {
        // towns with least overall percent change for main parties (dem + rep)
        return Math.abs(ch.democrat) + Math.abs(ch.republican);
      }
      if (filter === "dem") return ch.democrat; // bigger positive => dem gained share
      if (filter === "rep") return ch.republican; // bigger positive => rep gained share
      return 0;
    } else {
      // votes mode: use raw vote diffs
      const diffs = comparisonVoteDiffs(votes);
      if (filter === "close") {
        return Math.abs(diffs.democrat) + Math.abs(diffs.republican);
      }
      if (filter === "dem") return diffs.democrat;
      if (filter === "rep") return diffs.republican;
      return 0;
    }
  }

  // non-comparison (single dataset)
  if (type === "percent") {
    const pct = nonComparisonPercentShares(votes);
    if (filter === "close") return Math.abs(pct.democrat - pct.republican);
    if (filter === "dem") return pct.democrat - pct.republican;
    if (filter === "rep") return pct.republican - pct.democrat;
    return 0;
  } else {
    // raw votes
    const dem = getNum(votes, KEYS.dem);
    const rep = getNum(votes, KEYS.rep);
    if (filter === "close") return Math.abs(dem - rep);
    if (filter === "dem") return dem - rep;
    if (filter === "rep") return rep - dem;
    return 0;
  }
}

/* ---------- sort helper ---------- */
function sortVoteData(voteData, props) {
  const entries = Object.entries(voteData);
  const { filter } = props;

  entries.sort(([aTown, aVotes], [bTown, bVotes]) => {
    const metricA = getTownMetric(aVotes, props);
    const metricB = getTownMetric(bVotes, props);

    // 'close' -> ascending (smaller = closer)
    if (filter === "close") return metricA - metricB;
    // otherwise prefer larger metric (dem/rep wins)
    return metricB - metricA;
  });

  return entries;
}

/* ---------- formatting for display ---------- */
function formatVotes(votes, { isComparison, type }) {
  if (isComparison) {
    if (type === "percent") {
      const ch = comparisonPercentChanges(votes);
      return {
        democrat: formatSignedFixed(ch.democrat, 1) + "%",
        republican: formatSignedFixed(ch.republican, 1) + "%",
        other: formatSignedFixed(ch.other, 1) + "%",
      };
    }
    // votes mode: raw change (use provided diffs or fallback)
    const diffs = comparisonVoteDiffs(votes);
    return {
      democrat: formatSigned(Math.round(diffs.democrat)),
      republican: formatSigned(Math.round(diffs.republican)),
      other: formatSigned(Math.round(diffs.other)),
    };
  }

  // non-comparison display
  if (type === "percent") {
    const pct = nonComparisonPercentShares(votes);
    return {
      democrat: `${pct.democrat.toFixed(1)}%`,
      republican: `${pct.republican.toFixed(1)}%`,
      other: `${pct.other.toFixed(1)}%`,
    };
  }

  // raw votes display
  return {
    democrat: getNum(votes, KEYS.dem),
    republican: getNum(votes, KEYS.rep),
    other: getNum(votes, KEYS.other),
  };
}

/* ---------- component ---------- */
const RollingList = ({ voteData, filter = "close", type = "votes", isComparison = false }) => {
  if (!voteData || Object.keys(voteData).length === 0) return null;

  const sortedEntries = sortVoteData(voteData, { filter, type, isComparison });

  return (
    <div
      style={{
        position: "absolute",
        top: 100,
        left: 20,
        width: 320,
        maxHeight: "90vh",
        overflowY: "auto",
        backgroundColor: "white",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        padding: 16,
        zIndex: 500,
      }}
    >
      <h3 style={{ marginTop: 0 }}>Vote Data by Town</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {sortedEntries.map(([town, votes]) => {
          const { democrat, republican, other } = formatVotes(votes, {
            isComparison,
            type,
          });

          return (
            <li key={town} style={{ paddingBottom: 12, borderBottom: "1px solid #eee" }}>
              <strong>{town}</strong>
              <br />
              🟦 Dem: {democrat}
              <br />
              🟥 Rep: {republican}
              <br />
              🟩 Other: {other}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RollingList;
