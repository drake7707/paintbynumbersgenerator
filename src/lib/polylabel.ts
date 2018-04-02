import { PriorityQueue, IHeapItem, IComparable } from "./datastructs";

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
       var minX = Number.MAX_VALUE, minY = Number.MAX_VALUE, maxX = Number.MIN_VALUE, maxY = Number.MIN_VALUE;
       for (var i = 0; i < polygon[0].length; i++) {
           var p = polygon[0][i];
           if (p.x < minX) minX = p.x;
           if (p.y < minY) minY = p.y;
           if (p.x > maxX) maxX = p.x;
           if (p.y > maxY) maxY = p.y;
       }

       var width = maxX - minX;
       var height = maxY - minY;
       var cellSize = Math.min(width, height);
       var h = cellSize / 2;

       // a priority queue of cells in order of their "potential" (max distance to polygon)
       var cellQueue = new PriorityQueue<Cell>();

       if (cellSize === 0) return { pt: { x: minX, y: minY }, distance: 0 };

       // cover polygon with initial cells
       for (var x = minX; x < maxX; x += cellSize) {
           for (var y = minY; y < maxY; y += cellSize) {
               cellQueue.enqueue(new Cell(x + h, y + h, h, polygon));
           }
       }

       // take centroid as the first best guess
       var bestCell = getCentroidCell(polygon);

       // special case for rectangular polygons
       var bboxCell = new Cell(minX + width / 2, minY + height / 2, 0, polygon);
       if (bboxCell.d > bestCell.d) bestCell = bboxCell;

       var numProbes = cellQueue.size;

       while (cellQueue.size > 0) {
           // pick the most promising cell from the queue
           var cell = cellQueue.dequeue();

           // update the best cell if we found a better one
           if (cell.d > bestCell.d) {
               bestCell = cell;
           }

           // do not drill down further if there's no chance of a better solution
           if (cell.max - bestCell.d <= precision) continue;

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
       x: number; // cell center x
       y: number; // cell center y
       h: number; // half the cell size
       d: number; // distance from cell center to polygon
       max: number; // max distance to polygon within a cell
       constructor(x: number, y: number, h: number, polygon: Polygon) {
           this.x = x;
           this.y = y;
           this.h = h;
           this.d = pointToPolygonDist(x, y, polygon);
           this.max = this.d + this.h * Math.SQRT2;
       }

       compareTo(other: IComparable): number {
           return (<Cell>other).max - this.max;
       }

       getKey() {
           return this.x + "," + this.y;
       }
   }

   // get squared distance from a point px,py to a segment [a-b]
   function getSegDistSq(px: number, py: number, a: Point, b: Point) {

       var x = a.x;
       var y = a.y;
       var dx = b.x - x;
       var dy = b.y - y;

       if (dx !== 0 || dy !== 0) {
           var t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);

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
       var inside = false;
       var minDistSq = Infinity;

       for (var k = 0; k < polygon.length; k++) {
           var ring = polygon[k];

           for (var i = 0, len = ring.length, j = len - 1; i < len; j = i++) {
               var a = ring[i];
               var b = ring[j];

               if ((a.y > y !== b.y > y) &&
                   (x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x)) inside = !inside;

               minDistSq = Math.min(minDistSq, getSegDistSq(x, y, a, b));
           }
       }

       return (inside ? 1 : -1) * Math.sqrt(minDistSq);
   }

   // get polygon centroid
   function getCentroidCell(polygon: Polygon) {
       var area = 0;
       var x = 0;
       var y = 0;
       var points = polygon[0];

       for (var i = 0, len = points.length, j = len - 1; i < len; j = i++) {
           var a = points[i];
           var b = points[j];
           var f = a.x * b.y - b.x * a.y;
           x += (a.x + b.x) * f;
           y += (a.y + b.y) * f;
           area += f * 3;
       }
       if (area === 0) return new Cell(points[0].x, points[0].y, 0, polygon);
       return new Cell(x / area, y / area, 0, polygon);
   }