/**
 * Facet management from the process, anything from construction, reduction and border tracing etc.
 */
import { delay, IMap, RGB } from "./common";
import { fill } from "./lib/fill";
import { pointToPolygonDist, polylabel } from "./lib/polylabel";
import { BoundingBox } from "./structs/boundingbox";
import { Point } from "./structs/point";
import { BooleanArray2D, Uint32Array2D, Uint8Array2D } from "./structs/typedarrays";

enum OrientationEnum {
    Left,
    Top,
    Right,
    Bottom,
}

/**
 * PathPoint is a point with an orientation that indicates which wall border is set
 */
class PathPoint extends Point {

    constructor(pt: Point, public orientation: OrientationEnum) {
        super(pt.x, pt.y);
    }

    public getWallX() {
        let x = this.x;
        if (this.orientation === OrientationEnum.Left) {
            x -= 0.5;
        } else if (this.orientation === OrientationEnum.Right) {
            x += 0.5;
        }
        return x;
    }

    public getWallY() {
        let y = this.y;
        if (this.orientation === OrientationEnum.Top) {
            y -= 0.5;
        } else if (this.orientation === OrientationEnum.Bottom) {
            y += 0.5;
        }
        return y;
    }

    public getNeighbour(facetResult: FacetResult) {
        switch (this.orientation) {
            case OrientationEnum.Left:
                if (this.x - 1 >= 0) {
                    return facetResult.facetMap.get(this.x - 1, this.y);
                }
                break;
            case OrientationEnum.Right:
                if (this.x + 1 < facetResult.width) {
                    return facetResult.facetMap.get(this.x + 1, this.y);
                }
                break;
            case OrientationEnum.Top:
                if (this.y - 1 >= 0) {
                    return facetResult.facetMap.get(this.x, this.y - 1);
                }
                break;
            case OrientationEnum.Bottom:
                if (this.y + 1 < facetResult.height) {
                    return facetResult.facetMap.get(this.x, this.y + 1);
                }
                break;
        }
        return -1;
    }

    public toString() {
        return this.x + "," + this.y + " " + this.orientation;
    }
}

/**
 *  Path segment is a segment of a border path that is adjacent to a specific neighbour facet
 */
class PathSegment {
    constructor(public points: PathPoint[], public neighbour: number) {

    }
}

/**
 * Facet boundary segment describes the matched segment that is shared between 2 facets
 * When 2 segments are matched, one will be the original segment and the other one is removed
 * This ensures that all facets share the same segments, but sometimes in reverse order to ensure
 * the correct continuity of its entire oborder path
 */
class FacetBoundarySegment {
    constructor(public originalSegment: PathSegment, public neighbour: number, public reverseOrder: boolean) {

    }
}

/**
 *  A facet that represents an area of pixels of the same color
 */
class Facet {

    /**
     *  The id of the facet, is always the same as the actual index of the facet in the facet array
     */
    public id!: number;
    public color!: number;
    public pointCount: number = 0;
    public borderPoints!: Point[];
    public neighbourFacets!: number[] | null;
    /**
     * Flag indicating if the neighbourfacets array is dirty. If it is, the neighbourfacets *have* to be rebuild
     * Before it can be used. This is useful to defer the rebuilding of the array until it's actually needed
     * and can remove a lot of duplicate building of the array because multiple facets were hitting the same neighbour
     * (over 50% on test images)
     */
    public neighbourFacetsIsDirty: boolean = false;

    public bbox!: BoundingBox;

    public borderPath!: PathPoint[];
    public borderSegments!: FacetBoundarySegment[];

    public labelBounds!: BoundingBox;

    public getFullPathFromBorderSegments(useWalls: boolean) {
        const newpath: Point[] = [];
        for (const seg of this.borderSegments) {
            if (seg.reverseOrder) {
                for (let i: number = seg.originalSegment.points.length - 1; i >= 0; i--) {
                    if (useWalls)
                        newpath.push(new Point(seg.originalSegment.points[i].getWallX(), seg.originalSegment.points[i].getWallY()));
                    else
                        newpath.push(new Point(seg.originalSegment.points[i].x, seg.originalSegment.points[i].y));
                }
            } else {
                for (let i: number = 0; i < seg.originalSegment.points.length; i++) {
                    if (useWalls)
                        newpath.push(new Point(seg.originalSegment.points[i].getWallX(), seg.originalSegment.points[i].getWallY()));
                    else
                        newpath.push(new Point(seg.originalSegment.points[i].x, seg.originalSegment.points[i].y));
                }
            }
        }
        return newpath;
    }

}

/**
 *  Result of the facet construction, both as a map and as an array.
 *  Facets in the array can be null when they've been deleted
 */
export class FacetResult {
    public facetMap!: Uint32Array2D;
    public facets!: Array<Facet | null>;

    public width!: number;
    public height!: number;
}

export class FacetCreator {

    /**
     *  Constructs the facets with its border points for each area of pixels of the same color
     */
    public static async getFacets(width: number, height: number, imgColorIndices: Uint8Array2D, onUpdate: ((progress: number) => void) | null = null): Promise<FacetResult> {

        const result = new FacetResult();
        result.width = width;
        result.height = height;

        // setup visited mask
        const visited = new BooleanArray2D(result.width, result.height);

        // setup facet map & array
        result.facetMap = new Uint32Array2D(result.width, result.height);
        result.facets = [];

        // depth first traversal to find the different facets
        let count = 0;
        for (let j: number = 0; j < result.height; j++) {
            for (let i: number = 0; i < result.width; i++) {

                const colorIndex = imgColorIndices.get(i, j);
                if (!visited.get(i, j)) {
                    const facetIndex = result.facets.length;

                    // build a facet starting at point i,j
                    const facet = FacetCreator.buildFacet(facetIndex, colorIndex, i, j, visited, imgColorIndices, result);
                    result.facets.push(facet);

                    if (count % 100 === 0) {
                        await delay(0);
                        if (onUpdate != null) {
                            onUpdate(count / (result.width * result.height));
                        }
                    }
                }
                count++;
            }
        }

        await delay(0);

        // fill in the neighbours of all facets by checking the neighbours of the border points
        for (const f of result.facets) {
            if (f != null) {
                FacetCreator.buildFacetNeighbour(f, result);
            }
        }

        if (onUpdate != null) {
            onUpdate(1);
        }

        return result;
    }

    /**
     *  Builds a facet at given x,y using depth first search to visit all pixels of the same color
     */
    public static buildFacet(facetIndex: number, facetColorIndex: number, x: number, y: number, visited: BooleanArray2D, imgColorIndices: Uint8Array2D, facetResult: FacetResult) {
        const facet = new Facet();
        facet.id = facetIndex;
        facet.color = facetColorIndex;
        facet.bbox = new BoundingBox();
        facet.borderPoints = [];

        fill(x, y, facetResult.width, facetResult.height,
            (ptx, pty) => visited.get(ptx, pty) || imgColorIndices.get(ptx, pty) !== facetColorIndex,
            (ptx, pty) => {

                visited.set(ptx, pty, true);
                facetResult.facetMap.set(ptx, pty, facetIndex);
                facet.pointCount++;

                // determine if the point is a border or not
                /*  const isInnerPoint = (ptx - 1 >= 0 && imgColorIndices.get(ptx - 1, pty) === facetColorIndex) &&
                      (pty - 1 >= 0 && imgColorIndices.get(ptx, pty - 1) === facetColorIndex) &&
                      (ptx + 1 < facetResult.width && imgColorIndices.get(ptx + 1, pty) === facetColorIndex) &&
                      (pty + 1 < facetResult.height && imgColorIndices.get(ptx, pty + 1) === facetColorIndex);
                */
                const isInnerPoint = imgColorIndices.matchAllAround(ptx, pty, facetColorIndex);

                if (!isInnerPoint) {
                    facet.borderPoints.push(new Point(ptx, pty));
                }

                // update bounding box of facet
                if (ptx > facet.bbox.maxX) { facet.bbox.maxX = ptx; }
                if (pty > facet.bbox.maxY) { facet.bbox.maxY = pty; }
                if (ptx < facet.bbox.minX) { facet.bbox.minX = ptx; }
                if (pty < facet.bbox.minY) { facet.bbox.minY = pty; }
            });

        /*
           // using a 1D flattened stack (x*width+y), we can avoid heap allocations of Point objects, which halves the garbage collection time
         let stack: number[] = [];
         stack.push(y * facetResult.width + x);

         while (stack.length > 0) {
             let pt = stack.pop()!;
             let ptx = pt % facetResult.width;
             let pty = Math.floor(pt / facetResult.width);

             // if the point wasn't visited before and matches
             // the same color
             if (!visited.get(ptx, pty) &&
                 imgColorIndices.get(ptx, pty) == facetColorIndex) {

                 visited.set(ptx, pty, true);
                 facetResult.facetMap.set(ptx, pty, facetIndex);
                 facet.pointCount++;

                 // determine if the point is a border or not
                 let isInnerPoint = (ptx - 1 >= 0 && imgColorIndices.get(ptx - 1, pty) == facetColorIndex) &&
                     (pty - 1 >= 0 && imgColorIndices.get(ptx, pty - 1) == facetColorIndex) &&
                     (ptx + 1 < facetResult.width && imgColorIndices.get(ptx + 1, pty) == facetColorIndex) &&
                     (pty + 1 < facetResult.height && imgColorIndices.get(ptx, pty + 1) == facetColorIndex);

                 if (!isInnerPoint)
                     facet.borderPoints.push(new Point(ptx, pty));

                 // update bounding box of facet
                 if (ptx > facet.bbox.maxX) facet.bbox.maxX = ptx;
                 if (pty > facet.bbox.maxY) facet.bbox.maxY = pty;
                 if (ptx < facet.bbox.minX) facet.bbox.minX = ptx;
                 if (pty < facet.bbox.minY) facet.bbox.minY = pty;

                 // visit direct adjacent points
                 if (ptx - 1 >= 0 && !visited.get(ptx - 1, pty))
                     stack.push(pty * facetResult.width + (ptx - 1)); //stack.push(new Point(pt.x - 1, pt.y));
                 if (pty - 1 >= 0 && !visited.get(ptx, pty - 1))
                     stack.push((pty - 1) * facetResult.width + ptx); //stack.push(new Point(pt.x, pt.y - 1));
                 if (ptx + 1 < facetResult.width && !visited.get(ptx + 1, pty))
                     stack.push(pty * facetResult.width + (ptx + 1));//stack.push(new Point(pt.x + 1, pt.y));
                 if (pty + 1 < facetResult.height && !visited.get(ptx, pty + 1))
                     stack.push((pty + 1) * facetResult.width + ptx); //stack.push(new Point(pt.x, pt.y + 1));
             }
         }
         */
        return facet;
    }

    /**
     * Check which neighbour facets the given facet has by checking the neighbour facets at each border point
     */
    public static buildFacetNeighbour(facet: Facet, facetResult: FacetResult) {
        facet.neighbourFacets = [];
        const uniqueFacets: IMap<boolean> = {}; // poor man's set
        for (const pt of facet.borderPoints) {

            if (pt.x - 1 >= 0) {
                const leftFacetId = facetResult.facetMap.get(pt.x - 1, pt.y);
                if (leftFacetId !== facet.id) { uniqueFacets[leftFacetId] = true; }
            }
            if (pt.y - 1 >= 0) {
                const topFacetId = facetResult.facetMap.get(pt.x, pt.y - 1);
                if (topFacetId !== facet.id) { uniqueFacets[topFacetId] = true; }
            }
            if (pt.x + 1 < facetResult.width) {
                const rightFacetId = facetResult.facetMap.get(pt.x + 1, pt.y);
                if (rightFacetId !== facet.id) { uniqueFacets[rightFacetId] = true; }
            }
            if (pt.y + 1 < facetResult.height) {
                const bottomFacetId = facetResult.facetMap.get(pt.x, pt.y + 1);
                if (bottomFacetId !== facet.id) { uniqueFacets[bottomFacetId] = true; }
            }
        }
        for (const k of Object.keys(uniqueFacets)) {
            if (uniqueFacets.hasOwnProperty(k)) {
                facet.neighbourFacets.push(parseInt(k));
            }
        }
        // the neighbour array is updated so it's not dirty anymore
        facet.neighbourFacetsIsDirty = false;
    }
}

export class FacetReducer {

    /**
     *  Remove all facets that have a pointCount smaller than the given number.
     */
    public static async reduceFacets(smallerThan: number, removeFacetsFromLargeToSmall: boolean, colorsByIndex: RGB[], facetResult: FacetResult, imgColorIndices: Uint8Array2D, onUpdate: ((progress: number) => void) | null = null) {
        let count = 0;

        const visitedCache = new BooleanArray2D(facetResult.width, facetResult.height);

        // build the color distance matrix, which describes the distance of each color to each other
        const colorDistances: number[][] = FacetReducer.buildColorDistanceMatrix(colorsByIndex);

        // process facets from large to small. This results in better consistency with the original image
        // because the small facets act as boundary for the large merges keeping them mostly in place of where they should remain
        // then afterwards the smaller ones are deleted which will just end up completely isolated and thus entirely replaced
        // with the outer facet. But then again, what do I know, I'm just a comment.
        const facetProcessingOrder = facetResult.facets.filter((f) => f != null).slice(0).sort((a, b) => b!.pointCount > a!.pointCount ? 1 : (b!.pointCount < a!.pointCount ? -1 : 0)).map((f) => f!.id);
        if (!removeFacetsFromLargeToSmall) {
            facetProcessingOrder.reverse();
        }

        let curTime = new Date().getTime();

        for (let fidx: number = 0; fidx < facetProcessingOrder.length; fidx++) {
            const f = facetResult.facets[facetProcessingOrder[fidx]];
            // facets can be removed by merging by others due to a previous facet deletion
            if (f != null && f.pointCount < smallerThan) {
                const facetToRemove = f;
                FacetReducer.deleteFacet(facetToRemove!, facetResult, imgColorIndices, colorDistances, visitedCache);

                if (new Date().getTime() - curTime > 500) {
                    curTime = new Date().getTime();
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
     * Deletes a facet. All points belonging to the facet are moved to the nearest neighbour facet
     * based on the distance of the neighbour border points. This results in a voronoi like filling in of the
     * void the deletion made
     */
    private static deleteFacet(facetToRemove: Facet, facetResult: FacetResult, imgColorIndices: Uint8Array2D, colorDistances: number[][], visitedArrayCache: BooleanArray2D) {

        // there are many small facets, it's faster to just iterate over all points within its bounding box
        // and seeing which belong to the facet than to keep track of the inner points (along with the border points)
        // per facet, because that generates a lot of extra heap objects that need to be garbage collected each time
        // a facet is rebuilt
        for (let j: number = facetToRemove.bbox.minY; j <= facetToRemove.bbox.maxY; j++) {
            for (let i: number = facetToRemove.bbox.minX; i <= facetToRemove.bbox.maxX; i++) {
                if (facetResult.facetMap.get(i, j) === facetToRemove.id) {
                    let closestNeighbour = -1;
                    let minDistance = Number.MAX_VALUE;
                    let minColorDistance = Number.MAX_VALUE;

                    // ensure the neighbour facets is up to date if it was marked as dirty
                    if (facetToRemove.neighbourFacetsIsDirty) { FacetCreator.buildFacetNeighbour(facetToRemove, facetResult); }

                    // determine which neighbour will receive the current point based on the distance, and if there are more with the same
                    // distance, then take the neighbour with the closes color
                    for (const neighbourIdx of facetToRemove.neighbourFacets!) {
                        const neighbour = facetResult.facets[neighbourIdx];
                        if (neighbour != null) {
                            for (const bpt of neighbour.borderPoints) {
                                const distance = bpt.distanceToCoord(i, j);
                                if (distance < minDistance) {
                                    minDistance = distance;
                                    closestNeighbour = neighbourIdx;
                                    minColorDistance = Number.MAX_VALUE; // reset color distance
                                } else if (distance === minDistance) {
                                    // if the distance is equal as the min distance
                                    // then see if the neighbour's color is closer to the current color

                                    // note: this causes morepoints to be reallocated to different neighbours
                                    // in the sanity check later, but still yields a better visual result

                                    const colorDistance = colorDistances[facetToRemove.color][neighbour.color];
                                    if (colorDistance < minColorDistance) {
                                        minColorDistance = colorDistance;
                                        closestNeighbour = neighbourIdx;
                                    }
                                }
                            }
                        }
                    }

                    // copy over color of closest neighbour
                    imgColorIndices.set(i, j, facetResult.facets[closestNeighbour]!.color);
                }
            }
        }

        // Rebuild all the neighbour facets that have been changed. While it could probably be faster by just adding the points manually
        // to the facet map and determine if the border points are still valid, it's more complex than that. It's possible that due to the change in points
        // that 2 neighbours of the same colors have become linked and need to merged as well. So it's easier to just rebuild the entire facet
        FacetReducer.rebuildChangedFacets(visitedArrayCache, facetToRemove, imgColorIndices, facetResult);

        // sanity check: make sure that all points have been replaced by neighbour facets. It's possible that some points will have
        // been left out because there is no continuity with the neighbour points
        // this occurs for diagonal points to the neighbours and more often when the closest
        // color is chosen when distances are equal.
        // It's probably possible to enforce that this will never happen in the above code but
        // this is a constraint that is expensive to enforce and doesn't happen all that much
        // so instead try and merge if with any of its direct neighbours if possible
        let needsToRebuild = false;
        for (let y: number = facetToRemove.bbox.minY; y <= facetToRemove.bbox.maxY; y++) {
            for (let x: number = facetToRemove.bbox.minX; x <= facetToRemove.bbox.maxX; x++) {
                if (facetResult.facetMap.get(x, y) === facetToRemove.id) {

                    console.warn(`Point ${x},${y} was reallocated to neighbours for facet ${facetToRemove.id} deletion`);
                    needsToRebuild = true;

                    if (x - 1 >= 0 && facetResult.facetMap.get(x - 1, y) !== facetToRemove.id && facetResult.facets[facetResult.facetMap.get(x - 1, y)] !== null) {
                        imgColorIndices.set(x, y, facetResult.facets[facetResult.facetMap.get(x - 1, y)]!.color);
                    } else if (y - 1 >= 0 && facetResult.facetMap.get(x, y - 1) !== facetToRemove.id && facetResult.facets[facetResult.facetMap.get(x, y - 1)] !== null) {
                        imgColorIndices.set(x, y, facetResult.facets[facetResult.facetMap.get(x, y - 1)]!.color);
                    } else if (x + 1 < facetResult.width && facetResult.facetMap.get(x + 1, y) !== facetToRemove.id && facetResult.facets[facetResult.facetMap.get(x + 1, y)] !== null) {
                        imgColorIndices.set(x, y, facetResult.facets[facetResult.facetMap.get(x + 1, y)]!.color);
                    } else if (y + 1 < facetResult.height && facetResult.facetMap.get(x, y + 1) !== facetToRemove.id && facetResult.facets[facetResult.facetMap.get(x, y + 1)] !== null) {
                        imgColorIndices.set(x, y, facetResult.facets[facetResult.facetMap.get(x, y + 1)]!.color);
                    } else {
                        console.error(`Unable to reallocate point ${x},${y}`);
                    }
                }
            }
        }
        // now we need to go through the thing again to build facets and update the neighbours
        if (needsToRebuild) {
            FacetReducer.rebuildChangedFacets(visitedArrayCache, facetToRemove, imgColorIndices, facetResult);
        }

        // now mark the facet to remove as deleted
        facetResult.facets[facetToRemove.id] = null;
    }

    /**
     *  Rebuilds the given changed facets
     */
    private static rebuildChangedFacets(visitedArrayCache: BooleanArray2D, facetToRemove: Facet, imgColorIndices: Uint8Array2D, facetResult: FacetResult) {

        const changedNeighboursSet: IMap<boolean> = {};

        if (facetToRemove.neighbourFacetsIsDirty) { FacetCreator.buildFacetNeighbour(facetToRemove, facetResult); }
        for (const neighbourIdx of facetToRemove.neighbourFacets!) {
            const neighbour = facetResult.facets[neighbourIdx];
            if (neighbour != null) {
                // re-evaluate facet

                // track all the facets that needs to have their neighbour list updated
                changedNeighboursSet[neighbourIdx] = true;

                if (neighbour.neighbourFacetsIsDirty) { FacetCreator.buildFacetNeighbour(neighbour, facetResult); }
                for (const n of neighbour.neighbourFacets!) {
                    changedNeighboursSet[n] = true;
                }

                // rebuild the neighbour facet
                const newFacet = FacetCreator.buildFacet(neighbourIdx, neighbour.color, neighbour.borderPoints[0].x, neighbour.borderPoints[0].y, visitedArrayCache, imgColorIndices, facetResult);
                facetResult.facets[neighbourIdx] = newFacet;

                // it's possible that any of the neighbour facets are now overlapping
                // because if for example facet Red - Green - Red, Green is removed
                // then it will become Red - Red and both facets will overlap
                // this means the facet will have 0 points remaining
                if (newFacet.pointCount === 0) {
                    // remove the empty facet as well
                    facetResult.facets[neighbourIdx] = null;
                }
            }
        }

        // reset the visited array for all neighbours
        // while the visited array could be recreated per facet to remove, it's quite big and introduces
        // a lot of allocation / cleanup overhead. Due to the size of the facets it's usually faster
        // to just flag every point of the facet as false again
        if (facetToRemove.neighbourFacetsIsDirty) { FacetCreator.buildFacetNeighbour(facetToRemove, facetResult); }
        for (const neighbourIdx of facetToRemove.neighbourFacets!) {
            const neighbour = facetResult.facets[neighbourIdx];
            if (neighbour != null) {
                for (let y: number = neighbour.bbox.minY; y <= neighbour.bbox.maxY; y++) {
                    for (let x: number = neighbour.bbox.minX; x <= neighbour.bbox.maxX; x++) {
                        if (facetResult.facetMap.get(x, y) === neighbour.id) {
                            visitedArrayCache.set(x, y, false);
                        }
                    }
                }
            }
        }

        // rebuild neighbour array for affected neighbours
        for (const k of Object.keys(changedNeighboursSet)) {
            if (changedNeighboursSet.hasOwnProperty(k)) {
                const neighbourIdx = parseInt(k);
                const f = facetResult.facets[neighbourIdx];
                if (f != null) {
                    // it's a lot faster when deferring the neighbour array updates
                    // because a lot of facets that are deleted share the same facet neighbours
                    // and removing the unnecessary neighbour array checks until they it's needed
                    // speeds things up significantly
                    // FacetCreator.buildFacetNeighbour(f, facetResult);
                    f.neighbourFacets = null;
                    f.neighbourFacetsIsDirty = true;
                }
            }
        }
    }

    /**
     *  Builds a distance matrix for each color to each other
     */
    private static buildColorDistanceMatrix(colorsByIndex: RGB[]) {

        const colorDistances: number[][] = new Array(colorsByIndex.length);
        for (let j: number = 0; j < colorsByIndex.length; j++) {
            colorDistances[j] = new Array(colorDistances.length);
        }
        for (let j: number = 0; j < colorsByIndex.length; j++) {
            for (let i: number = j; i < colorsByIndex.length; i++) {
                const c1 = colorsByIndex[j];
                const c2 = colorsByIndex[i];
                const distance = Math.sqrt((c1[0] - c2[0]) * (c1[0] - c2[0]) +
                    (c1[1] - c2[1]) * (c1[1] - c2[1]) +
                    (c1[2] - c2[2]) * (c1[2] - c2[2]));
                colorDistances[i][j] = distance;
                colorDistances[j][i] = distance;
            }
        }
        return colorDistances;
    }
}

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
                } else if (pt.y - 1 < 0 || facetResult.facetMap.get(pt.x, pt.y - 1) !== f.id) {
                    pt.orientation = OrientationEnum.Top;
                } else if (pt.x + 1 >= facetResult.width || facetResult.facetMap.get(pt.x + 1, pt.y) !== f.id) {
                    pt.orientation = OrientationEnum.Right;
                } else if (pt.y + 1 >= facetResult.height || facetResult.facetMap.get(pt.x, pt.y + 1) !== f.id) {
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

            } else if (pt.orientation === OrientationEnum.Top) {

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

            } else if (pt.orientation === OrientationEnum.Right) {

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

            } else if (pt.orientation === OrientationEnum.Bottom) {
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
            } else if (possibleNextPoints.length === 1) {
                pt = possibleNextPoints[0];
                FacetBorderTracer.addPointToPath(path, pt, xWall, f, yWall);
            } else {
                finished = true;
            }
        }

        // clear up the walls set for the path so the array can be reused
        for (const pathPoint of path) {
            switch (pathPoint.orientation) {
                case OrientationEnum.Left: xWall.set(pathPoint.x, pathPoint.y, false); break;
                case OrientationEnum.Top: yWall.set(pathPoint.x, pathPoint.y, false); break;
                case OrientationEnum.Right: xWall.set(pathPoint.x + 1, pathPoint.y, false); break;
                case OrientationEnum.Bottom: yWall.set(pathPoint.x, pathPoint.y + 1, false); break;
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

export class FacetBorderSegmenter {

    /**
     *  Builds border segments that are shared between facets
     *  While border paths are all nice and fancy, they are not linked to neighbour facets
     *  So any change in the paths makes a not so nice gap between the facets, which makes smoothing them out impossible
     */
    public static async buildFacetBorderSegments(facetResult: FacetResult, nrOfTimesToHalvePoints: number = 2, onUpdate: ((progress: number) => void) | null = null) {

        // first chop up the border path in segments each time the neighbour at that point changes
        // (and sometimes even when it doesn't on that side but does on the neighbour's side)
        const segmentsPerFacet: Array<Array<PathSegment | null>> = FacetBorderSegmenter.prepareSegmentsPerFacet(facetResult);

        // now reduce the segment complexity with Haar wavelet reduction to smooth them out and make them
        // more curvy with data points instead of zig zag of a grid
        FacetBorderSegmenter.reduceSegmentComplexity(facetResult, segmentsPerFacet, nrOfTimesToHalvePoints);

        // now see which segments of facets with the prepared segments of the neighbour facets
        // and point them to the same one
        await FacetBorderSegmenter.matchSegmentsWithNeighbours(facetResult, segmentsPerFacet, onUpdate);
    }

    /**
     *  Chops up the border paths per facet into segments adjacent tothe same neighbour
     */
    private static prepareSegmentsPerFacet(facetResult: FacetResult) {
        const segmentsPerFacet: Array<Array<PathSegment | null>> = new Array(facetResult.facets.length);
        for (const f of facetResult.facets) {
            if (f != null) {
                const segments: PathSegment[] = [];
                if (f.borderPath.length > 1) {
                    let currentPoints: PathPoint[] = [];
                    currentPoints.push(f.borderPath[0]);
                    for (let i: number = 1; i < f.borderPath.length; i++) {
                        const prevBorderPoint = f.borderPath[i - 1];
                        const curBorderPoint = f.borderPath[i];

                        const oldNeighbour = prevBorderPoint.getNeighbour(facetResult);
                        const curNeighbour = curBorderPoint.getNeighbour(facetResult);
                        let isTransitionPoint = false;
                        if (oldNeighbour !== curNeighbour) {
                            isTransitionPoint = true;
                        } else {
                            // it's possible that due to inner facets inside the current facet that the
                            // border is interrupted on that facet's side, but not on the neighbour's side
                            if (oldNeighbour !== -1) {
                                // check for tight rotations to break path if diagonals contain a different neighbour,
                                // see https://i.imgur.com/o6Srqwj.png for visual path of the issue

                                if (prevBorderPoint.x === curBorderPoint.x &&
                                    prevBorderPoint.y === curBorderPoint.y) {
                                    // rotation turn
                                    // check the diagonal neighbour to see if it remains the same
                                    //   +---+---+
                                    //   | dN|   |
                                    //   +---xxxx> (x = wall, dN = diagNeighbour)
                                    //   |   x f |
                                    //   +---v---+
                                    if ((prevBorderPoint.orientation === OrientationEnum.Top && curBorderPoint.orientation === OrientationEnum.Left) ||
                                        (prevBorderPoint.orientation === OrientationEnum.Left && curBorderPoint.orientation === OrientationEnum.Top)) {
                                        const diagNeighbour = facetResult.facetMap.get(curBorderPoint.x - 1, curBorderPoint.y - 1);
                                        if (diagNeighbour !== oldNeighbour) {
                                            isTransitionPoint = true;
                                        }
                                    } else if ((prevBorderPoint.orientation === OrientationEnum.Top && curBorderPoint.orientation === OrientationEnum.Right) ||
                                        (prevBorderPoint.orientation === OrientationEnum.Right && curBorderPoint.orientation === OrientationEnum.Top)) {
                                        const diagNeighbour = facetResult.facetMap.get(curBorderPoint.x + 1, curBorderPoint.y - 1);
                                        if (diagNeighbour !== oldNeighbour) {
                                            isTransitionPoint = true;
                                        }
                                    } else if ((prevBorderPoint.orientation === OrientationEnum.Bottom && curBorderPoint.orientation === OrientationEnum.Left) ||
                                        (prevBorderPoint.orientation === OrientationEnum.Left && curBorderPoint.orientation === OrientationEnum.Bottom)) {
                                        const diagNeighbour = facetResult.facetMap.get(curBorderPoint.x - 1, curBorderPoint.y + 1);
                                        if (diagNeighbour !== oldNeighbour) {
                                            isTransitionPoint = true;
                                        }
                                    } else if ((prevBorderPoint.orientation === OrientationEnum.Bottom && curBorderPoint.orientation === OrientationEnum.Right) ||
                                        (prevBorderPoint.orientation === OrientationEnum.Right && curBorderPoint.orientation === OrientationEnum.Bottom)) {
                                        const diagNeighbour = facetResult.facetMap.get(curBorderPoint.x + 1, curBorderPoint.y + 1);
                                        if (diagNeighbour !== oldNeighbour) {
                                            isTransitionPoint = true;
                                        }
                                    }
                                }
                            }
                        }
                        currentPoints.push(curBorderPoint);

                        if (isTransitionPoint) {
                            // aha! a transition point, create the current points as new segment
                            // and start a new list
                            if (currentPoints.length > 0) {
                                const segment = new PathSegment(currentPoints, oldNeighbour);
                                segments.push(segment);
                                currentPoints = [ curBorderPoint];
                            }
                        }
                    }

                    // finally check if there is a remainder partial segment and either prepend
                    // the points to the first segment if they have the same neighbour or construct a
                    // new segment
                    if (currentPoints.length > 0) {
                        const oldNeighbour = f.borderPath[f.borderPath.length - 1].getNeighbour(facetResult);
                        if (segments.length > 0 && segments[0].neighbour === oldNeighbour) {
                            // the first segment and the remainder of the last one are the same part
                            // add the current points to the first segment by prefixing it
                            const mergedPoints = currentPoints.concat(segments[0].points);
                            segments[0].points = mergedPoints;
                        } else {
                            // add the remainder as final segment
                            const segment = new PathSegment(currentPoints, oldNeighbour);
                            segments.push(segment);
                            currentPoints = [];
                        }
                    }
                }

                segmentsPerFacet[f.id] = segments;
            }
        }
        return segmentsPerFacet;
    }

    /**
     * Reduces each segment border path points
     */
    private static reduceSegmentComplexity(facetResult: FacetResult, segmentsPerFacet: Array<Array<PathSegment | null>>, nrOfTimesToHalvePoints: number) {
        for (const f of facetResult.facets) {
            if (f != null) {
                for (const segment of segmentsPerFacet[f.id]) {
                    for (let i: number = 0; i < nrOfTimesToHalvePoints; i++) {
                        segment!.points = FacetBorderSegmenter.reduceSegmentHaarWavelet(segment!.points, true, facetResult.width, facetResult.height);
                    }
                }
            }
        }
    }

    /**
     *  Remove the points by taking the average per pair and using that as a new point
     *  in the reduced segment. The delta values that create the Haar wavelet are not tracked
     *  because they are unneeded.
     */
    private static reduceSegmentHaarWavelet(newpath: PathPoint[], skipOutsideBorders: boolean, width: number, height: number) {
        if (newpath.length <= 5) {
            return newpath;
        }

        const reducedPath: PathPoint[] = [];
        reducedPath.push(newpath[0]);
        for (let i: number = 1; i < newpath.length - 2; i += 2) {

            if (!skipOutsideBorders || (skipOutsideBorders && !FacetBorderSegmenter.isOutsideBorderPoint(newpath[i], width, height))) {
                const cx = (newpath[i].x + newpath[i + 1].x) / 2;
                const cy = (newpath[i].y + newpath[i + 1].y) / 2;
                reducedPath.push(new PathPoint(new Point(cx, cy), OrientationEnum.Left));
            } else {
                reducedPath.push(newpath[i]);
                reducedPath.push(newpath[i + 1]);
            }
        }

        // close the loop
        reducedPath.push(newpath[newpath.length - 1]);

        return reducedPath;
    }

    private static isOutsideBorderPoint(point: Point, width: number, height: number) {
        return point.x === 0 || point.y === 0 || point.x === width - 1 || point.y === height - 1;
    }

    private static calculateArea(path: Point[]) {

        let total = 0;
        for (let i = 0; i < path.length; i++) {
            const addX = path[i].x;
            const addY = path[i === path.length - 1 ? 0 : i + 1].y;
            const subX = path[i === path.length - 1 ? 0 : i + 1].x;
            const subY = path[i].y;

            total += (addX * addY * 0.5);
            total -= (subX * subY * 0.5);
        }

        return Math.abs(total);
    }

    /**
     *  Matches all segments with each other between facets and their neighbour
     *  A segment matches when the start and end match or the start matches with the end and vice versa
     *  (then the segment will need to be traversed in reverse order)
     */
    private static async matchSegmentsWithNeighbours(facetResult: FacetResult, segmentsPerFacet: Array<Array<PathSegment | null>>, onUpdate: ((progress: number) => void) | null = null) {

        // max distance of the start/end points of the segment that it can be before the segments don't match up
        // must be < 2 or else you'd end up with small border segments being wrongly reversed, e.g. https://i.imgur.com/XZQhxRV.png
        const MAX_DISTANCE = 2;

        // reserve room
        for (const f of facetResult.facets) {
            if (f != null) {
                f.borderSegments = new Array(segmentsPerFacet[f.id].length);
            }
        }

        let count = 0;
        // and now the fun begins to match segments from 1 facet to its neighbours and vice versa
        for (const f of facetResult.facets) {

            if (f != null) {

                const debug = false;
                for (let s: number = 0; s < segmentsPerFacet[f.id].length; s++) {

                    const segment = segmentsPerFacet[f.id][s];

                    if (segment != null && f.borderSegments[s] == null) {

                        f.borderSegments[s] = new FacetBoundarySegment(segment, segment.neighbour, false);
                        if (debug) { console.log("Setting facet " + f.id + " segment " + s + " to " + f.borderSegments[s]); }

                        if (segment.neighbour !== -1) {
                            const neighbourFacet = facetResult.facets[segment.neighbour];
                            // see if there is a match to be found
                            let matchFound = false;

                            if (neighbourFacet != null) {
                                const neighbourSegments = segmentsPerFacet[segment.neighbour];

                                for (let ns: number = 0; ns < neighbourSegments.length; ns++) {
                                    const neighbourSegment = neighbourSegments[ns];
                                    // only try to match against the segments that aren't processed yet
                                    // and which are adjacent to the boundary of the current facet
                                    if (neighbourSegment != null && neighbourSegment.neighbour === f.id) {

                                        if (segment.points[0].distanceTo(neighbourSegment.points[0]) <= MAX_DISTANCE &&
                                            segment.points[segment.points.length - 1].distanceTo(neighbourSegment.points[neighbourSegment.points.length - 1]) <= MAX_DISTANCE) {
                                            // start & end points match
                                            if (debug) { console.log("Match found for facet " + f.id + " to neighbour " + neighbourFacet.id); }

                                            neighbourFacet!.borderSegments[ns] = new FacetBoundarySegment(segment, f.id, false);
                                            if (debug) { console.log("Setting facet " + neighbourFacet!.id + " segment " + ns + " to " + neighbourFacet!.borderSegments[ns]); }
                                            segmentsPerFacet[neighbourFacet.id][ns] = null;

                                            matchFound = true;
                                            break;
                                        } else if (segment.points[0].distanceTo(neighbourSegment.points[neighbourSegment.points.length - 1]) <= MAX_DISTANCE &&
                                            segment.points[segment.points.length - 1].distanceTo(neighbourSegment.points[0]) <= MAX_DISTANCE) {
                                            // start & end points match  but in reverse order
                                            if (debug) { console.log("Reverse match found for facet " + f.id + " to neighbour " + neighbourFacet.id); }

                                            neighbourFacet!.borderSegments[ns] = new FacetBoundarySegment(segment, f.id, true);
                                            if (debug) { console.log("Setting facet " + neighbourFacet!.id + " segment " + ns + " to " + neighbourFacet!.borderSegments[ns]); }
                                            segmentsPerFacet[neighbourFacet.id][ns] = null;

                                            matchFound = true;
                                            break;
                                        }
                                    }
                                }
                            }

                            if (!matchFound && debug) {
                                // it's possible that the border is not shared with its neighbour
                                // this can happen when the segment fully falls inside the other facet
                                // though the above checks in the preparation of the segments should probably
                                // cover all cases
                                console.error("No match found for segment of " + f.id + ": " +
                                    ("siding " + segment.neighbour + " " + segment.points[0] + " -> " + segment.points[segment.points.length - 1]));
                            }
                        }
                    }

                    // clear the current segment so it can't be processed again when processing the neighbour facet
                    segmentsPerFacet[f.id][s] = null;
                }

                if (count % 100 === 0) {
                    await delay(0);
                    if (onUpdate != null) {
                        onUpdate(f.id / facetResult.facets.length);
                    }
                }
            }
            count++;
        }

        if (onUpdate != null) {
            onUpdate(1);
        }
    }

}

export class FacetLabelPlacer {

    /**
     *  Determines where to place the labels for each facet. This is done by calculating where
     *  in the polygon the largest circle can be contained, also called the pole of inaccessibility
     *  That's the spot where there will be the most room for the label.
     *  One tricky gotcha: neighbour facets can lay completely inside other facets and can overlap the label
     *  if only the outer border of the facet is taken in account. This is solved by adding the neighbours facet polygon that fall
     *  within the facet as additional polygon rings (why does everything look so easy to do yet never is under the hood :/)
     */
    public static async buildFacetLabelBounds(facetResult: FacetResult, onUpdate: ((progress: number) => void) | null = null) {

        let count = 0;
        for (const f of facetResult.facets) {
            if (f != null) {

                const polyRings: Point[][] = [];

                // get the border path from the segments (that can have been reduced compared to facet actual border path)
                const borderPath = f.getFullPathFromBorderSegments(true);
                // outer path must be first ring
                polyRings.push(borderPath);

                const onlyOuterRing = [borderPath];

                // now add all the neighbours of the facet as "inner" rings,
                // regardless if they are inner or not. These are seen as areas where the label
                // cannot be placed
                if (f.neighbourFacetsIsDirty) { FacetCreator.buildFacetNeighbour(f, facetResult); }
                for (const neighbourIdx of f.neighbourFacets!) {

                    const neighbourPath = facetResult.facets[neighbourIdx]!.getFullPathFromBorderSegments(true);

                    const fallsInside: boolean = FacetLabelPlacer.doesNeighbourFallInsideInCurrentFacet(neighbourPath, f, onlyOuterRing);

                    if (fallsInside) {
                        polyRings.push(neighbourPath);
                    }
                }
                const result = polylabel(polyRings);

                f.labelBounds = new BoundingBox();

                // determine inner square within the circle
                const innerPadding = 2 * Math.sqrt(2 * result.distance);
                f.labelBounds.minX = result.pt.x - innerPadding;
                f.labelBounds.maxX = result.pt.x + innerPadding;
                f.labelBounds.minY = result.pt.y - innerPadding;
                f.labelBounds.maxY = result.pt.y + innerPadding;

                if (count % 100 === 0) {
                    await delay(0);
                    if (onUpdate != null) {
                        onUpdate(f.id / facetResult.facets.length);
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
     *  Checks whether a neighbour border path is fully within the current facet border path
     */
    private static doesNeighbourFallInsideInCurrentFacet(neighbourPath: Point[], f: Facet, onlyOuterRing: Point[][]) {
        let fallsInside: boolean = true;

        // fast test to see if the neighbour falls inside the bbox of the facet
        for (let i: number = 0; i < neighbourPath.length && fallsInside; i++) {
            if (neighbourPath[i].x >= f.bbox.minX && neighbourPath[i].x <= f.bbox.maxX &&
                neighbourPath[i].y >= f.bbox.minY && neighbourPath[i].y <= f.bbox.maxY) {
                // ok
            } else {
                fallsInside = false;
            }
        }

        if (fallsInside) {
            // do a more fine grained but more expensive check to see if each of the points fall within the polygon
            for (let i: number = 0; i < neighbourPath.length && fallsInside; i++) {
                const distance = pointToPolygonDist(neighbourPath[i].x, neighbourPath[i].y, onlyOuterRing);
                if (distance < 0) {
                    // falls outside
                    fallsInside = false;
                }
            }
        }
        return fallsInside;
    }
}
