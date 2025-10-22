import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(currentDir, '..');

/**
 * Resolve variable names to environment values and ensure none are missing.
 * @param {string[]} keys
 * @returns {Record<string, string>}
 */
function loadEnv(keys) {
  const values = {};
  const missing = [];

  keys.forEach((key) => {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      values[key] = value.trim();
    } else {
      missing.push(key);
    }
  });

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  return values;
}

/**
 * Create the firebase config string written to disk.
 * @param {Record<string, string>} envMap
 * @param {string[]} allowedUploaders
 */
function generateConfig(envMap, allowedUploaders) {
  const config = {
    apiKey: envMap.PUBLIC_FIREBASE_API_KEY,
    authDomain: envMap.PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: envMap.PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: envMap.PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: envMap.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: envMap.PUBLIC_FIREBASE_APP_ID,
  };

  if (envMap.PUBLIC_FIREBASE_MEASUREMENT_ID) {
    config.measurementId = envMap.PUBLIC_FIREBASE_MEASUREMENT_ID;
  }

  const lines = [
    '// Auto-generated during build. Do not edit manually.',
    'window.firebaseConfig = ' + JSON.stringify(config, null, 2) + ';',
  ];

  lines.push(
    'window.allowedUploaders = ' + JSON.stringify(allowedUploaders) + ';',
    ''
  );

  return lines.join('\n');
}

function writeFile(targetPath, contents) {
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, contents, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Created ${targetPath.replace(rootDir + '/', '')}`);
}

function main() {
  const envMap = loadEnv([
    'PUBLIC_FIREBASE_API_KEY',
    'PUBLIC_FIREBASE_AUTH_DOMAIN',
    'PUBLIC_FIREBASE_PROJECT_ID',
    'PUBLIC_FIREBASE_STORAGE_BUCKET',
    'PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'PUBLIC_FIREBASE_APP_ID',
    // optional but still load if present
    'PUBLIC_FIREBASE_MEASUREMENT_ID',
  ]);

  const allowListRaw = process.env.ADMIN_PHONE_ALLOWLIST || '';
  const allowedUploaders = allowListRaw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const output = generateConfig(envMap, allowedUploaders);

  writeFile(resolve(rootDir, 'assets/js/firebase-config.js'), output);
  writeFile(resolve(rootDir, 'admin/firebase-config.js'), output);
}

try {
  main();
} catch (error) {
  console.error('[create-firebase-config] Failed:', error.message);
  process.exitCode = 1;
}
