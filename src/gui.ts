/**
 * Module that provides function the GUI uses and updates the DOM accordingly
 */

import { CancellationToken, IMap, RGB } from "./common";
import { GUIProcessManager, ProcessResult } from "./guiprocessmanager";
import { ClusteringColorSpace, Settings } from "./settings";

declare function saveSvgAsPng(el: Node, filename: string): void;

let processResult: ProcessResult | null = null;
let cancellationToken: CancellationToken = new CancellationToken();

const timers: IMap<Date> = {};
export function time(name: string) {
    console.time(name);
    timers[name] = new Date();
}

export function timeEnd(name: string) {
    console.timeEnd(name);
    const ms = new Date().getTime() - timers[name].getTime();
    log(name + ": " + ms + "ms");
    delete timers[name];
}

export function log(str: string) {
    $("#log").append("<br/><span>" + str + "</span>");
}

export function parseSettings(): Settings {
    const settings = new Settings();

    if ($("#optColorSpaceRGB").prop("checked")) {
        settings.kMeansClusteringColorSpace = ClusteringColorSpace.RGB;
    } else if ($("#optColorSpaceHSL").prop("checked")) {
        settings.kMeansClusteringColorSpace = ClusteringColorSpace.HSL;
    } else if ($("#optColorSpaceRGB").prop("checked")) {
        settings.kMeansClusteringColorSpace = ClusteringColorSpace.LAB;
    }

    if ($("#optFacetRemovalLargestToSmallest").prop("checked")) {
        settings.removeFacetsFromLargeToSmall = true;
    } else {
        settings.removeFacetsFromLargeToSmall = false;
    }

    settings.randomSeed = parseInt($("#txtRandomSeed").val() + "");
    settings.kMeansNrOfClusters = parseInt($("#txtNrOfClusters").val() + "");
    settings.kMeansMinDeltaDifference = parseFloat($("#txtClusterPrecision").val() + "");

    settings.removeFacetsSmallerThanNrOfPoints = parseInt($("#txtRemoveFacetsSmallerThan").val() + "");
    settings.maximumNumberOfFacets = parseInt($("#txtMaximumNumberOfFacets").val() + "");

    settings.nrOfTimesToHalveBorderSegments = parseInt($("#txtNrOfTimesToHalveBorderSegments").val() + "");

    settings.narrowPixelStripCleanupRuns = parseInt($("#txtNarrowPixelStripCleanupRuns").val() + "");

    settings.resizeImageIfTooLarge = $("#chkResizeImage").prop("checked");
    settings.resizeImageWidth = parseInt($("#txtResizeWidth").val() + "");
    settings.resizeImageHeight = parseInt($("#txtResizeHeight").val() + "");

    const restrictedColorLines = ($("#txtKMeansColorRestrictions").val() + "").split("\n");
    for (const line of restrictedColorLines) {
        const tline = line.trim();
        if (tline.indexOf("//") === 0) {
            // comment, skip
        } else {
            const rgbparts = tline.split(",");
            if (rgbparts.length === 3) {
                let red = parseInt(rgbparts[0]);
                let green = parseInt(rgbparts[1]);
                let blue = parseInt(rgbparts[2]);
                if (red < 0) red = 0;
                if (red > 255) red = 255;
                if (green < 0) green = 0;
                if (green > 255) green = 255;
                if (blue < 0) blue = 0;
                if (blue > 255) blue = 255;

                if (!isNaN(red) && !isNaN(green) && !isNaN(blue)) {
                    settings.kMeansColorRestrictions.push([red, green, blue]);
                }
            }
        }
    }

    return settings;
}

export async function process() {
    try {
        const settings: Settings = parseSettings();
        // cancel old process & create new
        cancellationToken.isCancelled = true;
        cancellationToken = new CancellationToken();
        processResult = await GUIProcessManager.process(settings, cancellationToken);
        await updateOutput();
        const tabsOutput = M.Tabs.getInstance(document.getElementById("tabsOutput")!);
        tabsOutput.select("output-pane");
    } catch (e) {
        log("Error: " + e.message + " at " + e.stack);
    }
}

export async function updateOutput() {

    if (processResult != null) {
        const showLabels = $("#chkShowLabels").prop("checked");
        const fill = $("#chkFillFacets").prop("checked");
        const stroke = $("#chkShowBorders").prop("checked");

        const sizeMultiplier = parseInt($("#txtSizeMultiplier").val() + "");
        const fontSize = parseInt($("#txtLabelFontSize").val() + "");

        const fontColor = $("#txtLabelFontColor").val() + "";

        $("#statusSVGGenerate").css("width", "0%");

        $(".status.SVGGenerate").removeClass("complete");
        $(".status.SVGGenerate").addClass("active");

        const svg = await GUIProcessManager.createSVG(processResult.facetResult, processResult.colorsByIndex, sizeMultiplier, fill, stroke, showLabels, fontSize, fontColor, (progress) => {
            if (cancellationToken.isCancelled) { throw new Error("Cancelled"); }
            $("#statusSVGGenerate").css("width", Math.round(progress * 100) + "%");
        });
        $("#svgContainer").empty().append(svg);
        $("#palette").empty().append(createPaletteHtml(processResult.colorsByIndex));
        ($("#palette .color") as any).tooltip();
        $(".status").removeClass("active");
        $(".status.SVGGenerate").addClass("complete");
    }
}

function createPaletteHtml(colorsByIndex: RGB[]) {
    let html = "";
    for (let c: number = 0; c < colorsByIndex.length; c++) {
        const style = "background-color: " + `rgb(${colorsByIndex[c][0]},${colorsByIndex[c][1]},${colorsByIndex[c][2]})`;
        html += `<div class="color" class="tooltipped" style="${style}" data-tooltip="${colorsByIndex[c][0]},${colorsByIndex[c][1]},${colorsByIndex[c][2]}">${c}</div>`;
    }
    return $(html);
}

export function downloadPalettePng() {
    if (processResult == null) { return; }
    const colorsByIndex: RGB[] = processResult.colorsByIndex;

    const canvas = document.createElement("canvas");

    const nrOfItemsPerRow = 10;
    const nrRows = Math.ceil(colorsByIndex.length / nrOfItemsPerRow);
    const margin = 10;
    const cellWidth = 80;
    const cellHeight = 70;

    canvas.width = margin + nrOfItemsPerRow * (cellWidth + margin);
    canvas.height = margin + nrRows * (cellHeight + margin);
    const ctx = canvas.getContext("2d")!;
    ctx.translate(0.5, 0.5);

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < colorsByIndex.length; i++) {
        const color = colorsByIndex[i];

        const x = margin + (i % nrOfItemsPerRow) * (cellWidth + margin);
        const y = margin + Math.floor(i / nrOfItemsPerRow) * (cellHeight + margin);

        ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        ctx.fillRect(x, y, cellWidth, cellHeight - 20);
        ctx.strokeStyle = "#888";
        ctx.strokeRect(x, y, cellWidth, cellHeight - 20);

        const nrText = i + "";
        ctx.fillStyle = "black";
        ctx.strokeStyle = "#CCC";
        ctx.font = "20px Tahoma";
        const nrTextSize = ctx.measureText(nrText);
        ctx.lineWidth = 2;
        ctx.strokeText(nrText, x + cellWidth / 2 - nrTextSize.width / 2, y + cellHeight / 2 - 5);
        ctx.fillText(nrText, x + cellWidth / 2 - nrTextSize.width / 2, y + cellHeight / 2 - 5);
        ctx.lineWidth = 1;

        ctx.font = "10px Tahoma";
        const rgbText = "RGB: " + Math.floor(color[0]) + "," + Math.floor(color[1]) + "," + Math.floor(color[2]);
        const rgbTextSize = ctx.measureText(rgbText);
        ctx.fillStyle = "black";
        ctx.fillText(rgbText, x + cellWidth / 2 - rgbTextSize.width / 2, y + cellHeight - 10);
    }

    const dataURL = canvas.toDataURL("image/png");
    const dl = document.createElement("a");
    document.body.appendChild(dl);
    dl.setAttribute("href", dataURL);
    dl.setAttribute("download", "palette.png");
    dl.click();
}

export function downloadPNG() {
    if ($("#svgContainer svg").length > 0) {
        saveSvgAsPng($("#svgContainer svg").get(0), "paintbynumbers.png");
    }
}

export function downloadSVG() {
    if ($("#svgContainer svg").length > 0) {
        const svgEl = $("#svgContainer svg").get(0) as any;

        svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        const svgData = svgEl.outerHTML;
        const preface = '<?xml version="1.0" standalone="no"?>\r\n';
        const svgBlob = new Blob([preface, svgData], { type: "image/svg+xml;charset=utf-8" });
        const svgUrl = URL.createObjectURL(svgBlob);
        const downloadLink = document.createElement("a");
        downloadLink.href = svgUrl;
        downloadLink.download = "paintbynumbers.svg";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        /*
        var svgAsXML = (new XMLSerializer).serializeToString(<any>$("#svgContainer svg").get(0));
        let dataURL = "data:image/svg+xml," + encodeURIComponent(svgAsXML);
        var dl = document.createElement("a");
        document.body.appendChild(dl);
        dl.setAttribute("href", dataURL);
        dl.setAttribute("download", "paintbynumbers.svg");
        dl.click();
        */
    }
}

export function loadExample(imgId: string) {
    // load image
    const img = document.getElementById(imgId) as HTMLImageElement;
    const c = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = c.getContext("2d")!;
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
}
