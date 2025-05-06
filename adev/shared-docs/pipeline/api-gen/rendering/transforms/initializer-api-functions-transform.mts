/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {InitializerApiFunctionEntry} from '../entities.mjs';

import {InitializerApiFunctionRenderable} from '../entities/renderables.mjs';

import {addRenderableCodeToc} from './code-transforms.mjs';
import {
  addHtmlAdditionalLinks,
  addHtmlDescription,
  addHtmlJsDocTagComments,
  addHtmlUsageNotes,
  setEntryFlags,
} from './jsdoc-transforms.mjs';
import {addModuleName} from './module-name.mjs';

export function getInitializerApiFunctionRenderable(
  entry: InitializerApiFunctionEntry,
  moduleName: string,
): InitializerApiFunctionRenderable {
  return setEntryFlags(
    addRenderableCodeToc(
      addHtmlJsDocTagComments(
        addHtmlUsageNotes(
          addHtmlDescription(addHtmlAdditionalLinks(addModuleName(entry, moduleName))),
        ),
      ),
    ),
  );
}
