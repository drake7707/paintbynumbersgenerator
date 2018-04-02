/**
 * Module that provides function the GUI uses and updates the DOM accordingly
 */

import { IMap, CancellationToken, RGB } from "./common";
import { ProcessResult, GUIProcessManager } from "./guiprocessmanager";
import { ClusteringColorSpace, Settings } from "./settings";


declare function saveSvgAsPng(el: Node, filename: string): void;

let processResult: ProcessResult | null = null;
let cancellationToken: CancellationToken = new CancellationToken();


var timers: IMap<Date> = {};
export function time(name: string) {
    console.time(name);
    timers[name] = new Date();
}

export function timeEnd(name: string) {
    console.timeEnd(name);
    let ms = new Date().getTime() - timers[name].getTime();
    log(name + ": " + ms + "ms");
    delete timers[name];
}


export function log(str: string) {
    $("#log").append("<br/><span>" + str + "</span>");
}

export function parseSettings(): Settings {
    let settings = new Settings();

    if ($("#optColorSpaceRGB").prop("checked"))
        settings.kMeansClusteringColorSpace = ClusteringColorSpace.RGB;
    else if ($("#optColorSpaceHSL").prop("checked"))
        settings.kMeansClusteringColorSpace = ClusteringColorSpace.HSL;
    else if ($("#optColorSpaceRGB").prop("checked"))
        settings.kMeansClusteringColorSpace = ClusteringColorSpace.LAB;

    if ($("#optFacetRemovalLargestToSmallest").prop("checked"))
        settings.removeFacetsFromLargeToSmall = true;
    else
        settings.removeFacetsFromLargeToSmall = false;

    settings.kMeansNrOfClusters = parseInt($("#txtNrOfClusters").val() + "");
    settings.kMeansMinDeltaDifference = parseFloat($("#txtClusterPrecision").val() + "");

    settings.removeFacetsSmallerThanNrOfPoints = parseInt($("#txtRemoveFacetsSmallerThan").val() + "");

    settings.nrOfTimesToHalveBorderSegments = parseInt($("#txtNrOfTimesToHalveBorderSegments").val() + "");

    settings.resizeImageIfTooLarge = $("#chkResizeImage").prop("checked");
    settings.resizeImageWidth = parseInt($("#txtResizeWidth").val() + "");
    settings.resizeImageHeight = parseInt($("#txtResizeHeight").val() + "");

    return settings;
}

export async function process() {
    try {
        let settings: Settings = parseSettings();
        // cancel old process & create new
        cancellationToken.isCancelled = true;
        cancellationToken = new CancellationToken();
        processResult = await GUIProcessManager.process(settings, cancellationToken);
        await updateOutput();
        let tabsOutput = M.Tabs.getInstance(document.getElementById("tabsOutput")!);
        tabsOutput.select("output-pane");
    }
    catch (e) {
        log("Error: " + e.message + " at " + e.stack);
    }
}


export async function updateOutput() {

    if (processResult != null) {
        let showLabels = $("#chkShowLabels").prop("checked");
        let fill = $("#chkFillFacets").prop("checked");
        let stroke = $("#chkShowBorders").prop("checked");

        let sizeMultiplier = parseInt($("#txtSizeMultiplier").val() + "");
        let fontSize = parseInt($("#txtLabelFontSize").val() + "");

        $("#statusSVGGenerate").css("width", "0%");

        $(".status.SVGGenerate").removeClass("complete");
        $(".status.SVGGenerate").addClass("active");

        let svg = await GUIProcessManager.createSVG(processResult.facetResult, processResult.colorsByIndex, sizeMultiplier, fill, stroke, showLabels, fontSize, progress => {
            if (cancellationToken.isCancelled) throw new Error("Cancelled");
            $("#statusSVGGenerate").css("width", Math.round(progress * 100) + "%");
        });
        $("#svgContainer").empty().append(svg);
        $("#palette").empty().append(createPaletteHtml(processResult.colorsByIndex));
        $('#palette .color').tooltip();
        $(".status").removeClass("active");
        $(".status.SVGGenerate").addClass("complete");
    }
}

function createPaletteHtml(colorsByIndex: RGB[]) {
    let html = "";
    for (let c: number = 0; c < colorsByIndex.length; c++) {
        let style = "background-color: " + `rgb(${colorsByIndex[c][0]},${colorsByIndex[c][1]},${colorsByIndex[c][2]})`;
        html += `<div class="color" class="tooltipped" style="${style}" data-tooltip="${colorsByIndex[c][0]},${colorsByIndex[c][1]},${colorsByIndex[c][2]}">${c}</div>`;
    }
    return $(html);
}

export function downloadPNG() {
    if ($("#svgContainer svg").length > 0) {
        let svg = <any>$("#svgContainer svg").get(0);
        var svgAsXML = (new XMLSerializer).serializeToString(<any>svg);
        saveSvgAsPng($("#svgContainer svg").get(0), "paintbynumbers.png");
    }
}

export function downloadSVG() {
    if ($("#svgContainer svg").length > 0) {
        var svgAsXML = (new XMLSerializer).serializeToString(<any>$("#svgContainer svg").get(0));
        let dataURL = "data:image/svg+xml," + encodeURIComponent(svgAsXML);
        var dl = document.createElement("a");
        document.body.appendChild(dl);
        dl.setAttribute("href", dataURL);
        dl.setAttribute("download", "paintbynumbers.svg");
        dl.click();
    }
}

export function loadExample(imgId: string) {
    // load image
    var img = <HTMLImageElement>document.getElementById(imgId);
    var c = <HTMLCanvasElement>document.getElementById("canvas");
    var ctx = c.getContext("2d")!;
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
}