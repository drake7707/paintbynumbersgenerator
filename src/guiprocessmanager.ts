/**
 * Module that manages the GUI when processing
 */

import { Settings, ClusteringColorSpace } from "./settings";
import { CancellationToken, IMap, RGB, delay } from "./common";
import { Uint8Array2D } from "./structs/typedarrays";
import { FacetCreator, FacetResult, FacetReducer, FacetBorderTracer, FacetBorderSegmenter, FacetLabelPlacer } from "./facetmanagement";
import { timeEnd, time } from "./gui";
import { Point } from "./structs/point";
import { Vector, KMeans } from "./lib/clustering";
import { rgb2lab, rgbToHsl, hslToRgb, lab2rgb } from "./lib/colorconversion";
import { ColorReducer, ColorMapResult } from "./colorreductionmanagement";


export class ProcessResult {
    facetResult!: FacetResult;
    colorsByIndex!: RGB[];
}

/**
 *  Manages the GUI states & processes the image step by step
 */
export class GUIProcessManager {

    static async process(settings: Settings, cancellationToken: CancellationToken): Promise<ProcessResult> {
        let c = <HTMLCanvasElement>document.getElementById("canvas");
        let ctx = c.getContext("2d")!;
        let imgData = ctx.getImageData(0, 0, c.width, c.height);

        if (settings.resizeImageIfTooLarge && (c.width > settings.resizeImageWidth || c.height > settings.resizeImageHeight)) {
            let width = c.width;
            let height = c.height;
            if (width > settings.resizeImageWidth) {
                let newWidth = settings.resizeImageWidth;
                let newHeight = c.height / c.width * settings.resizeImageWidth;
                width = newWidth;
                height = newHeight;
            }
            if (height > settings.resizeImageHeight) {
                let newHeight = settings.resizeImageHeight;
                let newWidth = width / height * newHeight;
                width = newWidth;
                height = newHeight;
            }

            let tempCanvas = document.createElement("canvas");
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

        let tabsOutput = M.Tabs.getInstance(document.getElementById("tabsOutput")!);

        // k-means clustering
        let kmeansImgData = await GUIProcessManager.processKmeansClustering(imgData, tabsOutput, ctx, settings, cancellationToken);

        // build color map
        let colormapResult = ColorReducer.createColorMap(kmeansImgData);

        // facet building
        let facetResult = await GUIProcessManager.processFacetBuilding(imgData, colormapResult, cancellationToken);

        // facet reduction
        await GUIProcessManager.processFacetReduction(facetResult, tabsOutput, settings, colormapResult, cancellationToken);

        // facet border tracing
        await GUIProcessManager.processFacetBorderTracing(tabsOutput, facetResult, cancellationToken);

        // facet border segmentation
        let cBorderSegment = await GUIProcessManager.processFacetBorderSegmentation(facetResult, tabsOutput, settings, cancellationToken);

        // facet label placement
        await GUIProcessManager.processFacetLabelPlacement(facetResult, cBorderSegment, tabsOutput, cancellationToken);

        // everything is now ready to generate the SVG, return the result
        let processResult = new ProcessResult();
        processResult.facetResult = facetResult;
        processResult.colorsByIndex = colormapResult.colorsByIndex;
        return processResult;
    }

    private static async processKmeansClustering(imgData: ImageData, tabsOutput: M.Tabs, ctx: CanvasRenderingContext2D,
        settings: Settings, cancellationToken: CancellationToken) {
        time("K-means clustering");
        let cKmeans = <HTMLCanvasElement>document.getElementById("cKMeans");
        cKmeans.width = imgData.width;
        cKmeans.height = imgData.height;
        let ctxKmeans = cKmeans.getContext("2d")!;
        ctxKmeans.fillStyle = "white";
        ctxKmeans.fillRect(0, 0, cKmeans.width, cKmeans.height);
        let kmeansImgData = ctxKmeans.getImageData(0, 0, cKmeans.width, cKmeans.height);
        tabsOutput.select("kmeans-pane");
        $(".status.kMeans").addClass("active");
        await ColorReducer.applyKMeansClustering(imgData, kmeansImgData, ctx, settings, (kmeans) => {
            let progress = (100 - (kmeans.currentDeltaDistanceDifference > 100 ? 100 : kmeans.currentDeltaDistanceDifference)) / 100;
            $("#statusKMeans").css("width", Math.round(progress * 100) + "%");
            ctxKmeans.putImageData(kmeansImgData, 0, 0);
            console.log(kmeans.currentDeltaDistanceDifference);
            if (cancellationToken.isCancelled)
                throw new Error("Cancelled");
        });
        $(".status").removeClass("active");
        $(".status.kMeans").addClass("complete");
        timeEnd("K-means clustering");
        return kmeansImgData;
    }

  

    private static async  processFacetBuilding(imgData: ImageData, colormapResult: ColorMapResult, cancellationToken: CancellationToken) {
        time("Facet building");
        $(".status.facetBuilding").addClass("active");
        let facetResult = await FacetCreator.getFacets(imgData.width, imgData.height, colormapResult.imgColorIndices, progress => {
            if (cancellationToken.isCancelled)
                throw new Error("Cancelled");
            $("#statusFacetBuilding").css("width", Math.round(progress * 100) + "%");
        });
        $(".status").removeClass("active");
        $(".status.facetBuilding").addClass("complete");
        timeEnd("Facet building");
        return facetResult;
    }

    private static async processFacetReduction(facetResult: FacetResult, tabsOutput: M.Tabs, settings: Settings, colormapResult: ColorMapResult, cancellationToken: CancellationToken) {
        time("Facet reduction");
        let cReduction = <HTMLCanvasElement>document.getElementById("cReduction");
        cReduction.width = facetResult.width;
        cReduction.height = facetResult.height;
        let ctxReduction = cReduction.getContext("2d")!;
        ctxReduction.fillStyle = "white";
        ctxReduction.fillRect(0, 0, cReduction.width, cReduction.height);
        let reductionImgData = ctxReduction.getImageData(0, 0, cReduction.width, cReduction.height);
        tabsOutput.select("reduction-pane");
        $(".status.facetReduction").addClass("active");
        await FacetReducer.reduceFacets(settings.removeFacetsSmallerThanNrOfPoints, settings.removeFacetsFromLargeToSmall, colormapResult.colorsByIndex, facetResult, colormapResult.imgColorIndices, progress => {
            if (cancellationToken.isCancelled)
                throw new Error("Cancelled");
            // update status & image                
            $("#statusFacetReduction").css("width", Math.round(progress * 100) + "%");
            let idx = 0;
            for (let j: number = 0; j < facetResult.height; j++) {
                for (let i: number = 0; i < facetResult.width; i++) {
                    let facet = facetResult.facets[facetResult.facetMap.get(i, j)];
                    let rgb = colormapResult.colorsByIndex[facet!.color];
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
        let cBorderPath = <HTMLCanvasElement>document.getElementById("cBorderPath");
        cBorderPath.width = facetResult.width;
        cBorderPath.height = facetResult.height;
        let ctxBorderPath = cBorderPath.getContext("2d")!;
        $(".status.facetBorderPath").addClass("active");
        await FacetBorderTracer.buildFacetBorderPaths(facetResult, progress => {
            if (cancellationToken.isCancelled)
                throw new Error("Cancelled");
            // update status & image
            $("#statusFacetBorderPath").css("width", Math.round(progress * 100) + "%");
            ctxBorderPath.fillStyle = "white";
            ctxBorderPath.fillRect(0, 0, cBorderPath.width, cBorderPath.height);
            for (let f of facetResult.facets) {
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
        let cBorderSegment = <HTMLCanvasElement>document.getElementById("cBorderSegmentation");
        cBorderSegment.width = facetResult.width;
        cBorderSegment.height = facetResult.height;
        let ctxBorderSegment = cBorderSegment.getContext("2d")!;
        tabsOutput.select("bordersegmentation-pane");
        $(".status.facetBorderSegmentation").addClass("active");

        await FacetBorderSegmenter.buildFacetBorderSegments(facetResult, settings.nrOfTimesToHalveBorderSegments, progress => {
            if (cancellationToken.isCancelled)
                throw new Error("Cancelled");

            // update status & image
            $("#statusFacetBorderSegmentation").css("width", Math.round(progress * 100) + "%");
            ctxBorderSegment.fillStyle = "white";
            ctxBorderSegment.fillRect(0, 0, cBorderSegment.width, cBorderSegment.height);
            for (let f of facetResult.facets) {
                if (f != null && progress > f.id / facetResult.facets.length) {
                    ctxBorderSegment.beginPath();
                    let path = f.getFullPathFromBorderSegments();
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
        let cLabelPlacement = <HTMLCanvasElement>document.getElementById("cLabelPlacement");
        cLabelPlacement.width = facetResult.width;
        cLabelPlacement.height = facetResult.height;
        let ctxLabelPlacement = cLabelPlacement.getContext("2d")!;
        ctxLabelPlacement.fillStyle = "white";
        ctxLabelPlacement.fillRect(0, 0, cBorderSegment.width, cBorderSegment.height);
        ctxLabelPlacement.drawImage(cBorderSegment, 0, 0);
        tabsOutput.select("labelplacement-pane");
        $(".status.facetLabelPlacement").addClass("active");
        await FacetLabelPlacer.buildFacetLabelBounds(facetResult, progress => {
            if (cancellationToken.isCancelled)
                throw new Error("Cancelled");

            // update status & image
            $("#statusFacetLabelPlacement").css("width", Math.round(progress * 100) + "%");
            for (let f of facetResult.facets) {
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
    static async createSVG(facetResult: FacetResult, colorsByIndex: RGB[], sizeMultiplier: number, fill: boolean, stroke: boolean, addColorLabels: boolean, fontSize: number = 6, onUpdate: ((progress: number) => void) | null = null) {
        var xmlns = "http://www.w3.org/2000/svg";
        let svg = document.createElementNS(xmlns, "svg");
        svg.setAttribute("width", sizeMultiplier * facetResult.width + "");
        svg.setAttribute("height", sizeMultiplier * facetResult.height + "");

        let count = 0;
        for (let f of facetResult.facets) {

            if (f != null && f.borderSegments.length > 0) {
                let newpath: Point[] = [];
                let useSegments = true;
                if (useSegments) {
                    newpath = f.getFullPathFromBorderSegments();
                }
                else {
                    for (let i: number = 0; i < f.borderPath.length; i++) {
                        newpath.push(new Point(f.borderPath[i].getWallX(), f.borderPath[i].getWallY()));
                    }
                }
                if (newpath[0].x != newpath[newpath.length - 1].x || newpath[0].y != newpath[newpath.length - 1].y)
                    newpath.push(newpath[0]); //close loop if necessary

                //Create a path in SVG's namespace
                // using quadratic curve absolute positions
                let svgPath = document.createElementNS("http://www.w3.org/2000/svg", 'path');
                let data = "M ";
                data += newpath[0].x * sizeMultiplier + " " + newpath[0].y * sizeMultiplier + " ";
                for (let i: number = 1; i < newpath.length; i++) {
                    let midpointX = (newpath[i].x + newpath[i - 1].x) / 2;
                    let midpointY = (newpath[i].y + newpath[i - 1].y) / 2;
                    data += "Q " + (midpointX * sizeMultiplier) + " " + (midpointY * sizeMultiplier) + " " + (newpath[i].x * sizeMultiplier) + " " + (newpath[i].y * sizeMultiplier) + " ";
                }

                svgPath.setAttribute("data-facetId", f.id + "");
                //Set path's data
                svgPath.setAttribute("d", data);

                if (stroke)
                    svgPath.style.stroke = "#000";
                else {
                    // make the border the same color as the fill color if there is no border stroke
                    // to not have gaps in between facets
                    if (fill)
                        svgPath.style.stroke = `rgb(${colorsByIndex[f.color][0]},${colorsByIndex[f.color][1]},${colorsByIndex[f.color][2]})`;
                }
                svgPath.style.strokeWidth = "1px"; //Set stroke width

                if (fill)
                    svgPath.style.fill = `rgb(${colorsByIndex[f.color][0]},${colorsByIndex[f.color][1]},${colorsByIndex[f.color][2]})`;
                else
                    svgPath.style.fill = "none";

                svg.appendChild(svgPath);

                // add the color labels if necessary. I mean, this is the whole idea behind the paint by numbers part
                // so I don't know why you would hide them
                if (addColorLabels) {
                    let txt = document.createElementNS(xmlns, "text");
                    txt.setAttribute("x", "50%");
                    txt.setAttribute("y", "50%");
                    txt.setAttribute("alignment-baseline", "middle");
                    txt.setAttribute("text-anchor", "middle");
                    txt.setAttribute("font-family", "Tahoma");
                    txt.setAttribute("font-size", fontSize + "");

                    txt.textContent = f.color + "";

                    let subsvg = document.createElementNS(xmlns, "svg");
                    subsvg.setAttribute("width", f.labelBounds.width * sizeMultiplier + "");
                    subsvg.setAttribute("height", f.labelBounds.height * sizeMultiplier + "");
                    subsvg.setAttribute("overflow", "visible");
                    subsvg.appendChild(txt);

                    let g = document.createElementNS(xmlns, "g");
                    g.setAttribute("class", "label");
                    g.setAttribute("transform", "translate(" + f.labelBounds.minX * sizeMultiplier + "," + f.labelBounds.minY * sizeMultiplier + ")");
                    g.appendChild(subsvg);
                    svg.appendChild(g);
                }

                if (count % 100 == 0) {
                    await delay(0);
                    if (onUpdate != null)
                        onUpdate(f.id / facetResult.facets.length);
                }
            }

            count++;
        }

        if (onUpdate != null)
            onUpdate(1);

        return svg;
    }
}