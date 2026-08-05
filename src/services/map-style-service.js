const STYLES = Object.freeze([
    { id: 'streets', title: 'Detailed streets', theme: 'day', tileTemplate: '/api/map/tiles/streets/{z}/{x}/{y}.png', attribution: 'OpenStreetMap contributors', labelMode: 'english-local', supportsTerrain: false },
    { id: 'light', title: 'Light intelligence', theme: 'paper', tileTemplate: '/api/map/tiles/light/{z}/{x}/{y}.png', attribution: 'OpenStreetMap contributors and CARTO', labelMode: 'english-local', supportsTerrain: false },
    { id: 'terrain', title: 'Terrain and relief', theme: 'terrain', tileTemplate: '/api/map/tiles/terrain/{z}/{x}/{y}.png', attribution: 'OpenTopoMap contributors', labelMode: 'english-local', supportsTerrain: true },
    { id: 'local', title: 'Local political', theme: 'political', tileTemplate: null, attribution: 'Merlin reference catalogue', labelMode: 'english-local', supportsTerrain: false }
]);
const THEMES = Object.freeze([
    { id: 'command', title: 'Command blue', variables: { accent: '#63c8f0', background: '#10212b', panel: '#1f3440', text: '#f2f7f8' } },
    { id: 'graphite', title: 'Graphite', variables: { accent: '#d0d5d8', background: '#121619', panel: '#242b2f', text: '#f4f5f5' } },
    { id: 'sand', title: 'Field sand', variables: { accent: '#dd9d42', background: '#242019', panel: '#3b3327', text: '#fbf3e5' } },
    { id: 'forest', title: 'Operations green', variables: { accent: '#7dc498', background: '#10221b', panel: '#20382d', text: '#f0f8f3' } },
    { id: 'crimson', title: 'Crisis red', variables: { accent: '#ef6a73', background: '#26171b', panel: '#44252c', text: '#fff3f4' } },
    { id: 'light', title: 'Analyst light', variables: { accent: '#176f9b', background: '#e7edef', panel: '#f8faf9', text: '#142a34' } }
]);
export class MapStyleService {
    styles() { return STYLES; }
    themes() { return THEMES; }
    style(id) { return STYLES.find(style => style.id === String(id)) || STYLES[0]; }
    theme(id) { return THEMES.find(theme => theme.id === String(id)) || THEMES[0]; }
    snapshot() { return Object.freeze({ styles: STYLES, themes: THEMES, defaults: Object.freeze({ style: 'streets', theme: 'command', labels: 'english-local' }) }); }
}
