module.exports = async ({ github, context }) => {
  const constants = {
    HEAD_BRANCH: context.ref.replace("refs/heads/", ""),
    OWNER_NAME: context.repo.owner,
    REPO_NAME: context.repo.repo,
  };

  const query = `
    query GetPullRequestCommitCount($OWNER_NAME: String!, $REPO_NAME: String!, $HEAD_BRANCH: String!) {
      repository(owner: $OWNER_NAME, name: $REPO_NAME) {
        defaultBranchRef {
          compare(headRef: $HEAD_BRANCH) {
            commits {
              totalCount
            }
          }
          name
        }
        id
        ref(qualifiedName: $HEAD_BRANCH) {
          associatedPullRequests {
            totalCount
          }
          target {
            ... on Commit {
              messageBody
              messageHeadline
            }
          }
        }
      }
    }`;

  const queryResponse = await github.graphql(query, constants);

  const variables = {
    ...constants,
    BASE_BRANCH: queryResponse.repository.defaultBranchRef.name,
    PR_BODY: queryResponse.repository.ref.target.messageBody,
    PR_TITLE: queryResponse.repository.ref.target.messageHeadline,
    PR_COUNT: queryResponse.repository.ref.associatedPullRequests.totalCount,
    REPO_ID: queryResponse.repository.id,
    COMMITS_COUNT:
      queryResponse.repository.defaultBranchRef.compare.commits.totalCount,
  };

  if (variables.PR_COUNT === 0 && variables.COMMITS_COUNT >= 1) {
    const mutation = `
      mutation CreatePR($REPO_ID: ID!, $HEAD_BRANCH: String!, $BASE_BRANCH: String!, $PR_TITLE: String!, $PR_BODY: String) {
        createPullRequest(input: {
          baseRefName: $BASE_BRANCH,
          body: $PR_BODY,
          headRefName: $HEAD_BRANCH,
          repositoryId: $REPO_ID,
          title: $PR_TITLE,
        })
      }`;

    await github.graphql(mutation, {
      BASE_BRANCH: variables.BASE_BRANCH,
      HEAD_BRANCH: variables.HEAD_BRANCH,
      PR_BODY: variables.PR_BODY,
      PR_TITLE: variables.PR_TITLE,
      REPO_ID: variables.REPO_ID,
    });

    console.log("Pull Request Created:");
  } else {
    console.log("Conditions not met, no pull request created.");
  }
};
