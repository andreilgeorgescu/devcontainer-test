module.exports = async ({ github, context, option_name }) => {
  const constants = {
    FIELD_NAME: "Status",
    // OPTION_NAME: option_name,
    OPTION_NAME: "Triage",
    OWNER_NAME: context.repo.owner,
    // PR_NUMBER: context.issue.number,
    PR_NUMBER: 75,
    REPO_NAME: context.repo.repo,
  };

  const query = `
    query Query($FIELD_NAME: String!, $OWNER_NAME: String!, $OPTION_NAME: String!, $PR_NUMBER: Int!, $REPO_NAME: String!) {
      repository(owner: $OWNER_NAME, name: $REPO_NAME) {
        issue(number: $PR_NUMBER) {
          projectItems(first: 100) {
            nodes {
              id
              project {
                id
                field(name: $FIELD_NAME) {
                  ... on ProjectV2SingleSelectField {
                    id
                    options(names: [$OPTION_NAME]) {
                      id
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`;

  const queryResponse = await github.graphql(query, constants);

  const variables = {
    ...constants,
    // PROJECT_ITEMS: queryResponse.repository.issue.projectItems.nodes,
    PROJECT_ITEM: queryResponse.repository.issue.projectItems.nodes[0],
  };

  const mutation = `
    mutation Mutation($FIELD_ID: ID!, $ITEM_ID: ID!, $PROJECT_ID: ID!, $OPTION_ID: String!) {
      updateProjectV2ItemFieldValue(input: {
        fieldId: $FIELD_ID,
        itemId: $ITEM_ID,
        projectId: $PROJECT_ID,
        value: {
          singleSelectOptionId: $OPTION_ID
              },
      }) {
        clientMutationId
      }
    }`;

  // for (const item of variables.PROJECT_ITEMS) {
  //   await github.graphql(mutation, {
  //     FIELD_ID: item.project.field.id,
  //     ITEM_ID: item.id,
  //     PROJECT_ID: item.project.id,
  //     OPTION_ID: item.project.field.options.find(
  //       (option) => option.name === variables.OPTION_NAME,
  //     ).id,
  //   });
  // }

  await github.graphql(mutation, {
    FIELD_ID: variables.PROJECT_ITEM.project.field.id,
    ITEM_ID: variables.PROJECT_ITEM.id,
    PROJECT_ID: variables.PROJECT_ITEM.project.id,
    OPTION_ID: variables.PROJECT_ITEM.project.field.options[0].id,
  });

  console.log("Auto-merge successfully enabled for pull request.");
};