import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(rootDir, '.env'));
loadEnvFile(resolve(rootDir, 'backend', '.env'));

const port = parseInt(process.env.FRONTEND_PORT || process.env.VITE_PORT || '5173', 10);

function findNgrokExecutable() {
  const candidates = [
    process.env.NGROK_PATH,
    'ngrok',
    resolve(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links', 'ngrok.exe'),
    resolve(process.env.USERPROFILE || '', 'AppData', 'Local', 'Microsoft', 'WinGet', 'Links', 'ngrok.exe'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate === 'ngrok') return candidate;
    if (existsSync(candidate)) return candidate;
  }
  return 'ngrok';
}

async function findExistingTunnel(port) {
  try {
    const res = await fetch('http://127.0.0.1:4040/api/tunnels');
    if (!res.ok) return undefined;
    const data = await res.json();
    const match = data.tunnels?.find((tunnel) => {
      const addr = tunnel.config?.addr || '';
      return addr === `http://localhost:${port}` || addr === `localhost:${port}`;
    });
    return match?.public_url;
  } catch {
    return undefined;
  }
}

function printPublicUrl(publicUrl, port) {
  console.log('\n========================================');
  console.log('  Ngrok public URL:', publicUrl);
  console.log('  Tunneling to:     http://localhost:' + port);
  console.log('  Inspector:        http://127.0.0.1:4040');
  console.log('========================================\n');
}

async function waitForTunnel(port, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const url = await findExistingTunnel(port);
    if (url) return url;
    await new Promise((r) => setTimeout(r, 500));
  }
  return undefined;
}

async function main() {
  const existingUrl = await findExistingTunnel(port);
  if (existingUrl) {
    printPublicUrl(existingUrl, port);
    process.stdin.resume();
    return;
  }

  const ngrokBin = findNgrokExecutable();
  console.log(`Starting ngrok (${ngrokBin}) -> localhost:${port}`);

  const child = spawn(ngrokBin, ['http', String(port)], {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: ngrokBin === 'ngrok',
  });

  child.stdout?.on('data', (chunk) => process.stdout.write(chunk));
  child.stderr?.on('data', (chunk) => process.stderr.write(chunk));

  child.on('error', (error) => {
    console.error('Failed to start ngrok:', error.message);
    console.error('Install ngrok or set NGROK_PATH to the ngrok executable.');
    process.exit(1);
  });

  const publicUrl = await waitForTunnel(port);
  if (publicUrl) {
    printPublicUrl(publicUrl, port);
  } else {
    console.log('Ngrok started. Open http://127.0.0.1:4040 for the public URL.');
  }

  child.on('exit', (code) => process.exit(code ?? 0));
  process.stdin.resume();
}

await main();
