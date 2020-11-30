/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {debug} from './console';
import {GitClient} from './git';


export interface InfoSectionItem {
  header: string;
  content: string;
}

/** Header of Angular information section. */
const infoSectionHeader = `<h2>Angular Pull Request Information</h2>\n\n`;
/** Footer of Angular information section. */
const infoSectionFooter =
    `\n<sup>Note: The above pull request information is automatically generated</sup>`;
/** Regex matcher to extract and replace the info section of a PR's summary. */
const infoSectionMatcher =
    new RegExp(`(<!-- ng-dev-info-section-start -->.*<!-- ng-dev-info-section-end -->)`, 's');

const baseInfoBlock = `<!-- ng-dev-info-section-start -->\n${infoSectionHeader}\n<!-- ng-dev-info-section-new-marker -->${
      infoSectionFooter}<!-- ng-dev-info-section-end -->`;

const newSectionMarkerMatcher = new RegExp(`(<!-- ng-dev-info-section-new-marker -->)`);

/**
 * Update information for a specific subsection of the Angular Pull Request Information section for
 * a specified PR.
 *
 * This updates the summary of the PR in place, adding the Angular Pull Request Information section
 * if it is not already present.  If it is present, updates the subsection identified by the
 * provided header.
 *
 * If no update is needed for the PR's summary, not action is performed.
 */
export async function updateInfoSectionInPrSummary(
    git: GitClient, prNumber: number, sections: InfoSectionItem[]) {
  /** Repo owner and name for the github repository. */
  const {owner, name: repo} = git.remoteConfig;
  /** The body of the issue or pr to be updated */
  let body = (await git.github.pulls.get({repo, owner, pull_number: prNumber})).data.body;
  debug(`Retrieved body of the summary for PR #${prNumber}`);
  /** The matched block of content for the info section, or null if a match isn't found. */
  const infoSectionMatch = body.match(infoSectionMatcher);
  /** Whether an info setion was found in the body. */
  const alreadyHasInfoSection = infoSectionMatch !== null;
  /** The info section  */
  let infoSectionContent = alreadyHasInfoSection ? infoSectionMatch![1] : '';


  for (const {header, content} of sections) {
    /** The id of the section, a kebab case conversion of the header string. */
    const id = header.replace(/\s/, '-').toLowerCase();
    /** The newly defined sticky block of content. */
    const newBlock =
        `<!-- ng-dev-${id}-start -->\n<h4>${id}</h4>\n\n${content}\n<!-- ng-dev-${id}-end -->`
    /** Regex matcher to extract and replace sticky block content in a PR's summary. */
    const blockMatcher = new RegExp(`(<!-- ng-dev-${id}-start -->.*<!-- ng-dev-${id}-end -->)`, 's')
    /** The matched block of content from a PR summary, or null if the match isn't found. */
    const matchedBlock = infoSectionContent.match(blockMatcher);


    if (matchedBlock === null) {
      debug(
          `Sticky block not found in summary body, updating to include the sticky block content.`);
      body = body.replace(newSectionMarkerMatcher, `${content}\n$1`);
    } else if (matchedBlock[1] === newBlock) {
      debug(`Skipping update as the new content exact matches the previous content.`);
      return;
    } else {
      debug(
          `Updating the summary body, to include the new sticky block content, replacing the old.`);
      body = infoSectionContent.replace(blockMatcher, newBlock);
    }


    // Place the new info section in the correct location in the PR body.
    body = alreadyHasInfoSection ? body.replace(infoSectionMatcher, infoSectionContent) :
                                   `${body}\n\n${infoSectionContent}`;
  }
  await git.github.pulls.update({body, pull_number: prNumber, repo, owner});

  debug(`Updated summary body of PR ${prNumber}`);
}
