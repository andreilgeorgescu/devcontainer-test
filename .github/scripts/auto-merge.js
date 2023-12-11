module.exports = async ({ github, context }) => {
  const constants = {
    OWNER_NAME: context.repo.owner,
    REPO_NAME: context.repo.repo,
    PR_NUMBER: context.issue.number,
  };

  const query = `
    query FindPullRequestId($OWNER_NAME: String!, $REPO_NAME: String!, $PR_NUMBER: Int!) {
      repository(owner: $OWNER_NAME, name: $REPO_NAME) {
        pullRequest(number: $PR_NUMBER) {
          id
        }
      }
    }`;

  const variables = await github.graphql(query, constants);

  const mutation = `
    mutation EnableAutoMerge($PULL_REQUEST_ID: ID!) {
      enablePullRequestAutoMerge(input: {
        mergeMethod: SQUASH,
        pullRequestId: $PULL_REQUEST_ID,
      }) {
        pullRequest {
          autoMergeRequest {
            enabledAt
            mergeMethod
          }
          number
          title
        }
      }
    }`;

  await github.graphql(mutation, {
    PULL_REQUEST_ID: variables.repository.pullRequest.id,
  });

  console.log("Auto merge enabled for pull request.");
};
