
export class Uint32Array2D {
    private arr: Uint32Array;
    constructor(private width: number, private height: number) {
        this.arr = new Uint32Array(width * height);
    }

    get(x: number, y: number) {
        return this.arr[y * this.width + x];
    }
    set(x: number, y: number, value: number) {
        this.arr[y * this.width + x] = value;
    }
}

export class Uint8Array2D {
    private arr: Uint8Array;
    constructor(private width: number, private height: number) {
        this.arr = new Uint8Array(width * height);
    }
    get(x: number, y: number) {
        return this.arr[y * this.width + x];
    }
    set(x: number, y: number, value: number) {
        this.arr[y * this.width + x] = value;
    }
}

export class BooleanArray2D {
    private arr: Uint8Array;
    constructor(private width: number, private height: number) {
        this.arr = new Uint8Array(width * height);
    }

    get(x: number, y: number) {
        return this.arr[y * this.width + x] != 0;
    }
    set(x: number, y: number, value: boolean) {
        this.arr[y * this.width + x] = value ? 1 : 0;
    }
}

