/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Argv} from 'yargs';
import {YarnUpdateModule} from './yarn-update/cli';


/** Build the parser for the caretaker commands. */
export function buildMiscParser(yargs: Argv) {
  return yargs.command(YarnUpdateModule);
}
