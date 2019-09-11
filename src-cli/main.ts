import * as canvas from "canvas";
import * as fs from "fs";
import * as minimist from "minimist";
import * as path from "path";
import * as process from "process";
import { ColorReducer } from "../src/colorreductionmanagement";
import { RGB } from "../src/common";
import { FacetBorderSegmenter } from "../src/facetBorderSegmenter";
import { FacetBorderTracer } from "../src/facetBorderTracer";
import { FacetCreator } from "../src/facetCreator";
import { FacetLabelPlacer } from "../src/facetLabelPlacer";
import { FacetResult } from "../src/facetmanagement";
import { FacetReducer } from "../src/facetReducer";
import { Settings } from "../src/settings";
import { Point } from "../src/structs/point";
const svg2img = require("svg2img");

class CLISettingsOutputProfile {
    public name: string = "";
    public svgShowLabels: boolean = true;
    public svgFillFacets: boolean = true;
    public svgShowBorders: boolean = true;
    public svgSizeMultiplier: number = 3;

    public svgFontSize: number = 60;
    public svgFontColor: string = "black";

    public filetype: "svg" | "png" | "jpg" = "svg";
    public filetypeQuality: number = 95;
}

class CLISettings extends Settings {

    public outputProfiles: CLISettingsOutputProfile[] = [];

}

async function main() {
    const args = minimist(process.argv.slice(2));
    const imagePath = args.i;
    const svgPath = args.o;

    if (typeof imagePath === "undefined" || typeof svgPath === "undefined") {
        console.log("Usage: exe -i <input_image> -o <output_svg> [-c <settings_json>]");
        process.exit(1);
    }

    let configPath = args.c;
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

    let facetResult = new FacetResult();
    if (typeof settings.narrowPixelStripCleanupRuns === "undefined" || settings.narrowPixelStripCleanupRuns === 0) {
        console.log("Creating facets");
        facetResult = await FacetCreator.getFacets(imgData.width, imgData.height, colormapResult.imgColorIndices, (progress) => {
            // progress
        });

        console.log("Reducing facets");
        await FacetReducer.reduceFacets(settings.removeFacetsSmallerThanNrOfPoints, settings.removeFacetsFromLargeToSmall, settings.maximumNumberOfFacets, colormapResult.colorsByIndex, facetResult, colormapResult.imgColorIndices, (progress) => {
            // progress
        });
    } else {
        for (let run = 0; run < settings.narrowPixelStripCleanupRuns; run++) {
            console.log("Removing narrow pixels run #" + (run + 1));
            // clean up narrow pixel strips
            await ColorReducer.processNarrowPixelStripCleanup(colormapResult);

            console.log("Creating facets");
            facetResult = await FacetCreator.getFacets(imgData.width, imgData.height, colormapResult.imgColorIndices, (progress) => {
                // progress
            });

            console.log("Reducing facets");
            await FacetReducer.reduceFacets(settings.removeFacetsSmallerThanNrOfPoints, settings.removeFacetsFromLargeToSmall, settings.maximumNumberOfFacets, colormapResult.colorsByIndex, facetResult, colormapResult.imgColorIndices, (progress) => {
                // progress
            });

            // the colormapResult.imgColorIndices get updated as the facets are reduced, so just do a few runs of pixel cleanup
        }
    }

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

    for (const profile of settings.outputProfiles) {
        console.log("Generating output for " + profile.name);

        if (typeof profile.filetype === "undefined") {
            profile.filetype = "svg";
        }

        const svgProfilePath = path.join(path.dirname(svgPath), path.basename(svgPath).substr(0, path.basename(svgPath).length - path.extname(svgPath).length) + "-" + profile.name) + "." + profile.filetype;
        const svgString = await createSVG(facetResult, colormapResult.colorsByIndex, profile.svgSizeMultiplier, profile.svgFillFacets, profile.svgShowBorders, profile.svgShowLabels, profile.svgFontSize, profile.svgFontColor);

        if (profile.filetype === "svg") {
            fs.writeFileSync(svgProfilePath, svgString);
        } else if (profile.filetype === "png") {

            const imageBuffer = await new Promise<Buffer>((then, reject) => {
                svg2img(svgString, function (error: Error, buffer: Buffer) {
                    if (error) {
                        reject(error);
                    } else {
                        then(buffer);
                    }
                });
            });
            fs.writeFileSync(svgProfilePath, imageBuffer);
        } else if (profile.filetype === "jpg") {
            const imageBuffer = await new Promise<Buffer>((then, reject) => {
                svg2img(svgString, { format: "jpg", quality: profile.filetypeQuality }, function (error: Error, buffer: Buffer) {
                    if (error) {
                        reject(error);
                    } else {
                        then(buffer);
                    }
                });
            });
            fs.writeFileSync(svgProfilePath, imageBuffer);
        }
    }

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

    const colorAliasesByColor: { [key: string]: string } = {};
    for (const alias of Object.keys(settings.colorAliases)) {
        colorAliasesByColor[settings.colorAliases[alias].join(",")] = alias;
    }

    const totalFrequency = colorFrequency.reduce((sum, val) => sum + val);

    const paletteInfo = JSON.stringify(colormapResult.colorsByIndex.map((color, index) => {
        return {
            areaPercentage: colorFrequency[index] / totalFrequency,
            color,
            colorAlias: colorAliasesByColor[color.join(",")],
            frequency: colorFrequency[index],
            index,
        };
    }), null, 2);

    fs.writeFileSync(palettePath, paletteInfo);
}

async function createSVG(facetResult: FacetResult, colorsByIndex: RGB[], sizeMultiplier: number, fill: boolean, stroke: boolean, addColorLabels: boolean, fontSize: number = 60, fontColor: string = "black", onUpdate: ((progress: number) => void) | null = null) {

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
                newpath = f.getFullPathFromBorderSegments(false);
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
                svgPathString += `stroke: ${svgStroke}; stroke-width:1px`;
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

                //     const svgLabelString = `<g class="label" transform="translate(${labelOffsetX},${labelOffsetY})">
                //     <svg width="${labelWidth}" height="${labelHeight}" overflow="visible" viewBox="-50 -50 100 100" preserveAspectRatio="xMidYMid meet">
                //         <rect xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="rgb(255,255,255,0.5)" x="-50" y="-50"/>
                //         <text font-family="Tahoma" font-size="60" dominant-baseline="middle" text-anchor="middle">${f.color}</text>
                //     </svg>
                //    </g>`;

                const nrOfDigits = (f.color + "").length;
                const svgLabelString = `<g class="label" transform="translate(${labelOffsetX},${labelOffsetY})">
                                        <svg width="${labelWidth}" height="${labelHeight}" overflow="visible" viewBox="-50 -50 100 100" preserveAspectRatio="xMidYMid meet">
                                            <text font-family="Tahoma" font-size="${(fontSize / nrOfDigits)}" dominant-baseline="middle" text-anchor="middle" fill="${fontColor}">${f.color}</text>
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
