import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

function getGitAPI() {
    const gitExtension = vscode.extensions.getExtension('vscode.git');
    if (!gitExtension?.isActive) return null;
    return gitExtension.exports.getAPI(1);
}

function getRepository(uri: vscode.Uri) {
    const git = getGitAPI();
    if (!git) return null;
    return git.getRepository(uri);
}

// Quote a filesystem path for use in a git shell command (forward slashes, escaped quotes)
function q(p: string): string {
    return `"${p.replace(/\\/g, '/').replace(/"/g, '\\"')}"`;
}

export function activate(context: vscode.ExtensionContext) {

    // --- Mode 1: Stage renames after VS Code moves files ---
    //
    // onWillRenameFiles cannot veto VS Code's move, so we use onDidRenameFiles instead.
    // After VS Code performs the filesystem move we:
    //   1. Check if the old path was tracked in the git index
    //   2. git rm --cached <old>  — remove old path from index
    //   3. git add <new>          — add new path to index
    // Git's rename detection then shows it as "R" (renamed) in the staging area.

    const renameListener = vscode.workspace.onDidRenameFiles(async (event) => {
        const config = vscode.workspace.getConfiguration('gitmoveright');
        if (!config.get<boolean>('autoIntercept')) return;

        for (const file of event.files) {
            const repo = getRepository(file.newUri);
            if (!repo) continue;

            const oldPath = file.oldUri.fsPath;
            const newPath = file.newUri.fsPath;
            const cwd = repo.rootUri.fsPath;

            try {
                // git ls-files reads from the index, so old path is still listed
                // even though it no longer exists on disk after the move.
                const { stdout } = await execAsync(`git ls-files -- ${q(oldPath)}`, { cwd });
                if (!stdout.trim()) continue; // untracked file — nothing to do

                await execAsync(`git rm --cached -- ${q(oldPath)}`, { cwd });
                await execAsync(`git add -- ${q(newPath)}`, { cwd });

                if (config.get<boolean>('showNotifications')) {
                    vscode.window.showInformationMessage(
                        `GitMoveRight: Staged ${path.basename(oldPath)} → ${path.basename(newPath)} as a rename`
                    );
                }
            } catch (err: any) {
                console.error('GitMoveRight: failed to stage rename:', err);
            }
        }
    });

    // --- Mode 2: Explicit "Move with Git..." context menu command ---

    const moveCommandHandler = vscode.commands.registerCommand(
        'gitmoveright.moveWithGit',
        async (uri: vscode.Uri) => {
            const repo = getRepository(uri);
            if (!repo) {
                vscode.window.showErrorMessage('GitMoveRight: File is not inside a Git repository');
                return;
            }

            const destination = await vscode.window.showSaveDialog({
                defaultUri: uri,
                title: 'Move file with git mv — choose destination'
            });

            if (!destination) return;

            const oldPath = uri.fsPath;
            const newPath = destination.fsPath;
            const cwd = repo.rootUri.fsPath;

            fs.mkdirSync(path.dirname(newPath), { recursive: true });

            try {
                await execAsync(`git mv ${q(oldPath)} ${q(newPath)}`, { cwd });
                vscode.window.showInformationMessage(
                    `GitMoveRight: Moved to ${path.relative(cwd, newPath)}`
                );
            } catch (err: any) {
                vscode.window.showErrorMessage(`GitMoveRight: git mv failed — ${err.message}`);
            }
        }
    );

    context.subscriptions.push(renameListener, moveCommandHandler);
}

export function deactivate() {}
