import { downloadPalettePng, downloadPNG, downloadSVG, loadExample, process, updateOutput } from "./gui";
import { Clipboard } from "./lib/clipboard";

$(document).ready(function() {

    $(".tabs").tabs();
    $(".tooltipped").tooltip();

    const clip = new Clipboard("canvas", true);

    loadExample("imgSmall");

    $("#btnProcess").click(async function() {
        try {
            await process();
        } catch (err) {
            alert("Error: " + err);
        }
    });

    $("#chkShowLabels, #chkFillFacets, #chkShowBorders, #txtSizeMultiplier, #txtLabelFontSize").change(async () => {
        await updateOutput();
    });

    $("#btnDownloadSVG").click(function() {
        downloadSVG();
    });

    $("#btnDownloadPNG").click(function() {
        downloadPNG();
    });

    $("#btnDownloadPalettePNG").click(function() {
        downloadPalettePng();
    });

    $("#lnkTrivial").click(() => { loadExample("imgTrivial"); return false; });
    $("#lnkSmall").click(() => { loadExample("imgSmall"); return false; });
    $("#lnkMedium").click(() => { loadExample("imgMedium"); return false; });
});
