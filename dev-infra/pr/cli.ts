/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as yargs from 'yargs';
import {discoverNewConflictsForPr} from './discover-new-conflicts';

/** Build the parser for the pr commands. */
export function buildPrParser(localYargs: yargs.Argv) {
  return localYargs.help().strict().demandCommand().command(
      'discover-new-conflicts [pr]',
      'Check if a pending PR causes new conflicts for other pending PRs', {}, ({pr}) => {
        discoverNewConflictsForPr(pr);
      });
}

if (require.main === module) {
  buildPrParser(yargs).parse();
}
