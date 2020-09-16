/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {spawnSync} from 'child_process';
import {unlinkSync} from 'fs';
import {join} from 'path';
import {Arguments, Argv, CommandModule} from 'yargs';

import {getRepoBaseDir} from '../../utils/config';
import {error, green, info, red} from '../../utils/console';
import {addGithubTokenOption} from '../../utils/git/github-yargs';
import {GitClient} from '../../utils/git/index';

const spawnSyncOpts = {
  encoding: 'utf8' as const,
  shell: true,
};

export interface YarnUpdateOptions {
  githubToken: string;
}

async function builder(yargs: Argv) {
  return addGithubTokenOption(yargs);
}

/** Handles the command. */
async function handler({githubToken}: Arguments<YarnUpdateOptions>) {
  /** Instance of the local git client. */
  const git = new GitClient(githubToken);
  /** The original branch or ref before the command was invoked. */
  const originaBranchOrRef = git.getCurrentBranchOrRevision();
  if (git.hasUncommittedChanges()) {
    error(red(
        `Local working repository not clean. Please make sure there are no uncommitted changes.`));
    process.exitCode = 1;
    return;
  }

  /** Version numbers of the current (old) and new yarn installs. */
  const yarnVersion = {
    old: spawnSync('yarn', ['-v'], spawnSyncOpts).stdout.trim(),
    new: spawnSync('yarn', ['info', 'yarn@latest', 'dist-tags.latest'], spawnSyncOpts).stdout.trim()
  };
  /* File path of old yarn version */
  const oldYarnPath = join(getRepoBaseDir(), `.yarn/releases/yarn-${yarnVersion.old}.js`);
  const title = `build: update to yarn v${yarnVersion.new}`;
  const body = `Update to the latest version of yarn.`;
  const commitMessage = `${title}\n\n${body}`;
  const {owner, repo} = git.remoteParams;
  const branchName = `yarn-update-v${yarnVersion.new}`;
  const localOwner = git.run(['remote', 'get-url', 'origin'])
                         .stdout.trim()
                         .match('(?:ssh|https?):\/\/.*github.com(?:\:?)/(.*)/')![1];

  if (yarnVersion.old === yarnVersion.new) {
    error(`Aborting as there is no new version of yarn to update to.`);
    process.exitCode = 1;
    return;
  }

  try {
    git.run(['fetch', git.repoGitUrl, 'master']);
    git.checkout('FETCH_HEAD', false);

    info(`Updating from yarn version '${yarnVersion.old}' to '${yarnVersion.new}'`);
    spawnSync('yarn', ['policies', 'set-version', 'latest'], spawnSyncOpts);

    info(`Removing previous yarn version (${yarnVersion.old})`);
    unlinkSync(oldYarnPath);

    info('Staging yarn vendoring files and creating commit');
    git.run(['add', '.yarn/**', '.yarnrc']);

    /**
     * New environment object with identifiers removed which prevent yarn from correctly loading
     * new version from within a yarn call.
     */
    const env = {
      ...process.env,
      YARN_IGNORE_PATH: '0',
      'PATH': process.env['PATH']!.replace(/\/tmp\/yarn.+?\:/, ''),
    };

    git.run(['commit', '-m', commitMessage], {env});

    info('Pushing commit changes to github.');
    git.run(['push', 'origin', '--force-with-lease', `HEAD:refs/heads/${branchName}`]);

    const createPrRequest = await git.github.pulls.create({
      owner,
      repo,
      title,
      body,
      base: 'master',
      maintainer_can_modify: true,
      head: `${localOwner}:${branchName}`
    });

    const pullRequest = createPrRequest.data;
    await git.github.issues.addLabels({
      owner,
      repo,
      issue_number: pullRequest.number,
      labels: ['target: patch'],
    });

    info(`${green('✔')}  Created PR #${pullRequest.number}`);
    info(`  ${pullRequest.html_url}`);

  } catch (e) {
    error(`${red('✘')}  Aborted yarn update do to errors:`);
    error(e);
    process.exitCode = 1;
  }

  finally {
    git.checkout(originaBranchOrRef, true);
  }
}

/** yargs command module. */
export const YarnUpdateModule: CommandModule<any, YarnUpdateOptions> = {
  builder,
  handler,
  command: 'update-yarn',
  describe: 'Updates the vendored yarn version to the latest version of yarn',
};
