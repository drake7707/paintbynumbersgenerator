import { IComparable, IHeapItem, PriorityQueue } from "./datastructs";

// This is a typescript port of https://github.com/mapbox/polylabel to calculate the pole of inaccessibility quickly

type Polygon = PolygonRing[];
type PolygonRing = Point[];

interface Point {
    x: number;
    y: number;
}
interface PointResult {
    pt: Point;
    distance: number;
}

export function polylabel(polygon: Polygon, precision: number = 1.0): PointResult {

    // find the bounding box of the outer ring
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;

    for (let i = 0; i < polygon[0].length; i++) {
        const p = polygon[0][i];
        if (p.x < minX) { minX = p.x; }
        if (p.y < minY) { minY = p.y; }
        if (p.x > maxX) { maxX = p.x; }
        if (p.y > maxY) { maxY = p.y; }
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const cellSize = Math.min(width, height);
    let h = cellSize / 2;

    // a priority queue of cells in order of their "potential" (max distance to polygon)
    const cellQueue = new PriorityQueue<Cell>();

    if (cellSize === 0) { return { pt: { x: minX, y: minY }, distance: 0 }; }

    // cover polygon with initial cells
    for (let x = minX; x < maxX; x += cellSize) {
        for (let y = minY; y < maxY; y += cellSize) {
            cellQueue.enqueue(new Cell(x + h, y + h, h, polygon));
        }
    }

    // take centroid as the first best guess
    let bestCell = getCentroidCell(polygon);

    // special case for rectangular polygons
    const bboxCell = new Cell(minX + width / 2, minY + height / 2, 0, polygon);
    if (bboxCell.d > bestCell.d) { bestCell = bboxCell; }

    let numProbes = cellQueue.size;

    while (cellQueue.size > 0) {
        // pick the most promising cell from the queue
        const cell = cellQueue.dequeue();

        // update the best cell if we found a better one
        if (cell.d > bestCell.d) {
            bestCell = cell;
        }

        // do not drill down further if there's no chance of a better solution
        if (cell.max - bestCell.d <= precision) { continue; }

        // split the cell into four cells
        h = cell.h / 2;
        cellQueue.enqueue(new Cell(cell.x - h, cell.y - h, h, polygon));
        cellQueue.enqueue(new Cell(cell.x + h, cell.y - h, h, polygon));
        cellQueue.enqueue(new Cell(cell.x - h, cell.y + h, h, polygon));
        cellQueue.enqueue(new Cell(cell.x + h, cell.y + h, h, polygon));
        numProbes += 4;
    }

    return { pt: { x: bestCell.x, y: bestCell.y }, distance: bestCell.d };
}

class Cell implements IHeapItem {
    public x: number; // cell center x
    public y: number; // cell center y
    public h: number; // half the cell size
    public d: number; // distance from cell center to polygon
    public max: number; // max distance to polygon within a cell
    constructor(x: number, y: number, h: number, polygon: Polygon) {
        this.x = x;
        this.y = y;
        this.h = h;
        this.d = pointToPolygonDist(x, y, polygon);
        this.max = this.d + this.h * Math.SQRT2;
    }

    public compareTo(other: IComparable): number {
        return (other as Cell).max - this.max;
    }

    public getKey() {
        return this.x + "," + this.y;
    }
}

// get squared distance from a point px,py to a segment [a-b]
function getSegDistSq(px: number, py: number, a: Point, b: Point) {

    let x = a.x;
    let y = a.y;
    let dx = b.x - x;
    let dy = b.y - y;

    if (dx !== 0 || dy !== 0) {
        const t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);

        if (t > 1) {
            x = b.x;
            y = b.y;

        } else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }

    dx = px - x;
    dy = py - y;

    return dx * dx + dy * dy;
}

/**
 * Signed distance from point to polygon outline (negative if point is outside)
 */
export function pointToPolygonDist(x: number, y: number, polygon: Polygon): number {
    let inside = false;
    let minDistSq = Infinity;

    for (let k = 0; k < polygon.length; k++) {
        const ring = polygon[k];

        for (let i = 0, len = ring.length, j = len - 1; i < len; j = i++) {
            const a = ring[i];
            const b = ring[j];

            if ((a.y > y !== b.y > y) &&
                (x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x)) { inside = !inside; }

            minDistSq = Math.min(minDistSq, getSegDistSq(x, y, a, b));
        }
    }

    return (inside ? 1 : -1) * Math.sqrt(minDistSq);
}

// get polygon centroid
function getCentroidCell(polygon: Polygon) {
    let area = 0;
    let x = 0;
    let y = 0;
    const points = polygon[0];

    for (let i = 0, len = points.length, j = len - 1; i < len; j = i++) {
        const a = points[i];
        const b = points[j];
        const f = a.x * b.y - b.x * a.y;
        x += (a.x + b.x) * f;
        y += (a.y + b.y) * f;
        area += f * 3;
    }
    if (area === 0) { return new Cell(points[0].x, points[0].y, 0, polygon); }
    return new Cell(x / area, y / area, 0, polygon);
}
