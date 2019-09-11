
export class Random {

    private seed: number;
    public constructor(seed?: number) {
        if (typeof seed === "undefined") {
            this.seed = new Date().getTime();
        } else {
            this.seed = seed;
        }
    }

    public next(): number {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }
}
