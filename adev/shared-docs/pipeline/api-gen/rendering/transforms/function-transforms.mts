/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {FunctionEntry, FunctionSignatureMetadata} from '../entities.mjs';
import {
  FunctionEntryRenderable,
  FunctionSignatureMetadataRenderable,
} from '../entities/renderables.mjs';
import {addRenderableCodeToc} from './code-transforms.mjs';
import {
  addHtmlAdditionalLinks,
  addHtmlDescription,
  addHtmlJsDocTagComments,
  addHtmlUsageNotes,
  setEntryFlags,
} from './jsdoc-transforms.mjs';
import {addModuleName} from './module-name.mjs';
import {addRenderableFunctionParams} from './params-transforms.mjs';

/** Given an unprocessed function entry, get the fully renderable function entry. */
export function getFunctionRenderable(
  entry: FunctionEntry,
  moduleName: string,
): FunctionEntryRenderable {
  return setEntryFlags(
    addRenderableCodeToc(
      addHtmlAdditionalLinks(
        addHtmlUsageNotes(
          setEntryFlags(
            addHtmlJsDocTagComments(addHtmlDescription(addModuleName(entry, moduleName))),
          ),
        ),
      ),
    ),
  );
}

export function getFunctionMetadataRenderable(
  entry: FunctionSignatureMetadata,
  moduleName: string = '',
): FunctionSignatureMetadataRenderable {
  return addHtmlAdditionalLinks(
    addRenderableFunctionParams(
      addHtmlUsageNotes(
        setEntryFlags(
          addHtmlJsDocTagComments(addHtmlDescription(addModuleName(entry, moduleName))),
        ),
      ),
    ),
  );
}
