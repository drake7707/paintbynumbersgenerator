export class BoundingBox {

    minX: number = Number.MAX_VALUE;
    minY: number = Number.MAX_VALUE;
    maxX: number = Number.MIN_VALUE;
    maxY: number = Number.MIN_VALUE;

    get width(): number {
        return this.maxX - this.minX + 1;
    }
    get height(): number {
        return this.maxY - this.minY + 1;
    }
}