import { readFileSync, realpathSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isAbsolute, relative, resolve, win32, posix } from 'node:path';
import { pathToFileURL } from 'node:url';

const topKeys = ['schemaVersion', 'teamReference', 'receivedAt', 'deadline', 'channel', 'incidentReference', 'fixedVersion', 'artifacts'];
const timePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

function validTime(value) {
  if (typeof value !== 'string' || !timePattern.test(value) || !Number.isFinite(Date.parse(value))) return false;
  const [year, month, day, hour, minute, second] = value.slice(0, 19).split(/[-T:]/).map(Number);
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (month < 1 || month > 12 || day < 1 || day > days || hour > 23 || minute > 59 || second > 59) return false;
  if (!value.endsWith('Z')) {
    const offset = value.slice(-5).split(':').map(Number);
    if (offset[0] > 23 || offset[1] > 59) return false;
  }
  return true;
}

export function validateManifest(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Manifest must be an object / Манифест должен быть объектом');
  if (Object.keys(input).some((key) => !topKeys.includes(key))) throw new Error('Unknown field / Неизвестное поле');
  if (input.schemaVersion !== 1) throw new Error('Unsupported schema version / Неизвестная версия');
  for (const key of ['teamReference', 'fixedVersion']) {
    if (typeof input[key] !== 'string' || !input[key].trim() || input[key].length > 128) throw new Error(`Invalid / Некорректно: ${key}`);
  }
  for (const key of ['receivedAt', 'deadline']) {
    if (!validTime(input[key])) {
      throw new Error(`Time needs an explicit UTC offset / Время требует смещения UTC: ${key}`);
    }
  }
  if (!['primary', 'fallback'].includes(input.channel)) throw new Error('Invalid channel / Некорректный канал');
  if (input.incidentReference !== undefined && (typeof input.incidentReference !== 'string' || !input.incidentReference.trim() || input.incidentReference.length > 128)) {
    throw new Error('Invalid incident reference / Некорректная ссылка на инцидент');
  }
  if (input.channel === 'fallback' && !input.incidentReference) throw new Error('Fallback needs incident reference / Нужна ссылка на инцидент');
  if (!Array.isArray(input.artifacts) || input.artifacts.length < 1 || input.artifacts.length > 50) throw new Error('Expected 1–50 artifacts / Нужно 1–50 файлов');
  const paths = new Set();
  for (const artifact of input.artifacts) {
    if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact) || Object.keys(artifact).some((key) => !['path', 'sha256', 'bytes'].includes(key))) {
      throw new Error('Invalid artifact / Некорректная запись файла');
    }
    if (typeof artifact.path !== 'string' || artifact.path.length < 1 || artifact.path.length > 255 ||
      win32.isAbsolute(artifact.path) || posix.isAbsolute(artifact.path) || artifact.path.includes(':') ||
      artifact.path.split(/[\\/]/).some((part) => part === '..' || part === '.' || part === '')) {
      throw new Error('Unsafe relative path / Некорректный относительный путь');
    }
    const key = artifact.path.replaceAll('\\', '/').toLowerCase();
    if (paths.has(key)) throw new Error('Duplicate artifact path / Путь повторяется');
    paths.add(key);
    if (typeof artifact.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(artifact.sha256)) throw new Error('Invalid SHA-256 / Некорректный SHA-256');
    if (!Number.isSafeInteger(artifact.bytes) || artifact.bytes < 0 || artifact.bytes > 25 * 1024 * 1024) throw new Error('Artifact exceeds 25 MiB / Файл превышает 25 MiB');
  }
  return { validStructure: true, arrivedAfterDeadline: Date.parse(input.receivedAt) > Date.parse(input.deadline) };
}

export function verifyArtifacts(manifest, directory) {
  const status = validateManifest(manifest);
  const root = realpathSync(resolve(directory));
  const verified = [];
  for (const artifact of manifest.artifacts) {
    const actual = realpathSync(resolve(root, artifact.path));
    const remainder = relative(root, actual);
    if (isAbsolute(remainder) || remainder === '..' || remainder.startsWith(`..${win32.sep}`) || remainder.startsWith(`..${posix.sep}`)) {
      throw new Error('Artifact escapes the root directory / Файл выходит за каталог');
    }
    const stat = statSync(actual);
    if (!stat.isFile() || stat.size !== artifact.bytes || stat.size > 25 * 1024 * 1024) throw new Error(`Size mismatch / Размер не совпадает: ${artifact.path}`);
    const digest = createHash('sha256').update(readFileSync(actual)).digest('hex');
    if (digest !== artifact.sha256) throw new Error(`Hash mismatch / Хеш не совпадает: ${artifact.path}`);
    verified.push(artifact.path);
  }
  return { ...status, verifiedArtifacts: verified, acceptedByOrganizer: 'not_checked', receiptAuthenticity: 'not_checked' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 4) throw new Error('Usage / Запуск: node verify.mjs manifest.json artifact-directory');
    console.log(JSON.stringify(verifyArtifacts(JSON.parse(readFileSync(process.argv[2], 'utf8')), process.argv[3]), null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Verification failed / Ошибка проверки');
    process.exitCode = 1;
  }
}
