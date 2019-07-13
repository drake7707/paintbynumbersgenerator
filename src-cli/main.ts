import * as canvas from "canvas";
import * as minimist from "minimist";
import * as process from "process";
import * as path from "path";
import * as fs from "fs";
import { ColorReducer } from "../src/colorreductionmanagement";
import { RGB } from "../src/common";
import { FacetBorderSegmenter, FacetBorderTracer, FacetCreator, FacetLabelPlacer, FacetReducer, FacetResult } from "../src/facetmanagement";
import { Settings } from "../src/settings";
import { Point } from "../src/structs/point";

class CLISettings extends Settings {
    public svgSizeMultiplier: number = 3;
    public svgShowLabels: boolean = true;
    public svgFillFacets: boolean = true;
    public svgShowBorders: boolean = true;
    public svgFontSize: number = 6;
}

async function main() {
    const args = minimist(process.argv.slice(2));
    const imagePath = args["i"];
    const svgPath = args["o"];

    if (typeof imagePath === "undefined" || typeof svgPath === "undefined") {
        console.log("Usage: exe -i <input_image> -o <output_svg> [-c <settings_json>]");
        process.exit(1);
    }

    let configPath = args["c"];
    if (typeof configPath === "undefined") {
        configPath = path.join(process.cwd(), "settings.json");
    } else {
        if (!path.isAbsolute(configPath)) {
            configPath = path.join(process.cwd(), configPath);
        }
    }

    const settings: CLISettings = require(configPath);

    const img = await canvas.loadImage(imagePath);
    const c = canvas.createCanvas(img.width, img.height);
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0, c.width, c.height);
    let imgData = ctx.getImageData(0, 0, c.width, c.height);

    // resize if required
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

        const tempCanvas = canvas.createCanvas(width, height);
        tempCanvas.width = width;
        tempCanvas.height = height;
        tempCanvas.getContext("2d")!.drawImage(c, 0, 0, width, height);
        c.width = width;
        c.height = height;
        ctx.drawImage(tempCanvas, 0, 0, width, height);
        imgData = ctx.getImageData(0, 0, c.width, c.height);

        console.log(`Resized image to ${width}x${height}`);
    }

    console.log("Running k-means clustering");
    const cKmeans = canvas.createCanvas(imgData.width, imgData.height);
    const ctxKmeans = cKmeans.getContext("2d")!;
    ctxKmeans.fillStyle = "white";
    ctxKmeans.fillRect(0, 0, cKmeans.width, cKmeans.height);

    const kmeansImgData = ctxKmeans.getImageData(0, 0, cKmeans.width, cKmeans.height);
    await ColorReducer.applyKMeansClustering(imgData, kmeansImgData, ctx, settings, (kmeans) => {
        const progress = (100 - (kmeans.currentDeltaDistanceDifference > 100 ? 100 : kmeans.currentDeltaDistanceDifference)) / 100;
        ctxKmeans.putImageData(kmeansImgData, 0, 0);
    });

    const colormapResult = ColorReducer.createColorMap(kmeansImgData);

    console.log("Creating facets");
    const facetResult = await FacetCreator.getFacets(imgData.width, imgData.height, colormapResult.imgColorIndices, (progress) => {
        // progress
    });

    console.log("Reducing facets");
    await FacetReducer.reduceFacets(settings.removeFacetsSmallerThanNrOfPoints, settings.removeFacetsFromLargeToSmall, colormapResult.colorsByIndex, facetResult, colormapResult.imgColorIndices, (progress) => {
        // progress
    });

    console.log("Build border paths");
    await FacetBorderTracer.buildFacetBorderPaths(facetResult, (progress) => {
        // progress
    });

    console.log("Build border path segments");
    await FacetBorderSegmenter.buildFacetBorderSegments(facetResult, settings.nrOfTimesToHalveBorderSegments, (progress) => {
        // progress
    });

    console.log("Determine label placement");
    await FacetLabelPlacer.buildFacetLabelBounds(facetResult, (progress) => {
        // progress
    });

    console.log("Generating svg");
    const svgString = await createSVG(facetResult, colormapResult.colorsByIndex, settings.svgSizeMultiplier, settings.svgFillFacets, settings.svgShowBorders, settings.svgShowLabels, settings.svgFontSize);

    fs.writeFileSync(svgPath, svgString);

    console.log("Generating palette info");
    const palettePath = path.join(path.dirname(svgPath), path.basename(svgPath).substr(0, path.basename(svgPath).length - path.extname(svgPath).length) + ".json");

    const colorFrequency: number[] = [];
    for (const color of colormapResult.colorsByIndex) {
        colorFrequency.push(0);
    }

    for (const facet of facetResult.facets) {
        if (facet !== null) {
            colorFrequency[facet.color] += facet.pointCount;
        }
    }

    const paletteInfo = JSON.stringify(colormapResult.colorsByIndex.map((color, index) => {
        return {
            index: index,
            color: color,
            frequency: colorFrequency[index]
        };
    }), null, 2);

    fs.writeFileSync(palettePath, paletteInfo);
}

async function createSVG(facetResult: FacetResult, colorsByIndex: RGB[], sizeMultiplier: number, fill: boolean, stroke: boolean, addColorLabels: boolean, fontSize: number = 6, onUpdate: ((progress: number) => void) | null = null) {

    let svgString = "";
    const xmlns = "http://www.w3.org/2000/svg";

    const svgWidth = sizeMultiplier * facetResult.width;
    const svgHeight = sizeMultiplier * facetResult.height;
    svgString += `<?xml version="1.0" standalone="no"?>
                  <svg width="${svgWidth}" height="${svgHeight}" xmlns="${xmlns}">`;

    for (const f of facetResult.facets) {

        if (f != null && f.borderSegments.length > 0) {
            let newpath: Point[] = [];
            const useSegments = true;
            if (useSegments) {
                newpath = f.getFullPathFromBorderSegments();
            } else {
                for (let i: number = 0; i < f.borderPath.length; i++) {
                    newpath.push(new Point(f.borderPath[i].getWallX(), f.borderPath[i].getWallY()));
                }
            }
            if (newpath[0].x !== newpath[newpath.length - 1].x || newpath[0].y !== newpath[newpath.length - 1].y) {
                newpath.push(newpath[0]);
            } // close loop if necessary

            // Create a path in SVG's namespace
            // using quadratic curve absolute positions

            let svgPathString = "";

            let data = "M ";
            data += newpath[0].x * sizeMultiplier + " " + newpath[0].y * sizeMultiplier + " ";
            for (let i: number = 1; i < newpath.length; i++) {
                const midpointX = (newpath[i].x + newpath[i - 1].x) / 2;
                const midpointY = (newpath[i].y + newpath[i - 1].y) / 2;
                data += "Q " + (midpointX * sizeMultiplier) + " " + (midpointY * sizeMultiplier) + " " + (newpath[i].x * sizeMultiplier) + " " + (newpath[i].y * sizeMultiplier) + " ";
            }

            let svgStroke = "";
            if (stroke) {
                svgStroke = "#000";
            } else {
                // make the border the same color as the fill color if there is no border stroke
                // to not have gaps in between facets
                if (fill) {
                    svgStroke = `rgb(${colorsByIndex[f.color][0]},${colorsByIndex[f.color][1]},${colorsByIndex[f.color][2]})`;
                }
            }

            let svgFill = "";
            if (fill) {
                svgFill = `rgb(${colorsByIndex[f.color][0]},${colorsByIndex[f.color][1]},${colorsByIndex[f.color][2]})`;
            } else {
                svgFill = "none";
            }

            svgPathString = `<path data-facetId="${f.id}" d="${data}" `;

            svgPathString += `style="`;
            svgPathString += `fill: ${svgFill};`;
            if (svgStroke !== "") {
                svgPathString += `stroke: ${svgStroke}; stroke-width=1px`;
            }
            svgPathString += `"`;

            svgPathString += `>`;

            svgPathString += `</path>`;

            svgString += svgPathString;

            // add the color labels if necessary. I mean, this is the whole idea behind the paint by numbers part
            // so I don't know why you would hide them
            if (addColorLabels) {

                const labelOffsetX = f.labelBounds.minX * sizeMultiplier;
                const labelOffsetY = f.labelBounds.minY * sizeMultiplier;
                const labelWidth = f.labelBounds.width * sizeMultiplier;
                const labelHeight = f.labelBounds.height * sizeMultiplier;

                const svgLabelString = `<g class="label" transform="translate(${labelOffsetX},${labelOffsetY})">
                                        <svg width="${labelWidth}" height="${labelHeight}" overflow="visible">
                                            <text x="50%" y="50%" alignment-baseline="middle" text-anchor="middle" font-family="Tahoma" font-size="${fontSize}">${f.color}</text>
                                        </svg>
                                       </g>`;

                svgString += svgLabelString;
            }
        }
    }

    svgString += `</svg>`;

    return svgString;
}

main().then(() => {
    console.log("Finished");
}).catch((err) => {
    console.error("Error: " + err.name + " " + err.message + " " + err.stack);
});
