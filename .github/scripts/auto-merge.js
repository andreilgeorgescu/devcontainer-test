module.exports = async ({ github, context }) => {
  const constants = {
    OWNER_NAME: context.repo.owner,
    REPO_NAME: context.repo.repo,
    PR_NUMBER: context.issue.number,
  };

  const query = `
    query FindPullRequestId($OWNER_NAME: String!, $PR_NUMBER: Int!, $REPO_NAME: String!) {
      repository(owner: $OWNER_NAME, name: $REPO_NAME) {
        pullRequest(number: $PR_NUMBER) {
          id
        }
      } {
        clientMutationId
      }
    }`;

  const queryResponse = await github.graphql(query, constants);

  const variables = {
    ...constants,
    PULL_REQUEST_ID: queryResponse.repository.pullRequest.id,
  };

  const mutation = `
    mutation EnableAutoMerge($PULL_REQUEST_ID: ID!) {
      enablePullRequestAutoMerge(input: {
        mergeMethod: SQUASH,
        pullRequestId: $PULL_REQUEST_ID,
      })
    }`;

  await github.graphql(mutation, {
    PULL_REQUEST_ID: variables.PULL_REQUEST_ID,
  });

  console.log("Auto-merge successfully enabled for pull request.");
};
