# How GitMoveRight Works

## Background: Why Git Loses History on File Moves

Git does not natively track file identity — it tracks content. When a file moves on the filesystem, Git has no built-in mechanism to detect the rename at the moment it happens. It simply sees:

- A **deletion** at the old path (the file disappears from Git's index)
- An **untracked file** at the new path (a new file appears that Git hasn't seen before)

Git does have a rename detection heuristic — it compares deleted files with new untracked files and, if their content is similar enough (above a configurable similarity threshold, default 50%), it infers a rename at `git diff` and `git log` time. This means history *can* be recovered with `git log --follow`, but it is not guaranteed, relies on a threshold, and is computed lazily rather than being recorded as a definite rename.

More importantly, the **staging area** shows the confusing delete + untracked pair until commit time, making the Source Control panel hard to read during day-to-day work.

The clean solution is to explicitly stage a rename, which is what `git mv` does: it moves the file on disk and records the operation directly in Git's index as a rename.

---

## The VS Code Event Model for File Operations

VS Code exposes two events that extensions can listen to for file rename and move operations:

### `workspace.onWillRenameFiles`

Fires **before** VS Code performs the filesystem move. Extensions can use `event.waitUntil()` to delay the operation while async work completes.

Importantly, **this event cannot veto or cancel the move**. Even if the promise passed to `waitUntil` rejects, VS Code proceeds with its own filesystem operation. This makes it unsuitable for replacing VS Code's move with a custom one — any attempt to pre-empt the move (e.g. by running `git mv` first) results in VS Code then trying to move a file that no longer exists at the source path, producing a "file does not exist" error.

### `workspace.onDidRenameFiles`

Fires **after** VS Code has completed the filesystem move. The files are already at their new locations. Extensions receive a list of `{ oldUri, newUri }` pairs describing what moved.

This is the correct event for GitMoveRight's use case: the move has already happened safely via VS Code's normal mechanisms, and now we need to inform Git about it.

---

## What GitMoveRight Does

GitMoveRight subscribes to `workspace.onDidRenameFiles`. When the event fires:

### Step 1 — Check if the file was tracked

```
git ls-files -- <oldPath>
```

`git ls-files` reads from Git's **index** (the staging area), not the filesystem. Because the index is not updated by a raw filesystem move, the old path is still listed in the index even after the file has been physically moved. If this command returns an empty result, the file was not tracked by Git and GitMoveRight does nothing.

### Step 2 — Remove the old path from the index

```
git rm --cached -- <oldPath>
```

The `--cached` flag tells Git to remove the entry from the index only — it does not touch the filesystem (the file is already gone from the old location anyway). This stages the "deletion" side of the rename.

### Step 3 — Add the new path to the index

```
git add -- <newPath>
```

This stages the file at its new location. Git computes a content hash and records it in the index.

### Step 4 — Git's rename detection resolves it

After steps 2 and 3, Git's index contains a staged deletion (old path) and a staged addition (new path) with identical content hashes. When `git status` or `git diff --staged` is run, Git's rename detection immediately resolves this pair as a **rename** and displays it as:

```
Changes to be committed:
  renamed: old/path/file.py -> new/path/file.py
```

This `R` status is what appears in VS Code's Source Control panel.

---

## Why Not Just Use `git mv`?

`git mv` is the standard tool for this job and works perfectly via the **"Move with Git..."** context menu command (Mode 2), where GitMoveRight controls the entire operation from start to finish.

For the automatic interception case (Mode 1), `git mv` cannot be used after the fact because `git mv` requires the file to exist at the source path — it moves the file as part of its operation. By the time `onDidRenameFiles` fires, the file is already at the new path, so `git mv` would fail.

The `git rm --cached` + `git add` sequence produces an identical result in the index to what `git mv` would have produced.

---

## Graceful Fallback

GitMoveRight only modifies Git's index for files it can confirm were tracked. The decision tree for each file in the rename event:

```
onDidRenameFiles fires
  └── Is the file inside a Git repository?
        ├── No  → do nothing (VS Code's move stands as-is)
        └── Yes → git ls-files -- <oldPath>
                    ├── empty → file was untracked → do nothing
                    └── match → run git rm --cached + git add
                                  ├── success → show notification (if enabled)
                                  └── error   → log to console, do nothing
```

At no point does GitMoveRight interfere with VS Code's own filesystem operation.

---

## The Context Menu Command ("Move with Git...")

Mode 2 is a fully manual alternative that uses `git mv` directly:

1. User right-clicks a tracked file and selects **Move with Git...**
2. VS Code shows a save dialog for the user to choose a destination
3. GitMoveRight ensures the destination directory exists (`fs.mkdirSync` with `recursive: true`)
4. GitMoveRight runs `git mv <old> <new>` — Git moves the file on disk and records the rename in the index in a single atomic operation
5. A confirmation notification is shown

This command bypasses VS Code's Explorer move entirely, so there is no risk of a double-move.
