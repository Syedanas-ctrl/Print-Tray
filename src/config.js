'use strict';

const SERVER_PORT = Number(process.env.PRINT_TRAY_PORT);

function resolveAllowedOrigins() {
  const envOrigins = (process.env.PRINT_TRAY_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (envOrigins.length) {
    return envOrigins;
  }

  if (process.env.PRINT_TRAY_ALLOW_ALL_ORIGINS === 'true') {
    return ['*'];
  }

  return [];
}

function buildCorsOptions() {
  const allowedOrigins = resolveAllowedOrigins();

  if (allowedOrigins.includes('*')) {
    return { origin: true, credentials: false };
  }

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: false
  };
}

module.exports = {
  SERVER_PORT,
  resolveAllowedOrigins,
  buildCorsOptions
};

