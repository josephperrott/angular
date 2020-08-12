
import {PullsListCommitsResponseItem as Commit} from '@octokit/rest';
import {GitClient} from '../../utils/git';

import {exec} from '../../utils/shelljs';
import {getRepoBaseDir} from '../../utils/config';
import {prompt} from 'inquirer';

import {checkOutPrLocally} from '../common/checkout-upstream-pr';

import {parseCommitMessage} from '../../commit-message/parse';
import {validateCommitMessage} from '../../commit-message/validate';

import { promptConfirm, info,error, debug} from '../../utils/console';

export async function fixupCommits(pr: number, githubToken: string) {
  const git = new GitClient(githubToken);
  const commits = (await getCommitsForPr(git, pr)).reverse();

  const commitsAsInquirerOptions = commits.reverse().map(commit => {
    return {
      name: parseCommitMessage(commit.commit.message).header,
      value: commit.sha,
    };
  });

  const {pushToUpstream, reset} = await checkOutPrLocally(pr, githubToken);



  const selectedCommits: string[] = (await prompt({
    type: 'checkbox',
    choices: commitsAsInquirerOptions,
    message: 'select things',
    name: 'output'
  })).output;

  if (selectedCommits.length === 0) {
    reset();
    return;
  }

  exec(`git reset --hard ${commits[0].sha}~1`);

  for (const commit of commits) {

    debug(`Applying commit: ${commit.sha}`);
    exec(`git format-patch -1 ${commit.sha} --stdout | git am --committer-date-is-author-date`);
    if (selectedCommits.includes(commit.sha)) {
      await ammendCommit();
    }
    debug(exec(`git rev-parse`));
  }

  try {
    pushToUpstream();
  }
  catch {
    reset();
  }

  process.exit(0);
}

async function getCommitsForPr(gitClient: GitClient, pr: number) {
  const {owner, name: repo} = gitClient.remoteConfig;
  return (await gitClient.github.pulls.listCommits({pull_number: pr, owner, repo})).data;
}

async function ammendCommit() {
  let commitMsg = exec(`git log --format=%B -n 1 HEAD`).stdout;

  async function updateMessage() {
    commitMsg = (await prompt<{result: string}>({
      type: 'editor',
      default: commitMsg,
      name: 'result',
      message: 'What should the new commit be?',
    })).result;
  }

  await updateMessage();

  exec(`git commit --amend -m "${commitMsg}" --no-verify`);
}
