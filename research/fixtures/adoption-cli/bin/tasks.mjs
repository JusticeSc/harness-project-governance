#!/usr/bin/env node
// Local task-list CLI. Node built-ins only; see README.md and CONTRACT.md for the contract.
import { readFileSync, writeSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const EXIT_OK = 0;
const EXIT_DATA = 1; // persisted data unreadable or structurally invalid
const EXIT_USAGE = 2; // bad command, flag, argument, title, or unknown id

const USAGE =
  'usage: node bin/tasks.mjs add "<title>"\n' +
  "       node bin/tasks.mjs list [--all]\n" +
  "       node bin/tasks.mjs done <id>\n" +
  "       node bin/tasks.mjs reopen <id>";

function out(value) {
  writeSync(1, JSON.stringify(value) + "\n");
}

function die(code, message) {
  writeSync(2, `tasks: ${message}\n`);
  process.exit(code);
}

function usageError(message) {
  die(EXIT_USAGE, `${message}\n${USAGE}`);
}

function dataPath() {
  const configured = process.env.TASKS_FILE;
  if (configured !== undefined && configured !== "") return configured;
  return join(process.cwd(), "tasks.json");
}

// Returns the validated task array, or null when the data file does not exist.
// Any other problem with the file exits 1; the file is never rewritten in that case.
function loadTasks(file) {
  let raw;
  try {
    raw = readFileSync(file, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return null;
    die(EXIT_DATA, `cannot read data file "${file}": ${err.message}`);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    die(EXIT_DATA, `data file "${file}" is not valid JSON: ${err.message}`);
  }
  if (!Array.isArray(data)) {
    die(EXIT_DATA, `data file "${file}" must contain a JSON array`);
  }
  const seenIds = new Set();
  for (let index = 0; index < data.length; index++) {
    const record = data[index];
    const where = `${file} record ${index}`;
    if (record === null || typeof record !== "object" || Array.isArray(record)) {
      die(EXIT_DATA, `${where}: each record must be a JSON object`);
    }
    const keys = Object.keys(record).sort();
    if (keys.length !== 3 || keys[0] !== "id" || keys[1] !== "status" || keys[2] !== "title") {
      die(EXIT_DATA, `${where}: each record must have exactly the fields {id, title, status}`);
    }
    if (!Number.isSafeInteger(record.id) || record.id <= 0) {
      die(EXIT_DATA, `${where}: id must be a positive safe integer`);
    }
    if (seenIds.has(record.id)) {
      die(EXIT_DATA, `${where}: duplicate id ${record.id}`);
    }
    seenIds.add(record.id);
    if (typeof record.title !== "string" || record.title.trim() === "") {
      die(EXIT_DATA, `${where}: title must be a non-blank string`);
    }
    if (record.status !== "open" && record.status !== "done") {
      die(EXIT_DATA, `${where}: status must be "open" or "done"`);
    }
  }
  return data;
}

function saveTasks(file, tasks) {
  try {
    writeFileSync(file, JSON.stringify(tasks, null, 2) + "\n", "utf8");
  } catch (err) {
    die(EXIT_DATA, `cannot write data file "${file}": ${err.message}`);
  }
}

// IDs are positive decimal integer strings only: no 0, signs, fractions or trailing characters.
function parseId(raw) {
  if (!/^[1-9][0-9]*$/.test(raw)) {
    usageError(`invalid task id "${raw}": expected a positive decimal integer`);
  }
  const id = Number(raw);
  if (!Number.isSafeInteger(id)) {
    usageError(`invalid task id "${raw}": out of supported range`);
  }
  return id;
}

function isFlagLike(arg) {
  return arg.startsWith("--");
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === undefined) usageError("missing command");

  if (command === "add") {
    if (args.length === 0) usageError('add: missing title argument');
    if (args.length > 1) usageError("add: too many arguments, expected exactly one title");
    const rawTitle = args[0];
    if (isFlagLike(rawTitle)) usageError(`unknown flag "${rawTitle}" for add`);
    const title = rawTitle.trim();
    if (title === "") usageError("add: title must not be empty");

    const file = dataPath();
    const tasks = loadTasks(file) ?? [];
    let maxId = 0;
    for (const task of tasks) if (task.id > maxId) maxId = task.id;
    if (maxId === Number.MAX_SAFE_INTEGER) {
      usageError("add: no safe task id remains");
    }
    const task = { id: maxId + 1, title, status: "open" };
    tasks.push(task);
    saveTasks(file, tasks);
    out(task);
    return;
  }

  if (command === "list") {
    if (args.length > 1) usageError("list: too many arguments");
    let showAll = false;
    for (const arg of args) {
      if (arg === "--all") {
        showAll = true;
      } else if (isFlagLike(arg)) {
        usageError(`unknown flag "${arg}" for list`);
      } else {
        usageError(`list: unexpected argument "${arg}"`);
      }
    }

    const file = dataPath();
    const tasks = loadTasks(file);
    if (tasks === null) {
      out([]);
      return;
    }
    const shown = tasks
      .filter((task) => showAll || task.status === "open")
      .sort((a, b) => a.id - b.id);
    out(shown);
    return;
  }

  if (command === "done" || command === "reopen") {
    const targetStatus = command === "done" ? "done" : "open";
    if (args.length === 0) usageError(`${command}: missing task id argument`);
    if (args.length > 1) usageError(`${command}: too many arguments, expected exactly one task id`);
    const id = parseId(args[0]);

    const file = dataPath();
    const tasks = loadTasks(file);
    if (tasks === null) usageError(`${command}: task ${id} not found`);
    const task = tasks.find((candidate) => candidate.id === id);
    if (task === undefined) usageError(`${command}: task ${id} not found`);

    // Idempotent: repeating a transition keeps the single existing record.
    task.status = targetStatus;
    saveTasks(file, tasks);
    out(task);
    return;
  }

  usageError(`unknown command "${command}"`);
}

main();
process.exitCode = EXIT_OK;
