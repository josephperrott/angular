/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {DocEntry} from './entities.mjs';

import {
  isClassEntry,
  isCliEntry,
  isConstantEntry,
  isDecoratorEntry,
  isEnumEntry,
  isFunctionEntry,
  isInitializerApiFunctionEntry,
  isInterfaceEntry,
  isTypeAliasEntry,
} from './entities/categorization.mjs';
import {CliCommandRenderable, DocEntryRenderable} from './entities/renderables.mjs';
import {getClassRenderable} from './transforms/class-transforms.mjs';
import {getDecoratorRenderable} from './transforms/decorator-transforms.mjs';
import {getCliRenderable} from './transforms/cli-transforms.mjs';
import {getConstantRenderable} from './transforms/constant-transforms.mjs';
import {getEnumRenderable} from './transforms/enum-transforms.mjs';
import {getFunctionRenderable} from './transforms/function-transforms.mjs';
import {getInitializerApiFunctionRenderable} from './transforms/initializer-api-functions-transform.mjs';
import {getInterfaceRenderable} from './transforms/interface-transforms.mjs';
import {
  addHtmlAdditionalLinks,
  addHtmlDescription,
  addHtmlJsDocTagComments,
  addHtmlUsageNotes,
  setEntryFlags,
} from './transforms/jsdoc-transforms.mjs';
import {addModuleName} from './transforms/module-name.mjs';
import {getTypeAliasRenderable} from './transforms/type-alias-transforms.mjs';
import {CliCommand} from './cli-entities.mjs';

export function getRenderable(
  entry: DocEntry | CliCommand,
  moduleName: string,
): DocEntryRenderable | CliCommandRenderable {
  if (isCliEntry(entry)) {
    return getCliRenderable(entry);
  }

  if (isClassEntry(entry)) {
    return getClassRenderable(entry, moduleName);
  }
  if (isDecoratorEntry(entry)) {
    return getDecoratorRenderable(entry, moduleName);
  }
  if (isConstantEntry(entry)) {
    return getConstantRenderable(entry, moduleName);
  }
  if (isEnumEntry(entry)) {
    return getEnumRenderable(entry, moduleName);
  }
  if (isInterfaceEntry(entry)) {
    return getInterfaceRenderable(entry, moduleName);
  }
  if (isFunctionEntry(entry)) {
    return getFunctionRenderable(entry, moduleName);
  }
  if (isTypeAliasEntry(entry)) {
    return getTypeAliasRenderable(entry, moduleName);
  }
  if (isInitializerApiFunctionEntry(entry)) {
    return getInitializerApiFunctionRenderable(entry, moduleName);
  }

  // Fallback to an uncategorized renderable.
  return setEntryFlags(
    addHtmlAdditionalLinks(
      addHtmlDescription(
        addHtmlUsageNotes(addHtmlJsDocTagComments(addModuleName(entry, moduleName))),
      ),
    ),
  );
}
