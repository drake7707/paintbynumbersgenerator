/**
 * Module that manages the GUI when processing
 */

import { ColorMapResult, ColorReducer } from "./colorreductionmanagement";
import { CancellationToken, delay, IMap, RGB } from "./common";
import { FacetBorderSegmenter } from "./facetBorderSegmenter";
import { FacetBorderTracer } from "./facetBorderTracer";
import { FacetCreator } from "./facetCreator";
import { FacetLabelPlacer } from "./facetLabelPlacer";
import { FacetResult } from "./facetmanagement";
import { FacetReducer } from "./facetReducer";
import { time, timeEnd } from "./gui";
import { Settings } from "./settings";
import { Point } from "./structs/point";

export class ProcessResult {
    public facetResult!: FacetResult;
    public colorsByIndex!: RGB[];
}

/**
 *  Manages the GUI states & processes the image step by step
 */
export class GUIProcessManager {

    public static async process(settings: Settings, cancellationToken: CancellationToken): Promise<ProcessResult> {
        const c = document.getElementById("canvas") as HTMLCanvasElement;
        const ctx = c.getContext("2d")!;
        let imgData = ctx.getImageData(0, 0, c.width, c.height);

        if (settings.resizeImageIfTooLarge && (c.width > settings.resizeImageWidth || c.height > settings.resizeImageHeight)) {
            let width = c.width;
            let height = c.height;
            if (width > settings.resizeImageWidth) {
                const newWidth = settings.resizeImageWidth;
                const newHeight = c.height / c.width * settings.resizeImageWidth;
                width = newWidth;
                height = newHeight;
            }
            if (height > settings.resizeImageHeight) {
                const newHeight = settings.resizeImageHeight;
                const newWidth = width / height * newHeight;
                width = newWidth;
                height = newHeight;
            }

            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = width;
            tempCanvas.height = height;
            tempCanvas.getContext("2d")!.drawImage(c, 0, 0, width, height);
            c.width = width;
            c.height = height;
            ctx.drawImage(tempCanvas, 0, 0, width, height);
            imgData = ctx.getImageData(0, 0, c.width, c.height);
        }

        // reset progress
        $(".status .progress .determinate").css("width", "0px");
        $(".status").removeClass("complete");

        const tabsOutput = M.Tabs.getInstance(document.getElementById("tabsOutput")!);

        // k-means clustering
        const kmeansImgData = await GUIProcessManager.processKmeansClustering(imgData, tabsOutput, ctx, settings, cancellationToken);

        let facetResult: FacetResult = new FacetResult();
        let colormapResult: ColorMapResult = new ColorMapResult();

        // build color map
        colormapResult = ColorReducer.createColorMap(kmeansImgData);

        if (settings.narrowPixelStripCleanupRuns === 0) {
            // facet building
            facetResult = await GUIProcessManager.processFacetBuilding(colormapResult, cancellationToken);

            // facet reduction
            await GUIProcessManager.processFacetReduction(facetResult, tabsOutput, settings, colormapResult, cancellationToken);
        } else {
            for (let run = 0; run < settings.narrowPixelStripCleanupRuns; run++) {

                // clean up narrow pixel strips
                await ColorReducer.processNarrowPixelStripCleanup(colormapResult);

                // facet building
                facetResult = await GUIProcessManager.processFacetBuilding(colormapResult, cancellationToken);

                // facet reduction
                await GUIProcessManager.processFacetReduction(facetResult, tabsOutput, settings, colormapResult, cancellationToken);

                // the colormapResult.imgColorIndices get updated as the facets are reduced, so just do a few runs of pixel cleanup
            }
        }

        // facet border tracing
        await GUIProcessManager.processFacetBorderTracing(tabsOutput, facetResult, cancellationToken);

        // facet border segmentation
        const cBorderSegment = await GUIProcessManager.processFacetBorderSegmentation(facetResult, tabsOutput, settings, cancellationToken);

        // facet label placement
        await GUIProcessManager.processFacetLabelPlacement(facetResult, cBorderSegment, tabsOutput, cancellationToken);

        // everything is now ready to generate the SVG, return the result
        const processResult = new ProcessResult();
        processResult.facetResult = facetResult;
        processResult.colorsByIndex = colormapResult.colorsByIndex;
        return processResult;
    }

    private static async processKmeansClustering(imgData: ImageData, tabsOutput: M.Tabs, ctx: CanvasRenderingContext2D,
        settings: Settings, cancellationToken: CancellationToken) {
        time("K-means clustering");

        const cKmeans = document.getElementById("cKMeans") as HTMLCanvasElement;
        cKmeans.width = imgData.width;
        cKmeans.height = imgData.height;

        const ctxKmeans = cKmeans.getContext("2d")!;
        ctxKmeans.fillStyle = "white";
        ctxKmeans.fillRect(0, 0, cKmeans.width, cKmeans.height);

        const kmeansImgData = ctxKmeans.getImageData(0, 0, cKmeans.width, cKmeans.height);

        tabsOutput.select("kmeans-pane");
        $(".status.kMeans").addClass("active");

        await ColorReducer.applyKMeansClustering(imgData, kmeansImgData, ctx, settings, (kmeans) => {
            const progress = (100 - (kmeans.currentDeltaDistanceDifference > 100 ? 100 : kmeans.currentDeltaDistanceDifference)) / 100;
            $("#statusKMeans").css("width", Math.round(progress * 100) + "%");
            ctxKmeans.putImageData(kmeansImgData, 0, 0);
            console.log(kmeans.currentDeltaDistanceDifference);
            if (cancellationToken.isCancelled) {
                throw new Error("Cancelled");
            }
        });

        $(".status").removeClass("active");
        $(".status.kMeans").addClass("complete");
        timeEnd("K-means clustering");
        return kmeansImgData;
    }


    private static async  processFacetBuilding(colormapResult: ColorMapResult, cancellationToken: CancellationToken) {
        time("Facet building");
        $(".status.facetBuilding").addClass("active");
        const facetResult = await FacetCreator.getFacets(colormapResult.width, colormapResult.height, colormapResult.imgColorIndices, (progress) => {
            if (cancellationToken.isCancelled) {
                throw new Error("Cancelled");
            }
            $("#statusFacetBuilding").css("width", Math.round(progress * 100) + "%");
        });
        $(".status").removeClass("active");
        $(".status.facetBuilding").addClass("complete");
        timeEnd("Facet building");
        return facetResult;
    }

    private static async processFacetReduction(facetResult: FacetResult, tabsOutput: M.Tabs, settings: Settings, colormapResult: ColorMapResult, cancellationToken: CancellationToken) {
        time("Facet reduction");
        const cReduction = document.getElementById("cReduction") as HTMLCanvasElement;
        cReduction.width = facetResult.width;
        cReduction.height = facetResult.height;
        const ctxReduction = cReduction.getContext("2d")!;
        ctxReduction.fillStyle = "white";
        ctxReduction.fillRect(0, 0, cReduction.width, cReduction.height);
        const reductionImgData = ctxReduction.getImageData(0, 0, cReduction.width, cReduction.height);
        tabsOutput.select("reduction-pane");
        $(".status.facetReduction").addClass("active");
        await FacetReducer.reduceFacets(settings.removeFacetsSmallerThanNrOfPoints, settings.removeFacetsFromLargeToSmall, settings.maximumNumberOfFacets, colormapResult.colorsByIndex, facetResult, colormapResult.imgColorIndices, (progress) => {
            if (cancellationToken.isCancelled) {
                throw new Error("Cancelled");
            }
            // update status & image
            $("#statusFacetReduction").css("width", Math.round(progress * 100) + "%");
            let idx = 0;
            for (let j: number = 0; j < facetResult.height; j++) {
                for (let i: number = 0; i < facetResult.width; i++) {
                    const facet = facetResult.facets[facetResult.facetMap.get(i, j)];
                    const rgb = colormapResult.colorsByIndex[facet!.color];
                    reductionImgData.data[idx++] = rgb[0];
                    reductionImgData.data[idx++] = rgb[1];
                    reductionImgData.data[idx++] = rgb[2];
                    idx++;
                }
            }
            ctxReduction.putImageData(reductionImgData, 0, 0);
        });
        $(".status").removeClass("active");
        $(".status.facetReduction").addClass("complete");
        timeEnd("Facet reduction");
    }

    private static async processFacetBorderTracing(tabsOutput: M.Tabs, facetResult: FacetResult, cancellationToken: CancellationToken) {
        time("Facet border tracing");
        tabsOutput.select("borderpath-pane");
        const cBorderPath = document.getElementById("cBorderPath") as HTMLCanvasElement;
        cBorderPath.width = facetResult.width;
        cBorderPath.height = facetResult.height;
        const ctxBorderPath = cBorderPath.getContext("2d")!;
        $(".status.facetBorderPath").addClass("active");
        await FacetBorderTracer.buildFacetBorderPaths(facetResult, (progress) => {
            if (cancellationToken.isCancelled) {
                throw new Error("Cancelled");
            }
            // update status & image
            $("#statusFacetBorderPath").css("width", Math.round(progress * 100) + "%");
            ctxBorderPath.fillStyle = "white";
            ctxBorderPath.fillRect(0, 0, cBorderPath.width, cBorderPath.height);
            for (const f of facetResult.facets) {
                if (f != null && f.borderPath != null) {
                    ctxBorderPath.beginPath();
                    ctxBorderPath.moveTo(f.borderPath[0].getWallX(), f.borderPath[0].getWallY());
                    for (let i: number = 1; i < f.borderPath.length; i++) {
                        ctxBorderPath.lineTo(f.borderPath[i].getWallX(), f.borderPath[i].getWallY());
                    }
                    ctxBorderPath.stroke();
                }
            }
        });
        $(".status").removeClass("active");
        $(".status.facetBorderPath").addClass("complete");
        timeEnd("Facet border tracing");
    }

    private static async processFacetBorderSegmentation(facetResult: FacetResult, tabsOutput: M.Tabs, settings: Settings, cancellationToken: CancellationToken) {
        time("Facet border segmentation");
        const cBorderSegment = document.getElementById("cBorderSegmentation") as HTMLCanvasElement;
        cBorderSegment.width = facetResult.width;
        cBorderSegment.height = facetResult.height;
        const ctxBorderSegment = cBorderSegment.getContext("2d")!;
        tabsOutput.select("bordersegmentation-pane");
        $(".status.facetBorderSegmentation").addClass("active");

        await FacetBorderSegmenter.buildFacetBorderSegments(facetResult, settings.nrOfTimesToHalveBorderSegments, (progress) => {
            if (cancellationToken.isCancelled) {
                throw new Error("Cancelled");
            }

            // update status & image
            $("#statusFacetBorderSegmentation").css("width", Math.round(progress * 100) + "%");
            ctxBorderSegment.fillStyle = "white";
            ctxBorderSegment.fillRect(0, 0, cBorderSegment.width, cBorderSegment.height);
            for (const f of facetResult.facets) {
                if (f != null && progress > f.id / facetResult.facets.length) {
                    ctxBorderSegment.beginPath();
                    const path = f.getFullPathFromBorderSegments(false);
                    ctxBorderSegment.moveTo(path[0].x, path[0].y);
                    for (let i: number = 1; i < path.length; i++) {
                        ctxBorderSegment.lineTo(path[i].x, path[i].y);
                    }
                    ctxBorderSegment.stroke();
                }
            }
        });
        $(".status").removeClass("active");
        $(".status.facetBorderSegmentation").addClass("complete");
        timeEnd("Facet border segmentation");
        return cBorderSegment;
    }

    private static async processFacetLabelPlacement(facetResult: FacetResult, cBorderSegment: HTMLCanvasElement, tabsOutput: M.Tabs, cancellationToken: CancellationToken) {
        time("Facet label placement");
        const cLabelPlacement = document.getElementById("cLabelPlacement") as HTMLCanvasElement;
        cLabelPlacement.width = facetResult.width;
        cLabelPlacement.height = facetResult.height;
        const ctxLabelPlacement = cLabelPlacement.getContext("2d")!;
        ctxLabelPlacement.fillStyle = "white";
        ctxLabelPlacement.fillRect(0, 0, cBorderSegment.width, cBorderSegment.height);
        ctxLabelPlacement.drawImage(cBorderSegment, 0, 0);
        tabsOutput.select("labelplacement-pane");
        $(".status.facetLabelPlacement").addClass("active");
        await FacetLabelPlacer.buildFacetLabelBounds(facetResult, (progress) => {
            if (cancellationToken.isCancelled) {
                throw new Error("Cancelled");
            }

            // update status & image
            $("#statusFacetLabelPlacement").css("width", Math.round(progress * 100) + "%");
            for (const f of facetResult.facets) {
                if (f != null && f.labelBounds != null) {
                    ctxLabelPlacement.fillStyle = "red";
                    ctxLabelPlacement.fillRect(f.labelBounds.minX, f.labelBounds.minY, f.labelBounds.width, f.labelBounds.height);
                }
            }
        });
        $(".status").removeClass("active");
        $(".status.facetLabelPlacement").addClass("complete");
        timeEnd("Facet label placement");
    }

    /**
     *  Creates a vector based SVG image of the facets with the given configuration
     */
    public static async createSVG(facetResult: FacetResult, colorsByIndex: RGB[], sizeMultiplier: number, fill: boolean, stroke: boolean, addColorLabels: boolean, fontSize: number = 50, fontColor: string = "black", onUpdate: ((progress: number) => void) | null = null) {
        const xmlns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(xmlns, "svg");
        svg.setAttribute("width", sizeMultiplier * facetResult.width + "");
        svg.setAttribute("height", sizeMultiplier * facetResult.height + "");

        let count = 0;
        for (const f of facetResult.facets) {

            if (f != null && f.borderSegments.length > 0) {
                let newpath: Point[] = [];
                const useSegments = true;
                if (useSegments) {
                    newpath = f.getFullPathFromBorderSegments(false);
                    // shift from wall coordinates to pixel centers
                    /*for (const p of newpath) {
                        p.x+=0.5;
                        p.y+=0.5;
                    }*/
                } else {
                    for (let i: number = 0; i < f.borderPath.length; i++) {
                        newpath.push(new Point(f.borderPath[i].getWallX() + 0.5, f.borderPath[i].getWallY() + 0.5));
                    }
                }
                if (newpath[0].x !== newpath[newpath.length - 1].x || newpath[0].y !== newpath[newpath.length - 1].y) {
                    newpath.push(newpath[0]);
                } // close loop if necessary

                // Create a path in SVG's namespace
                // using quadratic curve absolute positions
                const svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                let data = "M ";
                data += newpath[0].x * sizeMultiplier + " " + newpath[0].y * sizeMultiplier + " ";
                for (let i: number = 1; i < newpath.length; i++) {
                    const midpointX = (newpath[i].x + newpath[i - 1].x) / 2;
                    const midpointY = (newpath[i].y + newpath[i - 1].y) / 2;
                    data += "Q " + (midpointX * sizeMultiplier) + " " + (midpointY * sizeMultiplier) + " " + (newpath[i].x * sizeMultiplier) + " " + (newpath[i].y * sizeMultiplier) + " ";
                    // data += "L " + (newpath[i].x * sizeMultiplier) + " " + (newpath[i].y * sizeMultiplier) + " ";
                }
                data += "Z";

                svgPath.setAttribute("data-facetId", f.id + "");
                // Set path's data
                svgPath.setAttribute("d", data);

                if (stroke) {
                    svgPath.style.stroke = "#000";
                } else {
                    // make the border the same color as the fill color if there is no border stroke
                    // to not have gaps in between facets
                    if (fill) {
                        svgPath.style.stroke = `rgb(${colorsByIndex[f.color][0]},${colorsByIndex[f.color][1]},${colorsByIndex[f.color][2]})`;
                    }
                }
                svgPath.style.strokeWidth = "1px"; // Set stroke width

                if (fill) {
                    svgPath.style.fill = `rgb(${colorsByIndex[f.color][0]},${colorsByIndex[f.color][1]},${colorsByIndex[f.color][2]})`;
                } else {
                    svgPath.style.fill = "none";
                }

                svg.appendChild(svgPath);

                /*  for (const seg of f.borderSegments) {
                      const svgSegPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                      let segData = "M ";
                      const segPoints = seg.originalSegment.points;
                      segData += segPoints[0].x * sizeMultiplier + " " + segPoints[0].y * sizeMultiplier + " ";
                      for (let i: number = 1; i < segPoints.length; i++) {
                          const midpointX = (segPoints[i].x + segPoints[i - 1].x) / 2;
                          const midpointY = (segPoints[i].y + segPoints[i - 1].y) / 2;
                          //data += "Q " + (midpointX * sizeMultiplier) + " " + (midpointY * sizeMultiplier) + " " + (newpath[i].x * sizeMultiplier) + " " + (newpath[i].y * sizeMultiplier) + " ";
                          segData += "L " + (segPoints[i].x * sizeMultiplier) + " " + (segPoints[i].y * sizeMultiplier) + " ";
                      }

                      console.log("Facet " + f.id + ", segment " + segPoints[0].x + "," + segPoints[0].y + " -> " + segPoints[segPoints.length-1].x + "," +  segPoints[segPoints.length-1].y);

                      svgSegPath.setAttribute("data-segmentFacet", f.id + "");
                      // Set path's data
                      svgSegPath.setAttribute("d", segData);
                      svgSegPath.style.stroke = "#FF0";
                      svgSegPath.style.fill = "none";
                      svg.appendChild(svgSegPath);
                  }
                  */

                // add the color labels if necessary. I mean, this is the whole idea behind the paint by numbers part
                // so I don't know why you would hide them
                if (addColorLabels) {
                    const txt = document.createElementNS(xmlns, "text");
                    txt.setAttribute("font-family", "Tahoma");
                    const nrOfDigits = (f.color + "").length;
                    txt.setAttribute("font-size", (fontSize / nrOfDigits) + "");
                    txt.setAttribute("dominant-baseline", "middle");
                    txt.setAttribute("text-anchor", "middle");
                    txt.setAttribute("fill", fontColor);

                    txt.textContent = f.color + "";

                    const subsvg = document.createElementNS(xmlns, "svg");
                    subsvg.setAttribute("width", f.labelBounds.width * sizeMultiplier + "");
                    subsvg.setAttribute("height", f.labelBounds.height * sizeMultiplier + "");
                    subsvg.setAttribute("overflow", "visible");
                    subsvg.setAttribute("viewBox", "-50 -50 100 100");
                    subsvg.setAttribute("preserveAspectRatio", "xMidYMid meet");

                    subsvg.appendChild(txt);

                    const g = document.createElementNS(xmlns, "g");
                    g.setAttribute("class", "label");
                    g.setAttribute("transform", "translate(" + f.labelBounds.minX * sizeMultiplier + "," + f.labelBounds.minY * sizeMultiplier + ")");
                    g.appendChild(subsvg);
                    svg.appendChild(g);
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

        return svg;
    }
}
