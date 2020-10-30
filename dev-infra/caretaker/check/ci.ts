/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import fetch from 'node-fetch';
import {fetchActiveReleaseTrains, ReleaseTrain} from '../../release/versioning/index';

import {bold, debug, info} from '../../utils/console';
import {GitClient} from '../../utils/git/index';
import {CaretakerConfig} from '../config';
import {BaseModule} from './base';


type CiBranchStatus = string|'success'|'failed'|null;

type CiData = Array<{active: boolean; name: string; label: string; status: CiBranchStatus;}>;



export class CiModule extends BaseModule<CiData> {
  constructor(git: GitClient, config: CaretakerConfig) {
    super(git, config);
  }

  async retrieveData() {
    const releaseTrains =
        await fetchActiveReleaseTrains({api: this.git.github, ...this.git.remoteConfig});


    this.resolve(await Promise.all(Object.entries(releaseTrains).map(async ([trainName, train]: [
                                                                       string, ReleaseTrain|null
                                                                     ]) => {
      if (train === null) {
        return {
          active: false,
          name: '',
          label: '',
          status: null,
        };
      }
      return {
        active: true,
        name: train.branchName,
        label: `${trainName} (${train.branchName})`,
        status: await this.getBrancheStatusFromCi(train.branchName),
      };
    })));
  }

  async printToTerminal() {
    const data = await this.data;
    const minLabelLength = Math.max(...data.map(result => result.label.length));
    info.group(bold(`CI`));
    data.forEach(result => {
      if (result.active === false) {
        debug(`No active release train for ${result.name}`);
      }
      const label = result.label.padEnd(minLabelLength);
      if (result.status === null) {
        info(`${result.name} was not found on CircleCI`);
      } else if (result.status === 'success') {
        info(`${label} ✅`);
      } else {
        info(`${label} ❌`);
      }
    });
    info.groupEnd();
  }

  /** Get the CI status of a given branch from CircleCI. */
  private async getBrancheStatusFromCi(branch: string): Promise<CiBranchStatus> {
    const {owner, name} = this.git.remoteConfig;
    const url = `https://circleci.com/gh/${owner}/${name}/tree/${branch}.svg?style=shield`;
    const result = await fetch(url).then(result => result.text());

    if (result && !result.includes('no builds')) {
      return result.includes('passing') ? 'success' : 'failed';
    }
    return null;
  }
}
