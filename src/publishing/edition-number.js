export function nextEditionNumber(editions = [], publicationId) {
  return editions.filter(item => item.publicationId === publicationId).reduce((maximum, item) => Math.max(maximum, Number(item.editionNumber) || 0), 0) + 1;
}
