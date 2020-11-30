/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Arguments, Argv, CommandModule} from 'yargs';

import {addGithubTokenOption} from '../../utils/git/github-yargs';
import {updateNgInfoSection} from './info-section';

export interface CheckoutOptions {
  prNumber: number;
  githubToken: string;
}

/** Builds the checkout pull request command. */
function builder(yargs: Argv) {
  return addGithubTokenOption(yargs).positional('prNumber', {type: 'number', demandOption: true});
}

/** Handles the checkout pull request command. */
async function handler({prNumber, githubToken}: Arguments<CheckoutOptions>) {
  await updateNgInfoSection(prNumber, githubToken);
}

/** yargs command module for checking out a PR  */
export const InfoSectionCommandModule: CommandModule<{}, CheckoutOptions> = {
  handler,
  builder,
  command: 'update-info-section <pr-number>',
  describe: 'Updates the info section in the summary of the PR',
};
