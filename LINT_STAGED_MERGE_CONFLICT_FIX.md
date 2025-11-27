# Lint-Staged Merge Conflict Fix Guide

## Problem Description

During the `pnpm lint:fix` command (which triggers the pre-commit hook via husky), the lint-staged tool encounters a merge conflict when attempting to restore unstaged changes. This causes the entire pre-commit process to fail and revert all changes to the original state.

### Error Symptoms

```
[FAILED] Unstaged changes could not be restored due to a merge conflict!
[STARTED] Reverting to original state because of errors...
[COMPLETED] Reverting to original state because of errors...
Unstaged changes have been kept back in a patch file:

husky - pre-commit script failed (code 1)
```

## Root Cause

The issue occurs due to the following sequence:

1. **Partial staging**: Files are staged for commit, but other changes exist in the working directory that are not staged.
2. **Lint modifications**: The lint-staged pre-commit hook stashes unstaged changes, modifies files, and runs linting tasks.
3. **Stash conflict**: When lint-staged tries to restore the previously stashed changes, there's a conflict because the modified files have different changes applied.
4. **Automatic revert**: As a safety measure, the entire process is reverted, causing the commit to fail.

## Quick Fix (When Issue Occurs)

### Step 1: Check Git Status
```bash
git status
git stash list
```

### Step 2: Drop the Problematic Stash
The stash named "lint-staged automatic backup" is the culprit. Drop it:
```bash
git stash drop stash@{0}
```

### Step 3: Clean Up Unstaged Changes
Review and decide what to do with unstaged changes:
```bash
# To see what unstaged changes exist:
git diff

# To discard all unstaged changes:
git checkout .

# OR to stage everything for commit:
git add .
```

### Step 4: Re-run the Command
```bash
pnpm lint:fix
```

## Prevention Strategies

### Strategy 1: Always Stage Complete Changes (Recommended)

Before running `pnpm lint:fix`, ensure all related changes are either fully staged or fully unstaged:

```bash
# Stage all changes you want to commit:
git add .

# OR discard changes you don't want:
git checkout .

# Then run lint:fix:
pnpm lint:fix
```

### Strategy 2: Use Selective Staging

If you need to partially stage changes:

1. Stage only the files you want to commit:
```bash
git add path/to/file1.ts path/to/file2.tsx
```

2. **Immediately commit** without leaving unstaged changes lying around:
```bash
git commit -m "Your commit message"
```

### Strategy 3: Configure Lint-Staged (lint-staged.config.js)

Modify the lint-staged configuration to be more lenient with merge conflicts:

```javascript
module.exports = {
  '*.{js,jsx,ts,tsx,json,css}': ['biome check --write'],
  'package.json': ['biome check --write'],
};
```

Consider adding a `--no-stash` option if your version supports it (though this requires caution).

## Best Practices

1. **Always commit your lint fixes**: Don't leave lint changes staged without committing them.
2. **Keep staging areas clean**: Try to avoid mixing staged and unstaged changes in the same working directory.
3. **Run lint:fix regularly**: Don't accumulate multiple lint fixes before committing.
4. **Use feature branches**: Work on one feature at a time to minimize conflicting changes.
5. **Review staged changes**: Before committing, always run `git diff --cached` to see what's being committed.

## Workflow Example

### Good Workflow ✅
```bash
# 1. Make changes to files
# 2. Run lint on those specific files
pnpm lint:fix

# 3. Stage all changes
git add .

# 4. Commit immediately
git commit -m "feat: Add new feature"
```

### Bad Workflow ❌
```bash
# 1. Make changes to multiple features
# 2. Stage only some files
git add feature1/

# 3. Try to lint everything
pnpm lint:fix  # ← This may cause conflicts
```

## Advanced Debugging

If the issue persists after applying the quick fix:

### Check Git Log
```bash
git log --oneline -n 10
```

### Inspect the Stash Contents
```bash
git stash show stash@{0}
git stash show -p stash@{0}
```

### Manually Apply Stashed Changes
If you need to manually resolve the conflict:
```bash
# Drop the stash
git stash drop stash@{0}

# Manually stage changes
git add .

# Try committing
git commit -m "Your message"
```

## Husky and Lint-Staged Configuration

The pre-commit hook is configured in `.husky/pre-commit`. If issues persist, review this file and the lint-staged configuration for any problematic settings.

### Relevant Files
- `.husky/pre-commit` - The pre-commit hook script
- `lint-staged.config.js` or `package.json` (lint-staged config) - Lint-staged configuration
- `biome.json` - Biome formatter configuration

## Recovery Procedure

If your repository gets into a bad state:

```bash
# 1. See all stashes
git stash list

# 2. Drop problematic stashes
git stash drop stash@{0}

# 3. Reset to last known good commit (if needed)
git reset --hard HEAD

# 4. Verify clean state
git status

# 5. Start fresh
pnpm lint:fix
```

## Resources

- [Lint-Staged Documentation](https://github.com/okonet/lint-staged)
- [Husky Documentation](https://typicode.github.io/husky/)
- [Git Stash Documentation](https://git-scm.com/docs/git-stash)
