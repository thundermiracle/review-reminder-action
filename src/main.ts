import * as core from '@actions/core';
import * as github from '@actions/github';

import { isStalePr } from './utils';

const main = async () => {
  // get inputs
  const staleDays = core.getInput('stale-days');
  const baseBranch = core.getInput('base-branch');
  const reminderLabels = core.getMultilineInput('reminder-labels');
  const sendReminderComment = core.getBooleanInput('send-reminder-comment');
  const onlyBusinessDays = core.getBooleanInput('only-business-days');
  const ignoreDraft = core.getBooleanInput('ignore-draft');
  const token = core.getInput('token');

  // log all inputs
  core.info(`stale-days: ${staleDays}`);
  core.info(`base-branch: ${baseBranch}`);
  core.info(`reminder-labels: ${reminderLabels}`);
  core.info(`send-reminder-comment: ${sendReminderComment}`);
  core.info(`only-business-days: ${onlyBusinessDays}`);
  core.info(`ignore-draft: ${ignoreDraft}`);

  const {
    context: { repo },
  } = github;
  const octokit = github.getOctokit(token);

  // get all opened pull requests
  const searchOptions: { base?: string } = {};
  if (baseBranch) {
    searchOptions.base = baseBranch;
  }

  // get all pull requests
  const { data: pullRequests } = await octokit.rest.pulls.list({
    ...repo,
    ...searchOptions,
    state: 'open',
    sort: 'updated',
    per_page: 100,
  });
  core.info(`Total pull requests: ${pullRequests.length}`);

  for (const pr of pullRequests) {
    // skip draft pr
    if (ignoreDraft && pr.draft) {
      core.info(`Skip draft PR: ${pr.number}`);
      continue;
    }

    // get pr updated date
    core.info(`PR updated date: ${pr.updated_at}`);
    core.info(`PR current date: ${new Date().toLocaleString()}`);
    if (
      isStalePr(
        new Date(pr.updated_at),
        new Date(),
        Number(staleDays),
        onlyBusinessDays,
      )
    ) {
      core.info(`Stale PR: ${pr.number}`);
      continue;
    }

    // add labels
    if (reminderLabels.length) {
      core.info(`Add labels: ${reminderLabels}`);
      await octokit.rest.issues.addLabels({
        ...repo,
        issue_number: pr.number,
        labels: reminderLabels,
      });
    }

    // mention reviewers who haven't reviewed
    if (sendReminderComment) {
      const { data: reviews } = await octokit.rest.pulls.listReviews({
        ...repo,
        pull_number: pr.number,
      });
      const reviewersWhoReviewed = reviews.map((review) => review.user?.login);
      core.info(`Reviewers who reviewed: ${reviewersWhoReviewed}`);

      const reviewers = pr.requested_reviewers
        ?.filter((reviewer) => !reviewersWhoReviewed.includes(reviewer.login))
        .map((reviewer) => `@${reviewer.login}`)
        .join(' ');
      core.info(`Reviewers who haven't reviewed: ${reviewers}`);

      if (reviewers?.trim()) {
        const comment = `${reviewers} Please review it again.`;
        await octokit.rest.issues.createComment({
          ...repo,
          issue_number: pr.number,
          body: comment,
        });
      }
    }
  }
};

main().catch((error) => {
  if (error instanceof Error) {
    core.setFailed(error.message);
  }
});
