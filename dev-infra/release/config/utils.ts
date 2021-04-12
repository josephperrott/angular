/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {readFileSync} from 'fs';
import {join} from 'path';
import {GitClient} from '../../utils/git';

/** A package.json file. */
interface PackageJson {
  [key: string]: any;
  engines: {
    [key: string]: string,
    node: string,
  };
}

/**
 * Retrieve the node engines range from a provided package.json file.
 */
export function getNodeEnginesValueFromPackageJsonFile(filePath: string) {
  return () => {
    try {
      const packageJsonPath = join(GitClient.getInstance().baseDir, filePath);
      const pkgJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJson;
      if (pkgJson?.engines?.node) {
        return pkgJson.engines.node;
      }
      throw Error(`Could not find node range in "engines" field of ${filePath}`);
    } catch {
    }
    throw Error(`Could not find node range in "engines" field of ${filePath}`);
  };
}
