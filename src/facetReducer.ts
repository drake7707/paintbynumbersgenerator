import { ColorReducer } from "./colorreductionmanagement";
import { delay, IMap, RGB } from "./common";
import { FacetCreator } from "./facetCreator";
import { Facet, FacetResult } from "./facetmanagement";
import { BooleanArray2D, Uint8Array2D } from "./structs/typedarrays";

export class FacetReducer {

    /**
     *  Remove all facets that have a pointCount smaller than the given number.
     */
    public static async reduceFacets(smallerThan: number, removeFacetsFromLargeToSmall: boolean, maximumNumberOfFacets: number, colorsByIndex: RGB[], facetResult: FacetResult, imgColorIndices: Uint8Array2D, onUpdate: ((progress: number) => void) | null = null) {
        const visitedCache = new BooleanArray2D(facetResult.width, facetResult.height);

        // build the color distance matrix, which describes the distance of each color to each other
        const colorDistances: number[][] = ColorReducer.buildColorDistanceMatrix(colorsByIndex);

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
                FacetReducer.deleteFacet(f.id, facetResult, imgColorIndices, colorDistances, visitedCache);

                if (new Date().getTime() - curTime > 500) {
                    curTime = new Date().getTime();
                    await delay(0);
                    if (onUpdate != null) {
                        onUpdate(0.5 * fidx / facetProcessingOrder.length);
                    }
                }
            }

        }

        let facetCount = facetResult.facets.filter(f => f != null).length;
        if (facetCount > maximumNumberOfFacets) {
            console.log(`There are still ${facetCount} facets, more than the maximum of ${maximumNumberOfFacets}. Removing the smallest facets`);
        }

        const startFacetCount = facetCount;
        while (facetCount > maximumNumberOfFacets) {

            // because facets can be merged, reevaluate the order of facets to make sure the smallest one is removed 
            // this is slower but more accurate
            const facetProcessingOrder = facetResult.facets.filter((f) => f != null).slice(0)
                .sort((a, b) => b!.pointCount > a!.pointCount ? 1 : (b!.pointCount < a!.pointCount ? -1 : 0))
                .map((f) => f!.id)
                .reverse();

            const facetToRemove = facetResult.facets[facetProcessingOrder[0]];

            FacetReducer.deleteFacet(facetToRemove!.id, facetResult, imgColorIndices, colorDistances, visitedCache);
            facetCount = facetResult.facets.filter(f => f != null).length;

            if (new Date().getTime() - curTime > 500) {
                curTime = new Date().getTime();
                await delay(0);
                if (onUpdate != null) {
                    onUpdate(0.5 + 0.5 - (facetCount - maximumNumberOfFacets) / (startFacetCount - maximumNumberOfFacets));
                }
            }
        }
        // this.trimFacets(facetResult, imgColorIndices, colorDistances, visitedCache);

        if (onUpdate != null) {
            onUpdate(1);
        }
    }

    // /**
    //  * Trims facets with narrow paths either horizontally or vertically, potentially splitting the facet into multiple facets
    //  */
    // public static trimFacets(facetResult: FacetResult, imgColorIndices: Uint8Array2D, colorDistances: number[][], visitedArrayCache: BooleanArray2D) {
    //     for (const facet of facetResult.facets) {
    //         if (facet !== null) {

    //             const facetPointsToReallocate: Point[] = [];

    //             for (let y: number = facet.bbox.minY; y <= facet.bbox.maxY; y++) {
    //                 for (let x: number = facet.bbox.minX; x <= facet.bbox.maxX; x++) {
    //                     if (x > 0 && y > 0 && x < facetResult.width - 1 && y < facetResult.height - 1 &&
    //                         facetResult.facetMap.get(x, y) === facet.id) {

    //                         // check if isolated horizontally
    //                         const top = facetResult.facetMap.get(x, y - 1);
    //                         const bottom = facetResult.facetMap.get(x, y + 1);

    //                         if (top !== facet.id && bottom !== facet.id) {
    //                             // . ? .
    //                             // . F .
    //                             // . ? .
    //                             // mark pixel of facet that it should be removed
    //                             facetPointsToReallocate.push(new Point(x, y));

    //                             const closestNeighbour = FacetReducer.getClosestNeighbourForPixel(facet, facetResult, x, y, colorDistances);
    //                             // copy over color of closest neighbour
    //                             imgColorIndices.set(x, y, facetResult.facets[closestNeighbour]!.color);
    //                             console.log("Flagged " + x + "," + y + " to trim");
    //                         }
    //                     }
    //                 }
    //             }

    //             if (facetPointsToReallocate.length > 0) {
    //                 FacetReducer.rebuildForFacetChange(visitedArrayCache, facet, imgColorIndices, facetResult);
    //             }
    //         }
    //     }
    // }

    /**
     * Deletes a facet. All points belonging to the facet are moved to the nearest neighbour facet
     * based on the distance of the neighbour border points. This results in a voronoi like filling in of the
     * void the deletion made
     */
    private static deleteFacet(facetIdToRemove: number, facetResult: FacetResult, imgColorIndices: Uint8Array2D, colorDistances: number[][], visitedArrayCache: BooleanArray2D) {
        const facetToRemove = facetResult.facets[facetIdToRemove];
        if (facetToRemove === null) { // already removed
            return;
        }

        if (facetToRemove.neighbourFacetsIsDirty) {
            FacetCreator.buildFacetNeighbour(facetToRemove, facetResult);
        }

        if (facetToRemove.neighbourFacets!.length > 0) {
            // there are many small facets, it's faster to just iterate over all points within its bounding box
            // and seeing which belong to the facet than to keep track of the inner points (along with the border points)
            // per facet, because that generates a lot of extra heap objects that need to be garbage collected each time
            // a facet is rebuilt
            for (let j: number = facetToRemove.bbox.minY; j <= facetToRemove.bbox.maxY; j++) {
                for (let i: number = facetToRemove.bbox.minX; i <= facetToRemove.bbox.maxX; i++) {
                    if (facetResult.facetMap.get(i, j) === facetToRemove.id) {
                        const closestNeighbour = FacetReducer.getClosestNeighbourForPixel(facetToRemove, facetResult, i, j, colorDistances);
                        if (closestNeighbour !== -1) {
                            // copy over color of closest neighbour
                            imgColorIndices.set(i, j, facetResult.facets[closestNeighbour]!.color);
                        } else {
                            console.warn(`No closest neighbour found for point ${i},${j}`);
                        }
                    }
                }
            }
        } else {
            console.warn(`Facet ${facetToRemove.id} does not have any neighbours`);
        }

        // Rebuild all the neighbour facets that have been changed. While it could probably be faster by just adding the points manually
        // to the facet map and determine if the border points are still valid, it's more complex than that. It's possible that due to the change in points
        // that 2 neighbours of the same colors have become linked and need to merged as well. So it's easier to just rebuild the entire facet
        FacetReducer.rebuildForFacetChange(visitedArrayCache, facetToRemove, imgColorIndices, facetResult);

        // now mark the facet to remove as deleted
        facetResult.facets[facetToRemove.id] = null;
    }

    private static rebuildForFacetChange(visitedArrayCache: BooleanArray2D, facet: Facet, imgColorIndices: Uint8Array2D, facetResult: FacetResult) {
        FacetReducer.rebuildChangedNeighbourFacets(visitedArrayCache, facet, imgColorIndices, facetResult);

        // sanity check: make sure that all points have been replaced by neighbour facets. It's possible that some points will have
        // been left out because there is no continuity with the neighbour points
        // this occurs for diagonal points to the neighbours and more often when the closest
        // color is chosen when distances are equal.
        // It's probably possible to enforce that this will never happen in the above code but
        // this is a constraint that is expensive to enforce and doesn't happen all that much
        // so instead try and merge if with any of its direct neighbours if possible
        let needsToRebuild = false;
        for (let y: number = facet.bbox.minY; y <= facet.bbox.maxY; y++) {
            for (let x: number = facet.bbox.minX; x <= facet.bbox.maxX; x++) {
                if (facetResult.facetMap.get(x, y) === facet.id) {
                    console.warn(`Point ${x},${y} was reallocated to neighbours for facet ${facet.id}`);
                    needsToRebuild = true;
                    if (x - 1 >= 0 && facetResult.facetMap.get(x - 1, y) !== facet.id && facetResult.facets[facetResult.facetMap.get(x - 1, y)] !== null) {
                        imgColorIndices.set(x, y, facetResult.facets[facetResult.facetMap.get(x - 1, y)]!.color);
                    } else if (y - 1 >= 0 && facetResult.facetMap.get(x, y - 1) !== facet.id && facetResult.facets[facetResult.facetMap.get(x, y - 1)] !== null) {
                        imgColorIndices.set(x, y, facetResult.facets[facetResult.facetMap.get(x, y - 1)]!.color);
                    } else if (x + 1 < facetResult.width && facetResult.facetMap.get(x + 1, y) !== facet.id && facetResult.facets[facetResult.facetMap.get(x + 1, y)] !== null) {
                        imgColorIndices.set(x, y, facetResult.facets[facetResult.facetMap.get(x + 1, y)]!.color);
                    } else if (y + 1 < facetResult.height && facetResult.facetMap.get(x, y + 1) !== facet.id && facetResult.facets[facetResult.facetMap.get(x, y + 1)] !== null) {
                        imgColorIndices.set(x, y, facetResult.facets[facetResult.facetMap.get(x, y + 1)]!.color);
                    } else {
                        console.error(`Unable to reallocate point ${x},${y}`);
                    }
                }
            }
        }
        // now we need to go through the thing again to build facets and update the neighbours
        if (needsToRebuild) {
            FacetReducer.rebuildChangedNeighbourFacets(visitedArrayCache, facet, imgColorIndices, facetResult);
        }
    }

    /**
     * Determines the closest neighbour for a given pixel of a facet, based on the closest distance to the neighbour AND the when tied, the closest color
     */
    private static getClosestNeighbourForPixel(facetToRemove: Facet, facetResult: FacetResult, x: number, y: number, colorDistances: number[][]) {
        let closestNeighbour = -1;
        let minDistance = Number.MAX_VALUE;
        let minColorDistance = Number.MAX_VALUE;
        // ensure the neighbour facets is up to date if it was marked as dirty
        if (facetToRemove.neighbourFacetsIsDirty) {
            FacetCreator.buildFacetNeighbour(facetToRemove, facetResult);
        }
        // determine which neighbour will receive the current point based on the distance, and if there are more with the same
        // distance, then take the neighbour with the closes color
        for (const neighbourIdx of facetToRemove.neighbourFacets!) {
            const neighbour = facetResult.facets[neighbourIdx];
            if (neighbour != null) {
                for (const bpt of neighbour.borderPoints) {
                    const distance = bpt.distanceToCoord(x, y);
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
        return closestNeighbour;
    }

    /**
     *  Rebuilds the given changed facets
     */
    private static rebuildChangedNeighbourFacets(visitedArrayCache: BooleanArray2D, facetToRemove: Facet, imgColorIndices: Uint8Array2D, facetResult: FacetResult) {
        const changedNeighboursSet: IMap<boolean> = {};

        if (facetToRemove.neighbourFacetsIsDirty) {
            FacetCreator.buildFacetNeighbour(facetToRemove, facetResult);
        }

        for (const neighbourIdx of facetToRemove.neighbourFacets!) {
            const neighbour = facetResult.facets[neighbourIdx];
            if (neighbour != null) {
                // re-evaluate facet
                // track all the facets that needs to have their neighbour list updated, which is also going to be all the neighbours of the neighbours that are being updated
                changedNeighboursSet[neighbourIdx] = true;

                if (neighbour.neighbourFacetsIsDirty) {
                    FacetCreator.buildFacetNeighbour(neighbour, facetResult);
                }

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
        if (facetToRemove.neighbourFacetsIsDirty) {
            FacetCreator.buildFacetNeighbour(facetToRemove, facetResult);
        }

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

}

