/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Bar} from 'cli-progress';
import {exec as _exec} from 'shelljs';
import {types as graphQLTypes} from 'typed-graphqlify';

import {getPendingPrs} from '../utils/github';

// Run all exec commands as silent.
function exec(cmd: string) {
  return _exec(cmd, {silent: true});
}

// GraphQL schema for the response body for each pending PR.
const PR_SCHEMA = {
  number: graphQLTypes.number,
  mergeable: graphQLTypes.string,
  title: graphQLTypes.string,
};

// Progress bar to indicate progress.
const progressBar = new Bar({format: `[{bar}] ETA: {eta}s | {value}/{total}`});

/**
 * Checks if the provided PR will cause new conflicts in other pending PRs.
 */
export async function discoverNewConflictsForPr(newPrNumber: number) {
  // If there are any local changes in the current repository state, the
  // check cannot run as it needs to move between branches.
  if (hasLocalChanges()) {
    console.error('Cant run with local changes');
    process.exit(1);
  }

  // The branch checked out when the run started
  const originalBranch = getCurrentBranch();
  // PRs which were found to be conflicting.
  const conflicts: Array<typeof PR_SCHEMA> = [];

  // Fetch and checkout the PR being checked.
  exec(`git fetch upstream pull/${newPrNumber}/head`);
  exec(`git checkout -b rebase-checker-base FETCH_HEAD`);
  // Rebase the PR on the master branch.
  const result = exec(`git rebase upstream/master`);
  if (result.code) {
    exitGracefullyWithError('the base PR being checked doesnt work', originalBranch);
  }

  // Retrieve all of the pending PRs which are currently know to be mergable.
  let pendingPrs: Array<typeof PR_SCHEMA>;
  try {
    const allPendingPRs = (await getPendingPrs(PR_SCHEMA));
    pendingPrs = allPendingPRs.filter(pr => pr.mergeable === 'MERGEABLE');
    console.info(`${pendingPrs.length} of ${allPendingPRs.length} pending PRs do not have known conflicts.`)
    console.info(`Checking ${pendingPrs.length} PRs for conflicts after a merge of #${newPrNumber}`);
  } catch {
    throw Error('Unable to fetch pending PRs from github.');
  }

  // Start the progress bar
  progressBar.start(pendingPrs.length, 0);

  // Check each PR to determine if it can merge cleanly into the repo after the target PR.
  for (const pr of pendingPrs) {
    // Fetch and checkout the next PR
    exec(`git fetch upstream pull/${pr.number}/head`);
    exec(`git checkout --detach FETCH_HEAD`);
    // Check if the PR cleanly rebases into the repo after the target PR.
    const result = exec(`git rebase rebase-checker-base`);
    if (result.code !== 0) {
      conflicts.push(pr);
    }
    // Abort any outstanding rebase attempt.
    exec(`git rebase --abort`);

    progressBar.increment(1);
  }
  // End the progress bar as all PRs have been processed.
  progressBar.stop();
  console.info(`\nResult:`);

  resetGitEnvironment(originalBranch);

  // If no conflicts are found, exit successfully.
  if (conflicts.length === 0) {
    console.info(`No new conflicting PRs found after #${newPrNumber} merging.`);
    exitGracefully(0, originalBranch);
  }

  // Inform about discovered conflicts, exit with failure.
  console.error(
      `Discovered ${conflicts.length} PR(s) which conflict(s) after #${newPrNumber} merges:`);
  for (const pr of conflicts) {
    console.error(`  - ${pr.number}: ${pr.title}`);
  }
  exitGracefully(1, originalBranch);
}

/**
 * Exit the process gracefully, clearing the progressBar and git environment.
 */
function exitGracefully(code: number, originalBranch: string) {
  progressBar.stop();
  resetGitEnvironment(originalBranch);
  process.exit(code);
}
/**
 * Exit the process by throwing an error after cleaning the git environment.
 */
function exitGracefullyWithError(errMessage: string, originalBranch: string) {
  resetGitEnvironment(originalBranch);
  // Throw the provided error message.
  throw Error(errMessage);
}

/**
 * Reset the git environment to the state it was before the run.
 */
function resetGitEnvironment(originalBranch: string) {
  // Ensure that any outstanding rebases are aborted.
  exec(`git rebase --abort`);
  // Ensure that any changes in the current repo state are cleared.
  exec(`git reset --hard`);
  // Checkout the original branch from before the run began.
  exec(`git checkout ${originalBranch}`);
  // Delete the temporary branch created for the run.
  exec(`git branch -D rebase-checker-base`);
}

/** Whether the repo has local changes. */
function hasLocalChanges() {
  return !!exec(`git status --porcelain`).trim();
}

/** Get the currently checked out branch. */
function getCurrentBranch() {
  return exec(`git symbolic-ref --short HEAD`).trim();
}
