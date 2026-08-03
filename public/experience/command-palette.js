import { createCommandRegistry, rankCommands } from './command-registry.js';

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

export class CommandPalette {
  constructor({ onExecute, commands = createCommandRegistry(), sound } = {}) {
    this.onExecute = onExecute;
    this.commands = commands;
    this.sound = sound;
    this.opened = false;
    this.activeIndex = 0;
    this.results = commands.slice(0, 12);
  }

  bind() {
    this.root = document.querySelector('#command-palette');
    this.input = document.querySelector('#command-input');
    this.list = document.querySelector('#command-results');
    this.backdrop = document.querySelector('#command-backdrop');
    document.querySelector('#command-toggle')?.addEventListener('click', () => this.open());
    document.querySelector('#command-close')?.addEventListener('click', () => this.close());
    this.backdrop?.addEventListener('click', () => this.close());
    this.input?.addEventListener('input', event => this.search(event.target.value));
    this.input?.addEventListener('keydown', event => this.#onKeydown(event));
    this.list?.addEventListener('mousemove', event => {
      const row = event.target.closest('[data-command-index]');
      if (!row) return;
      this.activeIndex = Number(row.dataset.commandIndex);
      this.#paintActive();
    });
    this.list?.addEventListener('click', event => {
      const row = event.target.closest('[data-command-index]');
      if (row) this.execute(Number(row.dataset.commandIndex));
    });
    document.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        this.opened ? this.close() : this.open();
      }
      if (event.key === 'Escape' && this.opened) this.close();
    });
    this.render();
  }

  setCommands(commands) {
    this.commands = commands;
    this.search(this.input?.value || '');
  }

  open(query = '') {
    if (!this.root) return;
    this.opened = true;
    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('command-open');
    this.search(query);
    requestAnimationFrame(() => this.input?.focus());
    this.sound?.play('OPEN');
  }

  close() {
    if (!this.root || !this.opened) return;
    this.opened = false;
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('command-open');
    this.sound?.play('CLOSE');
  }

  search(query) {
    if (this.input && this.input.value !== query) this.input.value = query;
    this.results = rankCommands(this.commands, query, 14);
    this.activeIndex = 0;
    this.render();
  }

  execute(index = this.activeIndex) {
    const command = this.results[index];
    if (!command) return;
    this.onExecute?.(command);
    this.sound?.play('NAVIGATE');
    this.close();
  }

  render() {
    if (!this.list) return;
    if (!this.results.length) {
      this.list.innerHTML = '<div class="command-empty"><strong>NO MATCH</strong><span>Try a view, action or shortcut.</span></div>';
      return;
    }
    this.list.innerHTML = this.results.map((command, index) => `
      <button class="command-row${index === this.activeIndex ? ' active' : ''}" type="button" data-command-index="${index}" role="option" aria-selected="${index === this.activeIndex}">
        <span class="command-icon">${command.type === 'view' ? 'VIEW' : 'ACT'}</span>
        <span class="command-copy"><strong>${escapeHtml(command.label)}</strong><small>${escapeHtml(command.detail || '')}</small></span>
        ${command.shortcut ? `<kbd>${escapeHtml(command.shortcut)}</kbd>` : ''}
      </button>`).join('');
  }

  #paintActive() {
    this.list?.querySelectorAll('[data-command-index]').forEach((row, index) => {
      row.classList.toggle('active', index === this.activeIndex);
      row.setAttribute('aria-selected', String(index === this.activeIndex));
    });
    this.list?.querySelector(`[data-command-index="${this.activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }

  #onKeydown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex = Math.min(this.results.length - 1, this.activeIndex + 1);
      this.#paintActive();
      this.sound?.play('INTERACT', { level: 0.4 });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex = Math.max(0, this.activeIndex - 1);
      this.#paintActive();
      this.sound?.play('INTERACT', { level: 0.4 });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.execute();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }
}
