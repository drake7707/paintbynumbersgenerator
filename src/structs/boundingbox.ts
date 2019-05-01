export class BoundingBox {

    public minX: number = Number.MAX_VALUE;
    public minY: number = Number.MAX_VALUE;
    public maxX: number = Number.MIN_VALUE;
    public maxY: number = Number.MIN_VALUE;

    get width(): number {
        return this.maxX - this.minX + 1;
    }
    get height(): number {
        return this.maxY - this.minY + 1;
    }
}
