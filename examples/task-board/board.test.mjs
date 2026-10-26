import assert from 'node:assert/strict'
import test from 'node:test'
import { pendingTitles } from './board.mjs'

test('unfinished titles preserve input order', () => {
  assert.deepEqual(pendingTitles([
    { title: 'write goal', done: false },
    { title: 'old task', done: true },
    { title: 'verify', done: false },
  ]), ['write goal', 'verify'])
})

test('a completed board has no pending titles', () => {
  assert.deepEqual(pendingTitles([{ title: 'finished', done: true }]), [])
})
