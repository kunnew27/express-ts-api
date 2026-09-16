export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // ── Type ───────────────────────────────────────────────────────────────
    'type-enum': [
      2,
      'always',
      [
        'feat',      // new feature
        'fix',       // bug fix
        'chore',     // maintenance / tooling
        'docs',      // documentation only
        'style',     // formatting, no logic change
        'refactor',  // code change, not a fix or feature
        'test',      // adding or updating tests
        'perf',      // performance improvement
        'ci',        // CI/CD configuration
        'build',     // build system changes
        'revert',    // revert a previous commit
        'wip',       // work in progress (not ready for review)
      ],
    ],
    'type-case':         [2, 'always', 'lower-case'],
    'type-empty':        [2, 'never'],
    // ── Scope ─────────────────────────────────────────────────
    'scope-case':        [2, 'always', 'lower-case'],
    // ── Subject ───────────────────────────────────────────────
    'subject-empty':     [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-case':      [2, 'always', 'lower-case'],
    // ── Header ───────────────────────────────────────────────
    'header-max-length': [2, 'always', 72],
  },
};
