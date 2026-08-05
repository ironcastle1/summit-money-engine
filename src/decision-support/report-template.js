import { REPORT_FORMATS } from './constants.js';
export function reportTemplate(type = 'EXECUTIVE') {
  const id = REPORT_FORMATS.includes(String(type).toUpperCase()) ? String(type).toUpperCase() : 'EXECUTIVE';
  const sections = {
    EXECUTIVE: ['Executive summary','Priority signals','Actions','Evidence gaps'],
    MORNING: ['Overnight changes','Critical signals','Markets','Conflict and hazards','Actions'],
    SHIFT_HANDOVER: ['Current position','Unresolved items','Watchlist hits','Tasks','Data gaps'],
    INCIDENT: ['Incident overview','Timeline','Impact','Evidence','Decisions','Next actions'],
    MARKET: ['Market regime','Opportunities','Risks','Catalysts','Portfolio exposure'],
    COUNTRY: ['Political risk','Security','Economy','Sanctions','Scenarios'],
    ROUTE: ['Route overview','Disruptions','Cost and ETA','Alternatives','Actions']
  }[id];
  return Object.freeze({ id, title: id.replaceAll('_', ' '), sections: Object.freeze(sections) });
}
