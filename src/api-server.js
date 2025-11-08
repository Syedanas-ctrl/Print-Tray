'use strict';

const express = require('express');
const cors = require('cors');
const os = require('node:os');
const { app } = require('electron');
const log = require('electron-log');

const { SERVER_PORT, buildCorsOptions } = require('./config');
const { listPrinters, enqueuePrint, performPrintJob } = require('./printing');

async function startApiServer() {
  const server = express();
  server.use(cors(buildCorsOptions()));
  server.use(express.json({ limit: '10mb' }));

  server.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      platform: os.platform(),
      release: os.release(),
      version: app.getVersion()
    });
  });

  server.get('/printers', async (_req, res) => {
    try {
      const printers = await listPrinters();
      res.json({ printers });
    } catch (error) {
      log.error('Failed to list printers', error);
      res.status(500).json({ error: 'Failed to list printers' });
    }
  });

  server.post('/print', async (req, res) => {
    try {
      const jobResult = await enqueuePrint(() => performPrintJob(req.body || {}));
      res.json({ success: Boolean(jobResult) });
    } catch (error) {
      log.error('Print job failed', error);
      const status = error.code === 'INVALID_PAYLOAD' ? 400 : 500;
      res.status(status).json({ error: error.message || 'Print job failed' });
    }
  });

  return new Promise((resolve, reject) => {
    server
      .listen(SERVER_PORT, '127.0.0.1', () => {
        log.info(`ZAT tray API listening on http://127.0.0.1:${SERVER_PORT}`);
        resolve();
      })
      .on('error', (error) => {
        log.error('Failed to start API server', error);
        reject(error);
      });
  });
}

module.exports = {
  startApiServer
};

