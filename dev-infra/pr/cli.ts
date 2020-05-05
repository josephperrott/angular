/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as yargs from 'yargs';
import {checkRebase} from './check-rebase';

/** Build the parser for the release commands. */
export function buildPrParser(localYargs: yargs.Argv) {
  return localYargs.help().strict().demandCommand().command(
      'check-rebase [pr]', '', {}, ({pr}) => {
        checkRebase(pr);
      });
}

if (require.main === module) {
  buildPrParser(yargs).parse();
}
