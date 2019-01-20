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
        (<any>$('#palette .color')).tooltip();
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

export function downloadPalettePng() {
    if(processResult == null) return;
    let colorsByIndex: RGB[] = processResult.colorsByIndex;

    let canvas = document.createElement("canvas");

    let nrOfItemsPerRow = 10;
    let nrRows = Math.ceil(colorsByIndex.length / nrOfItemsPerRow);
    let margin = 10;
    let cellWidth = 80;
    let cellHeight = 70;

    canvas.width = margin + nrOfItemsPerRow * (cellWidth + margin);
    canvas.height = margin + nrRows * (cellHeight + margin);
    let ctx = canvas.getContext("2d")!;
    ctx.translate(0.5,0.5);

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < colorsByIndex.length; i++) {
        let color = colorsByIndex[i];

        let x = margin + (i % nrOfItemsPerRow) * (cellWidth + margin);
        let y = margin + Math.floor(i / nrOfItemsPerRow) * (cellHeight + margin);

        ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        ctx.fillRect(x, y, cellWidth, cellHeight - 20);
        ctx.strokeStyle = "#888";
        ctx.strokeRect(x, y, cellWidth, cellHeight - 20);

        let nrText = i + "";
        ctx.fillStyle = "black";
        ctx.strokeStyle = "#CCC";
        ctx.font = "20px Tahoma";
        let nrTextSize = ctx.measureText(nrText);
        ctx.lineWidth = 2;
        ctx.strokeText(nrText, x + cellWidth / 2 - nrTextSize.width / 2, y + cellHeight /2 - 5);
        ctx.fillText(nrText, x + cellWidth / 2 - nrTextSize.width / 2, y + cellHeight /2 - 5);
        ctx.lineWidth = 1;


        ctx.font = "10px Tahoma";
        let rgbText = "RGB: " + Math.floor(color[0]) + "," + Math.floor(color[1]) + "," + Math.floor(color[2]);
        let rgbTextSize = ctx.measureText(rgbText);
        ctx.fillStyle = "black";
        ctx.fillText(rgbText, x + cellWidth / 2 - rgbTextSize.width / 2, y + cellHeight - 10);
    }

    let dataURL = canvas.toDataURL("image/png");
    var dl = document.createElement("a");
    document.body.appendChild(dl);
    dl.setAttribute("href", dataURL);
    dl.setAttribute("download", "palette.png");
    dl.click();
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
        let svgEl = <any>$("#svgContainer svg").get(0);

        svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        var svgData = svgEl.outerHTML;
        var preface = '<?xml version="1.0" standalone="no"?>\r\n';
        var svgBlob = new Blob([preface, svgData], {type:"image/svg+xml;charset=utf-8"});
        var svgUrl = URL.createObjectURL(svgBlob);
        var downloadLink = document.createElement("a");
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
    var img = <HTMLImageElement>document.getElementById(imgId);
    var c = <HTMLCanvasElement>document.getElementById("canvas");
    var ctx = c.getContext("2d")!;
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
}