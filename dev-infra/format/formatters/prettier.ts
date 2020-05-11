/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {join} from 'path';

import {getRepoBaseDir} from '../../utils/config';

import {Formatter} from './base-formatter';

/**
 * Formatter for running prettier against json files
 */
export class Prettier extends Formatter {
  name = 'prettier';

  binaryFilePath = join(getRepoBaseDir(), 'node_modules/.bin/prettier');

  defaultFileMatcher = ['**/*.json'];

  actions = {
    check: {
      commandFlags: `--no-config -c`,
      callback:
          (_: string, code: number, stdout: string) => {
            return code !== 0;
          },
    },
    format: {
      commandFlags: `--no-config --write`,
      callback:
          (file: string, code: number, _: string, stderr: string) => {
            if (code !== 0) {
              console.error(`Error running prettier on: ${file}`);
              console.error(stderr);
              console.error();
              return true;
            }
            return false;
          }
    }
  };
}
