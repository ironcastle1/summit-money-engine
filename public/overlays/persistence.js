const KEY='merlin.overlay-state.v20';
export class OverlayPersistence { constructor(storage=window.localStorage){this.storage=storage;} load(){try{return JSON.parse(this.storage.getItem(KEY)||'null');}catch{return null;}} save(state){try{this.storage.setItem(KEY,JSON.stringify(state));return true;}catch{return false;}} clear(){try{this.storage.removeItem(KEY);}catch{}} }
