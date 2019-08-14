import { delay } from "./common";
import { Point } from "./structs/point";
import { BooleanArray2D } from "./structs/typedarrays";
import { FacetResult, PathPoint, OrientationEnum, Facet } from "./facetmanagement";

export class FacetBorderTracer {
    
    /**
     *  Traces the border path of the facet from the facet border points.
     *  Imagine placing walls around the outer side of the border points.
     */
    public static async buildFacetBorderPaths(facetResult: FacetResult, onUpdate: ((progress: number) => void) | null = null) {
        let count = 0;
        const borderMask = new BooleanArray2D(facetResult.width, facetResult.height);
        // sort by biggest facets first
        const facetProcessingOrder = facetResult.facets.filter((f) => f != null).slice(0).sort((a, b) => b!.pointCount > a!.pointCount ? 1 : (b!.pointCount < a!.pointCount ? -1 : 0)).map((f) => f!.id);
        for (let fidx: number = 0; fidx < facetProcessingOrder.length; fidx++) {
            const f = facetResult.facets[facetProcessingOrder[fidx]]!;
            if (f != null) {
                for (const bp of f.borderPoints) {
                    borderMask.set(bp.x, bp.y, true);
                }
                // keep track of which walls are already set on each pixel
                // e.g. xWall.get(x,y) is the left wall of point x,y
                // as the left wall of (x+1,y) and right wall of (x,y) is the same
                // the right wall of x,y can be set with xWall.set(x+1,y).
                // Analogous for the horizontal walls in yWall
                const xWall = new BooleanArray2D(facetResult.width + 1, facetResult.height + 1);
                const yWall = new BooleanArray2D(facetResult.width + 1, facetResult.height + 1);
                // the first border point will guaranteed be one of the outer ones because
                // it will be the first point that is encountered of the facet when building
                // them in buildFacet with DFS.
                // --> Or so I thought, which is apparently not the case in rare circumstances
                // sooooo go look for a border that edges with the bounding box, this is definitely
                // on the outer side then.
                let borderStartIndex = -1;
                for (let i: number = 0; i < f.borderPoints.length; i++) {
                    if ((f.borderPoints[i].x === f.bbox.minX || f.borderPoints[i].x === f.bbox.maxX) ||
                        (f.borderPoints[i].y === f.bbox.minY || f.borderPoints[i].y === f.bbox.maxY)) {
                        borderStartIndex = i;
                        break;
                    }
                }
                // determine the starting point orientation (the outside of facet)
                const pt = new PathPoint(f.borderPoints[borderStartIndex], OrientationEnum.Left);
                // L T R B
                if (pt.x - 1 < 0 || facetResult.facetMap.get(pt.x - 1, pt.y) !== f.id) {
                    pt.orientation = OrientationEnum.Left;
                }
                else if (pt.y - 1 < 0 || facetResult.facetMap.get(pt.x, pt.y - 1) !== f.id) {
                    pt.orientation = OrientationEnum.Top;
                }
                else if (pt.x + 1 >= facetResult.width || facetResult.facetMap.get(pt.x + 1, pt.y) !== f.id) {
                    pt.orientation = OrientationEnum.Right;
                }
                else if (pt.y + 1 >= facetResult.height || facetResult.facetMap.get(pt.x, pt.y + 1) !== f.id) {
                    pt.orientation = OrientationEnum.Bottom;
                }
                // build a border path from that point
                const path = FacetBorderTracer.getPath(pt, facetResult, f, borderMask, xWall, yWall);
                f.borderPath = path;
                if (count % 100 === 0) {
                    await delay(0);
                    if (onUpdate != null) {
                        onUpdate(fidx / facetProcessingOrder.length);
                    }
                }
            }
            count++;
        }
        if (onUpdate != null) {
            onUpdate(1);
        }
    }

    /**
     * Returns a border path starting from the given point
     */
    private static getPath(pt: PathPoint, facetResult: FacetResult, f: Facet, borderMask: BooleanArray2D, xWall: BooleanArray2D, yWall: BooleanArray2D) {
        const debug = false;
        let finished = false;
        const count = 0;
        const path: PathPoint[] = [];
        FacetBorderTracer.addPointToPath(path, pt, xWall, f, yWall);
        // check rotations first, then straight along the ouside and finally diagonally
        // this ensures that bends are always taken as tight as possible
        // so it doesn't skip border points to later loop back to and get stuck (hopefully)
        while (!finished) {
            if (debug) {
                console.log(pt.x + " " + pt.y + " " + pt.orientation);
            }
            // yes, technically i could do some trickery to only get the left/top cases
            // by shifting the pixels but that means some more shenanigans in correct order of things
            // so whatever. (And yes I tried it but it wasn't worth the debugging hell that ensued)
            const possibleNextPoints: PathPoint[] = [];
            //   +---+---+
            //   |  <|   |
            //   +---+---+
            if (pt.orientation === OrientationEnum.Left) {
                // check rotate to top
                //   +---+---+
                //   |   |   |
                //   +---xnnnn (x = old wall, n = new wall, F = current facet x,y)
                //   |   x F |
                //   +---x---+
                if (((pt.y - 1 >= 0 && facetResult.facetMap.get(pt.x, pt.y - 1) !== f.id) // top exists and is a neighbour facet
                    || pt.y - 1 < 0) // or top doesn't exist, which is the boundary of the image
                    && !yWall.get(pt.x, pt.y)) { // and the wall isn't set yet
                    // can place top _ wall at x,y
                    if (debug) {
                        console.log("can place top _ wall at x,y");
                    }
                    const nextpt = new PathPoint(new Point(pt.x, pt.y), OrientationEnum.Top);
                    possibleNextPoints.push(nextpt);
                }
                // check rotate to bottom
                //   +---+---+
                //   |   |   |
                //   +---x---+ (x = old wall, n = new wall, F = current facet x,y)
                //   |   x F |
                //   +---xnnnn
                if (((pt.y + 1 < facetResult.height && facetResult.facetMap.get(pt.x, pt.y + 1) !== f.id) // bottom exists and is a neighbour facet
                    || pt.y + 1 >= facetResult.height) // or bottom doesn't exist, which is the boundary of the image
                    && !yWall.get(pt.x, pt.y + 1)) { // and the wall isn't set yet
                    // can place bottom  _ wall at x,y
                    if (debug) {
                        console.log("can place bottom _ wall at x,y");
                    }
                    const nextpt = new PathPoint(new Point(pt.x, pt.y), OrientationEnum.Bottom);
                    possibleNextPoints.push(nextpt);
                }
                // check upwards
                //   +---n---+
                //   |   n   |
                //   +---x---+ (x = old wall, n = new wall, F = current facet x,y)
                //   |   x F |
                //   +---x---+
                if (pt.y - 1 >= 0 // top exists
                    && facetResult.facetMap.get(pt.x, pt.y - 1) === f.id // and is part of the same facet
                    && (pt.x - 1 < 0 || facetResult.facetMap.get(pt.x - 1, pt.y - 1) !== f.id) // and
                    && borderMask.get(pt.x, pt.y - 1)
                    && !xWall.get(pt.x, pt.y - 1)) {
                    // can place | wall at x,y-1
                    if (debug) {
                        console.log(`can place left | wall at x,y-1`);
                    }
                    const nextpt = new PathPoint(new Point(pt.x, pt.y - 1), OrientationEnum.Left);
                    possibleNextPoints.push(nextpt);
                }
                // check downwards
                //   +---x---+
                //   |   x F |
                //   +---x---+ (x = old wall, n = new wall, F = current facet x,y)
                //   |   n   |
                //   +---n---+
                if (pt.y + 1 < facetResult.height
                    && facetResult.facetMap.get(pt.x, pt.y + 1) === f.id
                    && (pt.x - 1 < 0 || facetResult.facetMap.get(pt.x - 1, pt.y + 1) !== f.id)
                    && borderMask.get(pt.x, pt.y + 1)
                    && !xWall.get(pt.x, pt.y + 1)) {
                    // can place | wall at x,y+1
                    if (debug) {
                        console.log("can place left | wall at x,y+1");
                    }
                    const nextpt = new PathPoint(new Point(pt.x, pt.y + 1), OrientationEnum.Left);
                    possibleNextPoints.push(nextpt);
                }
                // check left upwards
                //   +---+---+
                //   |   |   |
                //   nnnnx---+ (x = old wall, n = new wall, F = current facet x,y)
                //   |   x F |
                //   +---x---+
                if (pt.y - 1 >= 0 && pt.x - 1 >= 0 // there is a left upwards
                    && facetResult.facetMap.get(pt.x - 1, pt.y - 1) === f.id // and it belongs to the same facet
                    && borderMask.get(pt.x - 1, pt.y - 1) // and is on the border
                    && !yWall.get(pt.x - 1, pt.y - 1 + 1) // and the bottom wall isn't set yet
                    && !yWall.get(pt.x, pt.y) // and the path didn't come from the top of the current one to prevent getting a T shaped path (issue: https://i.imgur.com/ggUWuXi.png)
                ) {
                    // can place bottom _ wall at x-1,y-1
                    if (debug) {
                        console.log("can place bottom _ wall at x-1,y-1");
                    }
                    const nextpt = new PathPoint(new Point(pt.x - 1, pt.y - 1), OrientationEnum.Bottom);
                    possibleNextPoints.push(nextpt);
                }
                // check left downwards
                //   +---x---+
                //   |   x F |
                //   nnnnx---+ (x = old wall, n = new wall, F = current facet x,y)
                //   |   |   |
                //   +---+---+
                if (pt.y + 1 < facetResult.height && pt.x - 1 >= 0 // there is a left downwards
                    && facetResult.facetMap.get(pt.x - 1, pt.y + 1) === f.id // and belongs to the same facet
                    && borderMask.get(pt.x - 1, pt.y + 1) // and is on the border
                    && !yWall.get(pt.x - 1, pt.y + 1) // and the top wall isn't set yet
                    && !yWall.get(pt.x, pt.y + 1) // and the path didn't come from the bottom of the current point to prevent T shape
                ) {
                    // can place top _ wall at x-1,y+1
                    if (debug) {
                        console.log("can place top _ wall at x-1,y+1");
                    }
                    const nextpt = new PathPoint(new Point(pt.x - 1, pt.y + 1), OrientationEnum.Top);
                    possibleNextPoints.push(nextpt);
                }
            }
            else if (pt.orientation === OrientationEnum.Top) {
                // check rotate to left
                if (((pt.x - 1 >= 0
                    && facetResult.facetMap.get(pt.x - 1, pt.y) !== f.id)
                    || pt.x - 1 < 0)
                    && !xWall.get(pt.x, pt.y)) {
                    // can place left | wall at x,y
                    if (debug) {
                        console.log("can place left | wall at x,y");
                    }
                    const nextpt = new PathPoint(new Point(pt.x, pt.y), OrientationEnum.Left);
                    possibleNextPoints.push(nextpt);
                }
                // check rotate to right
                if (((pt.x + 1 < facetResult.width
                    && facetResult.facetMap.get(pt.x + 1, pt.y) !== f.id)
                    || pt.x + 1 >= facetResult.width)
                    && !xWall.get(pt.x + 1, pt.y)) {
                    // can place right | wall at x,y
                    if (debug) {
                        console.log("can place right | wall at x,y");
                    }
                    const nextpt = new PathPoint(new Point(pt.x, pt.y), OrientationEnum.Right);
                    possibleNextPoints.push(nextpt);
                }
                // check leftwards
                if (pt.x - 1 >= 0
                    && facetResult.facetMap.get(pt.x - 1, pt.y) === f.id
                    && (pt.y - 1 < 0 || facetResult.facetMap.get(pt.x - 1, pt.y - 1) !== f.id)
                    && borderMask.get(pt.x - 1, pt.y)
                    && !yWall.get(pt.x - 1, pt.y)) {
                    // can place top _ wall at x-1,y
                    if (debug) {
                        console.log(`can place top _ wall at x-1,y`);
                    }
                    const nextpt = new PathPoint(new Point(pt.x - 1, pt.y), OrientationEnum.Top);
                    possibleNextPoints.push(nextpt);
                }
                // check rightwards
                if (pt.x + 1 < facetResult.width
                    && facetResult.facetMap.get(pt.x + 1, pt.y) === f.id
                    && (pt.y - 1 < 0 || facetResult.facetMap.get(pt.x + 1, pt.y - 1) !== f.id)
                    && borderMask.get(pt.x + 1, pt.y)
                    && !yWall.get(pt.x + 1, pt.y)) {
                    // can place top _ wall at x+1,y
                    if (debug) {
                        console.log(`can place top _ wall at x+1,y`);
                    }
                    const nextpt = new PathPoint(new Point(pt.x + 1, pt.y), OrientationEnum.Top);
                    possibleNextPoints.push(nextpt);
                }
                // check left upwards
                if (pt.y - 1 >= 0 && pt.x - 1 >= 0 // there is a left upwards
                    && facetResult.facetMap.get(pt.x - 1, pt.y - 1) === f.id // and it belongs to the same facet
                    && borderMask.get(pt.x - 1, pt.y - 1) // and it's part of the border
                    && !xWall.get(pt.x - 1 + 1, pt.y - 1) // the right wall isn't set yet
                    && !xWall.get(pt.x, pt.y) // and the left wall of the current point isn't set yet to prevent |- path
                ) {
                    // can place right | wall at x-1,y-1
                    if (debug) {
                        console.log("can place right | wall at x-1,y-1");
                    }
                    const nextpt = new PathPoint(new Point(pt.x - 1, pt.y - 1), OrientationEnum.Right);
                    possibleNextPoints.push(nextpt);
                }
                // check right upwards
                if (pt.y - 1 >= 0 && pt.x + 1 < facetResult.width // there is a right upwards
                    && facetResult.facetMap.get(pt.x + 1, pt.y - 1) === f.id // and it belongs to the same facet
                    && borderMask.get(pt.x + 1, pt.y - 1) // and it's on the border
                    && !xWall.get(pt.x + 1, pt.y - 1) // and the left wall isn't set yet
                    && !xWall.get(pt.x + 1, pt.y) // and the right wall of the current point isn't set yet to prevent -| path
                ) {
                    // can place left |  wall at x+1,y-1
                    if (debug) {
                        console.log("can place left |  wall at x+1,y-1");
                    }
                    const nextpt = new PathPoint(new Point(pt.x + 1, pt.y - 1), OrientationEnum.Left);
                    possibleNextPoints.push(nextpt);
                }
            }
            else if (pt.orientation === OrientationEnum.Right) {
                // check rotate to top
                if (((pt.y - 1 >= 0
                    && facetResult.facetMap.get(pt.x, pt.y - 1) !== f.id)
                    || pt.y - 1 < 0)
                    && !yWall.get(pt.x, pt.y)) {
                    // can place top _ wall at x,y
                    if (debug) {
                        console.log("can place top _ wall at x,y");
                    }
                    const nextpt = new PathPoint(new Point(pt.x, pt.y), OrientationEnum.Top);
                    possibleNextPoints.push(nextpt);
                }
                // check rotate to bottom
                if (((pt.y + 1 < facetResult.height
                    && facetResult.facetMap.get(pt.x, pt.y + 1) !== f.id)
                    || pt.y + 1 >= facetResult.height)
                    && !yWall.get(pt.x, pt.y + 1)) {
                    // can place bottom  _ wall at x,y
                    if (debug) {
                        console.log("can place bottom _ wall at x,y");
                    }
                    const nextpt = new PathPoint(new Point(pt.x, pt.y), OrientationEnum.Bottom);
                    possibleNextPoints.push(nextpt);
                }
                // check upwards
                if (pt.y - 1 >= 0
                    && facetResult.facetMap.get(pt.x, pt.y - 1) === f.id
                    && (pt.x + 1 >= facetResult.width || facetResult.facetMap.get(pt.x + 1, pt.y - 1) !== f.id)
                    && borderMask.get(pt.x, pt.y - 1)
                    && !xWall.get(pt.x + 1, pt.y - 1)) {
                    // can place right | wall at x,y-1
                    if (debug) {
                        console.log(`can place right | wall at x,y-1`);
                    }
                    const nextpt = new PathPoint(new Point(pt.x, pt.y - 1), OrientationEnum.Right);
                    possibleNextPoints.push(nextpt);
                }
                // check downwards
                if (pt.y + 1 < facetResult.height
                    && facetResult.facetMap.get(pt.x, pt.y + 1) === f.id
                    && (pt.x + 1 >= facetResult.width || facetResult.facetMap.get(pt.x + 1, pt.y + 1) !== f.id)
                    && borderMask.get(pt.x, pt.y + 1)
                    && !xWall.get(pt.x + 1, pt.y + 1)) {
                    // can place right | wall at x,y+1
                    if (debug) {
                        console.log("can place right | wall at x,y+1");
                    }
                    const nextpt = new PathPoint(new Point(pt.x, pt.y + 1), OrientationEnum.Right);
                    possibleNextPoints.push(nextpt);
                }
                // check right upwards
                if (pt.y - 1 >= 0 && pt.x + 1 < facetResult.width // there is a right upwards
                    && facetResult.facetMap.get(pt.x + 1, pt.y - 1) === f.id // and belongs to the same facet
                    && borderMask.get(pt.x + 1, pt.y - 1) // and is on the border
                    && !yWall.get(pt.x + 1, pt.y - 1 + 1) // and the bottom wall isn't set yet
                    && !yWall.get(pt.x, pt.y) // and the top wall of the current point isn't set to prevent a T shape
                ) {
                    // can place bottom _ wall at x+1,y-1
                    if (debug) {
                        console.log("can place bottom _ wall at x+1,y-1");
                    }
                    const nextpt = new PathPoint(new Point(pt.x + 1, pt.y - 1), OrientationEnum.Bottom);
                    possibleNextPoints.push(nextpt);
                }
                // check right downwards
                if (pt.y + 1 < facetResult.height && pt.x + 1 < facetResult.width // there is a right downwards
                    && facetResult.facetMap.get(pt.x + 1, pt.y + 1) === f.id // and belongs to the same facet
                    && borderMask.get(pt.x + 1, pt.y + 1) // and is on the border
                    && !yWall.get(pt.x + 1, pt.y + 1) // and the top wall isn't visited yet
                    && !yWall.get(pt.x, pt.y + 1) // and the bottom wall of the current point isn't set to prevent a T shape
                ) {
                    // can place top _ wall at x+1,y+1
                    if (debug) {
                        console.log("can place top _ wall at x+1,y+1");
                    }
                    const nextpt = new PathPoint(new Point(pt.x + 1, pt.y + 1), OrientationEnum.Top);
                    possibleNextPoints.push(nextpt);
                }
            }
            else if (pt.orientation === OrientationEnum.Bottom) {
                // check rotate to left
                if (((pt.x - 1 >= 0
                    && facetResult.facetMap.get(pt.x - 1, pt.y) !== f.id)
                    || pt.x - 1 < 0)
                    && !xWall.get(pt.x, pt.y)) {
                    // can place left | wall at x,y
                    if (debug) {
                        console.log("can place left | wall at x,y");
                    }
                    const nextpt = new PathPoint(new Point(pt.x, pt.y), OrientationEnum.Left);
                    possibleNextPoints.push(nextpt);
                }
                // check rotate to right
                if (((pt.x + 1 < facetResult.width
                    && facetResult.facetMap.get(pt.x + 1, pt.y) !== f.id)
                    || pt.x + 1 >= facetResult.width)
                    && !xWall.get(pt.x + 1, pt.y)) {
                    // can place right | wall at x,y
                    if (debug) {
                        console.log("can place right | wall at x,y");
                    }
                    const nextpt = new PathPoint(new Point(pt.x, pt.y), OrientationEnum.Right);
                    possibleNextPoints.push(nextpt);
                }
                // check leftwards
                if (pt.x - 1 >= 0
                    && facetResult.facetMap.get(pt.x - 1, pt.y) === f.id
                    && (pt.y + 1 >= facetResult.height || facetResult.facetMap.get(pt.x - 1, pt.y + 1) !== f.id)
                    && borderMask.get(pt.x - 1, pt.y)
                    && !yWall.get(pt.x - 1, pt.y + 1)) {
                    // can place bottom _ wall at x-1,y
                    if (debug) {
                        console.log(`can place bottom _ wall at x-1,y`);
                    }
                    const nextpt = new PathPoint(new Point(pt.x - 1, pt.y), OrientationEnum.Bottom);
                    possibleNextPoints.push(nextpt);
                }
                // check rightwards
                if (pt.x + 1 < facetResult.width
                    && facetResult.facetMap.get(pt.x + 1, pt.y) === f.id
                    && (pt.y + 1 >= facetResult.height || facetResult.facetMap.get(pt.x + 1, pt.y + 1) !== f.id)
                    && borderMask.get(pt.x + 1, pt.y)
                    && !yWall.get(pt.x + 1, pt.y + 1)) {
                    // can place top _ wall at x+1,y
                    if (debug) {
                        console.log(`can place bottom _ wall at x+1,y`);
                    }
                    const nextpt = new PathPoint(new Point(pt.x + 1, pt.y), OrientationEnum.Bottom);
                    possibleNextPoints.push(nextpt);
                }
                // check left downwards
                if (pt.y + 1 < facetResult.height && pt.x - 1 >= 0 // there is a left downwards
                    && facetResult.facetMap.get(pt.x - 1, pt.y + 1) === f.id // and it's the same facet
                    && borderMask.get(pt.x - 1, pt.y + 1) // and it's on the border
                    && !xWall.get(pt.x - 1 + 1, pt.y + 1) // and the right wall isn't set yet
                    && !xWall.get(pt.x, pt.y) // and the left wall of the current point isn't set yet to prevent |- path
                ) {
                    // can place right | wall at x-1,y-1
                    if (debug) {
                        console.log("can place right | wall at x-1,y+1");
                    }
                    const nextpt = new PathPoint(new Point(pt.x - 1, pt.y + 1), OrientationEnum.Right);
                    possibleNextPoints.push(nextpt);
                }
                // check right downwards
                if (pt.y + 1 < facetResult.height && pt.x + 1 < facetResult.width // there is a right downwards
                    && facetResult.facetMap.get(pt.x + 1, pt.y + 1) === f.id // and it's the same facet
                    && borderMask.get(pt.x + 1, pt.y + 1) // and it's on the border
                    && !xWall.get(pt.x + 1, pt.y + 1) // and the left wall isn't set yet
                    && !xWall.get(pt.x + 1, pt.y) // and the right wall of the current point isn't set yet to prevent -| path
                ) {
                    // can place left |  wall at x+1,y+1
                    if (debug) {
                        console.log("can place left |  wall at x+1,y+1");
                    }
                    const nextpt = new PathPoint(new Point(pt.x + 1, pt.y + 1), OrientationEnum.Left);
                    possibleNextPoints.push(nextpt);
                }
            }

            if (possibleNextPoints.length > 1) {
                // TODO it's now not necessary anymore to aggregate all possibilities, the first one is going to be the correct
                // selection to trace the entire border, so the if checks above can include a skip once ssible point is found again
                pt = possibleNextPoints[0];
                FacetBorderTracer.addPointToPath(path, pt, xWall, f, yWall);
            }
            else if (possibleNextPoints.length === 1) {
                pt = possibleNextPoints[0];
                FacetBorderTracer.addPointToPath(path, pt, xWall, f, yWall);
            }
            else {
                finished = true;
            }
        }
        // clear up the walls set for the path so the array can be reused
        for (const pathPoint of path) {
            switch (pathPoint.orientation) {
                case OrientationEnum.Left:
                    xWall.set(pathPoint.x, pathPoint.y, false);
                    break;
                case OrientationEnum.Top:
                    yWall.set(pathPoint.x, pathPoint.y, false);
                    break;
                case OrientationEnum.Right:
                    xWall.set(pathPoint.x + 1, pathPoint.y, false);
                    break;
                case OrientationEnum.Bottom:
                    yWall.set(pathPoint.x, pathPoint.y + 1, false);
                    break;
            }
        }
        return path;
    }

    /**
     * Add a point to the border path and ensure the correct xWall/yWalls is set
     */
    private static addPointToPath(path: PathPoint[], pt: PathPoint, xWall: BooleanArray2D, f: Facet, yWall: BooleanArray2D) {
        path.push(pt);
        switch (pt.orientation) {
            case OrientationEnum.Left:
                xWall.set(pt.x, pt.y, true);
                break;
            case OrientationEnum.Top:
                yWall.set(pt.x, pt.y, true);
                break;
            case OrientationEnum.Right:
                xWall.set(pt.x + 1, pt.y, true);
                break;
            case OrientationEnum.Bottom:
                yWall.set(pt.x, pt.y + 1, true);
                break;
        }
    }
}
