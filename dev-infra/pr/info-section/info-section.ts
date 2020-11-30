/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {getConfig} from '../../utils/config';
import {GitClient} from '../../utils/git';
import {updateInfoSectionInPrSummary} from '../../utils/ng-info-section';
import {getTargetBranchesForPr} from '../check-target-branches/check-target-branches';


export async function updateNgInfoSection(prNumber: number, token: string) {
  const config = getConfig();
  const git = new GitClient(token, config);

  updateInfoSectionInPrSummary(git, prNumber, [
    {header: 'Target Branches', content: await getTargetBranchesContent(prNumber)},
    {header: 'Target Branches2', content: await getTargetBranchesContent(prNumber)},
  ]);
}

async function getTargetBranchesContent(prNumber: number) {
  const branches = await getTargetBranchesForPr(prNumber);

  if (branches === undefined) {
    return 'Unable to determine targetted branches as no targetting label has been applied';
  }

  return branches.map(target => `- ${target}`).join('\n');
}
