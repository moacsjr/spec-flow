import { graphql } from '@octokit/graphql';

function makeClient(token) {
  return graphql.defaults({
    headers: { authorization: `token ${token}` },
  });
}

export async function createProject(token, ownerId, title) {
  const client = makeClient(token);
  const result = await client(`
    mutation CreateProject($ownerId: ID!, $title: String!) {
      createProjectV2(input: { ownerId: $ownerId, title: $title }) {
        projectV2 {
          id
          number
          url
          fields(first: 20) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
              }
            }
          }
        }
      }
    }
  `, { ownerId, title });

  const project = result.createProjectV2.projectV2;
  const statusField = project.fields.nodes.find(f => f.name === 'Status');
  return { projectId: project.id, projectNumber: project.number, projectUrl: project.url, statusFieldId: statusField?.id };
}

export async function updateStatusField(token, fieldId, options) {
  const client = makeClient(token);
  await client(`
    mutation UpdateStatusField($fieldId: ID!, $options: [ProjectV2SingleSelectFieldOptionInput!]!) {
      updateProjectV2Field(input: {
        fieldId: $fieldId
        singleSelectOptions: $options
      }) {
        projectV2Field {
          ... on ProjectV2SingleSelectField {
            id
            name
          }
        }
      }
    }
  `, {
    fieldId,
    options: options.map(o => ({ name: o.name, color: o.color, description: '' })),
  });
}

export async function createSingleSelectField(token, projectId, name, options) {
  const client = makeClient(token);
  const result = await client(`
    mutation CreateField($projectId: ID!, $name: String!, $options: [ProjectV2SingleSelectFieldOptionInput!]!) {
      createProjectV2Field(input: {
        projectId: $projectId
        dataType: SINGLE_SELECT
        name: $name
        singleSelectOptions: $options
      }) {
        projectV2Field {
          ... on ProjectV2SingleSelectField {
            id
            name
          }
        }
      }
    }
  `, {
    projectId,
    name,
    options: options.map(o => ({ name: o.name, color: o.color, description: o.description || '' })),
  });
  return result.createProjectV2Field.projectV2Field.id;
}

export async function createTextField(token, projectId, name) {
  const client = makeClient(token);
  const result = await client(`
    mutation CreateTextField($projectId: ID!, $name: String!) {
      createProjectV2Field(input: {
        projectId: $projectId
        dataType: TEXT
        name: $name
      }) {
        projectV2Field {
          ... on ProjectV2Field {
            id
            name
          }
        }
      }
    }
  `, { projectId, name });
  return result.createProjectV2Field.projectV2Field.id;
}

export async function linkProjectToRepo(token, projectId, repositoryId) {
  const client = makeClient(token);
  await client(`
    mutation LinkProject($projectId: ID!, $repositoryId: ID!) {
      linkProjectV2ToRepository(input: {
        projectId: $projectId
        repositoryId: $repositoryId
      }) {
        repository {
          id
        }
      }
    }
  `, { projectId, repositoryId });
}
