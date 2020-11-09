/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ts from 'typescript';

import {AbsoluteFsPath, FileSystem, NgtscCompilerHost} from '../../../src/ngtsc/file_system';
import {initMockFileSystem} from '../../../src/ngtsc/file_system/testing';
import {performCompilation} from '../../../src/perform_compile';
import {CompilerOptions} from '../../../src/transformers/api';
import {loadStandardTestFiles, loadTestDirectory} from '../../helpers';

import {ConfigOptions} from './get_compliance_tests';

/**
 * Setup a mock file-system that is used to generate the partial files.
 *
 * @param testPath Absolute path (on the real file-system) to the test case being processed.
 */
export function initMockTestFileSystem(testPath: AbsoluteFsPath): FileSystem {
  const fs = initMockFileSystem('Native');
  const testFiles = loadStandardTestFiles();
  fs.init(testFiles);
  loadTestDirectory(fs, testPath, fs.resolve('/'));
  return fs;
}

export function compileTest(
    fs: FileSystem, testPath: AbsoluteFsPath, files: string[],
    compilerOptions: ConfigOptions|undefined,
    angularCompilerOptions: ConfigOptions|undefined): AbsoluteFsPath[] {
  const options = getOptions(fs, testPath, compilerOptions, angularCompilerOptions);
  const {diagnostics, emitResult} = performCompilation({
    rootNames: files.map(f => fs.resolve(f)),
    host: new NgtscCompilerHost(fs, options),
    options,
  });
  if (diagnostics.length > 0) {
    console.warn(diagnostics.map(d => d.messageText).join('\n'));
  }
  return emitResult!.emittedFiles!.map(p => fs.resolve(testPath, p));
}

export function getBuildOutputDirectory(fs: FileSystem): AbsoluteFsPath {
  return fs.resolve('/built');
}

function getOptions(
    fs: FileSystem, testPath: AbsoluteFsPath, compilerOptions: ConfigOptions|undefined,
    angularCompilerOptions: ConfigOptions|undefined): CompilerOptions {
  return {
    emitDecoratorMetadata: true,
    experimentalDecorators: true,
    skipLibCheck: true,
    noImplicitAny: true,
    noEmitOnError: true,
    listEmittedFiles: true,
    strictNullChecks: true,
    outDir: getBuildOutputDirectory(fs),
    rootDir: fs.resolve('/'),
    baseUrl: '.',
    allowJs: true,
    declaration: true,
    target: ts.ScriptTarget.ES2015,
    newLine: ts.NewLineKind.LineFeed,
    module: ts.ModuleKind.ES2015,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    typeRoots: ['node_modules/@types'],
    ...ts.convertCompilerOptionsFromJson({compilerOptions}, testPath).options,
    enableIvy: true,
    ivyTemplateTypeCheck: false,
    ...angularCompilerOptions,
  };
}
