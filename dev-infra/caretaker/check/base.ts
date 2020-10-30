/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {GitClient} from '../../utils/git/index';
import {CaretakerConfig} from '../config';


export abstract class BaseModule<Data> {
  protected resolve!: (data: Data) => void;


  readonly data = (new Promise<Data>((resolve) => {
    this.resolve = resolve;
  }));


  constructor(protected git: GitClient, protected config: CaretakerConfig) {
    this.retrieveData();
  }

  abstract async retrieveData(): Promise<void>;

  abstract async printToTerminal(): Promise<void>;
}
