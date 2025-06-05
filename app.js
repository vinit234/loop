const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const ingestRouter = require('./routes/ingest');
const statusRouter = require('./routes/status');

const app = express();

app.use(cors());
app.use(express.json());


app.use('/ingest', ingestRouter);
app.use('/status', statusRouter);


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

module.exports = app;
