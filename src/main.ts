import { Clipboard } from "./lib/clipboard";
import { loadExample, process, updateOutput, downloadSVG, downloadPNG } from "./gui";

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

    $("#lnkTrivial").click(() => { loadExample("imgTrivial"); return false; });
    $("#lnkSmall").click(() => { loadExample("imgSmall"); return false; });
    $("#lnkMedium").click(() => { loadExample("imgMedium"); return false; });
};