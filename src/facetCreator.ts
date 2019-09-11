import { delay, IMap, RGB } from "./common";
import { fill } from "./lib/fill";
import { BoundingBox } from "./structs/boundingbox";
import { Point } from "./structs/point";
import { BooleanArray2D, Uint32Array2D, Uint8Array2D } from "./structs/typedarrays";
import { FacetResult, Facet } from "./facetmanagement";
import { FacetReducer } from "./facetReducer";

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
        
        facet.neighbourFacetsIsDirty = true; // not built neighbours yet
        facet.neighbourFacets = null;

        fill(x, y, facetResult.width, facetResult.height, (ptx, pty) => visited.get(ptx, pty) || imgColorIndices.get(ptx, pty) !== facetColorIndex, (ptx, pty) => {
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
            if (ptx > facet.bbox.maxX) {
                facet.bbox.maxX = ptx;
            }
            if (pty > facet.bbox.maxY) {
                facet.bbox.maxY = pty;
            }
            if (ptx < facet.bbox.minX) {
                facet.bbox.minX = ptx;
            }
            if (pty < facet.bbox.minY) {
                facet.bbox.minY = pty;
            }
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
                if (leftFacetId !== facet.id) {
                    uniqueFacets[leftFacetId] = true;
                }
            }
            if (pt.y - 1 >= 0) {
                const topFacetId = facetResult.facetMap.get(pt.x, pt.y - 1);
                if (topFacetId !== facet.id) {
                    uniqueFacets[topFacetId] = true;
                }
            }
            if (pt.x + 1 < facetResult.width) {
                const rightFacetId = facetResult.facetMap.get(pt.x + 1, pt.y);
                if (rightFacetId !== facet.id) {
                    uniqueFacets[rightFacetId] = true;
                }
            }
            if (pt.y + 1 < facetResult.height) {
                const bottomFacetId = facetResult.facetMap.get(pt.x, pt.y + 1);
                if (bottomFacetId !== facet.id) {
                    uniqueFacets[bottomFacetId] = true;
                }
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
