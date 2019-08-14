/**
 * Facet management from the process, anything from construction, reduction and border tracing etc.
 */
import { FacetBoundarySegment } from "./FacetBorderSegmenter";
import { BoundingBox } from "./structs/boundingbox";
import { Point } from "./structs/point";
import { Uint32Array2D } from "./structs/typedarrays";

export enum OrientationEnum {
    Left,
    Top,
    Right,
    Bottom,
}

/**
 * PathPoint is a point with an orientation that indicates which wall border is set
 */
export class PathPoint extends Point {

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
 *  A facet that represents an area of pixels of the same color
 */
export class Facet {

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

        const addPoint = (pt: PathPoint) => {
            if (useWalls) {
                newpath.push(new Point(pt.getWallX(), pt.getWallY()));
            } else {
                newpath.push(new Point(pt.x, pt.y));
            }
        };

        let lastSegment: FacetBoundarySegment | null = null;
        for (const seg of this.borderSegments) {

            // fix for the continuitity of the border segments. If transition points between border segments on the path aren't repeated, the
            // borders of the facets aren't always matching up leaving holes when rendered
            if (lastSegment != null) {
                if (lastSegment.reverseOrder) {
                    addPoint(lastSegment.originalSegment.points[0]);
                } else {
                    addPoint(lastSegment.originalSegment.points[lastSegment.originalSegment.points.length - 1]);
                }
            }

            for (let i: number = 0; i < seg.originalSegment.points.length; i++) {
                const idx = seg.reverseOrder ? (seg.originalSegment.points.length - 1 - i) : i;
                addPoint(seg.originalSegment.points[idx]);
            }

            lastSegment = seg;
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
