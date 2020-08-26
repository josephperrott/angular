/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {alias, params, types} from 'typed-graphqlify';

import {bold, debug, green, info, red} from '../../utils/console';
import {GitClient} from '../../utils/git';
import {CaretakerConfig} from '../config';


export async function getG3Comparison(git: GitClient) {
  info.group(bold('g3 branch check'));
  checkChangesNotInG3(git);
  info.groupEnd();
  info();
}


function checkChangesNotInG3(git: GitClient) {
  git.run(['fetch', 'upstream']);
  const commitCount =
      git.run(['rev-list', '--count', 'upstream/g3...upstream/master']).stdout.trim();
  info(`${git.run(['diff', 'upstream/master..upstream/g3', '--shortstat']).stdout.trim()} over ${
      commitCount} commit(s)`);
}
