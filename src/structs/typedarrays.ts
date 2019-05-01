
export class Uint32Array2D {
    private arr: Uint32Array;
    constructor(private width: number, private height: number) {
        this.arr = new Uint32Array(width * height);
    }

    public get(x: number, y: number) {
        return this.arr[y * this.width + x];
    }
    public set(x: number, y: number, value: number) {
        this.arr[y * this.width + x] = value;
    }
}

export class Uint8Array2D {
    private arr: Uint8Array;
    constructor(private width: number, private height: number) {
        this.arr = new Uint8Array(width * height);
    }
    public get(x: number, y: number) {
        return this.arr[y * this.width + x];
    }

    public set(x: number, y: number, value: number) {
        this.arr[y * this.width + x] = value;
    }

    public matchAllAround(x: number, y: number, value: number) {
        const idx = y * this.width + x;
        return (x - 1 >= 0 && this.arr[idx - 1] === value) &&
            (y - 1 >= 0 && this.arr[idx - this.width] === value) &&
            (x + 1 < this.width && this.arr[idx + 1] === value) &&
            (y + 1 < this.height && this.arr[idx + this.width] === value);
    }
}

export class BooleanArray2D {
    private arr: Uint8Array;
    constructor(private width: number, private height: number) {
        this.arr = new Uint8Array(width * height);
    }

    public get(x: number, y: number) {
        return this.arr[y * this.width + x] !== 0;
    }
    public set(x: number, y: number, value: boolean) {
        this.arr[y * this.width + x] = value ? 1 : 0;
    }
}
