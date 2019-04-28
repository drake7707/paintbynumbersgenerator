/**
 * Color reduction management of the process: clustering to reduce colors & creating color map
 */
import { delay, IMap, RGB } from "./common";
import { KMeans, Vector } from "./lib/clustering";
import { hslToRgb, lab2rgb, rgb2lab, rgbToHsl } from "./lib/colorconversion";
import { ClusteringColorSpace, Settings } from "./settings";
import { Uint8Array2D } from "./structs/typedarrays";

export class ColorMapResult {
    public imgColorIndices!: Uint8Array2D;
    public colorsByIndex!: RGB[];
}

export class ColorReducer {

    /**
     *  Creates a map of the various colors used
     */
    public static createColorMap(kmeansImgData: ImageData) {
        const imgColorIndices = new Uint8Array2D(kmeansImgData.width, kmeansImgData.height);
        let colorIndex = 0;
        const colors: IMap<number> = {};
        const colorsByIndex: RGB[] = [];

        let idx = 0;
        for (let j: number = 0; j < kmeansImgData.height; j++) {
            for (let i: number = 0; i < kmeansImgData.width; i++) {
                const r = kmeansImgData.data[idx++];
                const g = kmeansImgData.data[idx++];
                const b = kmeansImgData.data[idx++];
                const a = kmeansImgData.data[idx++];
                let currentColorIndex;
                const color = r + "," + g + "," + b;
                if (typeof colors[color] === "undefined") {
                    currentColorIndex = colorIndex;
                    colors[color] = colorIndex;
                    colorsByIndex.push([r, g, b]);
                    colorIndex++;
                } else {
                    currentColorIndex = colors[color];
                }
                imgColorIndices.set(i, j, currentColorIndex);
            }
        }

        const result = new ColorMapResult();
        result.imgColorIndices = imgColorIndices;
        result.colorsByIndex = colorsByIndex;
        return result;
    }

    /**
     *  Applies K-means clustering on the imgData to reduce the colors to
     *  k clusters and then output the result to the given outputImgData
     */
    public static async applyKMeansClustering(imgData: ImageData, outputImgData: ImageData, ctx: CanvasRenderingContext2D, settings: Settings, onUpdate: ((kmeans: KMeans) => void) | null = null) {
        const vectors: Vector[] = [];
        let idx = 0;
        let vIdx = 0;

        const bitsToChopOff = 2; // r,g,b gets rounded to every 4 values, 0,4,8,...

        // group by color, add points as 1D index to prevent Point object allocation
        const pointsByColor: IMap<number[]> = {};
        for (let j: number = 0; j < imgData.height; j++) {
            for (let i: number = 0; i < imgData.width; i++) {
                let r = imgData.data[idx++];
                let g = imgData.data[idx++];
                let b = imgData.data[idx++];
                const a = imgData.data[idx++];

                // small performance boost: reduce bitness of colors by chopping off the last bits
                // this will group more colors with only slight variation in color together, reducing the size of the points

                r = r >> bitsToChopOff << bitsToChopOff;
                g = g >> bitsToChopOff << bitsToChopOff;
                b = b >> bitsToChopOff << bitsToChopOff;

                const color = `${r},${g},${b}`;
                if (!(color in pointsByColor)) {
                    pointsByColor[color] = [j * imgData.width + i];
                } else {
                    pointsByColor[color].push(j * imgData.width + i);
                }
            }
        }

        for (const color of Object.keys(pointsByColor)) {
            const rgb: number[] = color.split(",").map((v) => parseInt(v));

            // determine vector data based on color space conversion
            let data: number[];
            if (settings.kMeansClusteringColorSpace === ClusteringColorSpace.RGB) {
                data = rgb;
            } else if (settings.kMeansClusteringColorSpace === ClusteringColorSpace.HSL) {
                data = rgbToHsl(rgb[0], rgb[1], rgb[2]);
            } else if (settings.kMeansClusteringColorSpace === ClusteringColorSpace.LAB) {
                data = rgb2lab(rgb);
            } else {
                data = rgb;
            }
            // determine the weight (#pointsOfColor / #totalpoints) of each color
            const weight = pointsByColor[color].length / (imgData.width * imgData.height);

            const v = new Vector(data, weight);
            vectors[vIdx++] = v;
        }

        // vectors of all the unique colors are built, time to cluster them
        const kmeans = new KMeans(vectors, settings.kMeansNrOfClusters);

        let curTime = new Date().getTime();

        kmeans.step();
        while (kmeans.currentDeltaDistanceDifference > settings.kMeansMinDeltaDifference) {
            kmeans.step();

            // update GUI every 500ms
            if (new Date().getTime() - curTime > 500) {
                curTime = new Date().getTime();

                await delay(0);
                if (onUpdate != null) {
                    ColorReducer.updateKmeansOutputImageData(kmeans, settings, pointsByColor, imgData, outputImgData);
                    onUpdate(kmeans);
                }
            }

        }

        // update the output image data (because it will be used for further processing)
        ColorReducer.updateKmeansOutputImageData(kmeans, settings, pointsByColor, imgData, outputImgData);

        if (onUpdate != null) {
            onUpdate(kmeans);
        }
    }

    /**
     *  Updates the image data from the current kmeans centroids and their respective associated colors (vectors)
     */
    public static updateKmeansOutputImageData(kmeans: KMeans, settings: Settings, pointsByColor: IMap<number[]>, imgData: ImageData, outputImgData: ImageData) {

        for (let c: number = 0; c < kmeans.centroids.length; c++) {
            // for each cluster centroid
            const centroid = kmeans.centroids[c];

            // points per category are the different unique colors belonging to that cluster
            for (const v of kmeans.pointsPerCategory[c]) {

                // determine the rgb color value of the cluster centroid
                let rgb: number[];
                if (settings.kMeansClusteringColorSpace === ClusteringColorSpace.RGB) {
                    rgb = centroid.values;
                } else if (settings.kMeansClusteringColorSpace === ClusteringColorSpace.HSL) {
                    const hsl = centroid.values;
                    rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
                } else if (settings.kMeansClusteringColorSpace === ClusteringColorSpace.LAB) {
                    const lab = centroid.values;
                    rgb = lab2rgb(lab);
                } else {
                    rgb = centroid.values;
                }

                // replace all pixels of the old color by the new centroid color
                const pointColor = `${v.values[0]},${v.values[1]},${v.values[2]}`;
                for (const pt of pointsByColor[pointColor]) {
                    const ptx = pt % imgData.width;
                    const pty = Math.floor(pt / imgData.width);
                    let dataOffset = (pty * imgData.width + ptx) * 4;
                    outputImgData.data[dataOffset++] = rgb[0];
                    outputImgData.data[dataOffset++] = rgb[1];
                    outputImgData.data[dataOffset++] = rgb[2];
                }
            }
        }
    }
}
