module.exports = async ({ github, context }) => {
  const constants = {
    OWNER_NAME: context.repo.owner,
    PR_NUMBER: context.issue.number,
    REPO_NAME: context.repo.repo,
  };

  const query = `
    query Query($OWNER_NAME: String!, $PR_NUMBER: Int!, $REPO_NAME: String!) {
      repository(owner: $OWNER_NAME, name: $REPO_NAME) {
        pullRequest(number: $PR_NUMBER) {
          reviewDecision
          id
        }
      }
    }`;

  const queryResponse = await github.graphql(query, constants);

  const variables = {
    ...constants,
    PULL_REQUEST_ID: queryResponse.repository.pullRequest.id,
    REVIEW_DECISION: queryResponse.repository.pullRequest.reviewDecision,
  };

  if (
    variables.REVIEW_DECISION === "APPROVED" ||
    variables.REVIEW_DECISION === null
  ) {
    const mutation = `
      mutation Mutation($PULL_REQUEST_ID: ID!) {
        addComment(input: {
          body: "/merge",
          subjectId: $PULL_REQUEST_ID,
        }) {
          clientMutationId
          }
      }`;

    await github.graphql(mutation, {
      PULL_REQUEST_ID: variables.PULL_REQUEST_ID,
    });

    console.log("Pull request is ready to be merged");
  } else {
    console.log("Pull request is not ready to be merged.");
  }
};
