module.exports = async ({ github, context }) => {
  const HEAD_BRANCH = context.ref.replace("refs/heads/", "");
  const OWNER_NAME = context.repo.owner;
  const REPO_NAME = context.repo.repo;

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

  const queryResult = await github.graphql(query, {
    HEAD_BRANCH,
    OWNER_NAME,
    REPO_NAME,
  });

  const BASE_BRANCH = queryResult.repository.defaultBranchRef.name;
  const commitsCount =
    queryResult.repository.defaultBranchRef.compare.commits.totalCount;
  const PR_BODY = queryResult.repository.ref.target.messageBody;
  const PR_TITLE = queryResult.repository.ref.target.messageHeadline;
  const prCount = queryResult.repository.ref.associatedPullRequests.totalCount;
  const REPO_ID = queryResult.repository.id;

  if (prCount === 0 && commitsCount >= 1) {
    const mutation = `
      mutation CreatePR($REPO_ID: ID!, $HEAD_BRANCH: String!, $BASE_BRANCH: String!, $PR_TITLE: String!, $PR_BODY: String) {
        createPullRequest(input: {
          baseRefName: $BASE_BRANCH,
          body: $PR_BODY,
          headRefName: $HEAD_BRANCH,
          repositoryId: $REPO_ID,
          title: $PR_TITLE,
        }) {
          pullRequest {
            id
            number
            title
            bodyText
          }
        }
      }`;

    const mutationResult = await github.graphql(mutation, {
      BASE_BRANCH,
      HEAD_BRANCH,
      PR_BODY,
      PR_TITLE,
      REPO_ID,
    });

    console.log(
      "Pull Request Created:",
      mutationResult.createPullRequest.pullRequest,
    );
  } else {
    console.log("Conditions not met, no pull request created.");
  }
};
