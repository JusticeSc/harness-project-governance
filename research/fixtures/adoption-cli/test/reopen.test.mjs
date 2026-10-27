import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI = fileURLToPath(new URL('../bin/tasks.mjs', import.meta.url));

function createWorkspace() {
  const dir = mkdtempSync(join(tmpdir(), 'tasks-reopen-'));
  const file = join(dir, 'tasks.json');

  return {
    dir,
    file,
    seed(records) {
      writeFileSync(file, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
    },
    seedRaw(text) {
      writeFileSync(file, text, 'utf8');
    },
    bytes() {
      return readFileSync(file);
    },
    cleanup() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

function runCli(args, tasksFile) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    encoding: 'utf8',
    env: { ...process.env, TASKS_FILE: tasksFile },
  });

  assert.equal(
    result.error,
    undefined,
    `failed to start the CLI: ${result.error?.message ?? ''}`,
  );
  assert.equal(
    typeof result.status,
    'number',
    `the CLI produced no exit code (signal: ${result.signal})`,
  );

  return result;
}

function parseJsonOutput(stdout, label) {
  assert.notEqual(stdout.trim(), '', `${label}: expected a JSON value on stdout`);

  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    assert.fail(
      `${label}: stdout must be exactly one JSON value, got ${JSON.stringify(stdout)}`,
    );
  }
  return parsed;
}

function assertCliSuccess(result, label = 'command') {
  assert.equal(
    result.status,
    0,
    `${label}: expected exit 0, got ${result.status} (stderr: ${JSON.stringify(result.stderr)})`,
  );
  assert.equal(result.stderr, '', `${label}: expected empty stderr`);
  return parseJsonOutput(result.stdout, label);
}

function assertCliFailure(result, expectedStatus, label = 'command') {
  assert.equal(
    result.status,
    expectedStatus,
    `${label}: expected exit ${expectedStatus}, got ${result.status} (stderr: ${JSON.stringify(result.stderr)})`,
  );
  assert.equal(result.stdout, '', `${label}: expected empty stdout`);
  assert.notEqual(
    result.stderr.trim(),
    '',
    `${label}: expected a diagnostic on stderr`,
  );
}

test('reopen switches a done task to open and preserves every other record', () => {
  const ws = createWorkspace();

  try {
    ws.seed([
      { id: 1, title: '编写 "发布说明" 草稿', status: 'done' },
      { id: 2, title: 'second task', status: 'open' },
      { id: 3, title: 'finished task', status: 'done' },
    ]);

    const reopened = assertCliSuccess(
      runCli(['reopen', '1'], ws.file),
      'reopen 1',
    );
    assert.deepStrictEqual(reopened, {
      id: 1,
      title: '编写 "发布说明" 草稿',
      status: 'open',
    });

    assert.deepStrictEqual(JSON.parse(readFileSync(ws.file, 'utf8')), [
      { id: 1, title: '编写 "发布说明" 草稿', status: 'open' },
      { id: 2, title: 'second task', status: 'open' },
      { id: 3, title: 'finished task', status: 'done' },
    ]);

    assert.deepStrictEqual(
      assertCliSuccess(runCli(['list'], ws.file), 'list'),
      [
        { id: 1, title: '编写 "发布说明" 草稿', status: 'open' },
        { id: 2, title: 'second task', status: 'open' },
      ],
    );

    assert.deepStrictEqual(
      assertCliSuccess(runCli(['list', '--all'], ws.file), 'list --all'),
      [
        { id: 1, title: '编写 "发布说明" 草稿', status: 'open' },
        { id: 2, title: 'second task', status: 'open' },
        { id: 3, title: 'finished task', status: 'done' },
      ],
    );
  } finally {
    ws.cleanup();
  }
});

test('repeated reopen stays one record per id and is idempotent per task', () => {
  const ws = createWorkspace();

  try {
    ws.seed([
      { id: 1, title: 'first task', status: 'done' },
      { id: 2, title: 'second task', status: 'open' },
    ]);

    const expectedSecond = { id: 2, title: 'second task', status: 'open' };
    assert.deepStrictEqual(
      assertCliSuccess(runCli(['reopen', '2'], ws.file), 'reopen 2 (first)'),
      expectedSecond,
    );
    assert.deepStrictEqual(
      assertCliSuccess(runCli(['reopen', '2'], ws.file), 'reopen 2 (again)'),
      expectedSecond,
    );

    const expectedFirst = { id: 1, title: 'first task', status: 'open' };
    assert.deepStrictEqual(
      assertCliSuccess(runCli(['reopen', '1'], ws.file), 'reopen 1 (first)'),
      expectedFirst,
    );
    assert.deepStrictEqual(
      assertCliSuccess(runCli(['reopen', '1'], ws.file), 'reopen 1 (again)'),
      expectedFirst,
    );

    const stored = JSON.parse(readFileSync(ws.file, 'utf8'));
    assert.deepStrictEqual(stored, [
      { id: 1, title: 'first task', status: 'open' },
      expectedSecond,
    ]);
    assert.deepStrictEqual(
      stored.map((record) => record.id),
      [1, 2],
      'reopen must not duplicate records',
    );

    assert.deepStrictEqual(
      assertCliSuccess(runCli(['list', '--all'], ws.file), 'list --all'),
      [
        { id: 1, title: 'first task', status: 'open' },
        expectedSecond,
      ],
    );
  } finally {
    ws.cleanup();
  }
});

test('reopen of an unknown id exits 2 and leaves the file byte-identical', () => {
  const ws = createWorkspace();

  try {
    ws.seed([
      { id: 1, title: 'kept', status: 'done' },
      { id: 3, title: 'gap owner', status: 'open' },
    ]);
    const before = ws.bytes();

    const result = runCli(['reopen', '2'], ws.file);
    assertCliFailure(result, 2, 'reopen 2 (missing id)');
    assert.deepStrictEqual(ws.bytes(), before);
  } finally {
    ws.cleanup();
  }
});

test('reopen rejects malformed invocations and invalid ids with exit 2 without writing', () => {
  const ws = createWorkspace();

  try {
    ws.seed([
      { id: 1, title: 'kept', status: 'done' },
      { id: 2, title: 'other', status: 'open' },
    ]);
    const before = ws.bytes();

    const invocations = [
      [], // missing id
      ['1', '2'], // too many arguments
      ['1', '--all'], // too many arguments, one a flag
      ['--all'], // unknown flag
      ['0'],
      ['-1'],
      ['1.0'],
      ['1abc'],
      ['01'],
      ['+1'],
      [' 1'],
      ['999999999999999999999999'], // not a safe integer
    ];

    for (const args of invocations) {
      const label = `reopen ${JSON.stringify(args)}`;
      assertCliFailure(runCli(['reopen', ...args], ws.file), 2, label);
      assert.deepStrictEqual(ws.bytes(), before, `${label}: file changed`);
    }
  } finally {
    ws.cleanup();
  }
});

test('reopen rejects invalid stored JSON or records with exit 1 and does not overwrite', () => {
  const ws = createWorkspace();

  try {
    const cases = [
      {
        label: 'truncated JSON',
        raw: '[{"id":1,"title":"still here","status":"done"',
      },
      {
        label: 'non-array JSON',
        raw: '{"id":1,"title":"still here","status":"done"}\n',
      },
      {
        label: 'non-object record',
        raw: '[null]\n',
      },
      {
        label: 'duplicate ids',
        records: [
          { id: 1, title: 'first', status: 'done' },
          { id: 1, title: 'again', status: 'open' },
        ],
      },
      {
        label: 'illegal status',
        records: [{ id: 1, title: 'still here', status: 'pending' }],
      },
      {
        label: 'blank title',
        records: [{ id: 1, title: '   ', status: 'done' }],
      },
      {
        label: 'extra property',
        records: [{ id: 1, title: 'still here', status: 'done', note: 'x' }],
      },
      {
        label: 'invalid id zero',
        records: [{ id: 0, title: 'still here', status: 'done' }],
      },
      {
        label: 'unsafe id',
        records: [
          {
            id: Number.MAX_SAFE_INTEGER + 1,
            title: 'still here',
            status: 'done',
          },
        ],
      },
    ];

    for (const testCase of cases) {
      if (testCase.raw !== undefined) {
        ws.seedRaw(testCase.raw);
      } else {
        ws.seed(testCase.records);
      }
      const before = ws.bytes();

      const result = runCli(['reopen', '1'], ws.file);
      assertCliFailure(result, 1, `${testCase.label}: reopen 1`);
      assert.deepStrictEqual(
        ws.bytes(),
        before,
        `${testCase.label}: invalid data must not be overwritten`,
      );
    }
  } finally {
    ws.cleanup();
  }
});

test('reopen with a missing data file exits 2 and does not create it', () => {
  const ws = createWorkspace();

  try {
    assert.equal(existsSync(ws.file), false);

    const result = runCli(['reopen', '1'], ws.file);
    assertCliFailure(result, 2, 'reopen 1 (missing file)');
    assert.equal(existsSync(ws.file), false);
    assert.deepStrictEqual(readdirSync(ws.dir), []);
  } finally {
    ws.cleanup();
  }
});
