/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Argv} from 'yargs';
import {error} from '../../utils/console';

import {fixupCommits} from './fixup-commits';


/** URL to the Github page where personal access tokens can be generated. */
export const GITHUB_TOKEN_GENERATE_URL = `https://github.com/settings/tokens`;

/** Builds the fixup-commits pull request command. */
export function buildFixupCommitsCommand(yargs: Argv) {
  return yargs.option('github-token', {
    type: 'string',
    description: 'Github token. If not set, token is retrieved from the environment variables.'
  });
}

/** Handles the fixup-commits pull request command. */
export async function handleFixupCommitscommand(args) {
  const githubToken = args.githubToken || process.env.GITHUB_TOKEN || process.env.TOKEN;
  if (!githubToken) {
    error('No Github token set. Please set the `GITHUB_TOKEN` environment variable.');
    error('Alternatively, pass the `--github-token` command line flag.');
    error(`You can generate a token here: ${GITHUB_TOKEN_GENERATE_URL}`);
    process.exit(1);
  }

  await fixupCommits(args.prNumber, githubToken);
}
