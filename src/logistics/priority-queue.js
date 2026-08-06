export class PriorityQueue {
  constructor() { this.items = []; }
  get size() { return this.items.length; }
  push(value, priority) {
    const item = { value, priority: Number(priority) };
    this.items.push(item); let index = this.items.length - 1;
    while (index > 0) { const parent = Math.floor((index - 1) / 2); if (this.items[parent].priority <= item.priority) break; this.items[index] = this.items[parent]; index = parent; }
    this.items[index] = item; return this;
  }
  pop() {
    if (!this.items.length) return null;
    const root = this.items[0]; const tail = this.items.pop();
    if (this.items.length && tail) {
      let index = 0;
      while (true) {
        const left = index * 2 + 1; const right = left + 1; if (left >= this.items.length) break;
        const child = right < this.items.length && this.items[right].priority < this.items[left].priority ? right : left;
        if (this.items[child].priority >= tail.priority) break;
        this.items[index] = this.items[child]; index = child;
      }
      this.items[index] = tail;
    }
    return root;
  }
}
