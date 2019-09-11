var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define("common", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function delay(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof window !== "undefined") {
                return new Promise((exec) => window.setTimeout(exec, ms));
            }
            else {
                return new Promise((exec) => exec());
            }
        });
    }
    exports.delay = delay;
    class CancellationToken {
        constructor() {
            this.isCancelled = false;
        }
    }
    exports.CancellationToken = CancellationToken;
});
define("random", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Random {
        constructor(seed) {
            if (typeof seed === "undefined") {
                this.seed = new Date().getTime();
            }
            else {
                this.seed = seed;
            }
        }
        next() {
            const x = Math.sin(this.seed++) * 10000;
            return x - Math.floor(x);
        }
    }
    exports.Random = Random;
});
define("lib/clustering", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Vector {
        constructor(values, weight = 1) {
            this.values = values;
            this.weight = weight;
        }
        distanceTo(p) {
            let sumSquares = 0;
            for (let i = 0; i < this.values.length; i++) {
                sumSquares += (p.values[i] - this.values[i]) * (p.values[i] - this.values[i]);
            }
            return Math.sqrt(sumSquares);
        }
        /**
         *  Calculates the weighted average of the given points
         */
        static average(pts) {
            if (pts.length === 0) {
                throw Error("Can't average 0 elements");
            }
            const dims = pts[0].values.length;
            const values = [];
            for (let i = 0; i < dims; i++) {
                values.push(0);
            }
            let weightSum = 0;
            for (const p of pts) {
                weightSum += p.weight;
                for (let i = 0; i < dims; i++) {
                    values[i] += p.weight * p.values[i];
                }
            }
            for (let i = 0; i < values.length; i++) {
                values[i] /= weightSum;
            }
            return new Vector(values);
        }
    }
    exports.Vector = Vector;
    class KMeans {
        constructor(points, k, random, centroids = null) {
            this.points = points;
            this.k = k;
            this.random = random;
            this.currentIteration = 0;
            this.pointsPerCategory = [];
            this.centroids = [];
            this.currentDeltaDistanceDifference = 0;
            if (centroids != null) {
                this.centroids = centroids;
                for (let i = 0; i < this.k; i++) {
                    this.pointsPerCategory.push([]);
                }
            }
            else {
                this.initCentroids();
            }
        }
        initCentroids() {
            for (let i = 0; i < this.k; i++) {
                this.centroids.push(this.points[Math.floor(this.points.length * this.random.next())]);
                this.pointsPerCategory.push([]);
            }
        }
        step() {
            // clear category
            for (let i = 0; i < this.k; i++) {
                this.pointsPerCategory[i] = [];
            }
            // calculate points per centroid
            for (const p of this.points) {
                let minDist = Number.MAX_VALUE;
                let centroidIndex = -1;
                for (let k = 0; k < this.k; k++) {
                    const dist = this.centroids[k].distanceTo(p);
                    if (dist < minDist) {
                        centroidIndex = k;
                        minDist = dist;
                    }
                }
                this.pointsPerCategory[centroidIndex].push(p);
            }
            let totalDistanceDiff = 0;
            // adjust centroids
            for (let k = 0; k < this.pointsPerCategory.length; k++) {
                const cat = this.pointsPerCategory[k];
                if (cat.length > 0) {
                    const avg = Vector.average(cat);
                    const dist = this.centroids[k].distanceTo(avg);
                    totalDistanceDiff += dist;
                    this.centroids[k] = avg;
                }
            }
            this.currentDeltaDistanceDifference = totalDistanceDiff;
            this.currentIteration++;
        }
    }
    exports.KMeans = KMeans;
});
// From https://stackoverflow.com/a/9493060/694640
define("lib/colorconversion", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
      * Converts an RGB color value to HSL. Conversion formula
      * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
      * Assumes r, g, and b are contained in the set [0, 255] and
      * returns h, s, and l in the set [0, 1].
      *
      * @param   Number  r       The red color value
      * @param   Number  g       The green color value
      * @param   Number  b       The blue color value
      * @return  Array           The HSL representation
      */
    function rgbToHsl(r, g, b) {
        r /= 255, g /= 255, b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) {
            h = s = 0; // achromatic
        }
        else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
                default: h = 0;
            }
            h /= 6;
        }
        return [h, s, l];
    }
    exports.rgbToHsl = rgbToHsl;
    /**
     * Converts an HSL color value to RGB. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
     * Assumes h, s, and l are contained in the set [0, 1] and
     * returns r, g, and b in the set [0, 255].
     *
     * @param   Number  h       The hue
     * @param   Number  s       The saturation
     * @param   Number  l       The lightness
     * @return  Array           The RGB representation
     */
    function hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) {
            r = g = b = l; // achromatic
        }
        else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) {
                    t += 1;
                }
                if (t > 1) {
                    t -= 1;
                }
                if (t < 1 / 6) {
                    return p + (q - p) * 6 * t;
                }
                if (t < 1 / 2) {
                    return q;
                }
                if (t < 2 / 3) {
                    return p + (q - p) * (2 / 3 - t) * 6;
                }
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return [r * 255, g * 255, b * 255];
    }
    exports.hslToRgb = hslToRgb;
    // From https://github.com/antimatter15/rgb-lab/blob/master/color.js
    function lab2rgb(lab) {
        let y = (lab[0] + 16) / 116, x = lab[1] / 500 + y, z = y - lab[2] / 200, r, g, b;
        x = 0.95047 * ((x * x * x > 0.008856) ? x * x * x : (x - 16 / 116) / 7.787);
        y = 1.00000 * ((y * y * y > 0.008856) ? y * y * y : (y - 16 / 116) / 7.787);
        z = 1.08883 * ((z * z * z > 0.008856) ? z * z * z : (z - 16 / 116) / 7.787);
        r = x * 3.2406 + y * -1.5372 + z * -0.4986;
        g = x * -0.9689 + y * 1.8758 + z * 0.0415;
        b = x * 0.0557 + y * -0.2040 + z * 1.0570;
        r = (r > 0.0031308) ? (1.055 * Math.pow(r, 1 / 2.4) - 0.055) : 12.92 * r;
        g = (g > 0.0031308) ? (1.055 * Math.pow(g, 1 / 2.4) - 0.055) : 12.92 * g;
        b = (b > 0.0031308) ? (1.055 * Math.pow(b, 1 / 2.4) - 0.055) : 12.92 * b;
        return [Math.max(0, Math.min(1, r)) * 255,
            Math.max(0, Math.min(1, g)) * 255,
            Math.max(0, Math.min(1, b)) * 255];
    }
    exports.lab2rgb = lab2rgb;
    function rgb2lab(rgb) {
        let r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255, x, y, z;
        r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
        x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
        y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
        z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
        x = (x > 0.008856) ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
        y = (y > 0.008856) ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
        z = (z > 0.008856) ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;
        return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)];
    }
    exports.rgb2lab = rgb2lab;
});
define("settings", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ClusteringColorSpace;
    (function (ClusteringColorSpace) {
        ClusteringColorSpace[ClusteringColorSpace["RGB"] = 0] = "RGB";
        ClusteringColorSpace[ClusteringColorSpace["HSL"] = 1] = "HSL";
        ClusteringColorSpace[ClusteringColorSpace["LAB"] = 2] = "LAB";
    })(ClusteringColorSpace = exports.ClusteringColorSpace || (exports.ClusteringColorSpace = {}));
    class Settings {
        constructor() {
            this.kMeansNrOfClusters = 16;
            this.kMeansMinDeltaDifference = 1;
            this.kMeansClusteringColorSpace = ClusteringColorSpace.RGB;
            this.kMeansColorRestrictions = [];
            this.colorAliases = {};
            this.narrowPixelStripCleanupRuns = 3; // 3 seems like a good compromise between removing enough narrow pixel strips to convergence. This fixes e.g. https://i.imgur.com/dz4ANz1.png
            this.removeFacetsSmallerThanNrOfPoints = 20;
            this.removeFacetsFromLargeToSmall = true;
            this.maximumNumberOfFacets = Number.MAX_VALUE;
            this.nrOfTimesToHalveBorderSegments = 2;
            this.resizeImageIfTooLarge = true;
            this.resizeImageWidth = 1024;
            this.resizeImageHeight = 1024;
            this.randomSeed = new Date().getTime();
        }
    }
    exports.Settings = Settings;
});
define("structs/typedarrays", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Uint32Array2D {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.arr = new Uint32Array(width * height);
        }
        get(x, y) {
            return this.arr[y * this.width + x];
        }
        set(x, y, value) {
            this.arr[y * this.width + x] = value;
        }
    }
    exports.Uint32Array2D = Uint32Array2D;
    class Uint8Array2D {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.arr = new Uint8Array(width * height);
        }
        get(x, y) {
            return this.arr[y * this.width + x];
        }
        set(x, y, value) {
            this.arr[y * this.width + x] = value;
        }
        matchAllAround(x, y, value) {
            const idx = y * this.width + x;
            return (x - 1 >= 0 && this.arr[idx - 1] === value) &&
                (y - 1 >= 0 && this.arr[idx - this.width] === value) &&
                (x + 1 < this.width && this.arr[idx + 1] === value) &&
                (y + 1 < this.height && this.arr[idx + this.width] === value);
        }
    }
    exports.Uint8Array2D = Uint8Array2D;
    class BooleanArray2D {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.arr = new Uint8Array(width * height);
        }
        get(x, y) {
            return this.arr[y * this.width + x] !== 0;
        }
        set(x, y, value) {
            this.arr[y * this.width + x] = value ? 1 : 0;
        }
    }
    exports.BooleanArray2D = BooleanArray2D;
});
define("colorreductionmanagement", ["require", "exports", "common", "lib/clustering", "lib/colorconversion", "settings", "structs/typedarrays", "random"], function (require, exports, common_1, clustering_1, colorconversion_1, settings_1, typedarrays_1, random_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ColorMapResult {
    }
    exports.ColorMapResult = ColorMapResult;
    class ColorReducer {
        /**
         *  Creates a map of the various colors used
         */
        static createColorMap(kmeansImgData) {
            const imgColorIndices = new typedarrays_1.Uint8Array2D(kmeansImgData.width, kmeansImgData.height);
            let colorIndex = 0;
            const colors = {};
            const colorsByIndex = [];
            let idx = 0;
            for (let j = 0; j < kmeansImgData.height; j++) {
                for (let i = 0; i < kmeansImgData.width; i++) {
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
                    }
                    else {
                        currentColorIndex = colors[color];
                    }
                    imgColorIndices.set(i, j, currentColorIndex);
                }
            }
            const result = new ColorMapResult();
            result.imgColorIndices = imgColorIndices;
            result.colorsByIndex = colorsByIndex;
            result.width = kmeansImgData.width;
            result.height = kmeansImgData.height;
            return result;
        }
        /**
         *  Applies K-means clustering on the imgData to reduce the colors to
         *  k clusters and then output the result to the given outputImgData
         */
        static applyKMeansClustering(imgData, outputImgData, ctx, settings, onUpdate = null) {
            return __awaiter(this, void 0, void 0, function* () {
                const vectors = [];
                let idx = 0;
                let vIdx = 0;
                const bitsToChopOff = 2; // r,g,b gets rounded to every 4 values, 0,4,8,...
                // group by color, add points as 1D index to prevent Point object allocation
                const pointsByColor = {};
                for (let j = 0; j < imgData.height; j++) {
                    for (let i = 0; i < imgData.width; i++) {
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
                        }
                        else {
                            pointsByColor[color].push(j * imgData.width + i);
                        }
                    }
                }
                for (const color of Object.keys(pointsByColor)) {
                    const rgb = color.split(",").map((v) => parseInt(v));
                    // determine vector data based on color space conversion
                    let data;
                    if (settings.kMeansClusteringColorSpace === settings_1.ClusteringColorSpace.RGB) {
                        data = rgb;
                    }
                    else if (settings.kMeansClusteringColorSpace === settings_1.ClusteringColorSpace.HSL) {
                        data = colorconversion_1.rgbToHsl(rgb[0], rgb[1], rgb[2]);
                    }
                    else if (settings.kMeansClusteringColorSpace === settings_1.ClusteringColorSpace.LAB) {
                        data = colorconversion_1.rgb2lab(rgb);
                    }
                    else {
                        data = rgb;
                    }
                    // determine the weight (#pointsOfColor / #totalpoints) of each color
                    const weight = pointsByColor[color].length / (imgData.width * imgData.height);
                    const vec = new clustering_1.Vector(data, weight);
                    vec.tag = rgb;
                    vectors[vIdx++] = vec;
                }
                const random = new random_1.Random(settings.randomSeed);
                // vectors of all the unique colors are built, time to cluster them
                const kmeans = new clustering_1.KMeans(vectors, settings.kMeansNrOfClusters, random);
                let curTime = new Date().getTime();
                kmeans.step();
                while (kmeans.currentDeltaDistanceDifference > settings.kMeansMinDeltaDifference) {
                    kmeans.step();
                    // update GUI every 500ms
                    if (new Date().getTime() - curTime > 500) {
                        curTime = new Date().getTime();
                        yield common_1.delay(0);
                        if (onUpdate != null) {
                            ColorReducer.updateKmeansOutputImageData(kmeans, settings, pointsByColor, imgData, outputImgData, false);
                            onUpdate(kmeans);
                        }
                    }
                }
                // update the output image data (because it will be used for further processing)
                ColorReducer.updateKmeansOutputImageData(kmeans, settings, pointsByColor, imgData, outputImgData, true);
                if (onUpdate != null) {
                    onUpdate(kmeans);
                }
            });
        }
        /**
         *  Updates the image data from the current kmeans centroids and their respective associated colors (vectors)
         */
        static updateKmeansOutputImageData(kmeans, settings, pointsByColor, imgData, outputImgData, restrictToSpecifiedColors) {
            for (let c = 0; c < kmeans.centroids.length; c++) {
                // for each cluster centroid
                const centroid = kmeans.centroids[c];
                // points per category are the different unique colors belonging to that cluster
                for (const v of kmeans.pointsPerCategory[c]) {
                    // determine the rgb color value of the cluster centroid
                    let rgb;
                    if (settings.kMeansClusteringColorSpace === settings_1.ClusteringColorSpace.RGB) {
                        rgb = centroid.values;
                    }
                    else if (settings.kMeansClusteringColorSpace === settings_1.ClusteringColorSpace.HSL) {
                        const hsl = centroid.values;
                        rgb = colorconversion_1.hslToRgb(hsl[0], hsl[1], hsl[2]);
                    }
                    else if (settings.kMeansClusteringColorSpace === settings_1.ClusteringColorSpace.LAB) {
                        const lab = centroid.values;
                        rgb = colorconversion_1.lab2rgb(lab);
                    }
                    else {
                        rgb = centroid.values;
                    }
                    // remove decimals
                    rgb = rgb.map(v => Math.floor(v));
                    if (restrictToSpecifiedColors) {
                        if (settings.kMeansColorRestrictions.length > 0) {
                            // there are color restrictions, for each centroid find the color from the color restrictions that's the closest
                            let minDistance = Number.MAX_VALUE;
                            let closestRestrictedColor = null;
                            for (const color of settings.kMeansColorRestrictions) {
                                // RGB distance is not very good for the human eye perception, convert both to lab and then calculate the distance
                                const centroidLab = colorconversion_1.rgb2lab(rgb);
                                let restrictionLab;
                                if (typeof color === "string") {
                                    restrictionLab = colorconversion_1.rgb2lab(settings.colorAliases[color]);
                                }
                                else {
                                    restrictionLab = colorconversion_1.rgb2lab(color);
                                }
                                const distance = Math.sqrt((centroidLab[0] - restrictionLab[0]) * (centroidLab[0] - restrictionLab[0]) +
                                    (centroidLab[1] - restrictionLab[1]) * (centroidLab[1] - restrictionLab[1]) +
                                    (centroidLab[2] - restrictionLab[2]) * (centroidLab[2] - restrictionLab[2]));
                                if (distance < minDistance) {
                                    minDistance = distance;
                                    closestRestrictedColor = color;
                                }
                            }
                            // use this color instead
                            if (closestRestrictedColor !== null) {
                                if (typeof closestRestrictedColor === "string") {
                                    rgb = settings.colorAliases[closestRestrictedColor];
                                }
                                else {
                                    rgb = closestRestrictedColor;
                                }
                            }
                        }
                    }
                    let pointRGB = v.tag;
                    // replace all pixels of the old color by the new centroid color
                    const pointColor = `${Math.floor(pointRGB[0])},${Math.floor(pointRGB[1])},${Math.floor(pointRGB[2])}`;
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
        /**
         *  Builds a distance matrix for each color to each other
         */
        static buildColorDistanceMatrix(colorsByIndex) {
            const colorDistances = new Array(colorsByIndex.length);
            for (let j = 0; j < colorsByIndex.length; j++) {
                colorDistances[j] = new Array(colorDistances.length);
            }
            for (let j = 0; j < colorsByIndex.length; j++) {
                for (let i = j; i < colorsByIndex.length; i++) {
                    const c1 = colorsByIndex[j];
                    const c2 = colorsByIndex[i];
                    const distance = Math.sqrt((c1[0] - c2[0]) * (c1[0] - c2[0]) +
                        (c1[1] - c2[1]) * (c1[1] - c2[1]) +
                        (c1[2] - c2[2]) * (c1[2] - c2[2]));
                    colorDistances[i][j] = distance;
                    colorDistances[j][i] = distance;
                }
            }
            return colorDistances;
        }
        static processNarrowPixelStripCleanup(colormapResult) {
            return __awaiter(this, void 0, void 0, function* () {
                // build the color distance matrix, which describes the distance of each color to each other
                const colorDistances = ColorReducer.buildColorDistanceMatrix(colormapResult.colorsByIndex);
                let count = 0;
                const imgColorIndices = colormapResult.imgColorIndices;
                for (let j = 1; j < colormapResult.height - 1; j++) {
                    for (let i = 1; i < colormapResult.width - 1; i++) {
                        const top = imgColorIndices.get(i, j - 1);
                        const bottom = imgColorIndices.get(i, j + 1);
                        const left = imgColorIndices.get(i - 1, j);
                        const right = imgColorIndices.get(i + 1, j);
                        const cur = imgColorIndices.get(i, j);
                        if (cur !== top && cur !== bottom && cur !== left && cur !== right) {
                            // single pixel
                        }
                        else if (cur !== top && cur !== bottom) {
                            // check the color distance whether the top or bottom color is closer
                            const topColorDistance = colorDistances[cur][top];
                            const bottomColorDistance = colorDistances[cur][bottom];
                            imgColorIndices.set(i, j, topColorDistance < bottomColorDistance ? top : bottom);
                            count++;
                        }
                        else if (cur !== left && cur !== right) {
                            // check the color distance whether the top or bottom color is closer
                            const leftColorDistance = colorDistances[cur][left];
                            const rightColorDistance = colorDistances[cur][right];
                            imgColorIndices.set(i, j, leftColorDistance < rightColorDistance ? left : right);
                            count++;
                        }
                    }
                }
                console.log(count + " pixels replaced to remove narrow pixel strips");
            });
        }
    }
    exports.ColorReducer = ColorReducer;
});
define("structs/point", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        distanceTo(pt) {
            // don't do euclidean because then neighbours should be diagonally as well
            // because sqrt(2) < 2
            //  return Math.sqrt((pt.x - this.x) * (pt.x - this.x) + (pt.y - this.y) * (pt.y - this.y));
            return Math.abs(pt.x - this.x) + Math.abs(pt.y - this.y);
        }
        distanceToCoord(x, y) {
            // don't do euclidean because then neighbours should be diagonally as well
            // because sqrt(2) < 2
            //  return Math.sqrt((pt.x - this.x) * (pt.x - this.x) + (pt.y - this.y) * (pt.y - this.y));
            return Math.abs(x - this.x) + Math.abs(y - this.y);
        }
    }
    exports.Point = Point;
});
define("structs/boundingbox", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BoundingBox {
        constructor() {
            this.minX = Number.MAX_VALUE;
            this.minY = Number.MAX_VALUE;
            this.maxX = Number.MIN_VALUE;
            this.maxY = Number.MIN_VALUE;
        }
        get width() {
            return this.maxX - this.minX + 1;
        }
        get height() {
            return this.maxY - this.minY + 1;
        }
    }
    exports.BoundingBox = BoundingBox;
});
define("facetmanagement", ["require", "exports", "structs/point"], function (require, exports, point_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var OrientationEnum;
    (function (OrientationEnum) {
        OrientationEnum[OrientationEnum["Left"] = 0] = "Left";
        OrientationEnum[OrientationEnum["Top"] = 1] = "Top";
        OrientationEnum[OrientationEnum["Right"] = 2] = "Right";
        OrientationEnum[OrientationEnum["Bottom"] = 3] = "Bottom";
    })(OrientationEnum = exports.OrientationEnum || (exports.OrientationEnum = {}));
    /**
     * PathPoint is a point with an orientation that indicates which wall border is set
     */
    class PathPoint extends point_1.Point {
        constructor(pt, orientation) {
            super(pt.x, pt.y);
            this.orientation = orientation;
        }
        getWallX() {
            let x = this.x;
            if (this.orientation === OrientationEnum.Left) {
                x -= 0.5;
            }
            else if (this.orientation === OrientationEnum.Right) {
                x += 0.5;
            }
            return x;
        }
        getWallY() {
            let y = this.y;
            if (this.orientation === OrientationEnum.Top) {
                y -= 0.5;
            }
            else if (this.orientation === OrientationEnum.Bottom) {
                y += 0.5;
            }
            return y;
        }
        getNeighbour(facetResult) {
            switch (this.orientation) {
                case OrientationEnum.Left:
                    if (this.x - 1 >= 0) {
                        return facetResult.facetMap.get(this.x - 1, this.y);
                    }
                    break;
                case OrientationEnum.Right:
                    if (this.x + 1 < facetResult.width) {
                        return facetResult.facetMap.get(this.x + 1, this.y);
                    }
                    break;
                case OrientationEnum.Top:
                    if (this.y - 1 >= 0) {
                        return facetResult.facetMap.get(this.x, this.y - 1);
                    }
                    break;
                case OrientationEnum.Bottom:
                    if (this.y + 1 < facetResult.height) {
                        return facetResult.facetMap.get(this.x, this.y + 1);
                    }
                    break;
            }
            return -1;
        }
        toString() {
            return this.x + "," + this.y + " " + this.orientation;
        }
    }
    exports.PathPoint = PathPoint;
    /**
     *  A facet that represents an area of pixels of the same color
     */
    class Facet {
        constructor() {
            this.pointCount = 0;
            /**
             * Flag indicating if the neighbourfacets array is dirty. If it is, the neighbourfacets *have* to be rebuild
             * Before it can be used. This is useful to defer the rebuilding of the array until it's actually needed
             * and can remove a lot of duplicate building of the array because multiple facets were hitting the same neighbour
             * (over 50% on test images)
             */
            this.neighbourFacetsIsDirty = false;
        }
        getFullPathFromBorderSegments(useWalls) {
            const newpath = [];
            const addPoint = (pt) => {
                if (useWalls) {
                    newpath.push(new point_1.Point(pt.getWallX(), pt.getWallY()));
                }
                else {
                    newpath.push(new point_1.Point(pt.x, pt.y));
                }
            };
            let lastSegment = null;
            for (const seg of this.borderSegments) {
                // fix for the continuitity of the border segments. If transition points between border segments on the path aren't repeated, the
                // borders of the facets aren't always matching up leaving holes when rendered
                if (lastSegment != null) {
                    if (lastSegment.reverseOrder) {
                        addPoint(lastSegment.originalSegment.points[0]);
                    }
                    else {
                        addPoint(lastSegment.originalSegment.points[lastSegment.originalSegment.points.length - 1]);
                    }
                }
                for (let i = 0; i < seg.originalSegment.points.length; i++) {
                    const idx = seg.reverseOrder ? (seg.originalSegment.points.length - 1 - i) : i;
                    addPoint(seg.originalSegment.points[idx]);
                }
                lastSegment = seg;
            }
            return newpath;
        }
    }
    exports.Facet = Facet;
    /**
     *  Result of the facet construction, both as a map and as an array.
     *  Facets in the array can be null when they've been deleted
     */
    class FacetResult {
    }
    exports.FacetResult = FacetResult;
});
define("facetBorderSegmenter", ["require", "exports", "common", "structs/point", "facetmanagement"], function (require, exports, common_2, point_2, facetmanagement_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     *  Path segment is a segment of a border path that is adjacent to a specific neighbour facet
     */
    class PathSegment {
        constructor(points, neighbour) {
            this.points = points;
            this.neighbour = neighbour;
        }
    }
    exports.PathSegment = PathSegment;
    /**
     * Facet boundary segment describes the matched segment that is shared between 2 facets
     * When 2 segments are matched, one will be the original segment and the other one is removed
     * This ensures that all facets share the same segments, but sometimes in reverse order to ensure
     * the correct continuity of its entire oborder path
     */
    class FacetBoundarySegment {
        constructor(originalSegment, neighbour, reverseOrder) {
            this.originalSegment = originalSegment;
            this.neighbour = neighbour;
            this.reverseOrder = reverseOrder;
        }
    }
    exports.FacetBoundarySegment = FacetBoundarySegment;
    class FacetBorderSegmenter {
        /**
         *  Builds border segments that are shared between facets
         *  While border paths are all nice and fancy, they are not linked to neighbour facets
         *  So any change in the paths makes a not so nice gap between the facets, which makes smoothing them out impossible
         */
        static buildFacetBorderSegments(facetResult, nrOfTimesToHalvePoints = 2, onUpdate = null) {
            return __awaiter(this, void 0, void 0, function* () {
                // first chop up the border path in segments each time the neighbour at that point changes
                // (and sometimes even when it doesn't on that side but does on the neighbour's side)
                const segmentsPerFacet = FacetBorderSegmenter.prepareSegmentsPerFacet(facetResult);
                // now reduce the segment complexity with Haar wavelet reduction to smooth them out and make them
                // more curvy with data points instead of zig zag of a grid
                FacetBorderSegmenter.reduceSegmentComplexity(facetResult, segmentsPerFacet, nrOfTimesToHalvePoints);
                // now see which segments of facets with the prepared segments of the neighbour facets
                // and point them to the same one
                yield FacetBorderSegmenter.matchSegmentsWithNeighbours(facetResult, segmentsPerFacet, onUpdate);
            });
        }
        /**
         *  Chops up the border paths per facet into segments adjacent tothe same neighbour
         */
        static prepareSegmentsPerFacet(facetResult) {
            const segmentsPerFacet = new Array(facetResult.facets.length);
            for (const f of facetResult.facets) {
                if (f != null) {
                    const segments = [];
                    if (f.borderPath.length > 1) {
                        let currentPoints = [];
                        currentPoints.push(f.borderPath[0]);
                        for (let i = 1; i < f.borderPath.length; i++) {
                            const prevBorderPoint = f.borderPath[i - 1];
                            const curBorderPoint = f.borderPath[i];
                            const oldNeighbour = prevBorderPoint.getNeighbour(facetResult);
                            const curNeighbour = curBorderPoint.getNeighbour(facetResult);
                            let isTransitionPoint = false;
                            if (oldNeighbour !== curNeighbour) {
                                isTransitionPoint = true;
                            }
                            else {
                                // it's possible that due to inner facets inside the current facet that the
                                // border is interrupted on that facet's side, but not on the neighbour's side
                                if (oldNeighbour !== -1) {
                                    // check for tight rotations to break path if diagonals contain a different neighbour,
                                    // see https://i.imgur.com/o6Srqwj.png for visual path of the issue
                                    if (prevBorderPoint.x === curBorderPoint.x &&
                                        prevBorderPoint.y === curBorderPoint.y) {
                                        // rotation turn
                                        // check the diagonal neighbour to see if it remains the same
                                        //   +---+---+
                                        //   | dN|   |
                                        //   +---xxxx> (x = wall, dN = diagNeighbour)
                                        //   |   x f |
                                        //   +---v---+
                                        if ((prevBorderPoint.orientation === facetmanagement_1.OrientationEnum.Top && curBorderPoint.orientation === facetmanagement_1.OrientationEnum.Left) ||
                                            (prevBorderPoint.orientation === facetmanagement_1.OrientationEnum.Left && curBorderPoint.orientation === facetmanagement_1.OrientationEnum.Top)) {
                                            const diagNeighbour = facetResult.facetMap.get(curBorderPoint.x - 1, curBorderPoint.y - 1);
                                            if (diagNeighbour !== oldNeighbour) {
                                                isTransitionPoint = true;
                                            }
                                        }
                                        else if ((prevBorderPoint.orientation === facetmanagement_1.OrientationEnum.Top && curBorderPoint.orientation === facetmanagement_1.OrientationEnum.Right) ||
                                            (prevBorderPoint.orientation === facetmanagement_1.OrientationEnum.Right && curBorderPoint.orientation === facetmanagement_1.OrientationEnum.Top)) {
                                            const diagNeighbour = facetResult.facetMap.get(curBorderPoint.x + 1, curBorderPoint.y - 1);
                                            if (diagNeighbour !== oldNeighbour) {
                                                isTransitionPoint = true;
                                            }
                                        }
                                        else if ((prevBorderPoint.orientation === facetmanagement_1.OrientationEnum.Bottom && curBorderPoint.orientation === facetmanagement_1.OrientationEnum.Left) ||
                                            (prevBorderPoint.orientation === facetmanagement_1.OrientationEnum.Left && curBorderPoint.orientation === facetmanagement_1.OrientationEnum.Bottom)) {
                                            const diagNeighbour = facetResult.facetMap.get(curBorderPoint.x - 1, curBorderPoint.y + 1);
                                            if (diagNeighbour !== oldNeighbour) {
                                                isTransitionPoint = true;
                                            }
                                        }
                                        else if ((prevBorderPoint.orientation === facetmanagement_1.OrientationEnum.Bottom && curBorderPoint.orientation === facetmanagement_1.OrientationEnum.Right) ||
                                            (prevBorderPoint.orientation === facetmanagement_1.OrientationEnum.Right && curBorderPoint.orientation === facetmanagement_1.OrientationEnum.Bottom)) {
                                            const diagNeighbour = facetResult.facetMap.get(curBorderPoint.x + 1, curBorderPoint.y + 1);
                                            if (diagNeighbour !== oldNeighbour) {
                                                isTransitionPoint = true;
                                            }
                                        }
                                    }
                                }
                            }
                            currentPoints.push(curBorderPoint);
                            if (isTransitionPoint) {
                                // aha! a transition point, create the current points as new segment
                                // and start a new list
                                if (currentPoints.length > 1) {
                                    const segment = new PathSegment(currentPoints, oldNeighbour);
                                    segments.push(segment);
                                    currentPoints = [curBorderPoint];
                                }
                            }
                        }
                        // finally check if there is a remainder partial segment and either prepend
                        // the points to the first segment if they have the same neighbour or construct a
                        // new segment
                        if (currentPoints.length > 1) {
                            const oldNeighbour = f.borderPath[f.borderPath.length - 1].getNeighbour(facetResult);
                            if (segments.length > 0 && segments[0].neighbour === oldNeighbour) {
                                // the first segment and the remainder of the last one are the same part
                                // add the current points to the first segment by prefixing it
                                const mergedPoints = currentPoints.concat(segments[0].points);
                                segments[0].points = mergedPoints;
                            }
                            else {
                                // add the remainder as final segment
                                const segment = new PathSegment(currentPoints, oldNeighbour);
                                segments.push(segment);
                                currentPoints = [];
                            }
                        }
                    }
                    segmentsPerFacet[f.id] = segments;
                }
            }
            return segmentsPerFacet;
        }
        /**
         * Reduces each segment border path points
         */
        static reduceSegmentComplexity(facetResult, segmentsPerFacet, nrOfTimesToHalvePoints) {
            for (const f of facetResult.facets) {
                if (f != null) {
                    for (const segment of segmentsPerFacet[f.id]) {
                        for (let i = 0; i < nrOfTimesToHalvePoints; i++) {
                            segment.points = FacetBorderSegmenter.reduceSegmentHaarWavelet(segment.points, true, facetResult.width, facetResult.height);
                        }
                    }
                }
            }
        }
        /**
         *  Remove the points by taking the average per pair and using that as a new point
         *  in the reduced segment. The delta values that create the Haar wavelet are not tracked
         *  because they are unneeded.
         */
        static reduceSegmentHaarWavelet(newpath, skipOutsideBorders, width, height) {
            if (newpath.length <= 5) {
                return newpath;
            }
            const reducedPath = [];
            reducedPath.push(newpath[0]);
            for (let i = 1; i < newpath.length - 2; i += 2) {
                if (!skipOutsideBorders || (skipOutsideBorders && !FacetBorderSegmenter.isOutsideBorderPoint(newpath[i], width, height))) {
                    const cx = (newpath[i].x + newpath[i + 1].x) / 2;
                    const cy = (newpath[i].y + newpath[i + 1].y) / 2;
                    reducedPath.push(new facetmanagement_1.PathPoint(new point_2.Point(cx, cy), facetmanagement_1.OrientationEnum.Left));
                }
                else {
                    reducedPath.push(newpath[i]);
                    reducedPath.push(newpath[i + 1]);
                }
            }
            // close the loop
            reducedPath.push(newpath[newpath.length - 1]);
            return reducedPath;
        }
        static isOutsideBorderPoint(point, width, height) {
            return point.x === 0 || point.y === 0 || point.x === width - 1 || point.y === height - 1;
        }
        static calculateArea(path) {
            let total = 0;
            for (let i = 0; i < path.length; i++) {
                const addX = path[i].x;
                const addY = path[i === path.length - 1 ? 0 : i + 1].y;
                const subX = path[i === path.length - 1 ? 0 : i + 1].x;
                const subY = path[i].y;
                total += (addX * addY * 0.5);
                total -= (subX * subY * 0.5);
            }
            return Math.abs(total);
        }
        /**
         *  Matches all segments with each other between facets and their neighbour
         *  A segment matches when the start and end match or the start matches with the end and vice versa
         *  (then the segment will need to be traversed in reverse order)
         */
        static matchSegmentsWithNeighbours(facetResult, segmentsPerFacet, onUpdate = null) {
            return __awaiter(this, void 0, void 0, function* () {
                // max distance of the start/end points of the segment that it can be before the segments don't match up
                const MAX_DISTANCE = 4;
                // reserve room
                for (const f of facetResult.facets) {
                    if (f != null) {
                        f.borderSegments = new Array(segmentsPerFacet[f.id].length);
                    }
                }
                let count = 0;
                // and now the fun begins to match segments from 1 facet to its neighbours and vice versa
                for (const f of facetResult.facets) {
                    if (f != null) {
                        const debug = false;
                        for (let s = 0; s < segmentsPerFacet[f.id].length; s++) {
                            const segment = segmentsPerFacet[f.id][s];
                            if (segment != null && f.borderSegments[s] == null) {
                                f.borderSegments[s] = new FacetBoundarySegment(segment, segment.neighbour, false);
                                if (debug) {
                                    console.log("Setting facet " + f.id + " segment " + s + " to " + f.borderSegments[s]);
                                }
                                if (segment.neighbour !== -1) {
                                    const neighbourFacet = facetResult.facets[segment.neighbour];
                                    // see if there is a match to be found
                                    let matchFound = false;
                                    if (neighbourFacet != null) {
                                        const neighbourSegments = segmentsPerFacet[segment.neighbour];
                                        for (let ns = 0; ns < neighbourSegments.length; ns++) {
                                            const neighbourSegment = neighbourSegments[ns];
                                            // only try to match against the segments that aren't processed yet
                                            // and which are adjacent to the boundary of the current facet
                                            if (neighbourSegment != null && neighbourSegment.neighbour === f.id) {
                                                const segStartPoint = segment.points[0];
                                                const segEndPoint = segment.points[segment.points.length - 1];
                                                const nSegStartPoint = neighbourSegment.points[0];
                                                const nSegEndPoint = neighbourSegment.points[neighbourSegment.points.length - 1];
                                                let matchesStraight = (segStartPoint.distanceTo(nSegStartPoint) <= MAX_DISTANCE &&
                                                    segEndPoint.distanceTo(nSegEndPoint) <= MAX_DISTANCE);
                                                let matchesReverse = (segStartPoint.distanceTo(nSegEndPoint) <= MAX_DISTANCE &&
                                                    segEndPoint.distanceTo(nSegStartPoint) <= MAX_DISTANCE);
                                                if (matchesStraight && matchesReverse) {
                                                    // dang it , both match, it must be a tiny segment, but when placed wrongly it'll overlap in the path creating an hourglass 
                                                    //  e.g. https://i.imgur.com/XZQhxRV.png
                                                    // determine which is the closest
                                                    if (segStartPoint.distanceTo(nSegStartPoint) + segEndPoint.distanceTo(nSegEndPoint) <
                                                        segStartPoint.distanceTo(nSegEndPoint) + segEndPoint.distanceTo(nSegStartPoint)) {
                                                        matchesStraight = true;
                                                        matchesReverse = false;
                                                    }
                                                    else {
                                                        matchesStraight = false;
                                                        matchesReverse = true;
                                                    }
                                                }
                                                if (matchesStraight) {
                                                    // start & end points match
                                                    if (debug) {
                                                        console.log("Match found for facet " + f.id + " to neighbour " + neighbourFacet.id);
                                                    }
                                                    neighbourFacet.borderSegments[ns] = new FacetBoundarySegment(segment, f.id, false);
                                                    if (debug) {
                                                        console.log("Setting facet " + neighbourFacet.id + " segment " + ns + " to " + neighbourFacet.borderSegments[ns]);
                                                    }
                                                    segmentsPerFacet[neighbourFacet.id][ns] = null;
                                                    matchFound = true;
                                                    break;
                                                }
                                                else if (matchesReverse) {
                                                    // start & end points match  but in reverse order
                                                    if (debug) {
                                                        console.log("Reverse match found for facet " + f.id + " to neighbour " + neighbourFacet.id);
                                                    }
                                                    neighbourFacet.borderSegments[ns] = new FacetBoundarySegment(segment, f.id, true);
                                                    if (debug) {
                                                        console.log("Setting facet " + neighbourFacet.id + " segment " + ns + " to " + neighbourFacet.borderSegments[ns]);
                                                    }
                                                    segmentsPerFacet[neighbourFacet.id][ns] = null;
                                                    matchFound = true;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    if (!matchFound && debug) {
                                        // it's possible that the border is not shared with its neighbour
                                        // this can happen when the segment fully falls inside the other facet
                                        // though the above checks in the preparation of the segments should probably
                                        // cover all cases
                                        console.error("No match found for segment of " + f.id + ": " +
                                            ("siding " + segment.neighbour + " " + segment.points[0] + " -> " + segment.points[segment.points.length - 1]));
                                    }
                                }
                            }
                            // clear the current segment so it can't be processed again when processing the neighbour facet
                            segmentsPerFacet[f.id][s] = null;
                        }
                        if (count % 100 === 0) {
                            yield common_2.delay(0);
                            if (onUpdate != null) {
                                onUpdate(f.id / facetResult.facets.length);
                            }
                        }
                    }
                    count++;
                }
                if (onUpdate != null) {
                    onUpdate(1);
                }
            });
        }
    }
    exports.FacetBorderSegmenter = FacetBorderSegmenter;
});
define("facetBorderTracer", ["require", "exports", "common", "structs/point", "structs/typedarrays", "facetmanagement"], function (require, exports, common_3, point_3, typedarrays_2, facetmanagement_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FacetBorderTracer {
        /**
         *  Traces the border path of the facet from the facet border points.
         *  Imagine placing walls around the outer side of the border points.
         */
        static buildFacetBorderPaths(facetResult, onUpdate = null) {
            return __awaiter(this, void 0, void 0, function* () {
                let count = 0;
                const borderMask = new typedarrays_2.BooleanArray2D(facetResult.width, facetResult.height);
                // sort by biggest facets first
                const facetProcessingOrder = facetResult.facets.filter((f) => f != null).slice(0).sort((a, b) => b.pointCount > a.pointCount ? 1 : (b.pointCount < a.pointCount ? -1 : 0)).map((f) => f.id);
                for (let fidx = 0; fidx < facetProcessingOrder.length; fidx++) {
                    const f = facetResult.facets[facetProcessingOrder[fidx]];
                    if (f != null) {
                        for (const bp of f.borderPoints) {
                            borderMask.set(bp.x, bp.y, true);
                        }
                        // keep track of which walls are already set on each pixel
                        // e.g. xWall.get(x,y) is the left wall of point x,y
                        // as the left wall of (x+1,y) and right wall of (x,y) is the same
                        // the right wall of x,y can be set with xWall.set(x+1,y).
                        // Analogous for the horizontal walls in yWall
                        const xWall = new typedarrays_2.BooleanArray2D(facetResult.width + 1, facetResult.height + 1);
                        const yWall = new typedarrays_2.BooleanArray2D(facetResult.width + 1, facetResult.height + 1);
                        // the first border point will guaranteed be one of the outer ones because
                        // it will be the first point that is encountered of the facet when building
                        // them in buildFacet with DFS.
                        // --> Or so I thought, which is apparently not the case in rare circumstances
                        // sooooo go look for a border that edges with the bounding box, this is definitely
                        // on the outer side then.
                        let borderStartIndex = -1;
                        for (let i = 0; i < f.borderPoints.length; i++) {
                            if ((f.borderPoints[i].x === f.bbox.minX || f.borderPoints[i].x === f.bbox.maxX) ||
                                (f.borderPoints[i].y === f.bbox.minY || f.borderPoints[i].y === f.bbox.maxY)) {
                                borderStartIndex = i;
                                break;
                            }
                        }
                        // determine the starting point orientation (the outside of facet)
                        const pt = new facetmanagement_2.PathPoint(f.borderPoints[borderStartIndex], facetmanagement_2.OrientationEnum.Left);
                        // L T R B
                        if (pt.x - 1 < 0 || facetResult.facetMap.get(pt.x - 1, pt.y) !== f.id) {
                            pt.orientation = facetmanagement_2.OrientationEnum.Left;
                        }
                        else if (pt.y - 1 < 0 || facetResult.facetMap.get(pt.x, pt.y - 1) !== f.id) {
                            pt.orientation = facetmanagement_2.OrientationEnum.Top;
                        }
                        else if (pt.x + 1 >= facetResult.width || facetResult.facetMap.get(pt.x + 1, pt.y) !== f.id) {
                            pt.orientation = facetmanagement_2.OrientationEnum.Right;
                        }
                        else if (pt.y + 1 >= facetResult.height || facetResult.facetMap.get(pt.x, pt.y + 1) !== f.id) {
                            pt.orientation = facetmanagement_2.OrientationEnum.Bottom;
                        }
                        // build a border path from that point
                        const path = FacetBorderTracer.getPath(pt, facetResult, f, borderMask, xWall, yWall);
                        f.borderPath = path;
                        if (count % 100 === 0) {
                            yield common_3.delay(0);
                            if (onUpdate != null) {
                                onUpdate(fidx / facetProcessingOrder.length);
                            }
                        }
                    }
                    count++;
                }
                if (onUpdate != null) {
                    onUpdate(1);
                }
            });
        }
        /**
         * Returns a border path starting from the given point
         */
        static getPath(pt, facetResult, f, borderMask, xWall, yWall) {
            const debug = false;
            let finished = false;
            const count = 0;
            const path = [];
            FacetBorderTracer.addPointToPath(path, pt, xWall, f, yWall);
            // check rotations first, then straight along the ouside and finally diagonally
            // this ensures that bends are always taken as tight as possible
            // so it doesn't skip border points to later loop back to and get stuck (hopefully)
            while (!finished) {
                if (debug) {
                    console.log(pt.x + " " + pt.y + " " + pt.orientation);
                }
                // yes, technically i could do some trickery to only get the left/top cases
                // by shifting the pixels but that means some more shenanigans in correct order of things
                // so whatever. (And yes I tried it but it wasn't worth the debugging hell that ensued)
                const possibleNextPoints = [];
                //   +---+---+
                //   |  <|   |
                //   +---+---+
                if (pt.orientation === facetmanagement_2.OrientationEnum.Left) {
                    // check rotate to top
                    //   +---+---+
                    //   |   |   |
                    //   +---xnnnn (x = old wall, n = new wall, F = current facet x,y)
                    //   |   x F |
                    //   +---x---+
                    if (((pt.y - 1 >= 0 && facetResult.facetMap.get(pt.x, pt.y - 1) !== f.id) // top exists and is a neighbour facet
                        || pt.y - 1 < 0) // or top doesn't exist, which is the boundary of the image
                        && !yWall.get(pt.x, pt.y)) { // and the wall isn't set yet
                        // can place top _ wall at x,y
                        if (debug) {
                            console.log("can place top _ wall at x,y");
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x, pt.y), facetmanagement_2.OrientationEnum.Top);
                        possibleNextPoints.push(nextpt);
                    }
                    // check rotate to bottom
                    //   +---+---+
                    //   |   |   |
                    //   +---x---+ (x = old wall, n = new wall, F = current facet x,y)
                    //   |   x F |
                    //   +---xnnnn
                    if (((pt.y + 1 < facetResult.height && facetResult.facetMap.get(pt.x, pt.y + 1) !== f.id) // bottom exists and is a neighbour facet
                        || pt.y + 1 >= facetResult.height) // or bottom doesn't exist, which is the boundary of the image
                        && !yWall.get(pt.x, pt.y + 1)) { // and the wall isn't set yet
                        // can place bottom  _ wall at x,y
                        if (debug) {
                            console.log("can place bottom _ wall at x,y");
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x, pt.y), facetmanagement_2.OrientationEnum.Bottom);
                        possibleNextPoints.push(nextpt);
                    }
                    // check upwards
                    //   +---n---+
                    //   |   n   |
                    //   +---x---+ (x = old wall, n = new wall, F = current facet x,y)
                    //   |   x F |
                    //   +---x---+
                    if (pt.y - 1 >= 0 // top exists
                        && facetResult.facetMap.get(pt.x, pt.y - 1) === f.id // and is part of the same facet
                        && (pt.x - 1 < 0 || facetResult.facetMap.get(pt.x - 1, pt.y - 1) !== f.id) // and
                        && borderMask.get(pt.x, pt.y - 1)
                        && !xWall.get(pt.x, pt.y - 1)) {
                        // can place | wall at x,y-1
                        if (debug) {
                            console.log(`can place left | wall at x,y-1`);
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x, pt.y - 1), facetmanagement_2.OrientationEnum.Left);
                        possibleNextPoints.push(nextpt);
                    }
                    // check downwards
                    //   +---x---+
                    //   |   x F |
                    //   +---x---+ (x = old wall, n = new wall, F = current facet x,y)
                    //   |   n   |
                    //   +---n---+
                    if (pt.y + 1 < facetResult.height
                        && facetResult.facetMap.get(pt.x, pt.y + 1) === f.id
                        && (pt.x - 1 < 0 || facetResult.facetMap.get(pt.x - 1, pt.y + 1) !== f.id)
                        && borderMask.get(pt.x, pt.y + 1)
                        && !xWall.get(pt.x, pt.y + 1)) {
                        // can place | wall at x,y+1
                        if (debug) {
                            console.log("can place left | wall at x,y+1");
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x, pt.y + 1), facetmanagement_2.OrientationEnum.Left);
                        possibleNextPoints.push(nextpt);
                    }
                    // check left upwards
                    //   +---+---+
                    //   |   |   |
                    //   nnnnx---+ (x = old wall, n = new wall, F = current facet x,y)
                    //   |   x F |
                    //   +---x---+
                    if (pt.y - 1 >= 0 && pt.x - 1 >= 0 // there is a left upwards
                        && facetResult.facetMap.get(pt.x - 1, pt.y - 1) === f.id // and it belongs to the same facet
                        && borderMask.get(pt.x - 1, pt.y - 1) // and is on the border
                        && !yWall.get(pt.x - 1, pt.y - 1 + 1) // and the bottom wall isn't set yet
                        && !yWall.get(pt.x, pt.y) // and the path didn't come from the top of the current one to prevent getting a T shaped path (issue: https://i.imgur.com/ggUWuXi.png)
                    ) {
                        // can place bottom _ wall at x-1,y-1
                        if (debug) {
                            console.log("can place bottom _ wall at x-1,y-1");
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x - 1, pt.y - 1), facetmanagement_2.OrientationEnum.Bottom);
                        possibleNextPoints.push(nextpt);
                    }
                    // check left downwards
                    //   +---x---+
                    //   |   x F |
                    //   nnnnx---+ (x = old wall, n = new wall, F = current facet x,y)
                    //   |   |   |
                    //   +---+---+
                    if (pt.y + 1 < facetResult.height && pt.x - 1 >= 0 // there is a left downwards
                        && facetResult.facetMap.get(pt.x - 1, pt.y + 1) === f.id // and belongs to the same facet
                        && borderMask.get(pt.x - 1, pt.y + 1) // and is on the border
                        && !yWall.get(pt.x - 1, pt.y + 1) // and the top wall isn't set yet
                        && !yWall.get(pt.x, pt.y + 1) // and the path didn't come from the bottom of the current point to prevent T shape
                    ) {
                        // can place top _ wall at x-1,y+1
                        if (debug) {
                            console.log("can place top _ wall at x-1,y+1");
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x - 1, pt.y + 1), facetmanagement_2.OrientationEnum.Top);
                        possibleNextPoints.push(nextpt);
                    }
                }
                else if (pt.orientation === facetmanagement_2.OrientationEnum.Top) {
                    // check rotate to left
                    if (((pt.x - 1 >= 0
                        && facetResult.facetMap.get(pt.x - 1, pt.y) !== f.id)
                        || pt.x - 1 < 0)
                        && !xWall.get(pt.x, pt.y)) {
                        // can place left | wall at x,y
                        if (debug) {
                            console.log("can place left | wall at x,y");
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x, pt.y), facetmanagement_2.OrientationEnum.Left);
                        possibleNextPoints.push(nextpt);
                    }
                    // check rotate to right
                    if (((pt.x + 1 < facetResult.width
                        && facetResult.facetMap.get(pt.x + 1, pt.y) !== f.id)
                        || pt.x + 1 >= facetResult.width)
                        && !xWall.get(pt.x + 1, pt.y)) {
                        // can place right | wall at x,y
                        if (debug) {
                            console.log("can place right | wall at x,y");
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x, pt.y), facetmanagement_2.OrientationEnum.Right);
                        possibleNextPoints.push(nextpt);
                    }
                    // check leftwards
                    if (pt.x - 1 >= 0
                        && facetResult.facetMap.get(pt.x - 1, pt.y) === f.id
                        && (pt.y - 1 < 0 || facetResult.facetMap.get(pt.x - 1, pt.y - 1) !== f.id)
                        && borderMask.get(pt.x - 1, pt.y)
                        && !yWall.get(pt.x - 1, pt.y)) {
                        // can place top _ wall at x-1,y
                        if (debug) {
                            console.log(`can place top _ wall at x-1,y`);
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x - 1, pt.y), facetmanagement_2.OrientationEnum.Top);
                        possibleNextPoints.push(nextpt);
                    }
                    // check rightwards
                    if (pt.x + 1 < facetResult.width
                        && facetResult.facetMap.get(pt.x + 1, pt.y) === f.id
                        && (pt.y - 1 < 0 || facetResult.facetMap.get(pt.x + 1, pt.y - 1) !== f.id)
                        && borderMask.get(pt.x + 1, pt.y)
                        && !yWall.get(pt.x + 1, pt.y)) {
                        // can place top _ wall at x+1,y
                        if (debug) {
                            console.log(`can place top _ wall at x+1,y`);
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x + 1, pt.y), facetmanagement_2.OrientationEnum.Top);
                        possibleNextPoints.push(nextpt);
                    }
                    // check left upwards
                    if (pt.y - 1 >= 0 && pt.x - 1 >= 0 // there is a left upwards
                        && facetResult.facetMap.get(pt.x - 1, pt.y - 1) === f.id // and it belongs to the same facet
                        && borderMask.get(pt.x - 1, pt.y - 1) // and it's part of the border
                        && !xWall.get(pt.x - 1 + 1, pt.y - 1) // the right wall isn't set yet
                        && !xWall.get(pt.x, pt.y) // and the left wall of the current point isn't set yet to prevent |- path
                    ) {
                        // can place right | wall at x-1,y-1
                        if (debug) {
                            console.log("can place right | wall at x-1,y-1");
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x - 1, pt.y - 1), facetmanagement_2.OrientationEnum.Right);
                        possibleNextPoints.push(nextpt);
                    }
                    // check right upwards
                    if (pt.y - 1 >= 0 && pt.x + 1 < facetResult.width // there is a right upwards
                        && facetResult.facetMap.get(pt.x + 1, pt.y - 1) === f.id // and it belongs to the same facet
                        && borderMask.get(pt.x + 1, pt.y - 1) // and it's on the border
                        && !xWall.get(pt.x + 1, pt.y - 1) // and the left wall isn't set yet
                        && !xWall.get(pt.x + 1, pt.y) // and the right wall of the current point isn't set yet to prevent -| path
                    ) {
                        // can place left |  wall at x+1,y-1
                        if (debug) {
                            console.log("can place left |  wall at x+1,y-1");
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x + 1, pt.y - 1), facetmanagement_2.OrientationEnum.Left);
                        possibleNextPoints.push(nextpt);
                    }
                }
                else if (pt.orientation === facetmanagement_2.OrientationEnum.Right) {
                    // check rotate to top
                    if (((pt.y - 1 >= 0
                        && facetResult.facetMap.get(pt.x, pt.y - 1) !== f.id)
                        || pt.y - 1 < 0)
                        && !yWall.get(pt.x, pt.y)) {
                        // can place top _ wall at x,y
                        if (debug) {
                            console.log("can place top _ wall at x,y");
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x, pt.y), facetmanagement_2.OrientationEnum.Top);
                        possibleNextPoints.push(nextpt);
                    }
                    // check rotate to bottom
                    if (((pt.y + 1 < facetResult.height
                        && facetResult.facetMap.get(pt.x, pt.y + 1) !== f.id)
                        || pt.y + 1 >= facetResult.height)
                        && !yWall.get(pt.x, pt.y + 1)) {
                        // can place bottom  _ wall at x,y
                        if (debug) {
                            console.log("can place bottom _ wall at x,y");
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x, pt.y), facetmanagement_2.OrientationEnum.Bottom);
                        possibleNextPoints.push(nextpt);
                    }
                    // check upwards
                    if (pt.y - 1 >= 0
                        && facetResult.facetMap.get(pt.x, pt.y - 1) === f.id
                        && (pt.x + 1 >= facetResult.width || facetResult.facetMap.get(pt.x + 1, pt.y - 1) !== f.id)
                        && borderMask.get(pt.x, pt.y - 1)
                        && !xWall.get(pt.x + 1, pt.y - 1)) {
                        // can place right | wall at x,y-1
                        if (debug) {
                            console.log(`can place right | wall at x,y-1`);
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x, pt.y - 1), facetmanagement_2.OrientationEnum.Right);
                        possibleNextPoints.push(nextpt);
                    }
                    // check downwards
                    if (pt.y + 1 < facetResult.height
                        && facetResult.facetMap.get(pt.x, pt.y + 1) === f.id
                        && (pt.x + 1 >= facetResult.width || facetResult.facetMap.get(pt.x + 1, pt.y + 1) !== f.id)
                        && borderMask.get(pt.x, pt.y + 1)
                        && !xWall.get(pt.x + 1, pt.y + 1)) {
                        // can place right | wall at x,y+1
                        if (debug) {
                            console.log("can place right | wall at x,y+1");
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x, pt.y + 1), facetmanagement_2.OrientationEnum.Right);
                        possibleNextPoints.push(nextpt);
                    }
                    // check right upwards
                    if (pt.y - 1 >= 0 && pt.x + 1 < facetResult.width // there is a right upwards
                        && facetResult.facetMap.get(pt.x + 1, pt.y - 1) === f.id // and belongs to the same facet
                        && borderMask.get(pt.x + 1, pt.y - 1) // and is on the border
                        && !yWall.get(pt.x + 1, pt.y - 1 + 1) // and the bottom wall isn't set yet
                        && !yWall.get(pt.x, pt.y) // and the top wall of the current point isn't set to prevent a T shape
                    ) {
                        // can place bottom _ wall at x+1,y-1
                        if (debug) {
                            console.log("can place bottom _ wall at x+1,y-1");
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x + 1, pt.y - 1), facetmanagement_2.OrientationEnum.Bottom);
                        possibleNextPoints.push(nextpt);
                    }
                    // check right downwards
                    if (pt.y + 1 < facetResult.height && pt.x + 1 < facetResult.width // there is a right downwards
                        && facetResult.facetMap.get(pt.x + 1, pt.y + 1) === f.id // and belongs to the same facet
                        && borderMask.get(pt.x + 1, pt.y + 1) // and is on the border
                        && !yWall.get(pt.x + 1, pt.y + 1) // and the top wall isn't visited yet
                        && !yWall.get(pt.x, pt.y + 1) // and the bottom wall of the current point isn't set to prevent a T shape
                    ) {
                        // can place top _ wall at x+1,y+1
                        if (debug) {
                            console.log("can place top _ wall at x+1,y+1");
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x + 1, pt.y + 1), facetmanagement_2.OrientationEnum.Top);
                        possibleNextPoints.push(nextpt);
                    }
                }
                else if (pt.orientation === facetmanagement_2.OrientationEnum.Bottom) {
                    // check rotate to left
                    if (((pt.x - 1 >= 0
                        && facetResult.facetMap.get(pt.x - 1, pt.y) !== f.id)
                        || pt.x - 1 < 0)
                        && !xWall.get(pt.x, pt.y)) {
                        // can place left | wall at x,y
                        if (debug) {
                            console.log("can place left | wall at x,y");
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x, pt.y), facetmanagement_2.OrientationEnum.Left);
                        possibleNextPoints.push(nextpt);
                    }
                    // check rotate to right
                    if (((pt.x + 1 < facetResult.width
                        && facetResult.facetMap.get(pt.x + 1, pt.y) !== f.id)
                        || pt.x + 1 >= facetResult.width)
                        && !xWall.get(pt.x + 1, pt.y)) {
                        // can place right | wall at x,y
                        if (debug) {
                            console.log("can place right | wall at x,y");
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x, pt.y), facetmanagement_2.OrientationEnum.Right);
                        possibleNextPoints.push(nextpt);
                    }
                    // check leftwards
                    if (pt.x - 1 >= 0
                        && facetResult.facetMap.get(pt.x - 1, pt.y) === f.id
                        && (pt.y + 1 >= facetResult.height || facetResult.facetMap.get(pt.x - 1, pt.y + 1) !== f.id)
                        && borderMask.get(pt.x - 1, pt.y)
                        && !yWall.get(pt.x - 1, pt.y + 1)) {
                        // can place bottom _ wall at x-1,y
                        if (debug) {
                            console.log(`can place bottom _ wall at x-1,y`);
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x - 1, pt.y), facetmanagement_2.OrientationEnum.Bottom);
                        possibleNextPoints.push(nextpt);
                    }
                    // check rightwards
                    if (pt.x + 1 < facetResult.width
                        && facetResult.facetMap.get(pt.x + 1, pt.y) === f.id
                        && (pt.y + 1 >= facetResult.height || facetResult.facetMap.get(pt.x + 1, pt.y + 1) !== f.id)
                        && borderMask.get(pt.x + 1, pt.y)
                        && !yWall.get(pt.x + 1, pt.y + 1)) {
                        // can place top _ wall at x+1,y
                        if (debug) {
                            console.log(`can place bottom _ wall at x+1,y`);
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x + 1, pt.y), facetmanagement_2.OrientationEnum.Bottom);
                        possibleNextPoints.push(nextpt);
                    }
                    // check left downwards
                    if (pt.y + 1 < facetResult.height && pt.x - 1 >= 0 // there is a left downwards
                        && facetResult.facetMap.get(pt.x - 1, pt.y + 1) === f.id // and it's the same facet
                        && borderMask.get(pt.x - 1, pt.y + 1) // and it's on the border
                        && !xWall.get(pt.x - 1 + 1, pt.y + 1) // and the right wall isn't set yet
                        && !xWall.get(pt.x, pt.y) // and the left wall of the current point isn't set yet to prevent |- path
                    ) {
                        // can place right | wall at x-1,y-1
                        if (debug) {
                            console.log("can place right | wall at x-1,y+1");
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x - 1, pt.y + 1), facetmanagement_2.OrientationEnum.Right);
                        possibleNextPoints.push(nextpt);
                    }
                    // check right downwards
                    if (pt.y + 1 < facetResult.height && pt.x + 1 < facetResult.width // there is a right downwards
                        && facetResult.facetMap.get(pt.x + 1, pt.y + 1) === f.id // and it's the same facet
                        && borderMask.get(pt.x + 1, pt.y + 1) // and it's on the border
                        && !xWall.get(pt.x + 1, pt.y + 1) // and the left wall isn't set yet
                        && !xWall.get(pt.x + 1, pt.y) // and the right wall of the current point isn't set yet to prevent -| path
                    ) {
                        // can place left |  wall at x+1,y+1
                        if (debug) {
                            console.log("can place left |  wall at x+1,y+1");
                        }
                        const nextpt = new facetmanagement_2.PathPoint(new point_3.Point(pt.x + 1, pt.y + 1), facetmanagement_2.OrientationEnum.Left);
                        possibleNextPoints.push(nextpt);
                    }
                }
                if (possibleNextPoints.length > 1) {
                    // TODO it's now not necessary anymore to aggregate all possibilities, the first one is going to be the correct
                    // selection to trace the entire border, so the if checks above can include a skip once ssible point is found again
                    pt = possibleNextPoints[0];
                    FacetBorderTracer.addPointToPath(path, pt, xWall, f, yWall);
                }
                else if (possibleNextPoints.length === 1) {
                    pt = possibleNextPoints[0];
                    FacetBorderTracer.addPointToPath(path, pt, xWall, f, yWall);
                }
                else {
                    finished = true;
                }
            }
            // clear up the walls set for the path so the array can be reused
            for (const pathPoint of path) {
                switch (pathPoint.orientation) {
                    case facetmanagement_2.OrientationEnum.Left:
                        xWall.set(pathPoint.x, pathPoint.y, false);
                        break;
                    case facetmanagement_2.OrientationEnum.Top:
                        yWall.set(pathPoint.x, pathPoint.y, false);
                        break;
                    case facetmanagement_2.OrientationEnum.Right:
                        xWall.set(pathPoint.x + 1, pathPoint.y, false);
                        break;
                    case facetmanagement_2.OrientationEnum.Bottom:
                        yWall.set(pathPoint.x, pathPoint.y + 1, false);
                        break;
                }
            }
            return path;
        }
        /**
         * Add a point to the border path and ensure the correct xWall/yWalls is set
         */
        static addPointToPath(path, pt, xWall, f, yWall) {
            path.push(pt);
            switch (pt.orientation) {
                case facetmanagement_2.OrientationEnum.Left:
                    xWall.set(pt.x, pt.y, true);
                    break;
                case facetmanagement_2.OrientationEnum.Top:
                    yWall.set(pt.x, pt.y, true);
                    break;
                case facetmanagement_2.OrientationEnum.Right:
                    xWall.set(pt.x + 1, pt.y, true);
                    break;
                case facetmanagement_2.OrientationEnum.Bottom:
                    yWall.set(pt.x, pt.y + 1, true);
                    break;
            }
        }
    }
    exports.FacetBorderTracer = FacetBorderTracer;
});
// Faster flood fill from
// http://www.adammil.net/blog/v126_A_More_Efficient_Flood_Fill.html
define("lib/fill", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function fill(x, y, width, height, visited, setFill) {
        // at this point, we know array[y,x] is clear, and we want to move as far as possible to the upper-left. moving
        // up is much more important than moving left, so we could try to make this smarter by sometimes moving to
        // the right if doing so would allow us to move further up, but it doesn't seem worth the complexit
        let xx = x;
        let yy = y;
        while (true) {
            const ox = xx;
            const oy = yy;
            while (yy !== 0 && !visited(xx, yy - 1)) {
                yy--;
            }
            while (xx !== 0 && !visited(xx - 1, yy)) {
                xx--;
            }
            if (xx === ox && yy === oy) {
                break;
            }
        }
        fillCore(xx, yy, width, height, visited, setFill);
    }
    exports.fill = fill;
    function fillCore(x, y, width, height, visited, setFill) {
        // at this point, we know that array[y,x] is clear, and array[y-1,x] and array[y,x-1] are set.
        // we'll begin scanning down and to the right, attempting to fill an entire rectangular block
        let lastRowLength = 0; // the number of cells that were clear in the last row we scanned
        do {
            let rowLength = 0;
            let sx = x; // keep track of how long this row is. sx is the starting x for the main scan below
            // now we want to handle a case like |***|, where we fill 3 cells in the first row and then after we move to
            // the second row we find the first  | **| cell is filled, ending our rectangular scan. rather than handling
            // this via the recursion below, we'll increase the starting value of 'x' and reduce the last row length to
            // match. then we'll continue trying to set the narrower rectangular block
            if (lastRowLength !== 0 && visited(x, y)) {
                do {
                    if (--lastRowLength === 0) {
                        return;
                    } // shorten the row. if it's full, we're done
                } while (visited(++x, y)); // otherwise, update the starting point of the main scan to match
                sx = x;
            }
            else {
                for (; x !== 0 && !visited(x - 1, y); rowLength++, lastRowLength++) {
                    x--;
                    setFill(x, y); // to avoid scanning the cells twice, we'll fill them and update rowLength here
                    // if there's something above the new starting point, handle that recursively. this deals with cases
                    // like |* **| when we begin filling from (2,0), move down to (2,1), and then move left to (0,1).
                    // the  |****| main scan assumes the portion of the previous row from x to x+lastRowLength has already
                    // been filled. adjusting x and lastRowLength breaks that assumption in this case, so we must fix it
                    if (y !== 0 && !visited(x, y - 1)) {
                        fill(x, y - 1, width, height, visited, setFill);
                    } // use _Fill since there may be more up and left
                }
            }
            // now at this point we can begin to scan the current row in the rectangular block. the span of the previous
            // row from x (inclusive) to x+lastRowLength (exclusive) has already been filled, so we don't need to
            // check it. so scan across to the right in the current row
            for (; sx < width && !visited(sx, y); rowLength++, sx++) {
                setFill(sx, y);
            }
            // now we've scanned this row. if the block is rectangular, then the previous row has already been scanned,
            // so we don't need to look upwards and we're going to scan the next row in the next iteration so we don't
            // need to look downwards. however, if the block is not rectangular, we may need to look upwards or rightwards
            // for some portion of the row. if this row was shorter than the last row, we may need to look rightwards near
            // the end, as in the case of |*****|, where the first row is 5 cells long and the second row is 3 cells long.
            // we must look to the right  |*** *| of the single cell at the end of the second row, i.e. at (4,1)
            if (rowLength < lastRowLength) {
                for (const end = x + lastRowLength; ++sx < end;) { // there. any clear cells would have been connected to the previous
                    if (!visited(sx, y)) {
                        fillCore(sx, y, width, height, visited, setFill);
                    } // row. the cells up and left must be set so use FillCore
                }
            }
            else if (rowLength > lastRowLength && y !== 0) {
                for (let ux = x + lastRowLength; ++ux < sx;) {
                    if (!visited(ux, y - 1)) {
                        fill(ux, y - 1, width, height, visited, setFill);
                    } // since there may be clear cells up and left, use _Fill
                }
            }
            lastRowLength = rowLength; // record the new row length
        } while (lastRowLength !== 0 && ++y < height); // if we get to a full row or to the bottom, we're done
    }
});
define("facetReducer", ["require", "exports", "colorreductionmanagement", "common", "facetCreator", "structs/typedarrays"], function (require, exports, colorreductionmanagement_1, common_4, facetCreator_1, typedarrays_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FacetReducer {
        /**
         *  Remove all facets that have a pointCount smaller than the given number.
         */
        static reduceFacets(smallerThan, removeFacetsFromLargeToSmall, maximumNumberOfFacets, colorsByIndex, facetResult, imgColorIndices, onUpdate = null) {
            return __awaiter(this, void 0, void 0, function* () {
                const visitedCache = new typedarrays_3.BooleanArray2D(facetResult.width, facetResult.height);
                // build the color distance matrix, which describes the distance of each color to each other
                const colorDistances = colorreductionmanagement_1.ColorReducer.buildColorDistanceMatrix(colorsByIndex);
                // process facets from large to small. This results in better consistency with the original image
                // because the small facets act as boundary for the large merges keeping them mostly in place of where they should remain
                // then afterwards the smaller ones are deleted which will just end up completely isolated and thus entirely replaced
                // with the outer facet. But then again, what do I know, I'm just a comment.
                const facetProcessingOrder = facetResult.facets.filter((f) => f != null).slice(0).sort((a, b) => b.pointCount > a.pointCount ? 1 : (b.pointCount < a.pointCount ? -1 : 0)).map((f) => f.id);
                if (!removeFacetsFromLargeToSmall) {
                    facetProcessingOrder.reverse();
                }
                let curTime = new Date().getTime();
                for (let fidx = 0; fidx < facetProcessingOrder.length; fidx++) {
                    const f = facetResult.facets[facetProcessingOrder[fidx]];
                    // facets can be removed by merging by others due to a previous facet deletion
                    if (f != null && f.pointCount < smallerThan) {
                        FacetReducer.deleteFacet(f.id, facetResult, imgColorIndices, colorDistances, visitedCache);
                        if (new Date().getTime() - curTime > 500) {
                            curTime = new Date().getTime();
                            yield common_4.delay(0);
                            if (onUpdate != null) {
                                onUpdate(0.5 * fidx / facetProcessingOrder.length);
                            }
                        }
                    }
                }
                let facetCount = facetResult.facets.filter(f => f != null).length;
                if (facetCount > maximumNumberOfFacets) {
                    console.log(`There are still ${facetCount} facets, more than the maximum of ${maximumNumberOfFacets}. Removing the smallest facets`);
                }
                const startFacetCount = facetCount;
                while (facetCount > maximumNumberOfFacets) {
                    // because facets can be merged, reevaluate the order of facets to make sure the smallest one is removed 
                    // this is slower but more accurate
                    const facetProcessingOrder = facetResult.facets.filter((f) => f != null).slice(0)
                        .sort((a, b) => b.pointCount > a.pointCount ? 1 : (b.pointCount < a.pointCount ? -1 : 0))
                        .map((f) => f.id)
                        .reverse();
                    const facetToRemove = facetResult.facets[facetProcessingOrder[0]];
                    FacetReducer.deleteFacet(facetToRemove.id, facetResult, imgColorIndices, colorDistances, visitedCache);
                    facetCount = facetResult.facets.filter(f => f != null).length;
                    if (new Date().getTime() - curTime > 500) {
                        curTime = new Date().getTime();
                        yield common_4.delay(0);
                        if (onUpdate != null) {
                            onUpdate(0.5 + 0.5 - (facetCount - maximumNumberOfFacets) / (startFacetCount - maximumNumberOfFacets));
                        }
                    }
                }
                // this.trimFacets(facetResult, imgColorIndices, colorDistances, visitedCache);
                if (onUpdate != null) {
                    onUpdate(1);
                }
            });
        }
        // /**
        //  * Trims facets with narrow paths either horizontally or vertically, potentially splitting the facet into multiple facets
        //  */
        // public static trimFacets(facetResult: FacetResult, imgColorIndices: Uint8Array2D, colorDistances: number[][], visitedArrayCache: BooleanArray2D) {
        //     for (const facet of facetResult.facets) {
        //         if (facet !== null) {
        //             const facetPointsToReallocate: Point[] = [];
        //             for (let y: number = facet.bbox.minY; y <= facet.bbox.maxY; y++) {
        //                 for (let x: number = facet.bbox.minX; x <= facet.bbox.maxX; x++) {
        //                     if (x > 0 && y > 0 && x < facetResult.width - 1 && y < facetResult.height - 1 &&
        //                         facetResult.facetMap.get(x, y) === facet.id) {
        //                         // check if isolated horizontally
        //                         const top = facetResult.facetMap.get(x, y - 1);
        //                         const bottom = facetResult.facetMap.get(x, y + 1);
        //                         if (top !== facet.id && bottom !== facet.id) {
        //                             // . ? .
        //                             // . F .
        //                             // . ? .
        //                             // mark pixel of facet that it should be removed
        //                             facetPointsToReallocate.push(new Point(x, y));
        //                             const closestNeighbour = FacetReducer.getClosestNeighbourForPixel(facet, facetResult, x, y, colorDistances);
        //                             // copy over color of closest neighbour
        //                             imgColorIndices.set(x, y, facetResult.facets[closestNeighbour]!.color);
        //                             console.log("Flagged " + x + "," + y + " to trim");
        //                         }
        //                     }
        //                 }
        //             }
        //             if (facetPointsToReallocate.length > 0) {
        //                 FacetReducer.rebuildForFacetChange(visitedArrayCache, facet, imgColorIndices, facetResult);
        //             }
        //         }
        //     }
        // }
        /**
         * Deletes a facet. All points belonging to the facet are moved to the nearest neighbour facet
         * based on the distance of the neighbour border points. This results in a voronoi like filling in of the
         * void the deletion made
         */
        static deleteFacet(facetIdToRemove, facetResult, imgColorIndices, colorDistances, visitedArrayCache) {
            const facetToRemove = facetResult.facets[facetIdToRemove];
            if (facetToRemove === null) { // already removed
                return;
            }
            if (facetToRemove.neighbourFacetsIsDirty) {
                facetCreator_1.FacetCreator.buildFacetNeighbour(facetToRemove, facetResult);
            }
            if (facetToRemove.neighbourFacets.length > 0) {
                // there are many small facets, it's faster to just iterate over all points within its bounding box
                // and seeing which belong to the facet than to keep track of the inner points (along with the border points)
                // per facet, because that generates a lot of extra heap objects that need to be garbage collected each time
                // a facet is rebuilt
                for (let j = facetToRemove.bbox.minY; j <= facetToRemove.bbox.maxY; j++) {
                    for (let i = facetToRemove.bbox.minX; i <= facetToRemove.bbox.maxX; i++) {
                        if (facetResult.facetMap.get(i, j) === facetToRemove.id) {
                            const closestNeighbour = FacetReducer.getClosestNeighbourForPixel(facetToRemove, facetResult, i, j, colorDistances);
                            if (closestNeighbour !== -1) {
                                // copy over color of closest neighbour
                                imgColorIndices.set(i, j, facetResult.facets[closestNeighbour].color);
                            }
                            else {
                                console.warn(`No closest neighbour found for point ${i},${j}`);
                            }
                        }
                    }
                }
            }
            else {
                console.warn(`Facet ${facetToRemove.id} does not have any neighbours`);
            }
            // Rebuild all the neighbour facets that have been changed. While it could probably be faster by just adding the points manually
            // to the facet map and determine if the border points are still valid, it's more complex than that. It's possible that due to the change in points
            // that 2 neighbours of the same colors have become linked and need to merged as well. So it's easier to just rebuild the entire facet
            FacetReducer.rebuildForFacetChange(visitedArrayCache, facetToRemove, imgColorIndices, facetResult);
            // now mark the facet to remove as deleted
            facetResult.facets[facetToRemove.id] = null;
        }
        static rebuildForFacetChange(visitedArrayCache, facet, imgColorIndices, facetResult) {
            FacetReducer.rebuildChangedNeighbourFacets(visitedArrayCache, facet, imgColorIndices, facetResult);
            // sanity check: make sure that all points have been replaced by neighbour facets. It's possible that some points will have
            // been left out because there is no continuity with the neighbour points
            // this occurs for diagonal points to the neighbours and more often when the closest
            // color is chosen when distances are equal.
            // It's probably possible to enforce that this will never happen in the above code but
            // this is a constraint that is expensive to enforce and doesn't happen all that much
            // so instead try and merge if with any of its direct neighbours if possible
            let needsToRebuild = false;
            for (let y = facet.bbox.minY; y <= facet.bbox.maxY; y++) {
                for (let x = facet.bbox.minX; x <= facet.bbox.maxX; x++) {
                    if (facetResult.facetMap.get(x, y) === facet.id) {
                        console.warn(`Point ${x},${y} was reallocated to neighbours for facet ${facet.id}`);
                        needsToRebuild = true;
                        if (x - 1 >= 0 && facetResult.facetMap.get(x - 1, y) !== facet.id && facetResult.facets[facetResult.facetMap.get(x - 1, y)] !== null) {
                            imgColorIndices.set(x, y, facetResult.facets[facetResult.facetMap.get(x - 1, y)].color);
                        }
                        else if (y - 1 >= 0 && facetResult.facetMap.get(x, y - 1) !== facet.id && facetResult.facets[facetResult.facetMap.get(x, y - 1)] !== null) {
                            imgColorIndices.set(x, y, facetResult.facets[facetResult.facetMap.get(x, y - 1)].color);
                        }
                        else if (x + 1 < facetResult.width && facetResult.facetMap.get(x + 1, y) !== facet.id && facetResult.facets[facetResult.facetMap.get(x + 1, y)] !== null) {
                            imgColorIndices.set(x, y, facetResult.facets[facetResult.facetMap.get(x + 1, y)].color);
                        }
                        else if (y + 1 < facetResult.height && facetResult.facetMap.get(x, y + 1) !== facet.id && facetResult.facets[facetResult.facetMap.get(x, y + 1)] !== null) {
                            imgColorIndices.set(x, y, facetResult.facets[facetResult.facetMap.get(x, y + 1)].color);
                        }
                        else {
                            console.error(`Unable to reallocate point ${x},${y}`);
                        }
                    }
                }
            }
            // now we need to go through the thing again to build facets and update the neighbours
            if (needsToRebuild) {
                FacetReducer.rebuildChangedNeighbourFacets(visitedArrayCache, facet, imgColorIndices, facetResult);
            }
        }
        /**
         * Determines the closest neighbour for a given pixel of a facet, based on the closest distance to the neighbour AND the when tied, the closest color
         */
        static getClosestNeighbourForPixel(facetToRemove, facetResult, x, y, colorDistances) {
            let closestNeighbour = -1;
            let minDistance = Number.MAX_VALUE;
            let minColorDistance = Number.MAX_VALUE;
            // ensure the neighbour facets is up to date if it was marked as dirty
            if (facetToRemove.neighbourFacetsIsDirty) {
                facetCreator_1.FacetCreator.buildFacetNeighbour(facetToRemove, facetResult);
            }
            // determine which neighbour will receive the current point based on the distance, and if there are more with the same
            // distance, then take the neighbour with the closes color
            for (const neighbourIdx of facetToRemove.neighbourFacets) {
                const neighbour = facetResult.facets[neighbourIdx];
                if (neighbour != null) {
                    for (const bpt of neighbour.borderPoints) {
                        const distance = bpt.distanceToCoord(x, y);
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestNeighbour = neighbourIdx;
                            minColorDistance = Number.MAX_VALUE; // reset color distance
                        }
                        else if (distance === minDistance) {
                            // if the distance is equal as the min distance
                            // then see if the neighbour's color is closer to the current color
                            // note: this causes morepoints to be reallocated to different neighbours
                            // in the sanity check later, but still yields a better visual result
                            const colorDistance = colorDistances[facetToRemove.color][neighbour.color];
                            if (colorDistance < minColorDistance) {
                                minColorDistance = colorDistance;
                                closestNeighbour = neighbourIdx;
                            }
                        }
                    }
                }
            }
            return closestNeighbour;
        }
        /**
         *  Rebuilds the given changed facets
         */
        static rebuildChangedNeighbourFacets(visitedArrayCache, facetToRemove, imgColorIndices, facetResult) {
            const changedNeighboursSet = {};
            if (facetToRemove.neighbourFacetsIsDirty) {
                facetCreator_1.FacetCreator.buildFacetNeighbour(facetToRemove, facetResult);
            }
            for (const neighbourIdx of facetToRemove.neighbourFacets) {
                const neighbour = facetResult.facets[neighbourIdx];
                if (neighbour != null) {
                    // re-evaluate facet
                    // track all the facets that needs to have their neighbour list updated, which is also going to be all the neighbours of the neighbours that are being updated
                    changedNeighboursSet[neighbourIdx] = true;
                    if (neighbour.neighbourFacetsIsDirty) {
                        facetCreator_1.FacetCreator.buildFacetNeighbour(neighbour, facetResult);
                    }
                    for (const n of neighbour.neighbourFacets) {
                        changedNeighboursSet[n] = true;
                    }
                    // rebuild the neighbour facet
                    const newFacet = facetCreator_1.FacetCreator.buildFacet(neighbourIdx, neighbour.color, neighbour.borderPoints[0].x, neighbour.borderPoints[0].y, visitedArrayCache, imgColorIndices, facetResult);
                    facetResult.facets[neighbourIdx] = newFacet;
                    // it's possible that any of the neighbour facets are now overlapping
                    // because if for example facet Red - Green - Red, Green is removed
                    // then it will become Red - Red and both facets will overlap
                    // this means the facet will have 0 points remaining
                    if (newFacet.pointCount === 0) {
                        // remove the empty facet as well
                        facetResult.facets[neighbourIdx] = null;
                    }
                }
            }
            // reset the visited array for all neighbours
            // while the visited array could be recreated per facet to remove, it's quite big and introduces
            // a lot of allocation / cleanup overhead. Due to the size of the facets it's usually faster
            // to just flag every point of the facet as false again
            if (facetToRemove.neighbourFacetsIsDirty) {
                facetCreator_1.FacetCreator.buildFacetNeighbour(facetToRemove, facetResult);
            }
            for (const neighbourIdx of facetToRemove.neighbourFacets) {
                const neighbour = facetResult.facets[neighbourIdx];
                if (neighbour != null) {
                    for (let y = neighbour.bbox.minY; y <= neighbour.bbox.maxY; y++) {
                        for (let x = neighbour.bbox.minX; x <= neighbour.bbox.maxX; x++) {
                            if (facetResult.facetMap.get(x, y) === neighbour.id) {
                                visitedArrayCache.set(x, y, false);
                            }
                        }
                    }
                }
            }
            // rebuild neighbour array for affected neighbours
            for (const k of Object.keys(changedNeighboursSet)) {
                if (changedNeighboursSet.hasOwnProperty(k)) {
                    const neighbourIdx = parseInt(k);
                    const f = facetResult.facets[neighbourIdx];
                    if (f != null) {
                        // it's a lot faster when deferring the neighbour array updates
                        // because a lot of facets that are deleted share the same facet neighbours
                        // and removing the unnecessary neighbour array checks until they it's needed
                        // speeds things up significantly
                        // FacetCreator.buildFacetNeighbour(f, facetResult);
                        f.neighbourFacets = null;
                        f.neighbourFacetsIsDirty = true;
                    }
                }
            }
        }
    }
    exports.FacetReducer = FacetReducer;
});
define("facetCreator", ["require", "exports", "common", "lib/fill", "structs/boundingbox", "structs/point", "structs/typedarrays", "facetmanagement"], function (require, exports, common_5, fill_1, boundingbox_1, point_4, typedarrays_4, facetmanagement_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FacetCreator {
        /**
         *  Constructs the facets with its border points for each area of pixels of the same color
         */
        static getFacets(width, height, imgColorIndices, onUpdate = null) {
            return __awaiter(this, void 0, void 0, function* () {
                const result = new facetmanagement_3.FacetResult();
                result.width = width;
                result.height = height;
                // setup visited mask
                const visited = new typedarrays_4.BooleanArray2D(result.width, result.height);
                // setup facet map & array
                result.facetMap = new typedarrays_4.Uint32Array2D(result.width, result.height);
                result.facets = [];
                // depth first traversal to find the different facets
                let count = 0;
                for (let j = 0; j < result.height; j++) {
                    for (let i = 0; i < result.width; i++) {
                        const colorIndex = imgColorIndices.get(i, j);
                        if (!visited.get(i, j)) {
                            const facetIndex = result.facets.length;
                            // build a facet starting at point i,j
                            const facet = FacetCreator.buildFacet(facetIndex, colorIndex, i, j, visited, imgColorIndices, result);
                            result.facets.push(facet);
                            if (count % 100 === 0) {
                                yield common_5.delay(0);
                                if (onUpdate != null) {
                                    onUpdate(count / (result.width * result.height));
                                }
                            }
                        }
                        count++;
                    }
                }
                yield common_5.delay(0);
                // fill in the neighbours of all facets by checking the neighbours of the border points
                for (const f of result.facets) {
                    if (f != null) {
                        FacetCreator.buildFacetNeighbour(f, result);
                    }
                }
                if (onUpdate != null) {
                    onUpdate(1);
                }
                return result;
            });
        }
        /**
         *  Builds a facet at given x,y using depth first search to visit all pixels of the same color
         */
        static buildFacet(facetIndex, facetColorIndex, x, y, visited, imgColorIndices, facetResult) {
            const facet = new facetmanagement_3.Facet();
            facet.id = facetIndex;
            facet.color = facetColorIndex;
            facet.bbox = new boundingbox_1.BoundingBox();
            facet.borderPoints = [];
            facet.neighbourFacetsIsDirty = true; // not built neighbours yet
            facet.neighbourFacets = null;
            fill_1.fill(x, y, facetResult.width, facetResult.height, (ptx, pty) => visited.get(ptx, pty) || imgColorIndices.get(ptx, pty) !== facetColorIndex, (ptx, pty) => {
                visited.set(ptx, pty, true);
                facetResult.facetMap.set(ptx, pty, facetIndex);
                facet.pointCount++;
                // determine if the point is a border or not
                /*  const isInnerPoint = (ptx - 1 >= 0 && imgColorIndices.get(ptx - 1, pty) === facetColorIndex) &&
                      (pty - 1 >= 0 && imgColorIndices.get(ptx, pty - 1) === facetColorIndex) &&
                      (ptx + 1 < facetResult.width && imgColorIndices.get(ptx + 1, pty) === facetColorIndex) &&
                      (pty + 1 < facetResult.height && imgColorIndices.get(ptx, pty + 1) === facetColorIndex);
                */
                const isInnerPoint = imgColorIndices.matchAllAround(ptx, pty, facetColorIndex);
                if (!isInnerPoint) {
                    facet.borderPoints.push(new point_4.Point(ptx, pty));
                }
                // update bounding box of facet
                if (ptx > facet.bbox.maxX) {
                    facet.bbox.maxX = ptx;
                }
                if (pty > facet.bbox.maxY) {
                    facet.bbox.maxY = pty;
                }
                if (ptx < facet.bbox.minX) {
                    facet.bbox.minX = ptx;
                }
                if (pty < facet.bbox.minY) {
                    facet.bbox.minY = pty;
                }
            });
            /*
               // using a 1D flattened stack (x*width+y), we can avoid heap allocations of Point objects, which halves the garbage collection time
             let stack: number[] = [];
             stack.push(y * facetResult.width + x);
    
             while (stack.length > 0) {
                 let pt = stack.pop()!;
                 let ptx = pt % facetResult.width;
                 let pty = Math.floor(pt / facetResult.width);
    
                 // if the point wasn't visited before and matches
                 // the same color
                 if (!visited.get(ptx, pty) &&
                     imgColorIndices.get(ptx, pty) == facetColorIndex) {
    
                     visited.set(ptx, pty, true);
                     facetResult.facetMap.set(ptx, pty, facetIndex);
                     facet.pointCount++;
    
                     // determine if the point is a border or not
                     let isInnerPoint = (ptx - 1 >= 0 && imgColorIndices.get(ptx - 1, pty) == facetColorIndex) &&
                         (pty - 1 >= 0 && imgColorIndices.get(ptx, pty - 1) == facetColorIndex) &&
                         (ptx + 1 < facetResult.width && imgColorIndices.get(ptx + 1, pty) == facetColorIndex) &&
                         (pty + 1 < facetResult.height && imgColorIndices.get(ptx, pty + 1) == facetColorIndex);
    
                     if (!isInnerPoint)
                         facet.borderPoints.push(new Point(ptx, pty));
    
                     // update bounding box of facet
                     if (ptx > facet.bbox.maxX) facet.bbox.maxX = ptx;
                     if (pty > facet.bbox.maxY) facet.bbox.maxY = pty;
                     if (ptx < facet.bbox.minX) facet.bbox.minX = ptx;
                     if (pty < facet.bbox.minY) facet.bbox.minY = pty;
    
                     // visit direct adjacent points
                     if (ptx - 1 >= 0 && !visited.get(ptx - 1, pty))
                         stack.push(pty * facetResult.width + (ptx - 1)); //stack.push(new Point(pt.x - 1, pt.y));
                     if (pty - 1 >= 0 && !visited.get(ptx, pty - 1))
                         stack.push((pty - 1) * facetResult.width + ptx); //stack.push(new Point(pt.x, pt.y - 1));
                     if (ptx + 1 < facetResult.width && !visited.get(ptx + 1, pty))
                         stack.push(pty * facetResult.width + (ptx + 1));//stack.push(new Point(pt.x + 1, pt.y));
                     if (pty + 1 < facetResult.height && !visited.get(ptx, pty + 1))
                         stack.push((pty + 1) * facetResult.width + ptx); //stack.push(new Point(pt.x, pt.y + 1));
                 }
             }
             */
            return facet;
        }
        /**
         * Check which neighbour facets the given facet has by checking the neighbour facets at each border point
         */
        static buildFacetNeighbour(facet, facetResult) {
            facet.neighbourFacets = [];
            const uniqueFacets = {}; // poor man's set
            for (const pt of facet.borderPoints) {
                if (pt.x - 1 >= 0) {
                    const leftFacetId = facetResult.facetMap.get(pt.x - 1, pt.y);
                    if (leftFacetId !== facet.id) {
                        uniqueFacets[leftFacetId] = true;
                    }
                }
                if (pt.y - 1 >= 0) {
                    const topFacetId = facetResult.facetMap.get(pt.x, pt.y - 1);
                    if (topFacetId !== facet.id) {
                        uniqueFacets[topFacetId] = true;
                    }
                }
                if (pt.x + 1 < facetResult.width) {
                    const rightFacetId = facetResult.facetMap.get(pt.x + 1, pt.y);
                    if (rightFacetId !== facet.id) {
                        uniqueFacets[rightFacetId] = true;
                    }
                }
                if (pt.y + 1 < facetResult.height) {
                    const bottomFacetId = facetResult.facetMap.get(pt.x, pt.y + 1);
                    if (bottomFacetId !== facet.id) {
                        uniqueFacets[bottomFacetId] = true;
                    }
                }
            }
            for (const k of Object.keys(uniqueFacets)) {
                if (uniqueFacets.hasOwnProperty(k)) {
                    facet.neighbourFacets.push(parseInt(k));
                }
            }
            // the neighbour array is updated so it's not dirty anymore
            facet.neighbourFacetsIsDirty = false;
        }
    }
    exports.FacetCreator = FacetCreator;
});
define("lib/datastructs", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Map {
        constructor() {
            this.obj = {};
        }
        containsKey(key) {
            return key in this.obj;
        }
        getKeys() {
            const keys = [];
            for (const el in this.obj) {
                if (this.obj.hasOwnProperty(el)) {
                    keys.push(el);
                }
            }
            return keys;
        }
        get(key) {
            const o = this.obj[key];
            if (typeof o === "undefined") {
                return null;
            }
            else {
                return o;
            }
        }
        put(key, value) {
            this.obj[key] = value;
        }
        remove(key) {
            delete this.obj[key];
        }
        clone() {
            const m = new Map();
            m.obj = {};
            for (const p in this.obj) {
                m.obj[p] = this.obj[p];
            }
            return m;
        }
    }
    exports.Map = Map;
    class Heap {
        constructor() {
            this.array = [];
            this.keyMap = new Map();
        }
        add(obj) {
            if (this.keyMap.containsKey(obj.getKey())) {
                throw new Error("Item with key " + obj.getKey() + " already exists in the heap");
            }
            this.array.push(obj);
            this.keyMap.put(obj.getKey(), this.array.length - 1);
            this.checkParentRequirement(this.array.length - 1);
        }
        replaceAt(idx, newobj) {
            this.array[idx] = newobj;
            this.keyMap.put(newobj.getKey(), idx);
            this.checkParentRequirement(idx);
            this.checkChildrenRequirement(idx);
        }
        shift() {
            return this.removeAt(0);
        }
        remove(obj) {
            const idx = this.keyMap.get(obj.getKey());
            if (idx === -1) {
                return;
            }
            this.removeAt(idx);
        }
        removeWhere(predicate) {
            const itemsToRemove = [];
            for (let i = this.array.length - 1; i >= 0; i--) {
                if (predicate(this.array[i])) {
                    itemsToRemove.push(this.array[i]);
                }
            }
            for (const el of itemsToRemove) {
                this.remove(el);
            }
            for (const el of this.array) {
                if (predicate(el)) {
                    console.log("Idx of element not removed: " + this.keyMap.get(el.getKey()));
                    throw new Error("element not removed: " + el.getKey());
                }
            }
        }
        removeAt(idx) {
            const obj = this.array[idx];
            this.keyMap.remove(obj.getKey());
            const isLastElement = idx === this.array.length - 1;
            if (this.array.length > 0) {
                const newobj = this.array.pop();
                if (!isLastElement && this.array.length > 0) {
                    this.replaceAt(idx, newobj);
                }
            }
            return obj;
        }
        foreach(func) {
            const arr = this.array.sort((e, e2) => e.compareTo(e2));
            for (const el of arr) {
                func(el);
            }
        }
        peek() {
            return this.array[0];
        }
        contains(key) {
            return this.keyMap.containsKey(key);
        }
        at(key) {
            const obj = this.keyMap.get(key);
            if (typeof obj === "undefined") {
                return null;
            }
            else {
                return this.array[obj];
            }
        }
        size() {
            return this.array.length;
        }
        checkHeapRequirement(item) {
            const idx = this.keyMap.get(item.getKey());
            if (idx != null) {
                this.checkParentRequirement(idx);
                this.checkChildrenRequirement(idx);
            }
        }
        checkChildrenRequirement(idx) {
            let stop = false;
            while (!stop) {
                const left = this.getLeftChildIndex(idx);
                let right = left === -1 ? -1 : left + 1;
                if (left === -1) {
                    return;
                }
                if (right >= this.size()) {
                    right = -1;
                }
                let minIdx;
                if (right === -1) {
                    minIdx = left;
                }
                else {
                    minIdx = (this.array[left].compareTo(this.array[right]) < 0) ? left : right;
                }
                if (this.array[idx].compareTo(this.array[minIdx]) > 0) {
                    this.swap(idx, minIdx);
                    idx = minIdx; // iteratively instead of recursion for this.checkChildrenRequirement(minIdx);
                }
                else {
                    stop = true;
                }
            }
        }
        checkParentRequirement(idx) {
            let curIdx = idx;
            let parentIdx = Heap.getParentIndex(curIdx);
            while (parentIdx >= 0 && this.array[parentIdx].compareTo(this.array[curIdx]) > 0) {
                this.swap(curIdx, parentIdx);
                curIdx = parentIdx;
                parentIdx = Heap.getParentIndex(curIdx);
            }
        }
        dump() {
            if (this.size() === 0) {
                return;
            }
            const idx = 0;
            const leftIdx = this.getLeftChildIndex(idx);
            const rightIdx = leftIdx + 1;
            console.log(this.array);
            console.log("--- keymap ---");
            console.log(this.keyMap);
        }
        swap(i, j) {
            this.keyMap.put(this.array[i].getKey(), j);
            this.keyMap.put(this.array[j].getKey(), i);
            const tmp = this.array[i];
            this.array[i] = this.array[j];
            this.array[j] = tmp;
        }
        getLeftChildIndex(curIdx) {
            const idx = ((curIdx + 1) * 2) - 1;
            if (idx >= this.array.length) {
                return -1;
            }
            else {
                return idx;
            }
        }
        static getParentIndex(curIdx) {
            if (curIdx === 0) {
                return -1;
            }
            return Math.floor((curIdx + 1) / 2) - 1;
        }
        clone() {
            const h = new Heap();
            h.array = this.array.slice(0);
            h.keyMap = this.keyMap.clone();
            return h;
        }
    }
    class PriorityQueue {
        constructor() {
            this.heap = new Heap();
        }
        enqueue(obj) {
            this.heap.add(obj);
        }
        peek() {
            return this.heap.peek();
        }
        updatePriority(key) {
            this.heap.checkHeapRequirement(key);
        }
        get(key) {
            return this.heap.at(key);
        }
        get size() {
            return this.heap.size();
        }
        dequeue() {
            return this.heap.shift();
        }
        dump() {
            this.heap.dump();
        }
        contains(key) {
            return this.heap.contains(key);
        }
        removeWhere(predicate) {
            this.heap.removeWhere(predicate);
        }
        foreach(func) {
            this.heap.foreach(func);
        }
        clone() {
            const p = new PriorityQueue();
            p.heap = this.heap.clone();
            return p;
        }
    }
    exports.PriorityQueue = PriorityQueue;
});
define("lib/polylabel", ["require", "exports", "lib/datastructs"], function (require, exports, datastructs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function polylabel(polygon, precision = 1.0) {
        // find the bounding box of the outer ring
        let minX = Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;
        let maxX = Number.MIN_VALUE;
        let maxY = Number.MIN_VALUE;
        for (let i = 0; i < polygon[0].length; i++) {
            const p = polygon[0][i];
            if (p.x < minX) {
                minX = p.x;
            }
            if (p.y < minY) {
                minY = p.y;
            }
            if (p.x > maxX) {
                maxX = p.x;
            }
            if (p.y > maxY) {
                maxY = p.y;
            }
        }
        const width = maxX - minX;
        const height = maxY - minY;
        const cellSize = Math.min(width, height);
        let h = cellSize / 2;
        // a priority queue of cells in order of their "potential" (max distance to polygon)
        const cellQueue = new datastructs_1.PriorityQueue();
        if (cellSize === 0) {
            return { pt: { x: minX, y: minY }, distance: 0 };
        }
        // cover polygon with initial cells
        for (let x = minX; x < maxX; x += cellSize) {
            for (let y = minY; y < maxY; y += cellSize) {
                cellQueue.enqueue(new Cell(x + h, y + h, h, polygon));
            }
        }
        // take centroid as the first best guess
        let bestCell = getCentroidCell(polygon);
        // special case for rectangular polygons
        const bboxCell = new Cell(minX + width / 2, minY + height / 2, 0, polygon);
        if (bboxCell.d > bestCell.d) {
            bestCell = bboxCell;
        }
        let numProbes = cellQueue.size;
        while (cellQueue.size > 0) {
            // pick the most promising cell from the queue
            const cell = cellQueue.dequeue();
            // update the best cell if we found a better one
            if (cell.d > bestCell.d) {
                bestCell = cell;
            }
            // do not drill down further if there's no chance of a better solution
            if (cell.max - bestCell.d <= precision) {
                continue;
            }
            // split the cell into four cells
            h = cell.h / 2;
            cellQueue.enqueue(new Cell(cell.x - h, cell.y - h, h, polygon));
            cellQueue.enqueue(new Cell(cell.x + h, cell.y - h, h, polygon));
            cellQueue.enqueue(new Cell(cell.x - h, cell.y + h, h, polygon));
            cellQueue.enqueue(new Cell(cell.x + h, cell.y + h, h, polygon));
            numProbes += 4;
        }
        return { pt: { x: bestCell.x, y: bestCell.y }, distance: bestCell.d };
    }
    exports.polylabel = polylabel;
    class Cell {
        constructor(x, y, h, polygon) {
            this.x = x;
            this.y = y;
            this.h = h;
            this.d = pointToPolygonDist(x, y, polygon);
            this.max = this.d + this.h * Math.SQRT2;
        }
        compareTo(other) {
            return other.max - this.max;
        }
        getKey() {
            return this.x + "," + this.y;
        }
    }
    // get squared distance from a point px,py to a segment [a-b]
    function getSegDistSq(px, py, a, b) {
        let x = a.x;
        let y = a.y;
        let dx = b.x - x;
        let dy = b.y - y;
        if (dx !== 0 || dy !== 0) {
            const t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);
            if (t > 1) {
                x = b.x;
                y = b.y;
            }
            else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }
        dx = px - x;
        dy = py - y;
        return dx * dx + dy * dy;
    }
    /**
     * Signed distance from point to polygon outline (negative if point is outside)
     */
    function pointToPolygonDist(x, y, polygon) {
        let inside = false;
        let minDistSq = Infinity;
        for (let k = 0; k < polygon.length; k++) {
            const ring = polygon[k];
            for (let i = 0, len = ring.length, j = len - 1; i < len; j = i++) {
                const a = ring[i];
                const b = ring[j];
                if ((a.y > y !== b.y > y) &&
                    (x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x)) {
                    inside = !inside;
                }
                minDistSq = Math.min(minDistSq, getSegDistSq(x, y, a, b));
            }
        }
        return (inside ? 1 : -1) * Math.sqrt(minDistSq);
    }
    exports.pointToPolygonDist = pointToPolygonDist;
    // get polygon centroid
    function getCentroidCell(polygon) {
        let area = 0;
        let x = 0;
        let y = 0;
        const points = polygon[0];
        for (let i = 0, len = points.length, j = len - 1; i < len; j = i++) {
            const a = points[i];
            const b = points[j];
            const f = a.x * b.y - b.x * a.y;
            x += (a.x + b.x) * f;
            y += (a.y + b.y) * f;
            area += f * 3;
        }
        if (area === 0) {
            return new Cell(points[0].x, points[0].y, 0, polygon);
        }
        return new Cell(x / area, y / area, 0, polygon);
    }
});
define("facetLabelPlacer", ["require", "exports", "common", "lib/polylabel", "structs/boundingbox", "facetCreator"], function (require, exports, common_6, polylabel_1, boundingbox_2, facetCreator_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FacetLabelPlacer {
        /**
         *  Determines where to place the labels for each facet. This is done by calculating where
         *  in the polygon the largest circle can be contained, also called the pole of inaccessibility
         *  That's the spot where there will be the most room for the label.
         *  One tricky gotcha: neighbour facets can lay completely inside other facets and can overlap the label
         *  if only the outer border of the facet is taken in account. This is solved by adding the neighbours facet polygon that fall
         *  within the facet as additional polygon rings (why does everything look so easy to do yet never is under the hood :/)
         */
        static buildFacetLabelBounds(facetResult, onUpdate = null) {
            return __awaiter(this, void 0, void 0, function* () {
                let count = 0;
                for (const f of facetResult.facets) {
                    if (f != null) {
                        const polyRings = [];
                        // get the border path from the segments (that can have been reduced compared to facet actual border path)
                        const borderPath = f.getFullPathFromBorderSegments(true);
                        // outer path must be first ring
                        polyRings.push(borderPath);
                        const onlyOuterRing = [borderPath];
                        // now add all the neighbours of the facet as "inner" rings,
                        // regardless if they are inner or not. These are seen as areas where the label
                        // cannot be placed
                        if (f.neighbourFacetsIsDirty) {
                            facetCreator_2.FacetCreator.buildFacetNeighbour(f, facetResult);
                        }
                        for (const neighbourIdx of f.neighbourFacets) {
                            const neighbourPath = facetResult.facets[neighbourIdx].getFullPathFromBorderSegments(true);
                            const fallsInside = FacetLabelPlacer.doesNeighbourFallInsideInCurrentFacet(neighbourPath, f, onlyOuterRing);
                            if (fallsInside) {
                                polyRings.push(neighbourPath);
                            }
                        }
                        const result = polylabel_1.polylabel(polyRings);
                        f.labelBounds = new boundingbox_2.BoundingBox();
                        // determine inner square within the circle
                        const innerPadding = 2 * Math.sqrt(2 * result.distance);
                        f.labelBounds.minX = result.pt.x - innerPadding;
                        f.labelBounds.maxX = result.pt.x + innerPadding;
                        f.labelBounds.minY = result.pt.y - innerPadding;
                        f.labelBounds.maxY = result.pt.y + innerPadding;
                        if (count % 100 === 0) {
                            yield common_6.delay(0);
                            if (onUpdate != null) {
                                onUpdate(f.id / facetResult.facets.length);
                            }
                        }
                    }
                    count++;
                }
                if (onUpdate != null) {
                    onUpdate(1);
                }
            });
        }
        /**
         *  Checks whether a neighbour border path is fully within the current facet border path
         */
        static doesNeighbourFallInsideInCurrentFacet(neighbourPath, f, onlyOuterRing) {
            let fallsInside = true;
            // fast test to see if the neighbour falls inside the bbox of the facet
            for (let i = 0; i < neighbourPath.length && fallsInside; i++) {
                if (neighbourPath[i].x >= f.bbox.minX && neighbourPath[i].x <= f.bbox.maxX &&
                    neighbourPath[i].y >= f.bbox.minY && neighbourPath[i].y <= f.bbox.maxY) {
                    // ok
                }
                else {
                    fallsInside = false;
                }
            }
            if (fallsInside) {
                // do a more fine grained but more expensive check to see if each of the points fall within the polygon
                for (let i = 0; i < neighbourPath.length && fallsInside; i++) {
                    const distance = polylabel_1.pointToPolygonDist(neighbourPath[i].x, neighbourPath[i].y, onlyOuterRing);
                    if (distance < 0) {
                        // falls outside
                        fallsInside = false;
                    }
                }
            }
            return fallsInside;
        }
    }
    exports.FacetLabelPlacer = FacetLabelPlacer;
});
/**
 * Module that manages the GUI when processing
 */
define("guiprocessmanager", ["require", "exports", "colorreductionmanagement", "common", "facetBorderSegmenter", "facetBorderTracer", "facetCreator", "facetLabelPlacer", "facetmanagement", "facetReducer", "gui", "structs/point"], function (require, exports, colorreductionmanagement_2, common_7, facetBorderSegmenter_1, facetBorderTracer_1, facetCreator_3, facetLabelPlacer_1, facetmanagement_4, facetReducer_1, gui_1, point_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ProcessResult {
    }
    exports.ProcessResult = ProcessResult;
    /**
     *  Manages the GUI states & processes the image step by step
     */
    class GUIProcessManager {
        static process(settings, cancellationToken) {
            return __awaiter(this, void 0, void 0, function* () {
                const c = document.getElementById("canvas");
                const ctx = c.getContext("2d");
                let imgData = ctx.getImageData(0, 0, c.width, c.height);
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
                    const tempCanvas = document.createElement("canvas");
                    tempCanvas.width = width;
                    tempCanvas.height = height;
                    tempCanvas.getContext("2d").drawImage(c, 0, 0, width, height);
                    c.width = width;
                    c.height = height;
                    ctx.drawImage(tempCanvas, 0, 0, width, height);
                    imgData = ctx.getImageData(0, 0, c.width, c.height);
                }
                // reset progress
                $(".status .progress .determinate").css("width", "0px");
                $(".status").removeClass("complete");
                const tabsOutput = M.Tabs.getInstance(document.getElementById("tabsOutput"));
                // k-means clustering
                const kmeansImgData = yield GUIProcessManager.processKmeansClustering(imgData, tabsOutput, ctx, settings, cancellationToken);
                let facetResult = new facetmanagement_4.FacetResult();
                let colormapResult = new colorreductionmanagement_2.ColorMapResult();
                // build color map
                colormapResult = colorreductionmanagement_2.ColorReducer.createColorMap(kmeansImgData);
                if (settings.narrowPixelStripCleanupRuns === 0) {
                    // facet building
                    facetResult = yield GUIProcessManager.processFacetBuilding(colormapResult, cancellationToken);
                    // facet reduction
                    yield GUIProcessManager.processFacetReduction(facetResult, tabsOutput, settings, colormapResult, cancellationToken);
                }
                else {
                    for (let run = 0; run < settings.narrowPixelStripCleanupRuns; run++) {
                        // clean up narrow pixel strips
                        yield colorreductionmanagement_2.ColorReducer.processNarrowPixelStripCleanup(colormapResult);
                        // facet building
                        facetResult = yield GUIProcessManager.processFacetBuilding(colormapResult, cancellationToken);
                        // facet reduction
                        yield GUIProcessManager.processFacetReduction(facetResult, tabsOutput, settings, colormapResult, cancellationToken);
                        // the colormapResult.imgColorIndices get updated as the facets are reduced, so just do a few runs of pixel cleanup
                    }
                }
                // facet border tracing
                yield GUIProcessManager.processFacetBorderTracing(tabsOutput, facetResult, cancellationToken);
                // facet border segmentation
                const cBorderSegment = yield GUIProcessManager.processFacetBorderSegmentation(facetResult, tabsOutput, settings, cancellationToken);
                // facet label placement
                yield GUIProcessManager.processFacetLabelPlacement(facetResult, cBorderSegment, tabsOutput, cancellationToken);
                // everything is now ready to generate the SVG, return the result
                const processResult = new ProcessResult();
                processResult.facetResult = facetResult;
                processResult.colorsByIndex = colormapResult.colorsByIndex;
                return processResult;
            });
        }
        static processKmeansClustering(imgData, tabsOutput, ctx, settings, cancellationToken) {
            return __awaiter(this, void 0, void 0, function* () {
                gui_1.time("K-means clustering");
                const cKmeans = document.getElementById("cKMeans");
                cKmeans.width = imgData.width;
                cKmeans.height = imgData.height;
                const ctxKmeans = cKmeans.getContext("2d");
                ctxKmeans.fillStyle = "white";
                ctxKmeans.fillRect(0, 0, cKmeans.width, cKmeans.height);
                const kmeansImgData = ctxKmeans.getImageData(0, 0, cKmeans.width, cKmeans.height);
                tabsOutput.select("kmeans-pane");
                $(".status.kMeans").addClass("active");
                yield colorreductionmanagement_2.ColorReducer.applyKMeansClustering(imgData, kmeansImgData, ctx, settings, (kmeans) => {
                    const progress = (100 - (kmeans.currentDeltaDistanceDifference > 100 ? 100 : kmeans.currentDeltaDistanceDifference)) / 100;
                    $("#statusKMeans").css("width", Math.round(progress * 100) + "%");
                    ctxKmeans.putImageData(kmeansImgData, 0, 0);
                    console.log(kmeans.currentDeltaDistanceDifference);
                    if (cancellationToken.isCancelled) {
                        throw new Error("Cancelled");
                    }
                });
                $(".status").removeClass("active");
                $(".status.kMeans").addClass("complete");
                gui_1.timeEnd("K-means clustering");
                return kmeansImgData;
            });
        }
        static processFacetBuilding(colormapResult, cancellationToken) {
            return __awaiter(this, void 0, void 0, function* () {
                gui_1.time("Facet building");
                $(".status.facetBuilding").addClass("active");
                const facetResult = yield facetCreator_3.FacetCreator.getFacets(colormapResult.width, colormapResult.height, colormapResult.imgColorIndices, (progress) => {
                    if (cancellationToken.isCancelled) {
                        throw new Error("Cancelled");
                    }
                    $("#statusFacetBuilding").css("width", Math.round(progress * 100) + "%");
                });
                $(".status").removeClass("active");
                $(".status.facetBuilding").addClass("complete");
                gui_1.timeEnd("Facet building");
                return facetResult;
            });
        }
        static processFacetReduction(facetResult, tabsOutput, settings, colormapResult, cancellationToken) {
            return __awaiter(this, void 0, void 0, function* () {
                gui_1.time("Facet reduction");
                const cReduction = document.getElementById("cReduction");
                cReduction.width = facetResult.width;
                cReduction.height = facetResult.height;
                const ctxReduction = cReduction.getContext("2d");
                ctxReduction.fillStyle = "white";
                ctxReduction.fillRect(0, 0, cReduction.width, cReduction.height);
                const reductionImgData = ctxReduction.getImageData(0, 0, cReduction.width, cReduction.height);
                tabsOutput.select("reduction-pane");
                $(".status.facetReduction").addClass("active");
                yield facetReducer_1.FacetReducer.reduceFacets(settings.removeFacetsSmallerThanNrOfPoints, settings.removeFacetsFromLargeToSmall, settings.maximumNumberOfFacets, colormapResult.colorsByIndex, facetResult, colormapResult.imgColorIndices, (progress) => {
                    if (cancellationToken.isCancelled) {
                        throw new Error("Cancelled");
                    }
                    // update status & image
                    $("#statusFacetReduction").css("width", Math.round(progress * 100) + "%");
                    let idx = 0;
                    for (let j = 0; j < facetResult.height; j++) {
                        for (let i = 0; i < facetResult.width; i++) {
                            const facet = facetResult.facets[facetResult.facetMap.get(i, j)];
                            const rgb = colormapResult.colorsByIndex[facet.color];
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
                gui_1.timeEnd("Facet reduction");
            });
        }
        static processFacetBorderTracing(tabsOutput, facetResult, cancellationToken) {
            return __awaiter(this, void 0, void 0, function* () {
                gui_1.time("Facet border tracing");
                tabsOutput.select("borderpath-pane");
                const cBorderPath = document.getElementById("cBorderPath");
                cBorderPath.width = facetResult.width;
                cBorderPath.height = facetResult.height;
                const ctxBorderPath = cBorderPath.getContext("2d");
                $(".status.facetBorderPath").addClass("active");
                yield facetBorderTracer_1.FacetBorderTracer.buildFacetBorderPaths(facetResult, (progress) => {
                    if (cancellationToken.isCancelled) {
                        throw new Error("Cancelled");
                    }
                    // update status & image
                    $("#statusFacetBorderPath").css("width", Math.round(progress * 100) + "%");
                    ctxBorderPath.fillStyle = "white";
                    ctxBorderPath.fillRect(0, 0, cBorderPath.width, cBorderPath.height);
                    for (const f of facetResult.facets) {
                        if (f != null && f.borderPath != null) {
                            ctxBorderPath.beginPath();
                            ctxBorderPath.moveTo(f.borderPath[0].getWallX(), f.borderPath[0].getWallY());
                            for (let i = 1; i < f.borderPath.length; i++) {
                                ctxBorderPath.lineTo(f.borderPath[i].getWallX(), f.borderPath[i].getWallY());
                            }
                            ctxBorderPath.stroke();
                        }
                    }
                });
                $(".status").removeClass("active");
                $(".status.facetBorderPath").addClass("complete");
                gui_1.timeEnd("Facet border tracing");
            });
        }
        static processFacetBorderSegmentation(facetResult, tabsOutput, settings, cancellationToken) {
            return __awaiter(this, void 0, void 0, function* () {
                gui_1.time("Facet border segmentation");
                const cBorderSegment = document.getElementById("cBorderSegmentation");
                cBorderSegment.width = facetResult.width;
                cBorderSegment.height = facetResult.height;
                const ctxBorderSegment = cBorderSegment.getContext("2d");
                tabsOutput.select("bordersegmentation-pane");
                $(".status.facetBorderSegmentation").addClass("active");
                yield facetBorderSegmenter_1.FacetBorderSegmenter.buildFacetBorderSegments(facetResult, settings.nrOfTimesToHalveBorderSegments, (progress) => {
                    if (cancellationToken.isCancelled) {
                        throw new Error("Cancelled");
                    }
                    // update status & image
                    $("#statusFacetBorderSegmentation").css("width", Math.round(progress * 100) + "%");
                    ctxBorderSegment.fillStyle = "white";
                    ctxBorderSegment.fillRect(0, 0, cBorderSegment.width, cBorderSegment.height);
                    for (const f of facetResult.facets) {
                        if (f != null && progress > f.id / facetResult.facets.length) {
                            ctxBorderSegment.beginPath();
                            const path = f.getFullPathFromBorderSegments(false);
                            ctxBorderSegment.moveTo(path[0].x, path[0].y);
                            for (let i = 1; i < path.length; i++) {
                                ctxBorderSegment.lineTo(path[i].x, path[i].y);
                            }
                            ctxBorderSegment.stroke();
                        }
                    }
                });
                $(".status").removeClass("active");
                $(".status.facetBorderSegmentation").addClass("complete");
                gui_1.timeEnd("Facet border segmentation");
                return cBorderSegment;
            });
        }
        static processFacetLabelPlacement(facetResult, cBorderSegment, tabsOutput, cancellationToken) {
            return __awaiter(this, void 0, void 0, function* () {
                gui_1.time("Facet label placement");
                const cLabelPlacement = document.getElementById("cLabelPlacement");
                cLabelPlacement.width = facetResult.width;
                cLabelPlacement.height = facetResult.height;
                const ctxLabelPlacement = cLabelPlacement.getContext("2d");
                ctxLabelPlacement.fillStyle = "white";
                ctxLabelPlacement.fillRect(0, 0, cBorderSegment.width, cBorderSegment.height);
                ctxLabelPlacement.drawImage(cBorderSegment, 0, 0);
                tabsOutput.select("labelplacement-pane");
                $(".status.facetLabelPlacement").addClass("active");
                yield facetLabelPlacer_1.FacetLabelPlacer.buildFacetLabelBounds(facetResult, (progress) => {
                    if (cancellationToken.isCancelled) {
                        throw new Error("Cancelled");
                    }
                    // update status & image
                    $("#statusFacetLabelPlacement").css("width", Math.round(progress * 100) + "%");
                    for (const f of facetResult.facets) {
                        if (f != null && f.labelBounds != null) {
                            ctxLabelPlacement.fillStyle = "red";
                            ctxLabelPlacement.fillRect(f.labelBounds.minX, f.labelBounds.minY, f.labelBounds.width, f.labelBounds.height);
                        }
                    }
                });
                $(".status").removeClass("active");
                $(".status.facetLabelPlacement").addClass("complete");
                gui_1.timeEnd("Facet label placement");
            });
        }
        /**
         *  Creates a vector based SVG image of the facets with the given configuration
         */
        static createSVG(facetResult, colorsByIndex, sizeMultiplier, fill, stroke, addColorLabels, fontSize = 50, fontColor = "black", onUpdate = null) {
            return __awaiter(this, void 0, void 0, function* () {
                const xmlns = "http://www.w3.org/2000/svg";
                const svg = document.createElementNS(xmlns, "svg");
                svg.setAttribute("width", sizeMultiplier * facetResult.width + "");
                svg.setAttribute("height", sizeMultiplier * facetResult.height + "");
                let count = 0;
                for (const f of facetResult.facets) {
                    if (f != null && f.borderSegments.length > 0) {
                        let newpath = [];
                        const useSegments = true;
                        if (useSegments) {
                            newpath = f.getFullPathFromBorderSegments(false);
                            // shift from wall coordinates to pixel centers
                            /*for (const p of newpath) {
                                p.x+=0.5;
                                p.y+=0.5;
                            }*/
                        }
                        else {
                            for (let i = 0; i < f.borderPath.length; i++) {
                                newpath.push(new point_5.Point(f.borderPath[i].getWallX() + 0.5, f.borderPath[i].getWallY() + 0.5));
                            }
                        }
                        if (newpath[0].x !== newpath[newpath.length - 1].x || newpath[0].y !== newpath[newpath.length - 1].y) {
                            newpath.push(newpath[0]);
                        } // close loop if necessary
                        // Create a path in SVG's namespace
                        // using quadratic curve absolute positions
                        const svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                        let data = "M ";
                        data += newpath[0].x * sizeMultiplier + " " + newpath[0].y * sizeMultiplier + " ";
                        for (let i = 1; i < newpath.length; i++) {
                            const midpointX = (newpath[i].x + newpath[i - 1].x) / 2;
                            const midpointY = (newpath[i].y + newpath[i - 1].y) / 2;
                            data += "Q " + (midpointX * sizeMultiplier) + " " + (midpointY * sizeMultiplier) + " " + (newpath[i].x * sizeMultiplier) + " " + (newpath[i].y * sizeMultiplier) + " ";
                            // data += "L " + (newpath[i].x * sizeMultiplier) + " " + (newpath[i].y * sizeMultiplier) + " ";
                        }
                        data += "Z";
                        svgPath.setAttribute("data-facetId", f.id + "");
                        // Set path's data
                        svgPath.setAttribute("d", data);
                        if (stroke) {
                            svgPath.style.stroke = "#000";
                        }
                        else {
                            // make the border the same color as the fill color if there is no border stroke
                            // to not have gaps in between facets
                            if (fill) {
                                svgPath.style.stroke = `rgb(${colorsByIndex[f.color][0]},${colorsByIndex[f.color][1]},${colorsByIndex[f.color][2]})`;
                            }
                        }
                        svgPath.style.strokeWidth = "1px"; // Set stroke width
                        if (fill) {
                            svgPath.style.fill = `rgb(${colorsByIndex[f.color][0]},${colorsByIndex[f.color][1]},${colorsByIndex[f.color][2]})`;
                        }
                        else {
                            svgPath.style.fill = "none";
                        }
                        svg.appendChild(svgPath);
                        /*  for (const seg of f.borderSegments) {
                              const svgSegPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                              let segData = "M ";
                              const segPoints = seg.originalSegment.points;
                              segData += segPoints[0].x * sizeMultiplier + " " + segPoints[0].y * sizeMultiplier + " ";
                              for (let i: number = 1; i < segPoints.length; i++) {
                                  const midpointX = (segPoints[i].x + segPoints[i - 1].x) / 2;
                                  const midpointY = (segPoints[i].y + segPoints[i - 1].y) / 2;
                                  //data += "Q " + (midpointX * sizeMultiplier) + " " + (midpointY * sizeMultiplier) + " " + (newpath[i].x * sizeMultiplier) + " " + (newpath[i].y * sizeMultiplier) + " ";
                                  segData += "L " + (segPoints[i].x * sizeMultiplier) + " " + (segPoints[i].y * sizeMultiplier) + " ";
                              }
        
                              console.log("Facet " + f.id + ", segment " + segPoints[0].x + "," + segPoints[0].y + " -> " + segPoints[segPoints.length-1].x + "," +  segPoints[segPoints.length-1].y);
        
                              svgSegPath.setAttribute("data-segmentFacet", f.id + "");
                              // Set path's data
                              svgSegPath.setAttribute("d", segData);
                              svgSegPath.style.stroke = "#FF0";
                              svgSegPath.style.fill = "none";
                              svg.appendChild(svgSegPath);
                          }
                          */
                        // add the color labels if necessary. I mean, this is the whole idea behind the paint by numbers part
                        // so I don't know why you would hide them
                        if (addColorLabels) {
                            const txt = document.createElementNS(xmlns, "text");
                            txt.setAttribute("font-family", "Tahoma");
                            const nrOfDigits = (f.color + "").length;
                            txt.setAttribute("font-size", (fontSize / nrOfDigits) + "");
                            txt.setAttribute("dominant-baseline", "middle");
                            txt.setAttribute("text-anchor", "middle");
                            txt.setAttribute("fill", fontColor);
                            txt.textContent = f.color + "";
                            const subsvg = document.createElementNS(xmlns, "svg");
                            subsvg.setAttribute("width", f.labelBounds.width * sizeMultiplier + "");
                            subsvg.setAttribute("height", f.labelBounds.height * sizeMultiplier + "");
                            subsvg.setAttribute("overflow", "visible");
                            subsvg.setAttribute("viewBox", "-50 -50 100 100");
                            subsvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
                            subsvg.appendChild(txt);
                            const g = document.createElementNS(xmlns, "g");
                            g.setAttribute("class", "label");
                            g.setAttribute("transform", "translate(" + f.labelBounds.minX * sizeMultiplier + "," + f.labelBounds.minY * sizeMultiplier + ")");
                            g.appendChild(subsvg);
                            svg.appendChild(g);
                        }
                        if (count % 100 === 0) {
                            yield common_7.delay(0);
                            if (onUpdate != null) {
                                onUpdate(f.id / facetResult.facets.length);
                            }
                        }
                    }
                    count++;
                }
                if (onUpdate != null) {
                    onUpdate(1);
                }
                return svg;
            });
        }
    }
    exports.GUIProcessManager = GUIProcessManager;
});
/**
 * Module that provides function the GUI uses and updates the DOM accordingly
 */
define("gui", ["require", "exports", "common", "guiprocessmanager", "settings"], function (require, exports, common_8, guiprocessmanager_1, settings_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let processResult = null;
    let cancellationToken = new common_8.CancellationToken();
    const timers = {};
    function time(name) {
        console.time(name);
        timers[name] = new Date();
    }
    exports.time = time;
    function timeEnd(name) {
        console.timeEnd(name);
        const ms = new Date().getTime() - timers[name].getTime();
        log(name + ": " + ms + "ms");
        delete timers[name];
    }
    exports.timeEnd = timeEnd;
    function log(str) {
        $("#log").append("<br/><span>" + str + "</span>");
    }
    exports.log = log;
    function parseSettings() {
        const settings = new settings_2.Settings();
        if ($("#optColorSpaceRGB").prop("checked")) {
            settings.kMeansClusteringColorSpace = settings_2.ClusteringColorSpace.RGB;
        }
        else if ($("#optColorSpaceHSL").prop("checked")) {
            settings.kMeansClusteringColorSpace = settings_2.ClusteringColorSpace.HSL;
        }
        else if ($("#optColorSpaceRGB").prop("checked")) {
            settings.kMeansClusteringColorSpace = settings_2.ClusteringColorSpace.LAB;
        }
        if ($("#optFacetRemovalLargestToSmallest").prop("checked")) {
            settings.removeFacetsFromLargeToSmall = true;
        }
        else {
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
            }
            else {
                const rgbparts = tline.split(",");
                if (rgbparts.length === 3) {
                    let red = parseInt(rgbparts[0]);
                    let green = parseInt(rgbparts[1]);
                    let blue = parseInt(rgbparts[2]);
                    if (red < 0)
                        red = 0;
                    if (red > 255)
                        red = 255;
                    if (green < 0)
                        green = 0;
                    if (green > 255)
                        green = 255;
                    if (blue < 0)
                        blue = 0;
                    if (blue > 255)
                        blue = 255;
                    if (!isNaN(red) && !isNaN(green) && !isNaN(blue)) {
                        settings.kMeansColorRestrictions.push([red, green, blue]);
                    }
                }
            }
        }
        return settings;
    }
    exports.parseSettings = parseSettings;
    function process() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const settings = parseSettings();
                // cancel old process & create new
                cancellationToken.isCancelled = true;
                cancellationToken = new common_8.CancellationToken();
                processResult = yield guiprocessmanager_1.GUIProcessManager.process(settings, cancellationToken);
                yield updateOutput();
                const tabsOutput = M.Tabs.getInstance(document.getElementById("tabsOutput"));
                tabsOutput.select("output-pane");
            }
            catch (e) {
                log("Error: " + e.message + " at " + e.stack);
            }
        });
    }
    exports.process = process;
    function updateOutput() {
        return __awaiter(this, void 0, void 0, function* () {
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
                const svg = yield guiprocessmanager_1.GUIProcessManager.createSVG(processResult.facetResult, processResult.colorsByIndex, sizeMultiplier, fill, stroke, showLabels, fontSize, fontColor, (progress) => {
                    if (cancellationToken.isCancelled) {
                        throw new Error("Cancelled");
                    }
                    $("#statusSVGGenerate").css("width", Math.round(progress * 100) + "%");
                });
                $("#svgContainer").empty().append(svg);
                $("#palette").empty().append(createPaletteHtml(processResult.colorsByIndex));
                $("#palette .color").tooltip();
                $(".status").removeClass("active");
                $(".status.SVGGenerate").addClass("complete");
            }
        });
    }
    exports.updateOutput = updateOutput;
    function createPaletteHtml(colorsByIndex) {
        let html = "";
        for (let c = 0; c < colorsByIndex.length; c++) {
            const style = "background-color: " + `rgb(${colorsByIndex[c][0]},${colorsByIndex[c][1]},${colorsByIndex[c][2]})`;
            html += `<div class="color" class="tooltipped" style="${style}" data-tooltip="${colorsByIndex[c][0]},${colorsByIndex[c][1]},${colorsByIndex[c][2]}">${c}</div>`;
        }
        return $(html);
    }
    function downloadPalettePng() {
        if (processResult == null) {
            return;
        }
        const colorsByIndex = processResult.colorsByIndex;
        const canvas = document.createElement("canvas");
        const nrOfItemsPerRow = 10;
        const nrRows = Math.ceil(colorsByIndex.length / nrOfItemsPerRow);
        const margin = 10;
        const cellWidth = 80;
        const cellHeight = 70;
        canvas.width = margin + nrOfItemsPerRow * (cellWidth + margin);
        canvas.height = margin + nrRows * (cellHeight + margin);
        const ctx = canvas.getContext("2d");
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
    exports.downloadPalettePng = downloadPalettePng;
    function downloadPNG() {
        if ($("#svgContainer svg").length > 0) {
            saveSvgAsPng($("#svgContainer svg").get(0), "paintbynumbers.png");
        }
    }
    exports.downloadPNG = downloadPNG;
    function downloadSVG() {
        if ($("#svgContainer svg").length > 0) {
            const svgEl = $("#svgContainer svg").get(0);
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
    exports.downloadSVG = downloadSVG;
    function loadExample(imgId) {
        // load image
        const img = document.getElementById(imgId);
        const c = document.getElementById("canvas");
        const ctx = c.getContext("2d");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
    }
    exports.loadExample = loadExample;
});
define("lib/clipboard", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // From https://stackoverflow.com/a/35576409/694640
    /**
     * image pasting into canvas
     *
     * @param {string} canvas_id - canvas id
     * @param {boolean} autoresize - if canvas will be resized
     */
    class Clipboard {
        constructor(canvas_id, autoresize) {
            this.ctrl_pressed = false;
            this.command_pressed = false;
            this.paste_event_support = false;
            const _self = this;
            this.canvas = document.getElementById(canvas_id);
            this.ctx = this.canvas.getContext("2d");
            this.autoresize = autoresize;
            // handlers
            // document.addEventListener("keydown", function (e) {
            //     _self.on_keyboard_action(e);
            // }, false); // firefox fix
            // document.addEventListener("keyup", function (e) {
            //     _self.on_keyboardup_action(e);
            // }, false); // firefox fix
            document.addEventListener("paste", function (e) {
                _self.paste_auto(e);
            }, false); // official paste handler
            this.init();
        }
        // constructor - we ignore security checks here
        init() {
            this.pasteCatcher = document.createElement("div");
            this.pasteCatcher.setAttribute("id", "paste_ff");
            this.pasteCatcher.setAttribute("contenteditable", "");
            this.pasteCatcher.style.cssText = "opacity:0;position:fixed;top:0px;left:0px;width:10px;margin-left:-20px;";
            document.body.appendChild(this.pasteCatcher);
            const _self = this;
            // create an observer instance
            const observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (_self.paste_event_support === true || _self.ctrl_pressed === false || mutation.type !== "childList") {
                        // we already got data in paste_auto()
                        return true;
                    }
                    // if paste handle failed - capture pasted object manually
                    if (mutation.addedNodes.length === 1) {
                        if (mutation.addedNodes[0].src !== undefined) {
                            // image
                            _self.paste_createImage(mutation.addedNodes[0].src);
                        }
                        // register cleanup after some time.
                        setTimeout(function () {
                            _self.pasteCatcher.innerHTML = "";
                        }, 20);
                    }
                    return false;
                });
            });
            const target = document.getElementById("paste_ff");
            const config = { attributes: true, childList: true, characterData: true };
            observer.observe(target, config);
        }
        // default paste action
        paste_auto(e) {
            this.paste_event_support = false;
            if (this.pasteCatcher !== undefined) {
                this.pasteCatcher.innerHTML = "";
            }
            if (e.clipboardData) {
                const items = e.clipboardData.items;
                if (items) {
                    this.paste_event_support = true;
                    // access data directly
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].type.indexOf("image") !== -1) {
                            // image
                            const blob = items[i].getAsFile();
                            const URLObj = window.URL || window.webkitURL;
                            const source = URLObj.createObjectURL(blob);
                            this.paste_createImage(source);
                            e.preventDefault();
                            return false;
                        }
                    }
                }
                else {
                    // wait for DOMSubtreeModified event
                    // https://bugzilla.mozilla.org/show_bug.cgi?id=891247
                }
            }
            return true;
        }
        // on keyboard press
        on_keyboard_action(event) {
            const k = event.keyCode;
            // ctrl
            if (k === 17 || event.metaKey || event.ctrlKey) {
                if (this.ctrl_pressed === false) {
                    this.ctrl_pressed = true;
                }
            }
            // v
            if (k === 86) {
                if (document.activeElement !== undefined && document.activeElement.type === "text") {
                    // let user paste into some input
                    return false;
                }
                if (this.ctrl_pressed === true && this.pasteCatcher !== undefined) {
                    this.pasteCatcher.focus();
                }
            }
            return true;
        }
        // on keyboard release
        on_keyboardup_action(event) {
            // ctrl
            if (event.ctrlKey === false && this.ctrl_pressed === true) {
                this.ctrl_pressed = false;
            }
            else if (event.metaKey === false && this.command_pressed === true) {
                this.command_pressed = false;
                this.ctrl_pressed = false;
            }
        }
        // draw pasted image to canvas
        paste_createImage(source) {
            const pastedImage = new Image();
            const self = this;
            pastedImage.onload = function () {
                if (self.autoresize === true) {
                    // resize
                    self.canvas.width = pastedImage.width;
                    self.canvas.height = pastedImage.height;
                }
                else {
                    // clear canvas
                    self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
                }
                self.ctx.drawImage(pastedImage, 0, 0);
            };
            pastedImage.src = source;
        }
    }
    exports.Clipboard = Clipboard;
});
define("main", ["require", "exports", "gui", "lib/clipboard"], function (require, exports, gui_2, clipboard_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    $(document).ready(function () {
        $(".tabs").tabs();
        $(".tooltipped").tooltip();
        const clip = new clipboard_1.Clipboard("canvas", true);
        $("#file").change(function (ev) {
            const files = $("#file").get(0).files;
            if (files !== null && files.length > 0) {
                const reader = new FileReader();
                reader.onloadend = function () {
                    const img = document.createElement("img");
                    img.onload = () => {
                        const c = document.getElementById("canvas");
                        const ctx = c.getContext("2d");
                        c.width = img.naturalWidth;
                        c.height = img.naturalHeight;
                        ctx.drawImage(img, 0, 0);
                    };
                    img.onerror = () => {
                        alert("Unable to load image");
                    };
                    img.src = reader.result;
                };
                reader.readAsDataURL(files[0]);
            }
        });
        gui_2.loadExample("imgSmall");
        $("#btnProcess").click(function () {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield gui_2.process();
                }
                catch (err) {
                    alert("Error: " + err);
                }
            });
        });
        $("#chkShowLabels, #chkFillFacets, #chkShowBorders, #txtSizeMultiplier, #txtLabelFontSize, #txtLabelFontColor").change(() => __awaiter(this, void 0, void 0, function* () {
            yield gui_2.updateOutput();
        }));
        $("#btnDownloadSVG").click(function () {
            gui_2.downloadSVG();
        });
        $("#btnDownloadPNG").click(function () {
            gui_2.downloadPNG();
        });
        $("#btnDownloadPalettePNG").click(function () {
            gui_2.downloadPalettePng();
        });
        $("#lnkTrivial").click(() => { gui_2.loadExample("imgTrivial"); return false; });
        $("#lnkSmall").click(() => { gui_2.loadExample("imgSmall"); return false; });
        $("#lnkMedium").click(() => { gui_2.loadExample("imgMedium"); return false; });
    });
});
