import { $, text } from '../ui/dom.js';
import { CATEGORY_COLOURS } from '../map/theme.js';
import { upper } from '../ui/format.js';

export class CategoryFilters {
  constructor(options) {
    this.store = options.store;
    this.container = $('#category-filters');
    this.clearButton = $('#clear-category-filters');
    this.clearButton.addEventListener('click', () => {
      this.store.setState({ categories: new Set() }, 'filters.cleared');
      this.render();
      window.dispatchEvent(new CustomEvent('merlin:filters-changed'));
    });
  }

  render() {
    const state = this.store.getState();
    const counts = new Map();
    for (const event of state.localEvents) counts.set(event.category, (counts.get(event.category) || 0) + 1);
    const categories = [...counts.entries()].sort((left, right) => right[1] - left[1]);
    this.container.replaceChildren();
    for (const [category, count] of categories) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `category-filter${state.categories.has(category) ? ' active' : ''}`;
      button.style.setProperty('--category-colour', CATEGORY_COLOURS[category] || CATEGORY_COLOURS.other);
      button.innerHTML = `<i></i><span>${upper(category)}</span><b>${count}</b>`;
      button.addEventListener('click', () => {
        const next = new Set(this.store.getState().categories);
        if (next.has(category)) next.delete(category);
        else next.add(category);
        this.store.setState({ categories: next }, 'filters.category_toggled');
        this.render();
        window.dispatchEvent(new CustomEvent('merlin:filters-changed'));
      });
      this.container.append(button);
    }
    text(this.clearButton, state.categories.size ? `ALL (${state.categories.size})` : 'ALL');
  }
}
