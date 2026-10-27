import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../bin/tasks.mjs', import.meta.url));
const task = (id, title, status = 'open') => ({ id, title, status });

function withFixture(callback, { useDefault = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'tasks-cli-test-'));
  try {
    const cwd = join(root, 'working directory');
    const storage = join(root, 'separate storage');
    mkdirSync(cwd);
    mkdirSync(storage);
    const file = useDefault ? join(cwd, 'tasks.json') : join(storage, 'custom tasks.json');
    const env = { ...process.env };
    delete env.TASKS_FILE;
    if (!useDefault) env.TASKS_FILE = file;

    const run = (args) => {
      const result = spawnSync(process.execPath, [cli, ...args], {
        cwd,
        env,
        encoding: 'utf8',
        shell: false,
        windowsHide: true,
        timeout: 30000,
        maxBuffer: 4 * 1024 * 1024,
      });
      assert.ifError(result.error);
      assert.equal(result.signal, null, 'CLI must exit normally');
      assert.ok(Number.isInteger(result.status), 'CLI must have an exit status');
      return result;
    };
    const seed = (records) => {
      const bytes = Buffer.from(` \r\n${JSON.stringify(records, null, 2)}\r\n\t`, 'utf8');
      writeFileSync(file, bytes);
      return bytes;
    };
    callback({ cwd, file, run, seed });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function success(result) {
  assert.equal(result.status, 0, `Unexpected failure: ${result.stderr}`);
  assert.equal(result.stderr, '', 'Successful commands must not write to stderr');
  // Parsing the entire stream also rejects multiple JSON values and non-JSON chatter.
  return JSON.parse(result.stdout);
}

function failure(result, expectedStatus) {
  if (expectedStatus === undefined) {
    assert.notEqual(result.status, 0, 'Command must fail');
  } else {
    assert.equal(result.status, expectedStatus, `Unexpected exit status: ${result.stderr}`);
  }
  assert.equal(result.stdout, '', 'Errors must not write to stdout');
  assert.ok(result.stderr.trim().length > 0, 'Errors must provide a diagnostic on stderr');
}

function persisted(file, expected) {
  const actual = JSON.parse(readFileSync(file, 'utf8'));
  assert.ok(Array.isArray(actual), 'Persisted data must be an array');
  // Storage order and whitespace are not specified.
  assert.deepEqual(
    [...actual].sort((a, b) => a.id - b.id),
    [...expected].sort((a, b) => a.id - b.id),
  );
}

for (const useDefault of [false, true]) {
  test(`missing-file listing and first add (${useDefault ? 'default path' : 'TASKS_FILE'})`, () => {
    withFixture(({ file, run }) => {
      assert.equal(existsSync(file), false);
      assert.deepEqual(success(run(['list'])), []);
      assert.equal(existsSync(file), false, 'list must not create a missing file');
      assert.deepEqual(success(run(['list', '--all'])), []);
      assert.equal(existsSync(file), false, 'list --all must not create a missing file');

      const first = task(1, 'first task');
      assert.deepEqual(success(run(['add', 'first task'])), first);
      persisted(file, [first]);
      assert.deepEqual(success(run(['list'])), [first]);
      assert.deepEqual(success(run(['list', '--all'])), [first]);
    }, { useDefault });
  });
}

test('TASKS_FILE selects its file rather than cwd/tasks.json', () => {
  withFixture(({ cwd, file, run }) => {
    const decoyFile = join(cwd, 'tasks.json');
    const decoyBytes = Buffer.from(JSON.stringify([task(99, 'not the selected file')]));
    writeFileSync(decoyFile, decoyBytes);
    assert.deepEqual(success(run(['list', '--all'])), []);
    assert.equal(existsSync(file), false);
    assert.deepEqual(readFileSync(decoyFile), decoyBytes);

    const added = task(1, 'selected file');
    assert.deepEqual(success(run(['add', added.title])), added);
    persisted(file, [added]);
    assert.deepEqual(success(run(['list'])), [added]);
    const completed = { ...added, status: 'done' };
    assert.deepEqual(success(run(['done', '1'])), completed);
    persisted(file, [completed]);
    assert.deepEqual(readFileSync(decoyFile), decoyBytes);
  });
});

test('add trims titles, preserves Chinese, spaces and quotes, and persists across processes', () => {
  withFixture(({ file, run }) => {
    const title = '中文 标题 "双引号" 和 \'单引号\'  中间空格';
    const first = task(1, title);
    assert.deepEqual(success(run(['add', ` \t${title}\r\n`])), first);
    persisted(file, [first]);

    const second = task(2, 'second task');
    assert.deepEqual(success(run(['add', second.title])), second);
    persisted(file, [first, second]);
    assert.deepEqual(success(run(['list'])), [first, second]);

    const completed = { ...first, status: 'done' };
    assert.deepEqual(success(run(['done', '1'])), completed);
    persisted(file, [completed, second]);
    assert.deepEqual(success(run(['list'])), [second]);
    assert.deepEqual(success(run(['list', '--all'])), [completed, second]);

    assert.deepEqual(success(run(['done', '1'])), completed);
    persisted(file, [completed, second]);
    assert.deepEqual(success(run(['list', '--all'])), [completed, second]);

    const third = task(3, 'third task');
    assert.deepEqual(success(run(['add', third.title])), third);
    persisted(file, [completed, second, third]);
    assert.deepEqual(success(run(['list'])), [second, third]);
  });
});

test('list filters status and numerically sorts existing unsorted records', () => {
  withFixture(({ file, run, seed }) => {
    const records = [
      task(40, 'forty'),
      task(7, 'seven', 'done'),
      task(2, 'two'),
      task(15, 'fifteen', 'done'),
      task(9, 'nine'),
    ];
    seed(records);
    assert.deepEqual(success(run(['list'])), [records[2], records[4], records[0]]);
    assert.deepEqual(success(run(['list', '--all'])), [
      records[2], records[1], records[4], records[3], records[0],
    ]);
    persisted(file, records);
  });
});

test('an all-done file lists no open tasks', () => {
  withFixture(({ file, run, seed }) => {
    const records = [task(8, 'eight', 'done'), task(3, 'three', 'done')];
    seed(records);
    assert.deepEqual(success(run(['list'])), []);
    assert.deepEqual(success(run(['list', '--all'])), [records[1], records[0]]);
    persisted(file, records);
  });
});

test('an existing empty array is valid and starts ids at one', () => {
  withFixture(({ file, run, seed }) => {
    seed([]);
    assert.deepEqual(success(run(['list'])), []);
    assert.deepEqual(success(run(['list', '--all'])), []);
    const added = task(1, 'after empty array');
    assert.deepEqual(success(run(['add', added.title])), added);
    persisted(file, [added]);
  });
});

test('add uses the existing maximum id, including completed records, rather than length or position', () => {
  withFixture(({ file, run, seed }) => {
    const records = [task(41, 'maximum', 'done'), task(2, 'two'), task(9, 'nine', 'done')];
    seed(records);
    const added = task(42, 'next id');
    assert.deepEqual(success(run(['add', added.title])), added);
    persisted(file, [...records, added]);
    assert.deepEqual(success(run(['list'])), [records[1], added]);
  });
});

test('done updates the requested record in an unsorted file without changing other records', () => {
  withFixture(({ file, run, seed }) => {
    const records = [task(30, 'thirty'), task(4, 'four'), task(12, 'twelve', 'done')];
    seed(records);
    const completed = { ...records[1], status: 'done' };
    assert.deepEqual(success(run(['done', '4'])), completed);
    persisted(file, [records[0], completed, records[2]]);
    assert.deepEqual(success(run(['done', '4'])), completed);
    persisted(file, [records[0], completed, records[2]]);
    assert.deepEqual(success(run(['list'])), [records[0]]);
  });
});

test('safe-integer boundary: allocate the final id, reject exhaustion without modifying bytes, and complete that id', () => {
  withFixture(({ file, run, seed }) => {
    const max = Number.MAX_SAFE_INTEGER;
    const records = [task(max - 1, 'penultimate', 'done'), task(1, 'one')];
    seed(records);
    const last = task(max, 'last available id');
    assert.deepEqual(success(run(['add', last.title])), last);
    persisted(file, [...records, last]);
    assert.deepEqual(success(run(['list'])), [records[1], last]);

    const before = readFileSync(file);
    failure(run(['add', 'cannot allocate another id']));
    assert.deepEqual(readFileSync(file), before, 'Exhaustion must preserve original file bytes');

    const completed = { ...last, status: 'done' };
    assert.deepEqual(success(run(['done', String(max)])), completed);
    persisted(file, [...records, completed]);
  });
});

const invalidInvocations = [
  ['no command', []],
  ['unknown command', ['unknown-command']],
  ['flag in command position', ['--all']],
  ['list unknown flag', ['list', '--unknown']],
  ['list positional argument', ['list', '1']],
  ['list empty extra argument', ['list', '']],
  ['list extra argument after flag', ['list', '--all', 'extra']],
  ['list duplicate flags are extra arity', ['list', '--all', '--all']],
  ['list unknown flag after all', ['list', '--all', '--unknown']],
  ['add missing title', ['add']],
  ['add extra title', ['add', 'valid title', 'extra']],
  ['add trailing unknown flag', ['add', 'valid title', '--unknown']],
  ['done missing id', ['done']],
  ['done extra argument', ['done', '1', 'extra']],
  ['done trailing unknown flag', ['done', '1', '--unknown']],
  ['done flag instead of id', ['done', '--all']],
  ['done nonexistent positive id', ['done', '999']],
];

for (const [label, title] of [
  ['empty', ''],
  ['spaces', '   '],
  ['ASCII whitespace', '\t\r\n'],
  ['Unicode whitespace', '\u3000\u00a0'],
]) {
  invalidInvocations.push([`add ${label} title`, ['add', title]]);
}

for (const id of [
  '', '0', '-0', '-1', '+1', '1.0', '1.5', '.5', '1e0', '0x1',
  '1x', '1 2', ' 1', '1 ', '1\n', 'NaN', 'Infinity', '١', '１',
  String(Number.MAX_SAFE_INTEGER + 1), '999999999999999999999999999999999999',
]) {
  invalidInvocations.push([`done invalid id ${JSON.stringify(id)}`, ['done', id]]);
}

for (const [label, args] of invalidInvocations) {
  test(`invalid invocation: ${label}`, () => {
    withFixture(({ file, run, seed }) => {
      const before = seed([task(1, 'unchanged'), task(7, 'already done', 'done')]);
      failure(run(args), 2);
      assert.deepEqual(readFileSync(file), before, 'Invalid invocation must preserve original bytes');
    });
  });
}

test('invalid invocations and a nonexistent done id do not create a missing data file', () => {
  withFixture(({ file, run }) => {
    for (const args of [[], ['unknown-command'], ['list', '--unknown'], ['add', '  '], ['done', '1']]) {
      failure(run(args), 2);
      assert.equal(existsSync(file), false);
    }
  });
});

const invalidDocuments = [
  ['empty file', ''],
  ['whitespace-only file', ' \t\r\n'],
  ['truncated JSON', '['],
  ['invalid JSON token', '[not-json]'],
  ['trailing comma', '[{"id":1,"title":"x","status":"open"},]'],
  ['multiple JSON values', '[] []'],
  ['null root', 'null'],
  ['object root', '{}'],
  ['string root', '"tasks"'],
  ['number root', '42'],
  ['boolean root', 'true'],
  ['overflowing numeric id', '[{"id":1e309,"title":"x","status":"open"}]'],
];

const invalidRecords = [
  ['null record', null],
  ['array record', []],
  ['string record', 'record'],
  ['number record', 1],
  ['boolean record', true],
  ['empty object', {}],
  ['missing id', { title: 'x', status: 'open' }],
  ['missing title', { id: 2, status: 'open' }],
  ['missing status', { id: 2, title: 'x' }],
  ['extra property', { id: 2, title: 'x', status: 'open', extra: true }],
  ['string id', task('2', 'x')],
  ['null id', task(null, 'x')],
  ['boolean id', task(true, 'x')],
  ['zero id', task(0, 'x')],
  ['negative id', task(-2, 'x')],
  ['fractional id', task(2.5, 'x')],
  ['unsafe id', task(Number.MAX_SAFE_INTEGER + 1, 'x')],
  ['empty title', task(2, '')],
  ['whitespace title', task(2, ' \t\r\n')],
  ['Unicode whitespace title', task(2, '\u3000\u00a0')],
  ['null title', task(2, null)],
  ['numeric title', task(2, 123)],
  ['array title', task(2, ['x'])],
  ['object title', task(2, { text: 'x' })],
  ['unknown status', task(2, 'x', 'pending')],
  ['wrong-case status', task(2, 'x', 'OPEN')],
  ['padded status', task(2, 'x', 'done ')],
  ['null status', task(2, 'x', null)],
  ['numeric status', task(2, 'x', 1)],
];

for (const [label, record] of invalidRecords) {
  // Keep a valid, targetable record first: later invalid records must not be ignored.
  invalidDocuments.push([label, JSON.stringify([task(1, 'valid first record'), record])]);
}
invalidDocuments.push([
  'duplicate ids with different titles and statuses',
  JSON.stringify([task(1, 'first'), task(1, 'duplicate', 'done')]),
]);

for (const [label, document] of invalidDocuments) {
  test(`invalid persisted data: ${label}`, () => {
    withFixture(({ file, run }) => {
      const before = Buffer.from(document, 'utf8');
      writeFileSync(file, before);
      for (const args of [['list'], ['list', '--all'], ['add', 'new task'], ['done', '1']]) {
        failure(run(args), 1);
        assert.deepEqual(
          readFileSync(file),
          before,
          `${JSON.stringify(args)} must not replace or repair invalid data`,
        );
      }
    });
  });
}
