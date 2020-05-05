/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {exec} from 'shelljs';
import {graphql as unauthenticatedGraphql} from '@octokit/graphql';
import {alias, params, query as graphqlQuery, types} from 'typed-graphqlify';

/**
 * Authenticated instance of Github GraphQl API service, relies on a
 * personal access token being available in the TOKEN environment variable.
 */
const graphql = unauthenticatedGraphql.defaults({
  headers: {
    // TODO(josephperrott): Remove reference to TOKEN environment variable as part of larger
    // effort to migrate to expecting tokens via GITHUB_ACCESS_TOKEN environment variables.
    authorization: `token ${process.env.TOKEN || process.env.GITHUB_ACCESS_TOKEN}`,
  }
});


/**
 * Log the environment variables expected by bazel for stamping.
 *
 * See the section on stamping in docs / BAZEL.md
 *
 * This script must be a NodeJS script in order to be cross-platform.
 * See https://github.com/bazelbuild/bazel/issues/5958
 * Note: git operations, especially git status, take a long time inside mounted docker volumes
 * in Windows or OSX hosts (https://github.com/docker/for-win/issues/188).
 */
export async function checkRebase(prNumber: number) {
  if (hasLocalChanges()) {
    console.error('Cant run with local changes');
    process.exit(1);
  }

  const originalBranch = getCurrentBranch();

  const pendingPrs = (await getPendingPrs()).slice(0, 5);
  const pendingPrsAsRefs = pendingPrs.map(pendingPr => `pull/${pendingPr.number}/head:pr-${pendingPr.number}`);

  exec(`git fetch upstream ${pendingPrsAsRefs.join(' ')}`, {silent: false});

  exec(`git checkout pr-${prNumber}`, {silent: false});

  for (const pr of pendingPrs) {
    const result = exec(`git cherry-pick pr-${pr}`, {silent: false});
    exec(`git branch -D pr-${pr};`, {silent: false});
    exec(`git reset --hard pr-${prNumber}`, {silent: false});
    console.info(`${pr}: ${result.code ? 'conflicts': 'merges'}`);
  }

  exec(`git checkout ${originalBranch}`);
}


async function getPendingPrs() {
  // The GraphQL query object to get a page of members of an organization.
  const PRS_QUERY = params(
    {
      $first: 'Int',      // How many entries to get with each request
      $after: 'String',   // The cursor to start the page at
      $owner: 'String!',  // The organization to query for
      $name: 'String!',  // The organization to query for
    },
    {
      repository: params({login: '$owner', name: '$name'}, {
        pullRequests: params(
            {
              first: '$first',
              after: '$after',
              states: `OPEN`,
            },
            {
              nodes: [{number: types.number}],
              pageInfo: {
                hasNextPage: types.boolean,
                endCursor: types.string,
              },
            }),
      })
    });
  const query = graphqlQuery('members', PRS_QUERY);

  /**
  * Gets the query and queryParams for a specific page of entries.
  */
  const queryBuilder = (count: number, cursor?: string) => {
  return {
    query,
    params: {
      after: cursor || null,
      first: count,
      owner: 'angular',
      name: 'angular',
    },
  };
  };

  // The current cursor
  let cursor = undefined;
  // If an additional page of members is expected
  let hasNextPage = true;
  // Array of Github usernames of the organization
  const prs: {number: number}[] = [];

  while (hasNextPage) {
  const {query, params} = queryBuilder(100, cursor);
  const results = await graphql(query, params) as typeof PRS_QUERY;

  prs.push(...results.repository.pullRequests.nodes);
  hasNextPage = results.repository.pullRequests.pageInfo.hasNextPage;
  cursor = results.repository.pullRequests.pageInfo.endCursor;
  }
  return prs;
}



/** Whether the repo has local changes. */
function hasLocalChanges() {
  return !!exec(`git status --untracked-files=no --porcelain`, {silent: false}).trim();
}

/** Get the currently checked out branch. */
function getCurrentBranch() {
  return exec(`git symbolic-ref --short HEAD`, {silent: false}).trim();
}
