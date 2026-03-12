# GitMoveRight

**Never lose Git file history when moving files in VS Code again.**

When you drag and drop a file in the VS Code Explorer, Git normally sees it as a deletion and a brand-new file, losing all commit history, blame annotations, and diff context. GitMoveRight fixes this silently and automatically.

---

## The Problem

Moving a file in the VS Code Explorer is a raw filesystem operation. Git has no idea the file was renamed. It just sees one file disappear and a new one appear. Your Source Control panel fills up with confusing delete/untracked pairs, and once you commit, that file's history is gone.

## The Solution

GitMoveRight watches for file moves and immediately stages them as a proper Git rename. Git recognises it as the same file, history is preserved, and your Source Control panel shows a clean `R` (renamed) status. No extra steps required.

---

## Features

- **Automatic.** Works silently in the background. Just drag and drop as normal.
- **History-preserving.** Moves are staged as Git renames, keeping full commit history, `git log --follow`, and blame intact.
- **Safe.** Only acts on files already tracked by Git. Untracked files and files outside a Git repository are left completely alone.
- **"Move with Git..."** Right-click any file in the Explorer for an explicit, dialog-driven move when you want full control.
- **Configurable.** Turn off automatic staging or notifications at any time via VS Code Settings.

---

## How to Use

### Automatic (drag and drop)

Just move files in the Explorer as you normally would. GitMoveRight handles the rest. You'll see a brief notification confirming the rename was staged, and the Source Control panel will show `R` instead of a delete/add pair.

No configuration needed.

### Manual ("Move with Git...")

1. Right-click any tracked file in the Explorer
2. Select **Move with Git...**
3. Choose the destination in the save dialog
4. GitMoveRight moves the file and stages the rename for you

---

## Settings

Open **Settings** (`Ctrl+,`) and search for `GitMoveRight`.

| Setting | Default | Description |
|---|---|---|
| `gitmoveright.autoIntercept` | `true` | Automatically stage renames when files are moved in the Explorer |
| `gitmoveright.showNotifications` | `true` | Show a confirmation message after a rename is staged |

---

## Requirements

- Git must be installed and available on your system `PATH`
- The VS Code built-in Git extension must be enabled (it is by default)
- Only works inside a Git repository

## Author

- Extension developed by Andrew Seaford
  - Website:[http://www.andrew-seaford.co.uk](http://www.andrew-seaford.co.uk)
  - LinkedIn:[https://www.linkedin.com/in/andrewseaford/](www.linkedin.com/in/andrewseaford)
  - GitHub:[https://github.com/seafooood/vs-code-extension-GitMoveRight](hhttps://github.com/seafooood/vs-code-extension-GitMoveRight)
