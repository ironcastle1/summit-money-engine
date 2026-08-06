import { savedView, validateSavedViews } from '../geospatial/saved-view.js';
export class SavedMapViewService {
    constructor(options) { Object.assign(this, options); this.maximum = options.maximum || 100; }
    async list(user) { return validateSavedViews(await this.userData.get(user, 'savedViews'), this.maximum); }
    async put(user, input) {
        const next = savedView(input);
        const current = [...await this.list(user)];
        const index = current.findIndex(view => view.id === next.id);
        if (index === -1)
            current.unshift(next);
        else
            current[index] = next;
        return this.userData.put(user, 'savedViews', validateSavedViews(current, this.maximum));
    }
    async remove(user, id) {
        const current = [...await this.list(user)];
        const next = current.filter(view => view.id !== String(id));
        if (next.length === current.length)
            return { removed: false, views: current };
        return { removed: true, views: await this.userData.put(user, 'savedViews', next) };
    }
    validate(values) { return validateSavedViews(values, this.maximum); }
}
