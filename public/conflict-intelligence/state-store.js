const KEY = 'merlin.conflict-intelligence.v1';
export class ConflictStateStore {
  load() {
    try {
      return {
        ...this.defaults(),
        ...JSON.parse(localStorage.getItem(KEY) || '{}')
      };
    }
    catch {
      return this.defaults();
    }
  }
  save(state) {
    localStorage.setItem(KEY,
    JSON.stringify(state));
    return state;
  }
  defaults() {
    return {
      selected: null,
      minimumRisk: 0,
      query: '',
      scenario: 'REGIONAL_ENTRY'
    };
  }
}
