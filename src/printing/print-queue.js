'use strict';

const log = require('electron-log');

let printQueue = Promise.resolve();

/**
 * Enqueues a print task to ensure sequential execution.
 * Each task waits for the previous one to complete before executing.
 *
 * @param {Function} task - Async function that performs the print job
 * @returns {Promise} Promise that resolves when the task completes
 */
function enqueuePrint(task) {
  const next = printQueue.then(task);
  printQueue = next.catch((error) => {
    log.error('Print queue task failed', error);
  });
  return next;
}

module.exports = {
  enqueuePrint
};

