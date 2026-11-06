const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');
const { ELECTIONS, getElectionById, quoteIdent } = require('../config/elections');

const TEXT_COLUMNS = new Set(['cty', 'municipality']);

function readCsv(csvPath) {
  const [header, ...rows] = fs
    .readFileSync(csvPath, 'utf8')
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .map((line) => line.split(','));

  return { columns: header.map((column) => column.trim()), rows };
}

async function importElection(client, election, csvPath) {
  const { columns, rows } = readCsv(csvPath);
  const table = quoteIdent(election.table);
  const columnDefs = columns.map((column) => `${quoteIdent(column)} ${TEXT_COLUMNS.has(column) ? 'text' : 'integer'}`);
  const placeholders = columns.map((_, index) => `$${index + 1}`);
  const insert = `INSERT INTO ${table} (${columns.map(quoteIdent).join(', ')}) VALUES (${placeholders.join(', ')})`;

  // County totals and blank spacer rows have no county code or municipality.
  const townRows = rows.filter(([cty, municipality]) => cty?.trim() && municipality?.trim());

  await client.query('BEGIN');
  try {
    await client.query(`DROP TABLE IF EXISTS ${table}`);
    await client.query(`CREATE TABLE ${table} (${columnDefs.join(', ')})`);
    for (const row of townRows) {
      await client.query(insert, row.map((value) => (value === '' ? null : value)));
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }

  console.log(`Imported ${townRows.length} rows into ${election.table}`);
}

async function main() {
  const [electionId, flag, fileArg] = process.argv.slice(2);
  const elections = electionId ? [getElectionById(electionId)] : ELECTIONS;

  if (elections.includes(undefined)) {
    console.error(`Unknown election id: ${electionId}`);
    console.error('Usage: node scripts/import-election.js [electionId] [--file path/to.csv]');
    process.exit(1);
  }

  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  await client.connect();
  try {
    for (const election of elections) {
      const defaultPath = path.resolve(__dirname, '..', '..', 'data', `${election.id}.csv`);
      await importElection(client, election, flag === '--file' ? fileArg : defaultPath);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
