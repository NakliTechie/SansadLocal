// app/corpus-data.js
// Shared corpus-data helpers — currently scoped to the IDB-cache hydration
// helpers each corpus uses at activate() time to populate state.cache
// from IDB before the user starts interacting.
//
// Why this is a separate module:
//   • Every corpus has three nearly-identical functions that cursor the
//     'summaries' / 'chats' / 'texts' IDB stores, filter by a key prefix,
//     and copy matching entries into state.cache.<x>. That's ~30 LOC per
//     corpus × 3 corpora ≈ 90 LOC of pure copy-paste plus one bespoke
//     orphan-cleanup wrinkle in DRSC. Better as one helper.
//
//   • `fetchData` (the bigger initial-load function in each corpus)
//     stays per-corpus for now — its structure is similar but the data
//     layout diverges (CAG and DRSC use a single reports.json; Bills
//     fetches an index-meta.json then merges per-shard files into a
//     flat records array). The extraction overhead exceeds the savings.
//
// See CONV.md "Shared modules across corpus modules" for the running
// rationale on what gets pulled into shared modules vs left per-corpus.

import { idbCursor } from './deps.js';

/**
 * Cursor an IDB store, copy matching entries into a target object keyed
 * by the IDB key, and optionally drop stale entries that no longer pass
 * a validator.
 *
 * @param {Object}   args
 * @param {string}   args.store     IDB object-store name (e.g. 'summaries').
 * @param {Object}   args.target    Object to populate; key on IDB → value of IDB.
 * @param {Function} [args.matches] Optional filter: (key) => boolean. Only
 *                                  entries where matches(key) is true are
 *                                  considered for inclusion. Default: take
 *                                  every string-keyed entry (matches legacy
 *                                  DRSC behavior).
 * @param {Function} [args.validate] Optional second-stage check:
 *                                   (key, value) => boolean. Called only
 *                                   for entries that passed `matches`. If
 *                                   it returns false:
 *                                     - readonly mode: skip (entry stays
 *                                       in IDB but isn't loaded into target).
 *                                     - readwrite mode: delete from IDB.
 *                                   Used by DRSC to evict pre-v0.4 stale
 *                                   text orphans whose key shape no longer
 *                                   matches the current manifest.
 * @param {string}   [args.mode]    'readonly' | 'readwrite'. Required to
 *                                  be 'readwrite' if you want validate=false
 *                                  to actually delete IDB entries.
 *
 * @returns {Promise<{added: number, dropped: number}>}
 */
export async function hydrateFromIDB({
  store,
  target,
  matches,
  validate,
  mode = 'readonly',
}) {
  let added = 0, dropped = 0;
  try {
    await idbCursor(store, mode, (key, value) => {
      if (typeof key !== 'string') return;
      if (matches && !matches(key)) return;
      if (validate && !validate(key, value)) {
        if (mode === 'readwrite') {
          dropped++;
          return 'delete';
        }
        return;
      }
      target[key] = value;
      added++;
    });
  } catch {
    // Cursor failures (store missing in old DBs, etc.) are silent —
    // hydration is opportunistic, not authoritative.
  }
  return { added, dropped };
}
