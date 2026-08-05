export function territorialControl(events = []) {
  const changes = events.filter(event => event.territorialChange).map(event => Object.freeze({
    eventId: event.id,
    time: event.time,
    lat: event.lat,
    lon: event.lon,
    title: event.title,
    actors: event.actors
  }));
  return Object.freeze({
    changes,
    count: changes.length,
    latest: changes[0] || null,
    state: changes.length >= 3 ? 'VOLATILE' : changes.length ? 'CHANGING' : 'UNCONFIRMED'
  });
}
