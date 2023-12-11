module.exports = async ({ github, context }) => {
  const constants = {
    OWNER_NAME: context.repo.owner,
    PR_NUMBER: context.issue.number,
    REPO_NAME: context.repo.repo,
  };

  const query = `
    query Query($OWNER_NAME: String!, $PR_NUMBER: Int!, $REPO_NAME: String!) {
      repository(owner: $OWNER_NAME, name: $REPO_NAME) {
        label(name: "ready-to-test") {
          id
        }
        pullRequest(number: $PR_NUMBER) {
          reviewDecision
          id
        }
      }
    }`;

  const queryResponse = await github.graphql(query, constants);

  const variables = {
    ...constants,
    LABEL_ID: queryResponse.repository.label.id,
    PULL_REQUEST_ID: queryResponse.repository.pullRequest.id,
    REVIEW_DECISION: queryResponse.repository.pullRequest.reviewDecision,
  };

  if (
    variables.REVIEW_DECISION === "APPROVED" ||
    variables.REVIEW_DECISION === null
  ) {
    const mutation = `
  mutation Mutation($LABEL_ID: ID!, $PULL_REQUEST_ID: ID!) {
    addLabelsToLabelable(input: {
      labelableId: $PULL_REQUEST_ID,
      labelIds: [$LABEL_ID]
    }) {
      clientMutationId
      }
  }`;

    await github.graphql(mutation, {
      LABEL_ID: variables.LABEL_ID,
      PULL_REQUEST_ID: variables.PULL_REQUEST_ID,
    });

    console.log("Pull request successfully labeled as ready-to-test.");
  } else {
    console.log(
      "Pull request has already been approved or no review required.",
    );
  }
};
