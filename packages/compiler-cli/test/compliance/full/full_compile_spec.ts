/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {FileSystem} from '../../../src/ngtsc/file_system';
import {compileTest} from '../test_helpers/compile_test';
import {ComplianceTest} from '../test_helpers/get_compliance_tests';
import {runTests} from '../test_helpers/test_runner';

runTests('full compile', compileTests);

function compileTests(fs: FileSystem, test: ComplianceTest): void {
  compileTest(
      fs, test.testPath, test.inputFiles, test.compilerOptions, test.angularCompilerOptions);
}