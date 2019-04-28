
export interface IComparable {
    compareTo(other: IComparable): number;
}
export interface IHashable {
    getKey(): string;
}

export interface IHeapItem extends IComparable, IHashable {

}

export class Map<TValue> {
    private obj: any;

    constructor() {
        this.obj = {};
    }

    public containsKey(key: string): boolean {
        return key in this.obj;
    }

    public getKeys(): string[] {
        const keys: string[] = [];
        for (const el in this.obj) {
            if (this.obj.hasOwnProperty(el)) {
                keys.push(el);
            }
        }
        return keys;
    }

    public get(key: string): TValue | null {
        const o = this.obj[key];
        if (typeof o === "undefined") {
            return null;
        } else {
            return o as TValue;
        }
    }

    public put(key: string, value: TValue): void {
        this.obj[key] = value;
    }

    public remove(key: string) {
        delete this.obj[key];
    }

    public clone(): Map<TValue> {
        const m = new Map<TValue>();
        m.obj = {};
        for (const p in this.obj) {
            m.obj[p] = this.obj[p];
        }
        return m;
    }
}
class Heap<T extends IHeapItem> {

    private array: T[];
    private keyMap: Map<number>;

    constructor() {
        this.array = [];
        this.keyMap = new Map<number>();
    }

    public add(obj: T): void {
        if (this.keyMap.containsKey(obj.getKey())) {
            throw new Error("Item with key " + obj.getKey() + " already exists in the heap");
        }

        this.array.push(obj);
        this.keyMap.put(obj.getKey(), this.array.length - 1);
        this.checkParentRequirement(this.array.length - 1);
    }

    public replaceAt(idx: number, newobj: T): void {
        this.array[idx] = newobj;
        this.keyMap.put(newobj.getKey(), idx);
        this.checkParentRequirement(idx);
        this.checkChildrenRequirement(idx);
    }

    public shift(): T {
        return this.removeAt(0);
    }

    public remove(obj: T): void {
        const idx = this.keyMap.get(obj.getKey());

        if (idx === -1) {
            return;
        }
        this.removeAt(idx!);
    }

    public removeWhere(predicate: (el: T) => boolean) {
        const itemsToRemove: T[] = [];
        for (let i: number = this.array.length - 1; i >= 0; i--) {
            if (predicate(this.array[i])) {
                itemsToRemove.push(this.array[i]);
            }
        }
        for (const el of itemsToRemove) {
            this.remove(el);
        }
        for (const el of this.array) {
            if (predicate(el)) {
                console.log("Idx of element not removed: " + this.keyMap.get(el.getKey()));
                throw new Error("element not removed: " + el.getKey());
            }
        }
    }

    private removeAt(idx: number): T {
        const obj: any = this.array[idx];
        this.keyMap.remove(obj.getKey());
        const isLastElement: boolean = idx === this.array.length - 1;
        if (this.array.length > 0) {
            const newobj: any = this.array.pop();
            if (!isLastElement && this.array.length > 0) {
                this.replaceAt(idx, newobj);
            }
        }
        return obj;
    }

    public foreach(func: (el: T) => void) {
        const arr = this.array.sort((e, e2) => e.compareTo(e2));
        for (const el of arr) {
            func(el);
        }
    }

    public peek(): T {
        return this.array[0];
    }

    public contains(key: string) {
        return this.keyMap.containsKey(key);
    }

    public at(key: string): T | null {
        const obj = this.keyMap.get(key);
        if (typeof obj === "undefined") {
            return null;
        } else {
            return this.array[obj as number];
        }
    }

    public size(): number {
        return this.array.length;
    }

    public checkHeapRequirement(item: T) {
        const idx = this.keyMap.get(item.getKey()) as number;
        if (idx != null) {
            this.checkParentRequirement(idx);
            this.checkChildrenRequirement(idx);
        }
    }

    private checkChildrenRequirement(idx: number): void {
        let stop: boolean = false;
        while (!stop) {
            const left: number = this.getLeftChildIndex(idx);
            let right: number = left === -1 ? -1 : left + 1;

            if (left === -1) {
                return;
            }
            if (right >= this.size()) {
                right = -1;
            }

            let minIdx: number;
            if (right === -1) {
                minIdx = left;
            } else {
                minIdx = (this.array[left].compareTo(this.array[right]) < 0) ? left : right;
            }

            if (this.array[idx].compareTo(this.array[minIdx]) > 0) {
                this.swap(idx, minIdx);
                idx = minIdx; // iteratively instead of recursion for this.checkChildrenRequirement(minIdx);
            } else {
                stop = true;
            }
        }
    }

    private checkParentRequirement(idx: number): void {
        let curIdx: number = idx;
        let parentIdx: number = Heap.getParentIndex(curIdx);
        while (parentIdx >= 0 && this.array[parentIdx].compareTo(this.array[curIdx]) > 0) {
            this.swap(curIdx, parentIdx);

            curIdx = parentIdx;
            parentIdx = Heap.getParentIndex(curIdx);
        }
    }

    public dump(): void {
        if (this.size() === 0) {
            return;
        }

        const idx = 0;
        const leftIdx = this.getLeftChildIndex(idx);
        const rightIdx = leftIdx + 1;

        console.log(this.array);
        console.log("--- keymap ---");
        console.log(this.keyMap);
    }

    private swap(i: number, j: number): void {
        this.keyMap.put(this.array[i].getKey(), j);
        this.keyMap.put(this.array[j].getKey(), i);

        const tmp: T = this.array[i];
        this.array[i] = this.array[j];
        this.array[j] = tmp;
    }

    private getLeftChildIndex(curIdx: number): number {
        const idx: number = ((curIdx + 1) * 2) - 1;
        if (idx >= this.array.length) {
            return -1;
        } else {
            return idx;
        }
    }

    private static getParentIndex(curIdx: number): number {
        if (curIdx === 0) {
            return -1;
        }

        return Math.floor((curIdx + 1) / 2) - 1;
    }

    public clone(): Heap<T> {
        const h = new Heap<T>();
        h.array = this.array.slice(0);
        h.keyMap = this.keyMap.clone();
        return h;
    }
}

export class PriorityQueue<T extends IHeapItem> {

    private heap: Heap<T> = new Heap<T>();

    public enqueue(obj: T): void {
        this.heap.add(obj);
    }

    public peek(): T {
        return this.heap.peek();
    }

    public updatePriority(key: T) {
        this.heap.checkHeapRequirement(key);
    }

    public get(key: string): T | null {
        return this.heap.at(key);
    }

    get size(): number {
        return this.heap.size();
    }

    public dequeue(): T {
        return this.heap.shift();
    }

    public dump() {
        this.heap.dump();
    }

    public contains(key: string) {
        return this.heap.contains(key);
    }
    public removeWhere(predicate: (el: T) => boolean) {
        this.heap.removeWhere(predicate);
    }

    public foreach(func: (el: T) => void) {
        this.heap.foreach(func);
    }

    public clone(): PriorityQueue<T> {
        const p = new PriorityQueue<T>();
        p.heap = this.heap.clone();
        return p;
    }
}
