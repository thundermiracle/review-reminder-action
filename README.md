# review-reminder-action

A reminder that add labels and mention reviewers when pull requests become stale.

## Usage

1. Create `.github/workflows/review-reminder.yml` in your repository.

2. Add the following code to the file.

```yml
name: Review Reminder

on:
  schedule:
    - cron: '0 0 * * *'

jobs:
  review-reminder:
    permissions:
      contents: read
      pull-requests: write
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: enable corepack
        run: corepack enable

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --no-frozen-lockfile

      - name: Check last updated date
        uses: thundermiracle/review-reminder-action@v1
        env:
          stale-days: 2
```

## Configuration

You can configure the action with environment variables.

| Name                  | Description                                                                               | Required | Type         | Default      |
| --------------------- | ----------------------------------------------------------------------------------------- | -------- | ------------ | ------------ |
| stale-days            | The days that pull requests become stale.                                                 |          | number       | 2            |
| base-branch           | The base branch of pull requests.(nothing means all pull requests are targets)            |          | string       |              |
| reminder-labels       | The labels that will be added to pull requests. eg: ['need review', 'need help']          |          | String Array |              |
| send-reminder-comment | Send comment with mentions for pull request reviewers when the pull request needs review. |          | boolean      | true         |
| only-business-days    | Only count business days when calculating the stale days.                                 |          | boolean      | true         |
| ignore-draft          | Ignore draft pull requests.                                                               |          | boolean      | true         |
| token                 | The token to use for authentication.                                                      |          | string       | github.token |

## License

The scripts and documentation in this project are released under the [MIT License](./LICENSE)
