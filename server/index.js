const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const {
  buildComparisonQuery,
  buildSingleElectionQuery,
  getElectionById,
  listElections,
} = require('./config/elections');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const app = express();
app.use(cors());

app.get('/api/elections', (req, res) => {
  res.json(listElections());
});

app.get('/api/elections/:fromId/compare/:toId', async (req, res) => {
  const fromElection = getElectionById(req.params.fromId);
  const toElection = getElectionById(req.params.toId);

  if (!fromElection || !toElection) {
    return res.status(404).json({ error: 'Unknown election selection' });
  }

  try {
    const result = await pool.query(buildComparisonQuery(fromElection, toElection));
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.get('/api/elections/:electionId', async (req, res) => {
  const election = getElectionById(req.params.electionId);

  if (!election) {
    return res.status(404).json({ error: 'Unknown election' });
  }

  try {
    const result = await pool.query(buildSingleElectionQuery(election));
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

const port = process.env.PORT || 5002;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
