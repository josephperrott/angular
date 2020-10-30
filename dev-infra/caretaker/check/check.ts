/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {GitClient} from '../../utils/git/index';
import {CaretakerConfig, getCaretakerConfig} from '../config';

import {CiModule} from './ci';
import {G3Module} from './g3';
import {getGithubTaskPrinter} from './github';
import {getServicesStatusPrinter} from './services';


/** Check the status of services which Angular caretakers need to monitor. */
export async function checkServiceStatuses(githubToken: string) {
  /** The configuration for the caretaker commands. */
  const config = getCaretakerConfig();
  /** The GitClient for interacting with git and Github. */
  const git = new GitClient(githubToken, config);
  // Prevent logging of the git commands being executed during the check.
  GitClient.LOG_COMMANDS = false;

  const modules = [CiModule, G3Module].map(module => new module(git, config as any as CaretakerConfig));

  //await Promise.all(modules.map(module => module.data));

  modules.forEach(module => module.printToTerminal());
}
