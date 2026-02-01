#!/usr/bin/env node

'use strict';

/**
 * Utility script to send the Postmark renewal email template.
 *
 * Defaults:
 *   - TemplateId 42127600 (alias `code-your-own`)
 *   - Message stream `outbound`
 *
 * Usage:
 *   doppler run --project local-mac-work --config dev_personal -- \
 *   node scripts/send-renewal.js --to someone@example.com --name "Client"
 *
 * Flags:
 *   --template-id <id>   Override TemplateId (defaults to 42127600)
 *   --alias-only         Ignore TemplateId and send by alias instead
 *   --model-file <path>  Load TemplateModel from JSON file
 *   --dry-run            Print payload without calling Postmark
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const POSTMARK_HOST = 'api.postmarkapp.com';
const POSTMARK_PATH = '/email/withTemplate';

const DEFAULTS = {
  from: 'billing@highencodelearning.com',
  to: 'tiogilh@gmail.com',
  alias: 'code-your-own',
  templateId: 42127600,
  name: 'Gilberto',
  domain: 'hernandezlandscapeservices.com',
  stream: 'outbound'
};

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (!current.startsWith('--')) continue;
    const [flag, inlineValue] = current.split('=');
    const key = flag.replace(/^--/, '');
    if (inlineValue !== undefined) {
      result[key] = inlineValue;
      continue;
    }
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      result[key] = next;
      i += 1;
    } else {
      result[key] = true;
    }
  }
  return result;
}

function readString(overrides, key) {
  const value = overrides[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Flag --${key} requires a value.`);
  }
  return value.trim();
}

function buildConfig(overrides) {
  const config = { ...DEFAULTS };
  config.useAliasOnly = overrides['alias-only'] !== undefined;
  ['from', 'to', 'alias', 'name', 'domain', 'stream', 'cc', 'bcc', 'reply-to'].forEach((key) => {
    const value = readString(overrides, key);
    if (value) config[key] = value;
  });

  const templateIdValue = readString(overrides, 'template-id');
  if (config.useAliasOnly) {
    config.templateId = undefined;
  } else if (templateIdValue !== undefined) {
    const parsedTemplateId = Number(templateIdValue);
    if (Number.isNaN(parsedTemplateId)) {
      throw new Error('--template-id must be a number.');
    }
    config.templateId = parsedTemplateId;
  }

  config.modelFile = readString(overrides, 'model-file') || null;
  config.dryRun = overrides['dry-run'] !== undefined;
  return config;
}

function loadTemplateModel(config) {
  if (!config.modelFile) {
    return {
      name: config.name,
      domain_name: config.domain
    };
  }

  const absolutePath = path.resolve(process.cwd(), config.modelFile);
  try {
    const fileContents = fs.readFileSync(absolutePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    throw new Error(`Unable to read template model from ${absolutePath}: ${error.message}`);
  }
}

function buildPayload(config) {
  const payload = {
    From: config.from,
    To: config.to,
    TemplateModel: loadTemplateModel(config)
  };

  if (!config.useAliasOnly && config.templateId) {
    payload.TemplateId = config.templateId;
  } else {
    payload.TemplateAlias = config.alias;
  }

  if (config.stream) payload.MessageStream = config.stream;
  if (config['cc']) payload.Cc = config['cc'];
  if (config['bcc']) payload.Bcc = config['bcc'];
  if (config['reply-to']) payload.ReplyTo = config['reply-to'];

  return payload;
}

function sendTemplateEmail(token, payload) {
  const body = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: POSTMARK_HOST,
        path: POSTMARK_PATH,
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'X-Postmark-Server-Token': token
        }
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let parsed;
          try {
            parsed = raw ? JSON.parse(raw) : {};
          } catch (jsonError) {
            parsed = { rawBody: raw, parseError: jsonError.message };
          }

          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(parsed);
          } else {
            const err = new Error(`Postmark responded with status ${response.statusCode}`);
            err.statusCode = response.statusCode;
            err.response = parsed;
            reject(err);
          }
        });
      }
    );

    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

async function main() {
  const token = process.env.POSTMARK_TOKEN;
  if (!token) {
    console.error('Missing POSTMARK_TOKEN. Run via Doppler or export it manually.');
    process.exit(1);
  }

  let config;
  try {
    config = buildConfig(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  const payload = buildPayload(config);

  if (config.dryRun) {
    console.log('Dry run enabled. Payload that would be sent:');
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log('Sending renewal email via Postmark...');
  try {
    const response = await sendTemplateEmail(token, payload);
    console.log('✅ Email accepted by Postmark.');
    if (response.MessageID) {
      console.log(`MessageID: ${response.MessageID}`);
    }
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('❌ Failed to send renewal email.');
    if (error.response) {
      console.error(JSON.stringify(error.response, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

main();
