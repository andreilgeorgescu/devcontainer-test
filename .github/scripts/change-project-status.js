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
    PROJECT_ITEMS: queryResponse.repository.issue.projectItems.nodes.map(
      (project_item) => {
        field_id: project_item.project.field.id;
        item_id: project_item.id;
        project_id: project_item.project.id;
        option_id: project_item.project.field.options[0].id;
      },
    ),
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

  for (const project_item of variables.PROJECT_ITEMS) {
    await github.graphql(mutation, {
      FIELD_ID: project_item.field_id,
      ITEM_ID: project_item.item_id,
      PROJECT_ID: project_item.project_id,
      OPTION_ID: project_item.option_id,
    });
  }

  console.log("Auto-merge successfully enabled for pull request.");
};
