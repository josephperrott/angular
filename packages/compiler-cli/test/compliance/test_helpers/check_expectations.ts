/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {FileSystem} from '../../../src/ngtsc/file_system';
import {getBuildOutputDirectory} from './compile_test';
import {expectEmit} from './expect_emit';
import {ExpectedFile} from './get_compliance_tests';

/**
 * Check that each of the generated files matches the expected files.
 *
 * @param fs The mock file-system that holds the expected and generated files to compare.
 * @param failureMessage The message to display if the expectation fails.
 * @param expectedFiles The list of expected-generated pairs to compare.
 */
export function checkExpectations(
    fs: FileSystem, failureMessage: string, expectedFiles: ExpectedFile[]): void {
  const builtDirectory = getBuildOutputDirectory(fs);
  for (const expectedFile of expectedFiles) {
    const expected = fs.readFile(fs.resolve(expectedFile.expected)).replace(/\/\* … \*\//g, '…');
    const generated = fs.readFile(fs.resolve(builtDirectory, expectedFile.generated));
    expectEmit(generated, expected, failureMessage);
  }
}
