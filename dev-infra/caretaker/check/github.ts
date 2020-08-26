/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {alias, params, types} from 'typed-graphqlify';

import {bold, debug, green, info, red} from '../../utils/console';
import {GitClient} from '../../utils/git';
import {CaretakerConfig} from '../config';



interface GithubInfoQuery {
  [key: string]: {issueCount: number;}
}


export async function getGithubTasks(git: GitClient, config: CaretakerConfig) {
  info.group(bold('Github Tasks'));
  await getGithubInfo(git, config);
  info.groupEnd();
  info();
}



function buildGithubInfoQuery(queries: any): GithubInfoQuery {
  if (!queries?.length) {
    debug('No github queries defined in the configuration, skipping.')
    return {};
  }
  const output = {};
  const githubInfo = {repo: 'angular', org: 'angular'};
  const repo = `repo:${githubInfo.org}/${githubInfo.repo}`;
  queries.forEach(({name, query}) => {
    output[alias(name.replace(/ /g, ''), 'search')] = params(
        {type: 'ISSUE', query: `"${repo} ${query.replace(/"/g, '\\"')}"`},
        {issueCount: types.number});
  });
  return output;
}


async function getGithubInfo(git: GitClient, {githubQueries: queries}: CaretakerConfig) {
  const githubState = await git.github.graphql.query(buildGithubInfoQuery(queries));
  Object.entries(githubState).forEach(([title, result]) => {
    const readableTitle = queries.find(query => query.name.replace(/ /g, '') === title).name;
    info(`${readableTitle.padEnd(25)} ${result.issueCount}`);
  });
}
