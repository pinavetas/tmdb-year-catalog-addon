/**
 * Preload for the unit tests (tsx --import): deterministic tests even when the environment defines
 * addon variables. The Vercel build runs the tests with the project's variables, and the usage
 * metrics in particular must never write to the real database from a test.
 * TMDB_API_KEY is left alone so the live integration tests keep working locally.
 */
const ADDON_ENV_VARS = ['VERCEL', 'PUBLIC_URL', 'LOG_REQUESTS', 'DATABASE_URL', 'USAGE_SALT', 'STATS_KEY'];

for (const name of ADDON_ENV_VARS) {
  delete process.env[name];
}
