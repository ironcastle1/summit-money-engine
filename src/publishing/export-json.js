export function editionJson(edition, options = {}) {
  return `${JSON.stringify({ schema: 'merlin.publication.edition.v1', generatedAt: new Date().toISOString(), edition, options }, null, 2)}
`;
}
