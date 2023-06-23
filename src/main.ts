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
  const skipApproveCount =
    Number.parseInt(core.getInput('skip-approve-count'), 10) || 0;
  const token = core.getInput('token');

  // log all inputs
  core.info(`stale-days: ${staleDays}`);
  core.info(`base-branch: ${baseBranch}`);
  core.info(`reminder-labels: ${reminderLabels}`);
  core.info(`send-reminder-comment: ${sendReminderComment}`);
  core.info(`only-business-days: ${onlyBusinessDays}`);
  core.info(`ignore-draft: ${ignoreDraft}`);
  core.info(`skip-approve-count: ${skipApproveCount}`);

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
    core.info(`PR number: ${pr.number}`);

    // skip draft pr
    if (ignoreDraft && pr.draft) {
      core.info(`Skip draft PR: ${pr.number}`);
      continue;
    }

    // get pr updated date
    core.info(`PR updated date: ${pr.updated_at}`);
    core.info(`PR current date: ${new Date()}`);
    if (
      !isStalePr(
        new Date(pr.updated_at),
        new Date(),
        Number(staleDays),
        onlyBusinessDays,
      )
    ) {
      core.info(`Active PR: ${pr.number}`);
      continue;
    }

    // mention reviewers who haven't reviewed
    if (sendReminderComment) {
      const { data: reviews } = await octokit.rest.pulls.listReviews({
        ...repo,
        pull_number: pr.number,
      });
      const reviewersWhoApproved = reviews
        .filter((review) => review.state === 'APPROVED')
        .map((review) => review.user?.login);
      core.info(`Reviewers who reviewed & approved: ${reviewersWhoApproved}`);

      if (
        skipApproveCount > 0 &&
        reviewersWhoApproved.length >= skipApproveCount
      ) {
        core.info(
          `Skip reminder comment approve count(${reviews.length}) is enough: ${pr.number}`,
        );
        continue;
      }

      // get reviewers and teams who haven't reviewed
      const reviewers = pr.requested_reviewers
        ?.filter((reviewer) => !reviewersWhoApproved.includes(reviewer.login))
        .map((reviewer) => `@${reviewer.login}`)
        .concat(pr.requested_teams?.map((team) => `@${team.name}`) || [])
        .join(' ');
      core.info(`Reviewers who haven't reviewed: ${reviewers}`);

      if (reviewers?.trim()) {
        const comment = `${reviewers} <br />Please review it again.`;
        await octokit.rest.issues.createComment({
          ...repo,
          issue_number: pr.number,
          body: comment,
        });
      }
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
  }
};

main().catch((error) => {
  if (error instanceof Error) {
    core.setFailed(error.message);
  }
});
