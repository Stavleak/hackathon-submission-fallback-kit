import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { validateManifest, verifyArtifacts } from './verify.mjs';

const data = Buffer.from('fictional demo\n');
const manifest = { schemaVersion: 1, teamReference: 'fictional-team-01',
  receivedAt: '2026-10-01T18:59:00+05:00', deadline: '2026-10-01T19:00:00+05:00',
  channel: 'fallback', incidentReference: 'fictional-incident-01', fixedVersion: 'fictional-snapshot-01',
  artifacts: [{ path: 'demo.txt', sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length }] };

test('matches file content and separately reports lateness', () => {
  const root = mkdtempSync(join(tmpdir(), 'stavleak-fallback-test-'));
  try {
    writeFileSync(join(root, 'demo.txt'), data);
    assert.deepEqual(verifyArtifacts(manifest, root).verifiedArtifacts, ['demo.txt']);
    assert.equal(validateManifest({ ...manifest, receivedAt: '2026-10-01T19:01:00+05:00' }).arrivedAfterDeadline, true);
    writeFileSync(join(root, 'demo.txt'), Buffer.from('wrong content!\n'));
    assert.throws(() => verifyArtifacts(manifest, root));
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('rejects traversal, absolute paths, duplicates and invalid sizes', () => {
  for (const path of ['../secret', 'a/../../secret', '/etc/passwd', 'C:\\private.txt', 'a\\..\\private', 'a//b']) {
    assert.throws(() => validateManifest({ ...manifest, artifacts: [{ ...manifest.artifacts[0], path }] }));
  }
  assert.throws(() => validateManifest({ ...manifest, artifacts: [...manifest.artifacts, ...manifest.artifacts] }));
  assert.throws(() => validateManifest({ ...manifest, artifacts: [{ ...manifest.artifacts[0], bytes: -1 }] }));
});
test('rejects ambiguous time, missing incident and extra fields', () => {
  for (const input of [{ ...manifest, deadline: '2026-10-01T19:00:00' },
    { ...manifest, deadline: '2026-02-30T19:00:00+05:00' },
    { ...manifest, incidentReference: undefined }, { ...manifest, unexpected: true },
    { ...manifest, artifacts: [] }, { ...manifest, schemaVersion: 2 }]) assert.throws(() => validateManifest(input));
});
