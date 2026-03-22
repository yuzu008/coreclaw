import fs from 'fs';
import path from 'path';

/**
 * Read specific keys from .env without polluting process.env.
 */
export function readEnvFile(
  keys: string[],
): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  const envPath = path.join(process.cwd(), '.env');

  let envVars: Record<string, string> = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      envVars[key] = value;
    }
  }

  for (const key of keys) {
    result[key] = envVars[key] || process.env[key];
  }

  return result;
}
