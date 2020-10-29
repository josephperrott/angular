/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {GitClient} from '../../utils/git/index';
import {loadG3File} from '../../utils/config';
import {getCaretakerConfig} from '../config';

import {printCiStatus} from './ci';
import {printG3Comparison} from './g3';
import {printGithubTasks} from './github';
import {printServiceStatuses} from './services';
import { join } from 'path';


/** Check the status of services which Angular caretakers need to monitor. */
export async function checkServiceStatuses(githubToken: string) {
  /** The configuration for the caretaker commands. */
  const config = getCaretakerConfig();
  /** The GitClient for interacting with git and Github. */
  const git = new GitClient(githubToken, config);
  // Prevent logging of the git commands being executed during the check.
  GitClient.LOG_COMMANDS = false;

  const internalCaretakerChecks: any[] = [];
  if (process.env.INTERNAL_NG_DEV_PATH) {
    const loadedObject = loadG3File(join(process.env.INTERNAL_NG_DEV_PATH, 'caretaker_check'));
    internalCaretakerChecks.push(...loadedObject.printerCalls);
  }

  // TODO(josephperrott): Allow these checks to be loaded in parallel.
  await printServiceStatuses();
  await printGithubTasks(git, config.caretaker);
  await printG3Comparison(git);
  await printCiStatus(git);
  for (const module of internalCaretakerChecks) {
    const data = await module.getData(5710658318368768);
    module.print(data);
  }

}
