import { $, text } from '../ui/dom.js';
import { age, number, upper } from '../ui/format.js';
import { CATEGORY_COLOURS } from '../map/theme.js';

export class EventList {
  constructor(options) {
    this.store = options.store;
    this.mapController = options.mapController;
    this.container = $('#event-list');
    this.template = $('#event-row-template');
  }

  render(events) {
    this.container.replaceChildren();
    if (!events.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = '0 EVENTS';
      this.container.append(empty);
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const event of events.slice(0, 500)) {
      const row = this.template.content.firstElementChild.cloneNode(true);
      row.style.setProperty('--category-colour', CATEGORY_COLOURS[event.category] || CATEGORY_COLOURS.other);
      text('.event-col-main strong', event.title, row);
      text('.event-col-main small', `${upper(event.category)} / ${upper(event.source)}`, row);
      text('.event-age', age(event.time), row);
      text('.event-distance', Number.isFinite(event.distanceKm) ? number(event.distanceKm) : 'N/A', row);
      text('.event-severity', number(event.severity, 1), row);
      row.addEventListener('click', () => this.mapController.focusEvent(event));
      fragment.append(row);
    }
    this.container.append(fragment);
  }
}
