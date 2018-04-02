import { Clipboard } from "./lib/clipboard";
import { loadExample, process, updateOutput, downloadSVG, downloadPNG, downloadPalettePng } from "./gui";
import { rgbToHsl, hslToRgb } from "./lib/colorconversion";
import { RGB } from "./common";

window.onload = () => {

    $('.tabs').tabs();
    $('.tooltipped').tooltip();

    var clip = new Clipboard("canvas", true);

    loadExample("imgSmall");

    $("#btnProcess").click(async function () {
        await process();
    });

    $("#chkShowLabels, #chkFillFacets, #chkShowBorders, #txtSizeMultiplier, #txtLabelFontSize").change(async () => {
        await updateOutput();
    });

    $("#btnDownloadSVG").click(function () {
        downloadSVG();
    });

    $("#btnDownloadPNG").click(function () {
        downloadPNG();
    });

    $("#btnDownloadPalettePNG").click(function () {
        downloadPalettePng();
    });

    $("#lnkTrivial").click(() => { loadExample("imgTrivial"); return false; });
    $("#lnkSmall").click(() => { loadExample("imgSmall"); return false; });
    $("#lnkMedium").click(() => { loadExample("imgMedium"); return false; });
};