import { delay } from "./common";
import { Point } from "./structs/point";
import { FacetResult, PathPoint, OrientationEnum } from "./facetmanagement";


/**
 *  Path segment is a segment of a border path that is adjacent to a specific neighbour facet
 */
export class PathSegment {
    constructor(public points: PathPoint[], public neighbour: number) {

    }
}


/**
 * Facet boundary segment describes the matched segment that is shared between 2 facets
 * When 2 segments are matched, one will be the original segment and the other one is removed
 * This ensures that all facets share the same segments, but sometimes in reverse order to ensure
 * the correct continuity of its entire oborder path
 */
export class FacetBoundarySegment {
    constructor(public originalSegment: PathSegment, public neighbour: number, public reverseOrder: boolean) {

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
                        }
                        else {
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
                                    }
                                    else if ((prevBorderPoint.orientation === OrientationEnum.Top && curBorderPoint.orientation === OrientationEnum.Right) ||
                                        (prevBorderPoint.orientation === OrientationEnum.Right && curBorderPoint.orientation === OrientationEnum.Top)) {
                                        const diagNeighbour = facetResult.facetMap.get(curBorderPoint.x + 1, curBorderPoint.y - 1);
                                        if (diagNeighbour !== oldNeighbour) {
                                            isTransitionPoint = true;
                                        }
                                    }
                                    else if ((prevBorderPoint.orientation === OrientationEnum.Bottom && curBorderPoint.orientation === OrientationEnum.Left) ||
                                        (prevBorderPoint.orientation === OrientationEnum.Left && curBorderPoint.orientation === OrientationEnum.Bottom)) {
                                        const diagNeighbour = facetResult.facetMap.get(curBorderPoint.x - 1, curBorderPoint.y + 1);
                                        if (diagNeighbour !== oldNeighbour) {
                                            isTransitionPoint = true;
                                        }
                                    }
                                    else if ((prevBorderPoint.orientation === OrientationEnum.Bottom && curBorderPoint.orientation === OrientationEnum.Right) ||
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
                            if (currentPoints.length > 1) {
                                const segment = new PathSegment(currentPoints, oldNeighbour);
                                segments.push(segment);
                                currentPoints = [curBorderPoint];
                            }
                        }
                    }
                    // finally check if there is a remainder partial segment and either prepend
                    // the points to the first segment if they have the same neighbour or construct a
                    // new segment
                    if (currentPoints.length > 1) {
                        const oldNeighbour = f.borderPath[f.borderPath.length - 1].getNeighbour(facetResult);
                        if (segments.length > 0 && segments[0].neighbour === oldNeighbour) {
                            // the first segment and the remainder of the last one are the same part
                            // add the current points to the first segment by prefixing it
                            const mergedPoints = currentPoints.concat(segments[0].points);
                            segments[0].points = mergedPoints;
                        }
                        else {
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
            }
            else {
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
        const MAX_DISTANCE = 4;
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
                        if (debug) {
                            console.log("Setting facet " + f.id + " segment " + s + " to " + f.borderSegments[s]);
                        }
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
                                        const segStartPoint = segment.points[0];
                                        const segEndPoint = segment.points[segment.points.length - 1];
                                        const nSegStartPoint = neighbourSegment.points[0];
                                        const nSegEndPoint = neighbourSegment.points[neighbourSegment.points.length - 1];
                                        let matchesStraight = (segStartPoint.distanceTo(nSegStartPoint) <= MAX_DISTANCE &&
                                            segEndPoint.distanceTo(nSegEndPoint) <= MAX_DISTANCE);
                                        let matchesReverse = (segStartPoint.distanceTo(nSegEndPoint) <= MAX_DISTANCE &&
                                            segEndPoint.distanceTo(nSegStartPoint) <= MAX_DISTANCE);
                                        if (matchesStraight && matchesReverse) {
                                            // dang it , both match, it must be a tiny segment, but when placed wrongly it'll overlap in the path creating an hourglass 
                                            //  e.g. https://i.imgur.com/XZQhxRV.png
                                            // determine which is the closest
                                            if (segStartPoint.distanceTo(nSegStartPoint) + segEndPoint.distanceTo(nSegEndPoint) <
                                                segStartPoint.distanceTo(nSegEndPoint) + segEndPoint.distanceTo(nSegStartPoint)) {
                                                matchesStraight = true;
                                                matchesReverse = false;
                                            }
                                            else {
                                                matchesStraight = false;
                                                matchesReverse = true;
                                            }
                                        }
                                        if (matchesStraight) {
                                            // start & end points match
                                            if (debug) {
                                                console.log("Match found for facet " + f.id + " to neighbour " + neighbourFacet.id);
                                            }
                                            neighbourFacet!.borderSegments[ns] = new FacetBoundarySegment(segment, f.id, false);
                                            if (debug) {
                                                console.log("Setting facet " + neighbourFacet!.id + " segment " + ns + " to " + neighbourFacet!.borderSegments[ns]);
                                            }
                                            segmentsPerFacet[neighbourFacet.id][ns] = null;
                                            matchFound = true;
                                            break;
                                        }
                                        else if (matchesReverse) {
                                            // start & end points match  but in reverse order
                                            if (debug) {
                                                console.log("Reverse match found for facet " + f.id + " to neighbour " + neighbourFacet.id);
                                            }
                                            neighbourFacet!.borderSegments[ns] = new FacetBoundarySegment(segment, f.id, true);
                                            if (debug) {
                                                console.log("Setting facet " + neighbourFacet!.id + " segment " + ns + " to " + neighbourFacet!.borderSegments[ns]);
                                            }
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
