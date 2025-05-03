import path from 'path';

export default ({ env }) => {
  const client = env('DB_CLIENT', 'sqlite');

  const connection = {
    client,
    connection: {
      connectionString: env('DB_URL'),
      host: env('DB_HOST', 'localhost'),
      port: env.int('DB_PORT', 5432),
      database: env('DB_NAME', 'strapi'),
      user: env('DB_USERNAME', 'strapi'),
      password: env('DB_PASSWORD', 'strapi'),
      ssl: env.bool('DB_SSL', false) && {
        key: env('DB_SSL_KEY', undefined),
        cert: env('DB_SSL_CERT', undefined),
        ca: env('DB_SSL_CA', undefined),
        capath: env('DB_SSL_CAPATH', undefined),
        cipher: env('DB_SSL_CIPHER', undefined),
        rejectUnauthorized: env.bool('DB_SSL_REJECT_UNAUTHORIZED', true),
      },
      schema: env('DB_SCHEMA', 'public'),
    },
    pool: {
      min: 0,
      max: 1,
      acquireTimeoutMillis: 60000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    },
    acquireConnectionTimeout: env.int('DB_CONNECTION_TIMEOUT', 60000),
    idleTimeoutMillis: env.int('DB_IDLE_TIMEOUT', 30000),
    reapIntervalMillis: env.int('DB_REAP_INTERVAL', 1000),
    createEntryIntervalMillis: env.int('DB_CREATE_ENTRY_INTERVAL', 200),
  };

  return {
    connection,
  };
};
