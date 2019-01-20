var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define("structs/typedarrays", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Uint32Array2D = /** @class */ (function () {
        function Uint32Array2D(width, height) {
            this.width = width;
            this.height = height;
            this.arr = new Uint32Array(width * height);
        }
        Uint32Array2D.prototype.get = function (x, y) {
            return this.arr[y * this.width + x];
        };
        Uint32Array2D.prototype.set = function (x, y, value) {
            this.arr[y * this.width + x] = value;
        };
        return Uint32Array2D;
    }());
    exports.Uint32Array2D = Uint32Array2D;
    var Uint8Array2D = /** @class */ (function () {
        function Uint8Array2D(width, height) {
            this.width = width;
            this.height = height;
            this.arr = new Uint8Array(width * height);
        }
        Uint8Array2D.prototype.get = function (x, y) {
            return this.arr[y * this.width + x];
        };
        Uint8Array2D.prototype.set = function (x, y, value) {
            this.arr[y * this.width + x] = value;
        };
        return Uint8Array2D;
    }());
    exports.Uint8Array2D = Uint8Array2D;
    var BooleanArray2D = /** @class */ (function () {
        function BooleanArray2D(width, height) {
            this.width = width;
            this.height = height;
            this.arr = new Uint8Array(width * height);
        }
        BooleanArray2D.prototype.get = function (x, y) {
            return this.arr[y * this.width + x] != 0;
        };
        BooleanArray2D.prototype.set = function (x, y, value) {
            this.arr[y * this.width + x] = value ? 1 : 0;
        };
        return BooleanArray2D;
    }());
    exports.BooleanArray2D = BooleanArray2D;
});
define("common", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function delay(ms) {
        return new Promise(function (exec) { return window.setTimeout(exec, ms); });
    }
    exports.delay = delay;
    var CancellationToken = /** @class */ (function () {
        function CancellationToken() {
            this.isCancelled = false;
        }
        return CancellationToken;
    }());
    exports.CancellationToken = CancellationToken;
});
define("lib/clustering", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Vector = /** @class */ (function () {
        function Vector(values, weight) {
            if (weight === void 0) { weight = 1; }
            this.values = values;
            this.weight = weight;
        }
        Vector.prototype.distanceTo = function (p) {
            var sumSquares = 0;
            for (var i = 0; i < this.values.length; i++) {
                sumSquares += (p.values[i] - this.values[i]) * (p.values[i] - this.values[i]);
            }
            return Math.sqrt(sumSquares);
        };
        /**
         *  Calculates the weighted average of the given points
         */
        Vector.average = function (pts) {
            if (pts.length == 0)
                throw Error("Can't average 0 elements");
            var dims = pts[0].values.length;
            var values = [];
            for (var i = 0; i < dims; i++)
                values.push(0);
            var weightSum = 0;
            for (var _i = 0, pts_1 = pts; _i < pts_1.length; _i++) {
                var p = pts_1[_i];
                weightSum += p.weight;
                for (var i = 0; i < dims; i++)
                    values[i] += p.weight * p.values[i];
            }
            for (var i = 0; i < values.length; i++) {
                values[i] /= weightSum;
            }
            return new Vector(values);
        };
        return Vector;
    }());
    exports.Vector = Vector;
    var KMeans = /** @class */ (function () {
        function KMeans(points, k, centroids) {
            if (centroids === void 0) { centroids = null; }
            this.points = points;
            this.k = k;
            this.currentIteration = 0;
            this.pointsPerCategory = [];
            this.centroids = [];
            this.currentDeltaDistanceDifference = 0;
            if (centroids != null) {
                this.centroids = centroids;
                for (var i = 0; i < this.k; i++)
                    this.pointsPerCategory.push([]);
            }
            else
                this.initCentroids();
        }
        KMeans.prototype.initCentroids = function () {
            for (var i = 0; i < this.k; i++) {
                this.centroids.push(this.points[Math.floor(this.points.length * Math.random())]);
                this.pointsPerCategory.push([]);
            }
        };
        KMeans.prototype.step = function () {
            // clear category
            for (var i = 0; i < this.k; i++) {
                this.pointsPerCategory[i] = [];
            }
            // calculate points per centroid
            for (var _i = 0, _a = this.points; _i < _a.length; _i++) {
                var p = _a[_i];
                var minDist = Number.MAX_VALUE;
                var centroidIndex = -1;
                for (var k = 0; k < this.k; k++) {
                    var dist = this.centroids[k].distanceTo(p);
                    if (dist < minDist) {
                        centroidIndex = k;
                        minDist = dist;
                    }
                }
                this.pointsPerCategory[centroidIndex].push(p);
            }
            var totalDistanceDiff = 0;
            // adjust centroids
            for (var k = 0; k < this.pointsPerCategory.length; k++) {
                var cat = this.pointsPerCategory[k];
                if (cat.length > 0) {
                    var avg = Vector.average(cat);
                    var dist = this.centroids[k].distanceTo(avg);
                    totalDistanceDiff += dist;
                    this.centroids[k] = avg;
                }
            }
            this.currentDeltaDistanceDifference = totalDistanceDiff;
            this.currentIteration++;
        };
        return KMeans;
    }());
    exports.KMeans = KMeans;
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
    var Settings = /** @class */ (function () {
        function Settings() {
            this.kMeansNrOfClusters = 16;
            this.kMeansMinDeltaDifference = 1;
            this.kMeansClusteringColorSpace = ClusteringColorSpace.RGB;
            this.removeFacetsSmallerThanNrOfPoints = 20;
            this.removeFacetsFromLargeToSmall = true;
            this.nrOfTimesToHalveBorderSegments = 2;
            this.resizeImageIfTooLarge = true;
            this.resizeImageWidth = 1024;
            this.resizeImageHeight = 1024;
        }
        return Settings;
    }());
    exports.Settings = Settings;
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
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;
        if (max == min) {
            h = s = 0; // achromatic
        }
        else {
            var d = max - min;
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
        var r, g, b;
        if (s == 0) {
            r = g = b = l; // achromatic
        }
        else {
            var hue2rgb = function (p, q, t) {
                if (t < 0)
                    t += 1;
                if (t > 1)
                    t -= 1;
                if (t < 1 / 6)
                    return p + (q - p) * 6 * t;
                if (t < 1 / 2)
                    return q;
                if (t < 2 / 3)
                    return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return [r * 255, g * 255, b * 255];
    }
    exports.hslToRgb = hslToRgb;
    // From https://github.com/antimatter15/rgb-lab/blob/master/color.js
    function lab2rgb(lab) {
        var y = (lab[0] + 16) / 116, x = lab[1] / 500 + y, z = y - lab[2] / 200, r, g, b;
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
        var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255, x, y, z;
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
define("colorreductionmanagement", ["require", "exports", "structs/typedarrays", "common", "lib/clustering", "settings", "lib/colorconversion"], function (require, exports, typedarrays_1, common_1, clustering_1, settings_1, colorconversion_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ColorMapResult = /** @class */ (function () {
        function ColorMapResult() {
        }
        return ColorMapResult;
    }());
    exports.ColorMapResult = ColorMapResult;
    var ColorReducer = /** @class */ (function () {
        function ColorReducer() {
        }
        /**
       *  Creates a map of the various colors used
       */
        ColorReducer.createColorMap = function (kmeansImgData) {
            var imgColorIndices = new typedarrays_1.Uint8Array2D(kmeansImgData.width, kmeansImgData.height);
            var colorIndex = 0;
            var colors = {};
            var colorsByIndex = [];
            var idx = 0;
            for (var j = 0; j < kmeansImgData.height; j++) {
                for (var i = 0; i < kmeansImgData.width; i++) {
                    var r = kmeansImgData.data[idx++];
                    var g = kmeansImgData.data[idx++];
                    var b = kmeansImgData.data[idx++];
                    var a = kmeansImgData.data[idx++];
                    var currentColorIndex = void 0;
                    var color = r + "," + g + "," + b;
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
            var result = new ColorMapResult();
            result.imgColorIndices = imgColorIndices;
            result.colorsByIndex = colorsByIndex;
            return result;
        };
        /**
         *  Applies K-means clustering on the imgData to reduce the colors to
         *  k clusters and then output the result to the given outputImgData
         */
        ColorReducer.applyKMeansClustering = function (imgData, outputImgData, ctx, settings, onUpdate) {
            if (onUpdate === void 0) { onUpdate = null; }
            return __awaiter(this, void 0, void 0, function () {
                var vectors, idx, vIdx, pointsByColor, j, i, r, g, b, a, color, _i, _a, color, rgb, data, weight, v, kmeans, count;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            vectors = [];
                            idx = 0;
                            vIdx = 0;
                            pointsByColor = {};
                            for (j = 0; j < imgData.height; j++) {
                                for (i = 0; i < imgData.width; i++) {
                                    r = imgData.data[idx++];
                                    g = imgData.data[idx++];
                                    b = imgData.data[idx++];
                                    a = imgData.data[idx++];
                                    color = r + "," + g + "," + b;
                                    if (!(color in pointsByColor)) {
                                        pointsByColor[color] = [j * imgData.width + i];
                                    }
                                    else
                                        pointsByColor[color].push(j * imgData.width + i);
                                }
                            }
                            for (_i = 0, _a = Object.keys(pointsByColor); _i < _a.length; _i++) {
                                color = _a[_i];
                                rgb = color.split(",").map(function (v) { return parseInt(v); });
                                data = void 0;
                                if (settings.kMeansClusteringColorSpace == settings_1.ClusteringColorSpace.RGB)
                                    data = rgb;
                                else if (settings.kMeansClusteringColorSpace == settings_1.ClusteringColorSpace.HSL)
                                    data = colorconversion_1.rgbToHsl(rgb[0], rgb[1], rgb[2]);
                                else if (settings.kMeansClusteringColorSpace == settings_1.ClusteringColorSpace.LAB)
                                    data = colorconversion_1.rgb2lab(rgb);
                                else
                                    data = rgb;
                                weight = pointsByColor[color].length / (imgData.width * imgData.height);
                                v = new clustering_1.Vector(data, weight);
                                vectors[vIdx++] = v;
                            }
                            kmeans = new clustering_1.KMeans(vectors, settings.kMeansNrOfClusters);
                            count = 0;
                            kmeans.step();
                            _b.label = 1;
                        case 1:
                            if (!(kmeans.currentDeltaDistanceDifference > settings.kMeansMinDeltaDifference)) return [3 /*break*/, 4];
                            kmeans.step();
                            if (!(count++ % 2 == 0)) return [3 /*break*/, 3];
                            return [4 /*yield*/, common_1.delay(0)];
                        case 2:
                            _b.sent();
                            if (onUpdate != null) {
                                ColorReducer.updateKmeansOutputImageData(kmeans, settings, pointsByColor, imgData, outputImgData);
                                onUpdate(kmeans);
                            }
                            _b.label = 3;
                        case 3: return [3 /*break*/, 1];
                        case 4:
                            // update the output image data (because it will be used for further processing)
                            ColorReducer.updateKmeansOutputImageData(kmeans, settings, pointsByColor, imgData, outputImgData);
                            if (onUpdate != null)
                                onUpdate(kmeans);
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         *  Updates the image data from the current kmeans centroids and their respective associated colors (vectors)
         */
        ColorReducer.updateKmeansOutputImageData = function (kmeans, settings, pointsByColor, imgData, outputImgData) {
            for (var c = 0; c < kmeans.centroids.length; c++) {
                // for each cluster centroid
                var centroid = kmeans.centroids[c];
                // points per category are the different unique colors belonging to that cluster
                for (var _i = 0, _a = kmeans.pointsPerCategory[c]; _i < _a.length; _i++) {
                    var v = _a[_i];
                    // determine the rgb color value of the cluster centroid
                    var rgb = void 0;
                    if (settings.kMeansClusteringColorSpace == settings_1.ClusteringColorSpace.RGB) {
                        rgb = centroid.values;
                    }
                    else if (settings.kMeansClusteringColorSpace == settings_1.ClusteringColorSpace.HSL) {
                        var hsl = centroid.values;
                        rgb = colorconversion_1.hslToRgb(hsl[0], hsl[1], hsl[2]);
                    }
                    else if (settings.kMeansClusteringColorSpace == settings_1.ClusteringColorSpace.LAB) {
                        var lab = centroid.values;
                        rgb = colorconversion_1.lab2rgb(lab);
                    }
                    else
                        rgb = centroid.values;
                    // replace all pixels of the old color by the new centroid color
                    var pointColor = v.values[0] + "," + v.values[1] + "," + v.values[2];
                    for (var _b = 0, _c = pointsByColor[pointColor]; _b < _c.length; _b++) {
                        var pt = _c[_b];
                        var ptx = pt % imgData.width;
                        var pty = Math.floor(pt / imgData.width);
                        var dataOffset = (pty * imgData.width + ptx) * 4;
                        outputImgData.data[dataOffset++] = rgb[0];
                        outputImgData.data[dataOffset++] = rgb[1];
                        outputImgData.data[dataOffset++] = rgb[2];
                    }
                }
            }
        };
        return ColorReducer;
    }());
    exports.ColorReducer = ColorReducer;
});
define("structs/point", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Point = /** @class */ (function () {
        function Point(x, y) {
            this.x = x;
            this.y = y;
        }
        Point.prototype.distanceTo = function (pt) {
            // don't do euclidean because then neighbours should be diagonally as well
            // because sqrt(2) < 2
            //  return Math.sqrt((pt.x - this.x) * (pt.x - this.x) + (pt.y - this.y) * (pt.y - this.y));
            return Math.abs(pt.x - this.x) + Math.abs(pt.y - this.y);
        };
        Point.prototype.distanceToCoord = function (x, y) {
            // don't do euclidean because then neighbours should be diagonally as well
            // because sqrt(2) < 2
            //  return Math.sqrt((pt.x - this.x) * (pt.x - this.x) + (pt.y - this.y) * (pt.y - this.y));
            return Math.abs(x - this.x) + Math.abs(y - this.y);
        };
        return Point;
    }());
    exports.Point = Point;
});
define("structs/boundingbox", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var BoundingBox = /** @class */ (function () {
        function BoundingBox() {
            this.minX = Number.MAX_VALUE;
            this.minY = Number.MAX_VALUE;
            this.maxX = Number.MIN_VALUE;
            this.maxY = Number.MIN_VALUE;
        }
        Object.defineProperty(BoundingBox.prototype, "width", {
            get: function () {
                return this.maxX - this.minX + 1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BoundingBox.prototype, "height", {
            get: function () {
                return this.maxY - this.minY + 1;
            },
            enumerable: true,
            configurable: true
        });
        return BoundingBox;
    }());
    exports.BoundingBox = BoundingBox;
});
define("lib/datastructs", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Map = /** @class */ (function () {
        function Map() {
            this.obj = {};
        }
        Map.prototype.containsKey = function (key) {
            return key in this.obj;
        };
        Map.prototype.getKeys = function () {
            var keys = [];
            for (var el in this.obj) {
                if (this.obj.hasOwnProperty(el))
                    keys.push(el);
            }
            return keys;
        };
        Map.prototype.get = function (key) {
            var o = this.obj[key];
            if (typeof o === "undefined")
                return null;
            else
                return o;
        };
        Map.prototype.put = function (key, value) {
            this.obj[key] = value;
        };
        Map.prototype.remove = function (key) {
            delete this.obj[key];
        };
        Map.prototype.clone = function () {
            var m = new Map();
            m.obj = {};
            for (var p in this.obj) {
                m.obj[p] = this.obj[p];
            }
            return m;
        };
        return Map;
    }());
    exports.Map = Map;
    var Heap = /** @class */ (function () {
        function Heap() {
            this.array = [];
            this.keyMap = new Map();
        }
        Heap.prototype.add = function (obj) {
            if (this.keyMap.containsKey(obj.getKey())) {
                throw new Error("Item with key " + obj.getKey() + " already exists in the heap");
            }
            this.array.push(obj);
            this.keyMap.put(obj.getKey(), this.array.length - 1);
            this.checkParentRequirement(this.array.length - 1);
        };
        Heap.prototype.replaceAt = function (idx, newobj) {
            this.array[idx] = newobj;
            this.keyMap.put(newobj.getKey(), idx);
            this.checkParentRequirement(idx);
            this.checkChildrenRequirement(idx);
        };
        Heap.prototype.shift = function () {
            return this.removeAt(0);
        };
        Heap.prototype.remove = function (obj) {
            var idx = this.keyMap.get(obj.getKey());
            if (idx == -1)
                return;
            this.removeAt(idx);
        };
        Heap.prototype.removeWhere = function (predicate) {
            var itemsToRemove = [];
            for (var i = this.array.length - 1; i >= 0; i--) {
                if (predicate(this.array[i])) {
                    itemsToRemove.push(this.array[i]);
                }
            }
            for (var _i = 0, itemsToRemove_1 = itemsToRemove; _i < itemsToRemove_1.length; _i++) {
                var el = itemsToRemove_1[_i];
                this.remove(el);
            }
            for (var _a = 0, _b = this.array; _a < _b.length; _a++) {
                var el = _b[_a];
                if (predicate(el)) {
                    console.log("Idx of element not removed: " + this.keyMap.get(el.getKey()));
                    throw new Error("element not removed: " + el.getKey());
                }
            }
        };
        Heap.prototype.removeAt = function (idx) {
            var obj = this.array[idx];
            this.keyMap.remove(obj.getKey());
            var isLastElement = idx == this.array.length - 1;
            if (this.array.length > 0) {
                var newobj = this.array.pop();
                if (!isLastElement && this.array.length > 0)
                    this.replaceAt(idx, newobj);
            }
            return obj;
        };
        Heap.prototype.foreach = function (func) {
            var arr = this.array.sort(function (e, e2) { return e.compareTo(e2); });
            for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
                var el = arr_1[_i];
                func(el);
            }
        };
        Heap.prototype.peek = function () {
            return this.array[0];
        };
        Heap.prototype.contains = function (key) {
            return this.keyMap.containsKey(key);
        };
        Heap.prototype.at = function (key) {
            var obj = this.keyMap.get(key);
            if (typeof obj === "undefined")
                return null;
            else
                return this.array[obj];
        };
        Heap.prototype.size = function () {
            return this.array.length;
        };
        Heap.prototype.checkHeapRequirement = function (item) {
            var idx = this.keyMap.get(item.getKey());
            if (idx != null) {
                this.checkParentRequirement(idx);
                this.checkChildrenRequirement(idx);
            }
        };
        Heap.prototype.checkChildrenRequirement = function (idx) {
            var stop = false;
            while (!stop) {
                var left = this.getLeftChildIndex(idx);
                var right = left == -1 ? -1 : left + 1;
                if (left == -1)
                    return;
                if (right >= this.size())
                    right = -1;
                var minIdx = void 0;
                if (right == -1)
                    minIdx = left;
                else
                    minIdx = (this.array[left].compareTo(this.array[right]) < 0) ? left : right;
                if (this.array[idx].compareTo(this.array[minIdx]) > 0) {
                    this.swap(idx, minIdx);
                    idx = minIdx; // iteratively instead of recursion for this.checkChildrenRequirement(minIdx);
                }
                else
                    stop = true;
            }
        };
        Heap.prototype.checkParentRequirement = function (idx) {
            var curIdx = idx;
            var parentIdx = Heap.getParentIndex(curIdx);
            while (parentIdx >= 0 && this.array[parentIdx].compareTo(this.array[curIdx]) > 0) {
                this.swap(curIdx, parentIdx);
                curIdx = parentIdx;
                parentIdx = Heap.getParentIndex(curIdx);
            }
        };
        Heap.prototype.dump = function () {
            if (this.size() == 0)
                return;
            var idx = 0;
            var leftIdx = this.getLeftChildIndex(idx);
            var rightIdx = leftIdx + 1;
            console.log(this.array);
            console.log("--- keymap ---");
            console.log(this.keyMap);
        };
        Heap.prototype.swap = function (i, j) {
            this.keyMap.put(this.array[i].getKey(), j);
            this.keyMap.put(this.array[j].getKey(), i);
            var tmp = this.array[i];
            this.array[i] = this.array[j];
            this.array[j] = tmp;
        };
        Heap.prototype.getLeftChildIndex = function (curIdx) {
            var idx = ((curIdx + 1) * 2) - 1;
            if (idx >= this.array.length)
                return -1;
            else
                return idx;
        };
        Heap.getParentIndex = function (curIdx) {
            if (curIdx == 0)
                return -1;
            return Math.floor((curIdx + 1) / 2) - 1;
        };
        Heap.prototype.clone = function () {
            var h = new Heap();
            h.array = this.array.slice(0);
            h.keyMap = this.keyMap.clone();
            return h;
        };
        return Heap;
    }());
    var PriorityQueue = /** @class */ (function () {
        function PriorityQueue() {
            this.heap = new Heap();
        }
        PriorityQueue.prototype.enqueue = function (obj) {
            this.heap.add(obj);
        };
        PriorityQueue.prototype.peek = function () {
            return this.heap.peek();
        };
        PriorityQueue.prototype.updatePriority = function (key) {
            this.heap.checkHeapRequirement(key);
        };
        PriorityQueue.prototype.get = function (key) {
            return this.heap.at(key);
        };
        Object.defineProperty(PriorityQueue.prototype, "size", {
            get: function () {
                return this.heap.size();
            },
            enumerable: true,
            configurable: true
        });
        PriorityQueue.prototype.dequeue = function () {
            return this.heap.shift();
        };
        PriorityQueue.prototype.dump = function () {
            this.heap.dump();
        };
        PriorityQueue.prototype.contains = function (key) {
            return this.heap.contains(key);
        };
        PriorityQueue.prototype.removeWhere = function (predicate) {
            this.heap.removeWhere(predicate);
        };
        PriorityQueue.prototype.foreach = function (func) {
            this.heap.foreach(func);
        };
        PriorityQueue.prototype.clone = function () {
            var p = new PriorityQueue();
            p.heap = this.heap.clone();
            return p;
        };
        return PriorityQueue;
    }());
    exports.PriorityQueue = PriorityQueue;
});
define("lib/polylabel", ["require", "exports", "lib/datastructs"], function (require, exports, datastructs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function polylabel(polygon, precision) {
        if (precision === void 0) { precision = 1.0; }
        // find the bounding box of the outer ring
        var minX = Number.MAX_VALUE, minY = Number.MAX_VALUE, maxX = Number.MIN_VALUE, maxY = Number.MIN_VALUE;
        for (var i = 0; i < polygon[0].length; i++) {
            var p = polygon[0][i];
            if (p.x < minX)
                minX = p.x;
            if (p.y < minY)
                minY = p.y;
            if (p.x > maxX)
                maxX = p.x;
            if (p.y > maxY)
                maxY = p.y;
        }
        var width = maxX - minX;
        var height = maxY - minY;
        var cellSize = Math.min(width, height);
        var h = cellSize / 2;
        // a priority queue of cells in order of their "potential" (max distance to polygon)
        var cellQueue = new datastructs_1.PriorityQueue();
        if (cellSize === 0)
            return { pt: { x: minX, y: minY }, distance: 0 };
        // cover polygon with initial cells
        for (var x = minX; x < maxX; x += cellSize) {
            for (var y = minY; y < maxY; y += cellSize) {
                cellQueue.enqueue(new Cell(x + h, y + h, h, polygon));
            }
        }
        // take centroid as the first best guess
        var bestCell = getCentroidCell(polygon);
        // special case for rectangular polygons
        var bboxCell = new Cell(minX + width / 2, minY + height / 2, 0, polygon);
        if (bboxCell.d > bestCell.d)
            bestCell = bboxCell;
        var numProbes = cellQueue.size;
        while (cellQueue.size > 0) {
            // pick the most promising cell from the queue
            var cell = cellQueue.dequeue();
            // update the best cell if we found a better one
            if (cell.d > bestCell.d) {
                bestCell = cell;
            }
            // do not drill down further if there's no chance of a better solution
            if (cell.max - bestCell.d <= precision)
                continue;
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
    var Cell = /** @class */ (function () {
        function Cell(x, y, h, polygon) {
            this.x = x;
            this.y = y;
            this.h = h;
            this.d = pointToPolygonDist(x, y, polygon);
            this.max = this.d + this.h * Math.SQRT2;
        }
        Cell.prototype.compareTo = function (other) {
            return other.max - this.max;
        };
        Cell.prototype.getKey = function () {
            return this.x + "," + this.y;
        };
        return Cell;
    }());
    // get squared distance from a point px,py to a segment [a-b]
    function getSegDistSq(px, py, a, b) {
        var x = a.x;
        var y = a.y;
        var dx = b.x - x;
        var dy = b.y - y;
        if (dx !== 0 || dy !== 0) {
            var t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);
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
        var inside = false;
        var minDistSq = Infinity;
        for (var k = 0; k < polygon.length; k++) {
            var ring = polygon[k];
            for (var i = 0, len = ring.length, j = len - 1; i < len; j = i++) {
                var a = ring[i];
                var b = ring[j];
                if ((a.y > y !== b.y > y) &&
                    (x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x))
                    inside = !inside;
                minDistSq = Math.min(minDistSq, getSegDistSq(x, y, a, b));
            }
        }
        return (inside ? 1 : -1) * Math.sqrt(minDistSq);
    }
    exports.pointToPolygonDist = pointToPolygonDist;
    // get polygon centroid
    function getCentroidCell(polygon) {
        var area = 0;
        var x = 0;
        var y = 0;
        var points = polygon[0];
        for (var i = 0, len = points.length, j = len - 1; i < len; j = i++) {
            var a = points[i];
            var b = points[j];
            var f = a.x * b.y - b.x * a.y;
            x += (a.x + b.x) * f;
            y += (a.y + b.y) * f;
            area += f * 3;
        }
        if (area === 0)
            return new Cell(points[0].x, points[0].y, 0, polygon);
        return new Cell(x / area, y / area, 0, polygon);
    }
});
define("facetmanagement", ["require", "exports", "structs/point", "structs/boundingbox", "structs/typedarrays", "common", "lib/polylabel"], function (require, exports, point_1, boundingbox_1, typedarrays_2, common_2, polylabel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var OrientationEnum;
    (function (OrientationEnum) {
        OrientationEnum[OrientationEnum["Left"] = 0] = "Left";
        OrientationEnum[OrientationEnum["Top"] = 1] = "Top";
        OrientationEnum[OrientationEnum["Right"] = 2] = "Right";
        OrientationEnum[OrientationEnum["Bottom"] = 3] = "Bottom";
    })(OrientationEnum || (OrientationEnum = {}));
    /**
     * PathPoint is a point with an orientation that indicates which wall border is set
     */
    var PathPoint = /** @class */ (function (_super) {
        __extends(PathPoint, _super);
        function PathPoint(pt, orientation) {
            var _this = _super.call(this, pt.x, pt.y) || this;
            _this.orientation = orientation;
            return _this;
        }
        PathPoint.prototype.getWallX = function () {
            var x = this.x;
            if (this.orientation == OrientationEnum.Left)
                x -= 0.5;
            else if (this.orientation == OrientationEnum.Right)
                x += 0.5;
            return x;
        };
        PathPoint.prototype.getWallY = function () {
            var y = this.y;
            if (this.orientation == OrientationEnum.Top)
                y -= 0.5;
            else if (this.orientation == OrientationEnum.Bottom)
                y += 0.5;
            return y;
        };
        PathPoint.prototype.getNeighbour = function (facetResult) {
            switch (this.orientation) {
                case OrientationEnum.Left:
                    if (this.x - 1 >= 0)
                        return facetResult.facetMap.get(this.x - 1, this.y);
                    break;
                case OrientationEnum.Right:
                    if (this.x + 1 < facetResult.width)
                        return facetResult.facetMap.get(this.x + 1, this.y);
                    break;
                case OrientationEnum.Top:
                    if (this.y - 1 >= 0)
                        return facetResult.facetMap.get(this.x, this.y - 1);
                    break;
                case OrientationEnum.Bottom:
                    if (this.y + 1 < facetResult.height)
                        return facetResult.facetMap.get(this.x, this.y + 1);
                    break;
            }
            return -1;
        };
        PathPoint.prototype.toString = function () {
            return this.x + "," + this.y + " " + this.orientation;
        };
        return PathPoint;
    }(point_1.Point));
    /**
     *  Path segment is a segment of a border path that is adjacent to a specific neighbour facet
     */
    var PathSegment = /** @class */ (function () {
        function PathSegment(points, neighbour) {
            this.points = points;
            this.neighbour = neighbour;
        }
        return PathSegment;
    }());
    /**
     * Facet boundary segment describes the matched segment that is shared between 2 facets
     * When 2 segments are matched, one will be the original segment and the other one is removed
     * This ensures that all facets share the same segments, but sometimes in reverse order to ensure
     * the correct continuity of its entire oborder path
     */
    var FacetBoundarySegment = /** @class */ (function () {
        function FacetBoundarySegment(originalSegment, neighbour, reverseOrder) {
            this.originalSegment = originalSegment;
            this.neighbour = neighbour;
            this.reverseOrder = reverseOrder;
        }
        return FacetBoundarySegment;
    }());
    /**
     *  A facet that represents an area of pixels of the same color
     */
    var Facet = /** @class */ (function () {
        function Facet() {
            this.pointCount = 0;
            /**
             * Flag indicating if the neighbourfacets array is dirty. If it is, the neighbourfacets *have* to be rebuild
             * Before it can be used. This is useful to defer the rebuilding of the array until it's actually needed
             * and can remove a lot of duplicate building of the array because multiple facets were hitting the same neighbour
             * (over 50% on test images)
             */
            this.neighbourFacetsIsDirty = false;
        }
        Facet.prototype.getFullPathFromBorderSegments = function () {
            var newpath = [];
            for (var _i = 0, _a = this.borderSegments; _i < _a.length; _i++) {
                var seg = _a[_i];
                if (seg.reverseOrder) {
                    for (var i = seg.originalSegment.points.length - 1; i >= 0; i--) {
                        newpath.push(new point_1.Point(seg.originalSegment.points[i].getWallX(), seg.originalSegment.points[i].getWallY()));
                    }
                }
                else {
                    for (var i = 0; i < seg.originalSegment.points.length; i++) {
                        newpath.push(new point_1.Point(seg.originalSegment.points[i].getWallX(), seg.originalSegment.points[i].getWallY()));
                    }
                }
            }
            return newpath;
        };
        return Facet;
    }());
    /**
     *  Result of the facet construction, both as a map and as an array.
     *  Facets in the array can be null when they've been deleted
     */
    var FacetResult = /** @class */ (function () {
        function FacetResult() {
        }
        return FacetResult;
    }());
    exports.FacetResult = FacetResult;
    var FacetCreator = /** @class */ (function () {
        function FacetCreator() {
        }
        /**
         *  Constructs the facets with its border points for each area of pixels of the same color
         */
        FacetCreator.getFacets = function (width, height, imgColorIndices, onUpdate) {
            if (onUpdate === void 0) { onUpdate = null; }
            return __awaiter(this, void 0, void 0, function () {
                var result, visited, count, j, i, colorIndex, facetIndex, facet, _i, _a, f;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            result = new FacetResult();
                            result.width = width;
                            result.height = height;
                            visited = new typedarrays_2.BooleanArray2D(result.width, result.height);
                            // setup facet map & array
                            result.facetMap = new typedarrays_2.Uint32Array2D(result.width, result.height);
                            result.facets = [];
                            count = 0;
                            j = 0;
                            _b.label = 1;
                        case 1:
                            if (!(j < result.height)) return [3 /*break*/, 7];
                            i = 0;
                            _b.label = 2;
                        case 2:
                            if (!(i < result.width)) return [3 /*break*/, 6];
                            colorIndex = imgColorIndices.get(i, j);
                            if (!!visited.get(i, j)) return [3 /*break*/, 4];
                            facetIndex = result.facets.length;
                            facet = FacetCreator.buildFacet(facetIndex, colorIndex, i, j, visited, imgColorIndices, result);
                            result.facets.push(facet);
                            if (!(count % 100 == 0)) return [3 /*break*/, 4];
                            return [4 /*yield*/, common_2.delay(0)];
                        case 3:
                            _b.sent();
                            if (onUpdate != null)
                                onUpdate(count / (result.width * result.height));
                            _b.label = 4;
                        case 4:
                            count++;
                            _b.label = 5;
                        case 5:
                            i++;
                            return [3 /*break*/, 2];
                        case 6:
                            j++;
                            return [3 /*break*/, 1];
                        case 7: return [4 /*yield*/, common_2.delay(0)];
                        case 8:
                            _b.sent();
                            // fill in the neighbours of all facets by checking the neighbours of the border points
                            for (_i = 0, _a = result.facets; _i < _a.length; _i++) {
                                f = _a[_i];
                                if (f != null)
                                    FacetCreator.buildFacetNeighbour(f, result);
                            }
                            if (onUpdate != null)
                                onUpdate(1);
                            return [2 /*return*/, result];
                    }
                });
            });
        };
        /**
         *  Builds a facet at given x,y using depth first search to visit all pixels of the same color
         */
        FacetCreator.buildFacet = function (facetIndex, facetColorIndex, x, y, visited, imgColorIndices, facetResult) {
            var facet = new Facet();
            facet.id = facetIndex;
            facet.color = facetColorIndex;
            facet.bbox = new boundingbox_1.BoundingBox();
            facet.borderPoints = [];
            // using a 1D flattened stack (x*width+y), we can avoid heap allocations of Point objects, which halves the garbage collection time
            var stack = [];
            stack.push(y * facetResult.width + x);
            while (stack.length > 0) {
                var pt = stack.pop();
                var ptx = pt % facetResult.width;
                var pty = Math.floor(pt / facetResult.width);
                // if the point wasn't visited before and matches 
                // the same color
                if (!visited.get(ptx, pty) &&
                    imgColorIndices.get(ptx, pty) == facetColorIndex) {
                    visited.set(ptx, pty, true);
                    facetResult.facetMap.set(ptx, pty, facetIndex);
                    facet.pointCount++;
                    // determine if the point is a border or not
                    var isInnerPoint = (ptx - 1 >= 0 && imgColorIndices.get(ptx - 1, pty) == facetColorIndex) &&
                        (pty - 1 >= 0 && imgColorIndices.get(ptx, pty - 1) == facetColorIndex) &&
                        (ptx + 1 < facetResult.width && imgColorIndices.get(ptx + 1, pty) == facetColorIndex) &&
                        (pty + 1 < facetResult.height && imgColorIndices.get(ptx, pty + 1) == facetColorIndex);
                    if (!isInnerPoint)
                        facet.borderPoints.push(new point_1.Point(ptx, pty));
                    // update bounding box of facet
                    if (ptx > facet.bbox.maxX)
                        facet.bbox.maxX = ptx;
                    if (pty > facet.bbox.maxY)
                        facet.bbox.maxY = pty;
                    if (ptx < facet.bbox.minX)
                        facet.bbox.minX = ptx;
                    if (pty < facet.bbox.minY)
                        facet.bbox.minY = pty;
                    // visit direct adjacent points
                    if (ptx - 1 >= 0 && !visited.get(ptx - 1, pty))
                        stack.push(pty * facetResult.width + (ptx - 1)); //stack.push(new Point(pt.x - 1, pt.y));
                    if (pty - 1 >= 0 && !visited.get(ptx, pty - 1))
                        stack.push((pty - 1) * facetResult.width + ptx); //stack.push(new Point(pt.x, pt.y - 1));
                    if (ptx + 1 < facetResult.width && !visited.get(ptx + 1, pty))
                        stack.push(pty * facetResult.width + (ptx + 1)); //stack.push(new Point(pt.x + 1, pt.y));
                    if (pty + 1 < facetResult.height && !visited.get(ptx, pty + 1))
                        stack.push((pty + 1) * facetResult.width + ptx); //stack.push(new Point(pt.x, pt.y + 1));
                }
            }
            return facet;
        };
        /**
         * Check which neighbour facets the given facet has by checking the neighbour facets at each border point
         */
        FacetCreator.buildFacetNeighbour = function (facet, facetResult) {
            facet.neighbourFacets = [];
            var uniqueFacets = {}; // poor man's set
            for (var _i = 0, _a = facet.borderPoints; _i < _a.length; _i++) {
                var pt = _a[_i];
                if (pt.x - 1 >= 0) {
                    var leftFacetId = facetResult.facetMap.get(pt.x - 1, pt.y);
                    if (leftFacetId != facet.id)
                        uniqueFacets[leftFacetId] = true;
                }
                if (pt.y - 1 >= 0) {
                    var topFacetId = facetResult.facetMap.get(pt.x, pt.y - 1);
                    if (topFacetId != facet.id)
                        uniqueFacets[topFacetId] = true;
                }
                if (pt.x + 1 < facetResult.width) {
                    var rightFacetId = facetResult.facetMap.get(pt.x + 1, pt.y);
                    if (rightFacetId != facet.id)
                        uniqueFacets[rightFacetId] = true;
                }
                if (pt.y + 1 < facetResult.height) {
                    var bottomFacetId = facetResult.facetMap.get(pt.x, pt.y + 1);
                    if (bottomFacetId != facet.id)
                        uniqueFacets[bottomFacetId] = true;
                }
            }
            for (var _b = 0, _c = Object.keys(uniqueFacets); _b < _c.length; _b++) {
                var k = _c[_b];
                if (k in uniqueFacets)
                    facet.neighbourFacets.push(parseInt(k));
            }
            // the neighbour array is updated so it's not dirty anymore
            facet.neighbourFacetsIsDirty = false;
        };
        return FacetCreator;
    }());
    exports.FacetCreator = FacetCreator;
    var FacetReducer = /** @class */ (function () {
        function FacetReducer() {
        }
        /**
         *  Remove all facets that have a pointCount smaller than the given number.
         */
        FacetReducer.reduceFacets = function (smallerThan, removeFacetsFromLargeToSmall, colorsByIndex, facetResult, imgColorIndices, onUpdate) {
            if (onUpdate === void 0) { onUpdate = null; }
            return __awaiter(this, void 0, void 0, function () {
                var count, visitedCache, colorDistances, facetProcessingOrder, fidx, f, facetToRemove;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            count = 0;
                            visitedCache = new typedarrays_2.BooleanArray2D(facetResult.width, facetResult.height);
                            colorDistances = FacetReducer.buildColorDistanceMatrix(colorsByIndex);
                            facetProcessingOrder = facetResult.facets.filter(function (f) { return f != null; }).slice(0).sort(function (a, b) { return b.pointCount > a.pointCount ? 1 : (b.pointCount < a.pointCount ? -1 : 0); }).map(function (f) { return f.id; });
                            if (!removeFacetsFromLargeToSmall)
                                facetProcessingOrder.reverse();
                            fidx = 0;
                            _a.label = 1;
                        case 1:
                            if (!(fidx < facetProcessingOrder.length)) return [3 /*break*/, 6];
                            f = facetResult.facets[facetProcessingOrder[fidx]];
                            if (!(f != null && f.pointCount < smallerThan)) return [3 /*break*/, 4];
                            facetToRemove = f;
                            FacetReducer.deleteFacet(facetToRemove, facetResult, imgColorIndices, colorDistances, visitedCache);
                            if (!(count % 10 == 0)) return [3 /*break*/, 3];
                            return [4 /*yield*/, common_2.delay(0)];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3:
                            if (count % 100 == 0) {
                                if (onUpdate != null)
                                    onUpdate(fidx / facetProcessingOrder.length);
                            }
                            _a.label = 4;
                        case 4:
                            count++;
                            _a.label = 5;
                        case 5:
                            fidx++;
                            return [3 /*break*/, 1];
                        case 6:
                            if (onUpdate != null)
                                onUpdate(1);
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Deletes a facet. All points belonging to the facet are moved to the nearest neighbour facet
         * based on the distance of the neighbour border points. This results in a voronoi like filling in of the
         * void the deletion made
         */
        FacetReducer.deleteFacet = function (facetToRemove, facetResult, imgColorIndices, colorDistances, visitedArrayCache) {
            // there are many small facets, it's faster to just iterate over all points within its bounding box
            // and seeing which belong to the facet than to keep track of the inner points (along with the border points)
            // per facet, because that generates a lot of extra heap objects that need to be garbage collected each time
            // a facet is rebuilt
            for (var j = facetToRemove.bbox.minY; j <= facetToRemove.bbox.maxY; j++) {
                for (var i = facetToRemove.bbox.minX; i <= facetToRemove.bbox.maxX; i++) {
                    if (facetResult.facetMap.get(i, j) == facetToRemove.id) {
                        var closestNeighbour = -1;
                        var minDistance = Number.MAX_VALUE;
                        var minColorDistance = Number.MAX_VALUE;
                        // ensure the neighbour facets is up to date if it was marked as dirty
                        if (facetToRemove.neighbourFacetsIsDirty)
                            FacetCreator.buildFacetNeighbour(facetToRemove, facetResult);
                        // determine which neighbour will receive the current point based on the distance, and if there are more with the same
                        // distance, then take the neighbour with the closes color
                        for (var _i = 0, _a = facetToRemove.neighbourFacets; _i < _a.length; _i++) {
                            var neighbourIdx = _a[_i];
                            var neighbour = facetResult.facets[neighbourIdx];
                            if (neighbour != null) {
                                for (var _b = 0, _c = neighbour.borderPoints; _b < _c.length; _b++) {
                                    var bpt = _c[_b];
                                    var distance = bpt.distanceToCoord(i, j);
                                    if (distance < minDistance) {
                                        minDistance = distance;
                                        closestNeighbour = neighbourIdx;
                                        minColorDistance = Number.MAX_VALUE; // reset color distance
                                    }
                                    else if (distance == minDistance) {
                                        // if the distance is equal as the min distance
                                        // then see if the neighbour's color is closer to the current color 
                                        // note: this causes morepoints to be reallocated to different neighbours
                                        // in the sanity check later, but still yields a better visual result
                                        var colorDistance = colorDistances[facetToRemove.color][neighbour.color];
                                        if (colorDistance < minColorDistance) {
                                            minColorDistance = colorDistance;
                                            closestNeighbour = neighbourIdx;
                                        }
                                    }
                                }
                            }
                        }
                        // copy over color of closest neighbour
                        imgColorIndices.set(i, j, facetResult.facets[closestNeighbour].color);
                    }
                }
            }
            // Rebuild all the neighbour facets that have been changed. While it could probably be faster by just adding the points manually
            // to the facet map and determine if the border points are still valid, it's more complex than that. It's possible that due to the change in points
            // that 2 neighbours of the same colors have become linked and need to merged as well. So it's easier to just rebuild the entire facet
            FacetReducer.rebuildChangedFacets(visitedArrayCache, facetToRemove, imgColorIndices, facetResult);
            // sanity check: make sure that all points have been replaced by neighbour facets. It's possible that some points will have
            // been left out because there is no continuity with the neighbour points
            // this occurs for diagonal points to the neighbours and more often when the closest
            // color is chosen when distances are equal.
            // It's probably possible to enforce that this will never happen in the above code but 
            // this is a constraint that is expensive to enforce and doesn't happen all that much
            // so instead try and merge if with any of its direct neighbours if possible
            var needsToRebuild = false;
            for (var y = facetToRemove.bbox.minY; y <= facetToRemove.bbox.maxY; y++) {
                for (var x = facetToRemove.bbox.minX; x <= facetToRemove.bbox.maxX; x++) {
                    if (facetResult.facetMap.get(x, y) == facetToRemove.id) {
                        console.warn("Point " + x + "," + y + " was reallocated to neighbours for facet " + facetToRemove.id + " deletion");
                        needsToRebuild = true;
                        if (x - 1 >= 0 && facetResult.facetMap.get(x - 1, y) != facetToRemove.id) {
                            imgColorIndices.set(x, y, facetResult.facets[facetResult.facetMap.get(x - 1, y)].color);
                        }
                        else if (y - 1 >= 0 && facetResult.facetMap.get(x, y - 1) != facetToRemove.id) {
                            imgColorIndices.set(x, y, facetResult.facets[facetResult.facetMap.get(x, y - 1)].color);
                        }
                        else if (x + 1 < facetResult.width && facetResult.facetMap.get(x + 1, y) != facetToRemove.id) {
                            imgColorIndices.set(x, y, facetResult.facets[facetResult.facetMap.get(x + 1, y)].color);
                        }
                        else if (y + 1 < facetResult.height && facetResult.facetMap.get(x, y + 1) != facetToRemove.id) {
                            imgColorIndices.set(x, y, facetResult.facets[facetResult.facetMap.get(x, y + 1)].color);
                        }
                        else
                            console.error("Unable to reallocate point " + x + "," + y);
                    }
                }
            }
            // now we need to go through the thing again to build facets and update the neighbours
            if (needsToRebuild)
                FacetReducer.rebuildChangedFacets(visitedArrayCache, facetToRemove, imgColorIndices, facetResult);
            // now mark the facet to remove as deleted
            facetResult.facets[facetToRemove.id] = null;
        };
        /**
         *  Rebuilds the given changed facets
         */
        FacetReducer.rebuildChangedFacets = function (visitedArrayCache, facetToRemove, imgColorIndices, facetResult) {
            var changedNeighboursSet = {};
            if (facetToRemove.neighbourFacetsIsDirty)
                FacetCreator.buildFacetNeighbour(facetToRemove, facetResult);
            for (var _i = 0, _a = facetToRemove.neighbourFacets; _i < _a.length; _i++) {
                var neighbourIdx = _a[_i];
                var neighbour = facetResult.facets[neighbourIdx];
                if (neighbour != null) {
                    // re-evaluate facet
                    // track all the facets that needs to have their neighbour list updated
                    changedNeighboursSet[neighbourIdx] = true;
                    if (neighbour.neighbourFacetsIsDirty)
                        FacetCreator.buildFacetNeighbour(neighbour, facetResult);
                    for (var _b = 0, _c = neighbour.neighbourFacets; _b < _c.length; _b++) {
                        var n = _c[_b];
                        changedNeighboursSet[n] = true;
                    }
                    // rebuild the neighbour facet
                    var newFacet = FacetCreator.buildFacet(neighbourIdx, neighbour.color, neighbour.borderPoints[0].x, neighbour.borderPoints[0].y, visitedArrayCache, imgColorIndices, facetResult);
                    facetResult.facets[neighbourIdx] = newFacet;
                    // it's possible that any of the neighbour facets are now overlapping
                    // because if for example facet Red - Green - Red, Green is removed
                    // then it will become Red - Red and both facets will overlap
                    // this means the facet will have 0 points remaining
                    if (newFacet.pointCount == 0) {
                        // remove the empty facet as well
                        facetResult.facets[neighbourIdx] = null;
                    }
                }
            }
            // reset the visited array for all neighbours
            // while the visited array could be recreated per facet to remove, it's quite big and introduces
            // a lot of allocation / cleanup overhead. Due to the size of the facets it's usually faster
            // to just flag every point of the facet as false again
            if (facetToRemove.neighbourFacetsIsDirty)
                FacetCreator.buildFacetNeighbour(facetToRemove, facetResult);
            for (var _d = 0, _e = facetToRemove.neighbourFacets; _d < _e.length; _d++) {
                var neighbourIdx = _e[_d];
                var neighbour = facetResult.facets[neighbourIdx];
                if (neighbour != null) {
                    for (var y = neighbour.bbox.minY; y <= neighbour.bbox.maxY; y++) {
                        for (var x = neighbour.bbox.minX; x <= neighbour.bbox.maxX; x++) {
                            if (facetResult.facetMap.get(x, y) == neighbour.id)
                                visitedArrayCache.set(x, y, false);
                        }
                    }
                }
            }
            // rebuild neighbour array for affected neighbours
            for (var _f = 0, _g = Object.keys(changedNeighboursSet); _f < _g.length; _f++) {
                var k = _g[_f];
                if (changedNeighboursSet.hasOwnProperty(k)) {
                    var neighbourIdx = parseInt(k);
                    var f = facetResult.facets[neighbourIdx];
                    if (f != null) {
                        // it's a lot faster when deferring the neighbour array updates
                        // because a lot of facets that are deleted share the same facet neighbours
                        // and removing the unnecessary neighbour array checks until they it's needed
                        // speeds things up significantly
                        //FacetCreator.buildFacetNeighbour(f, facetResult);
                        f.neighbourFacets = null;
                        f.neighbourFacetsIsDirty = true;
                    }
                }
            }
        };
        /**
         *  Builds a distance matrix for each color to each other
         */
        FacetReducer.buildColorDistanceMatrix = function (colorsByIndex) {
            var colorDistances = new Array(colorsByIndex.length);
            for (var j = 0; j < colorsByIndex.length; j++) {
                colorDistances[j] = new Array(colorDistances.length);
            }
            for (var j = 0; j < colorsByIndex.length; j++) {
                for (var i = j; i < colorsByIndex.length; i++) {
                    var c1 = colorsByIndex[j];
                    var c2 = colorsByIndex[i];
                    var distance = Math.sqrt((c1[0] - c2[0]) * (c1[0] - c2[0]) +
                        (c1[1] - c2[1]) * (c1[1] - c2[1]) +
                        (c1[2] - c2[2]) * (c1[2] - c2[2]));
                    colorDistances[i][j] = distance;
                    colorDistances[j][i] = distance;
                }
            }
            return colorDistances;
        };
        return FacetReducer;
    }());
    exports.FacetReducer = FacetReducer;
    var FacetBorderTracer = /** @class */ (function () {
        function FacetBorderTracer() {
        }
        /**
         *  Traces the border path of the facet from the facet border points.
         *  Imagine placing walls around the outer side of the border points.
         */
        FacetBorderTracer.buildFacetBorderPaths = function (facetResult, onUpdate) {
            if (onUpdate === void 0) { onUpdate = null; }
            return __awaiter(this, void 0, void 0, function () {
                var count, borderMask, facetProcessingOrder, fidx, f, _i, _a, bp, xWall, yWall, borderStartIndex, i, pt, path;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            count = 0;
                            borderMask = new typedarrays_2.BooleanArray2D(facetResult.width, facetResult.height);
                            facetProcessingOrder = facetResult.facets.filter(function (f) { return f != null; }).slice(0).sort(function (a, b) { return b.pointCount > a.pointCount ? 1 : (b.pointCount < a.pointCount ? -1 : 0); }).map(function (f) { return f.id; });
                            fidx = 0;
                            _b.label = 1;
                        case 1:
                            if (!(fidx < facetProcessingOrder.length)) return [3 /*break*/, 5];
                            f = facetResult.facets[facetProcessingOrder[fidx]];
                            if (!(f != null)) return [3 /*break*/, 3];
                            for (_i = 0, _a = f.borderPoints; _i < _a.length; _i++) {
                                bp = _a[_i];
                                borderMask.set(bp.x, bp.y, true);
                            }
                            xWall = new typedarrays_2.BooleanArray2D(facetResult.width + 1, facetResult.height + 1);
                            yWall = new typedarrays_2.BooleanArray2D(facetResult.width + 1, facetResult.height + 1);
                            borderStartIndex = -1;
                            for (i = 0; i < f.borderPoints.length; i++) {
                                if ((f.borderPoints[i].x == f.bbox.minX || f.borderPoints[i].x == f.bbox.maxX) ||
                                    (f.borderPoints[i].y == f.bbox.minY || f.borderPoints[i].y == f.bbox.maxY)) {
                                    borderStartIndex = i;
                                    break;
                                }
                            }
                            pt = new PathPoint(f.borderPoints[borderStartIndex], OrientationEnum.Left);
                            // L T R B
                            if (pt.x - 1 < 0 || facetResult.facetMap.get(pt.x - 1, pt.y) != f.id)
                                pt.orientation = OrientationEnum.Left;
                            else if (pt.y - 1 < 0 || facetResult.facetMap.get(pt.x, pt.y - 1) != f.id)
                                pt.orientation = OrientationEnum.Top;
                            else if (pt.x + 1 >= facetResult.width || facetResult.facetMap.get(pt.x + 1, pt.y) != f.id)
                                pt.orientation = OrientationEnum.Right;
                            else if (pt.y + 1 >= facetResult.height || facetResult.facetMap.get(pt.x, pt.y + 1) != f.id)
                                pt.orientation = OrientationEnum.Bottom;
                            path = FacetBorderTracer.getPath(pt, facetResult, f, borderMask, xWall, yWall);
                            f.borderPath = path;
                            if (!(count % 100 == 0)) return [3 /*break*/, 3];
                            return [4 /*yield*/, common_2.delay(0)];
                        case 2:
                            _b.sent();
                            if (onUpdate != null)
                                onUpdate(fidx / facetProcessingOrder.length);
                            _b.label = 3;
                        case 3:
                            count++;
                            _b.label = 4;
                        case 4:
                            fidx++;
                            return [3 /*break*/, 1];
                        case 5:
                            if (onUpdate != null)
                                onUpdate(1);
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Returns a border path starting from the given point
         */
        FacetBorderTracer.getPath = function (pt, facetResult, f, borderMask, xWall, yWall) {
            var debug = false;
            var finished = false;
            var count = 0;
            var path = [];
            FacetBorderTracer.addPointToPath(path, pt, xWall, f, yWall);
            // check rotations first, then straight along the ouside and finally diagonally
            // this ensures that bends are always taken as tight as possible
            // so it doesn't skip border points to later loop back to and get stuck (hopefully)
            while (!finished) {
                if (debug)
                    console.log(pt.x + " " + pt.y + " " + pt.orientation);
                // yes, technically i could do some trickery to only get the left/top cases
                // by shifting the pixels but that means some more shenanigans in correct order of things
                // so whatever. (And yes I tried it but it wasn't worth the debugging hell that ensued)
                var possibleNextPoints = [];
                //   +---+---+
                //   |  <|   |
                //   +---+---+
                if (pt.orientation == OrientationEnum.Left) {
                    // check rotate to top
                    //   +---+---+
                    //   |   |   |
                    //   +---xnnnn (x = old wall, n = new wall, F = current facet x,y)
                    //   |   x F |
                    //   +---x---+                    
                    if (((pt.y - 1 >= 0 && facetResult.facetMap.get(pt.x, pt.y - 1) != f.id) // top exists and is a neighbour facet
                        || pt.y - 1 < 0) // or top doesn't exist, which is the boundary of the image
                        && !yWall.get(pt.x, pt.y)) { // and the wall isn't set yet
                        // can place top _ wall at x,y
                        if (debug)
                            console.log("can place top _ wall at x,y");
                        var nextpt = new PathPoint(new point_1.Point(pt.x, pt.y), OrientationEnum.Top);
                        possibleNextPoints.push(nextpt);
                    }
                    // check rotate to bottom
                    //   +---+---+
                    //   |   |   |
                    //   +---x---+ (x = old wall, n = new wall, F = current facet x,y)
                    //   |   x F |
                    //   +---xnnnn                      
                    if (((pt.y + 1 < facetResult.height && facetResult.facetMap.get(pt.x, pt.y + 1) != f.id) // bottom exists and is a neighbour facet
                        || pt.y + 1 >= facetResult.height) // or bottom doesn't exist, which is the boundary of the image
                        && !yWall.get(pt.x, pt.y + 1)) { // and the wall isn't set yet
                        // can place bottom  _ wall at x,y
                        if (debug)
                            console.log("can place bottom _ wall at x,y");
                        var nextpt = new PathPoint(new point_1.Point(pt.x, pt.y), OrientationEnum.Bottom);
                        possibleNextPoints.push(nextpt);
                    }
                    // check upwards
                    //   +---n---+
                    //   |   n   |
                    //   +---x---+ (x = old wall, n = new wall, F = current facet x,y)
                    //   |   x F |
                    //   +---x---+                      
                    if (pt.y - 1 >= 0 // top exists
                        && facetResult.facetMap.get(pt.x, pt.y - 1) == f.id // and is part of the same facet
                        && (pt.x - 1 < 0 || facetResult.facetMap.get(pt.x - 1, pt.y - 1) != f.id) // and 
                        && borderMask.get(pt.x, pt.y - 1)
                        && !xWall.get(pt.x, pt.y - 1)) {
                        // can place | wall at x,y-1
                        if (debug)
                            console.log("can place left | wall at x,y-1");
                        var nextpt = new PathPoint(new point_1.Point(pt.x, pt.y - 1), OrientationEnum.Left);
                        possibleNextPoints.push(nextpt);
                    }
                    // check downwards
                    //   +---x---+ 
                    //   |   x F |
                    //   +---x---+ (x = old wall, n = new wall, F = current facet x,y)   
                    //   |   n   |
                    //   +---n---+
                    if (pt.y + 1 < facetResult.height
                        && facetResult.facetMap.get(pt.x, pt.y + 1) == f.id
                        && (pt.x - 1 < 0 || facetResult.facetMap.get(pt.x - 1, pt.y + 1) != f.id)
                        && borderMask.get(pt.x, pt.y + 1)
                        && !xWall.get(pt.x, pt.y + 1)) {
                        // can place | wall at x,y+1
                        if (debug)
                            console.log("can place left | wall at x,y+1");
                        var nextpt = new PathPoint(new point_1.Point(pt.x, pt.y + 1), OrientationEnum.Left);
                        possibleNextPoints.push(nextpt);
                    }
                    // check left upwards
                    //   +---+---+
                    //   |   |   |
                    //   nnnnx---+ (x = old wall, n = new wall, F = current facet x,y)
                    //   |   x F |
                    //   +---x---+                      
                    if (pt.y - 1 >= 0 && pt.x - 1 >= 0 // there is a left upwards
                        && facetResult.facetMap.get(pt.x - 1, pt.y - 1) == f.id // and it belongs to the same facet
                        && borderMask.get(pt.x - 1, pt.y - 1) // and is on the border
                        && !yWall.get(pt.x - 1, pt.y - 1 + 1) // and the bottom wall isn't set yet
                        && !yWall.get(pt.x, pt.y) // and the path didn't come from the top of the current one to prevent getting a T shaped path (issue: https://i.imgur.com/ggUWuXi.png)
                    ) {
                        // can place bottom _ wall at x-1,y-1
                        if (debug)
                            console.log("can place bottom _ wall at x-1,y-1");
                        var nextpt = new PathPoint(new point_1.Point(pt.x - 1, pt.y - 1), OrientationEnum.Bottom);
                        possibleNextPoints.push(nextpt);
                    }
                    // check left downwards
                    //   +---x---+ 
                    //   |   x F |
                    //   nnnnx---+ (x = old wall, n = new wall, F = current facet x,y)   
                    //   |   |   |
                    //   +---+---+                     
                    if (pt.y + 1 < facetResult.height && pt.x - 1 >= 0 // there is a left downwards
                        && facetResult.facetMap.get(pt.x - 1, pt.y + 1) == f.id // and belongs to the same facet
                        && borderMask.get(pt.x - 1, pt.y + 1) // and is on the border
                        && !yWall.get(pt.x - 1, pt.y + 1) // and the top wall isn't set yet
                        && !yWall.get(pt.x, pt.y + 1) // and the path didn't come from the bottom of the current point to prevent T shape
                    ) {
                        // can place top _ wall at x-1,y+1
                        if (debug)
                            console.log("can place top _ wall at x-1,y+1");
                        var nextpt = new PathPoint(new point_1.Point(pt.x - 1, pt.y + 1), OrientationEnum.Top);
                        possibleNextPoints.push(nextpt);
                    }
                }
                // all the other directions are pretty much the same cases
                // top and bottom are rotated 90° clock and anticlockwise
                // and right is mirrored, so each of the checks of left are also somewhat the 
                // same in the other orientations 
                else if (pt.orientation == OrientationEnum.Top) {
                    // check rotate to left
                    if (((pt.x - 1 >= 0
                        && facetResult.facetMap.get(pt.x - 1, pt.y) != f.id)
                        || pt.x - 1 < 0)
                        && !xWall.get(pt.x, pt.y)) {
                        // can place left | wall at x,y
                        if (debug)
                            console.log("can place left | wall at x,y");
                        var nextpt = new PathPoint(new point_1.Point(pt.x, pt.y), OrientationEnum.Left);
                        possibleNextPoints.push(nextpt);
                    }
                    // check rotate to right
                    if (((pt.x + 1 < facetResult.width
                        && facetResult.facetMap.get(pt.x + 1, pt.y) != f.id)
                        || pt.x + 1 >= facetResult.width)
                        && !xWall.get(pt.x + 1, pt.y)) {
                        // can place right | wall at x,y
                        if (debug)
                            console.log("can place right | wall at x,y");
                        var nextpt = new PathPoint(new point_1.Point(pt.x, pt.y), OrientationEnum.Right);
                        possibleNextPoints.push(nextpt);
                    }
                    // check leftwards
                    if (pt.x - 1 >= 0
                        && facetResult.facetMap.get(pt.x - 1, pt.y) == f.id
                        && (pt.y - 1 < 0 || facetResult.facetMap.get(pt.x - 1, pt.y - 1) != f.id)
                        && borderMask.get(pt.x - 1, pt.y)
                        && !yWall.get(pt.x - 1, pt.y)) {
                        // can place top _ wall at x-1,y
                        if (debug)
                            console.log("can place top _ wall at x-1,y");
                        var nextpt = new PathPoint(new point_1.Point(pt.x - 1, pt.y), OrientationEnum.Top);
                        possibleNextPoints.push(nextpt);
                    }
                    // check rightwards
                    if (pt.x + 1 < facetResult.width
                        && facetResult.facetMap.get(pt.x + 1, pt.y) == f.id
                        && (pt.y - 1 < 0 || facetResult.facetMap.get(pt.x + 1, pt.y - 1) != f.id)
                        && borderMask.get(pt.x + 1, pt.y)
                        && !yWall.get(pt.x + 1, pt.y)) {
                        // can place top _ wall at x+1,y
                        if (debug)
                            console.log("can place top _ wall at x+1,y");
                        var nextpt = new PathPoint(new point_1.Point(pt.x + 1, pt.y), OrientationEnum.Top);
                        possibleNextPoints.push(nextpt);
                    }
                    // check left upwards
                    if (pt.y - 1 >= 0 && pt.x - 1 >= 0 // there is a left upwards
                        && facetResult.facetMap.get(pt.x - 1, pt.y - 1) == f.id // and it belongs to the same facet
                        && borderMask.get(pt.x - 1, pt.y - 1) // and it's part of the border
                        && !xWall.get(pt.x - 1 + 1, pt.y - 1) // the right wall isn't set yet
                        && !xWall.get(pt.x, pt.y) // and the left wall of the current point isn't set yet to prevent |- path
                    ) {
                        // can place right | wall at x-1,y-1
                        if (debug)
                            console.log("can place right | wall at x-1,y-1");
                        var nextpt = new PathPoint(new point_1.Point(pt.x - 1, pt.y - 1), OrientationEnum.Right);
                        possibleNextPoints.push(nextpt);
                    }
                    // check right upwards
                    if (pt.y - 1 >= 0 && pt.x + 1 < facetResult.width // there is a right upwards
                        && facetResult.facetMap.get(pt.x + 1, pt.y - 1) == f.id // and it belongs to the same facet
                        && borderMask.get(pt.x + 1, pt.y - 1) // and it's on the border
                        && !xWall.get(pt.x + 1, pt.y - 1) // and the left wall isn't set yet
                        && !xWall.get(pt.x + 1, pt.y) // and the right wall of the current point isn't set yet to prevent -| path
                    ) {
                        // can place left |  wall at x+1,y-1
                        if (debug)
                            console.log("can place left |  wall at x+1,y-1");
                        var nextpt = new PathPoint(new point_1.Point(pt.x + 1, pt.y - 1), OrientationEnum.Left);
                        possibleNextPoints.push(nextpt);
                    }
                }
                else if (pt.orientation == OrientationEnum.Right) {
                    // check rotate to top
                    if (((pt.y - 1 >= 0
                        && facetResult.facetMap.get(pt.x, pt.y - 1) != f.id)
                        || pt.y - 1 < 0)
                        && !yWall.get(pt.x, pt.y)) {
                        // can place top _ wall at x,y
                        if (debug)
                            console.log("can place top _ wall at x,y");
                        var nextpt = new PathPoint(new point_1.Point(pt.x, pt.y), OrientationEnum.Top);
                        possibleNextPoints.push(nextpt);
                    }
                    // check rotate to bottom
                    if (((pt.y + 1 < facetResult.height
                        && facetResult.facetMap.get(pt.x, pt.y + 1) != f.id)
                        || pt.y + 1 >= facetResult.height)
                        && !yWall.get(pt.x, pt.y + 1)) {
                        // can place bottom  _ wall at x,y
                        if (debug)
                            console.log("can place bottom _ wall at x,y");
                        var nextpt = new PathPoint(new point_1.Point(pt.x, pt.y), OrientationEnum.Bottom);
                        possibleNextPoints.push(nextpt);
                    }
                    // check upwards
                    if (pt.y - 1 >= 0
                        && facetResult.facetMap.get(pt.x, pt.y - 1) == f.id
                        && (pt.x + 1 >= facetResult.width || facetResult.facetMap.get(pt.x + 1, pt.y - 1) != f.id)
                        && borderMask.get(pt.x, pt.y - 1)
                        && !xWall.get(pt.x + 1, pt.y - 1)) {
                        // can place right | wall at x,y-1
                        if (debug)
                            console.log("can place right | wall at x,y-1");
                        var nextpt = new PathPoint(new point_1.Point(pt.x, pt.y - 1), OrientationEnum.Right);
                        possibleNextPoints.push(nextpt);
                    }
                    // check downwards
                    if (pt.y + 1 < facetResult.height
                        && facetResult.facetMap.get(pt.x, pt.y + 1) == f.id
                        && (pt.x + 1 >= facetResult.width || facetResult.facetMap.get(pt.x + 1, pt.y + 1) != f.id)
                        && borderMask.get(pt.x, pt.y + 1)
                        && !xWall.get(pt.x + 1, pt.y + 1)) {
                        // can place right | wall at x,y+1
                        if (debug)
                            console.log("can place right | wall at x,y+1");
                        var nextpt = new PathPoint(new point_1.Point(pt.x, pt.y + 1), OrientationEnum.Right);
                        possibleNextPoints.push(nextpt);
                    }
                    // check right upwards
                    if (pt.y - 1 >= 0 && pt.x + 1 < facetResult.width // there is a right upwards
                        && facetResult.facetMap.get(pt.x + 1, pt.y - 1) == f.id // and belongs to the same facet
                        && borderMask.get(pt.x + 1, pt.y - 1) // and is on the border
                        && !yWall.get(pt.x + 1, pt.y - 1 + 1) // and the bottom wall isn't set yet
                        && !yWall.get(pt.x, pt.y) // and the top wall of the current point isn't set to prevent a T shape
                    ) {
                        // can place bottom _ wall at x+1,y-1
                        if (debug)
                            console.log("can place bottom _ wall at x+1,y-1");
                        var nextpt = new PathPoint(new point_1.Point(pt.x + 1, pt.y - 1), OrientationEnum.Bottom);
                        possibleNextPoints.push(nextpt);
                    }
                    // check right downwards
                    if (pt.y + 1 < facetResult.height && pt.x + 1 < facetResult.width // there is a right downwards
                        && facetResult.facetMap.get(pt.x + 1, pt.y + 1) == f.id // and belongs to the same facet
                        && borderMask.get(pt.x + 1, pt.y + 1) // and is on the border
                        && !yWall.get(pt.x + 1, pt.y + 1) // and the top wall isn't visited yet
                        && !yWall.get(pt.x, pt.y + 1) // and the bottom wall of the current point isn't set to prevent a T shape
                    ) {
                        // can place top _ wall at x+1,y+1
                        if (debug)
                            console.log("can place top _ wall at x+1,y+1");
                        var nextpt = new PathPoint(new point_1.Point(pt.x + 1, pt.y + 1), OrientationEnum.Top);
                        possibleNextPoints.push(nextpt);
                    }
                }
                else if (pt.orientation == OrientationEnum.Bottom) {
                    // check rotate to left
                    if (((pt.x - 1 >= 0
                        && facetResult.facetMap.get(pt.x - 1, pt.y) != f.id)
                        || pt.x - 1 < 0)
                        && !xWall.get(pt.x, pt.y)) {
                        // can place left | wall at x,y
                        if (debug)
                            console.log("can place left | wall at x,y");
                        var nextpt = new PathPoint(new point_1.Point(pt.x, pt.y), OrientationEnum.Left);
                        possibleNextPoints.push(nextpt);
                    }
                    // check rotate to right
                    if (((pt.x + 1 < facetResult.width
                        && facetResult.facetMap.get(pt.x + 1, pt.y) != f.id)
                        || pt.x + 1 >= facetResult.width)
                        && !xWall.get(pt.x + 1, pt.y)) {
                        // can place right | wall at x,y
                        if (debug)
                            console.log("can place right | wall at x,y");
                        var nextpt = new PathPoint(new point_1.Point(pt.x, pt.y), OrientationEnum.Right);
                        possibleNextPoints.push(nextpt);
                    }
                    // check leftwards
                    if (pt.x - 1 >= 0
                        && facetResult.facetMap.get(pt.x - 1, pt.y) == f.id
                        && (pt.y + 1 >= facetResult.height || facetResult.facetMap.get(pt.x - 1, pt.y + 1) != f.id)
                        && borderMask.get(pt.x - 1, pt.y)
                        && !yWall.get(pt.x - 1, pt.y + 1)) {
                        // can place bottom _ wall at x-1,y
                        if (debug)
                            console.log("can place bottom _ wall at x-1,y");
                        var nextpt = new PathPoint(new point_1.Point(pt.x - 1, pt.y), OrientationEnum.Bottom);
                        possibleNextPoints.push(nextpt);
                    }
                    // check rightwards
                    if (pt.x + 1 < facetResult.width
                        && facetResult.facetMap.get(pt.x + 1, pt.y) == f.id
                        && (pt.y + 1 >= facetResult.height || facetResult.facetMap.get(pt.x + 1, pt.y + 1) != f.id)
                        && borderMask.get(pt.x + 1, pt.y)
                        && !yWall.get(pt.x + 1, pt.y + 1)) {
                        // can place top _ wall at x+1,y
                        if (debug)
                            console.log("can place bottom _ wall at x+1,y");
                        var nextpt = new PathPoint(new point_1.Point(pt.x + 1, pt.y), OrientationEnum.Bottom);
                        possibleNextPoints.push(nextpt);
                    }
                    // check left downwards
                    if (pt.y + 1 < facetResult.height && pt.x - 1 >= 0 // there is a left downwards
                        && facetResult.facetMap.get(pt.x - 1, pt.y + 1) == f.id // and it's the same facet
                        && borderMask.get(pt.x - 1, pt.y + 1) // and it's on the border
                        && !xWall.get(pt.x - 1 + 1, pt.y + 1) // and the right wall isn't set yet
                        && !xWall.get(pt.x, pt.y) // and the left wall of the current point isn't set yet to prevent |- path
                    ) {
                        // can place right | wall at x-1,y-1
                        if (debug)
                            console.log("can place right | wall at x-1,y+1");
                        var nextpt = new PathPoint(new point_1.Point(pt.x - 1, pt.y + 1), OrientationEnum.Right);
                        possibleNextPoints.push(nextpt);
                    }
                    // check right downwards
                    if (pt.y + 1 < facetResult.height && pt.x + 1 < facetResult.width // there is a right downwards
                        && facetResult.facetMap.get(pt.x + 1, pt.y + 1) == f.id // and it's the same facet
                        && borderMask.get(pt.x + 1, pt.y + 1) // and it's on the border
                        && !xWall.get(pt.x + 1, pt.y + 1) // and the left wall isn't set yet
                        && !xWall.get(pt.x + 1, pt.y) // and the right wall of the current point isn't set yet to prevent -| path
                    ) {
                        // can place left |  wall at x+1,y+1
                        if (debug)
                            console.log("can place left |  wall at x+1,y+1");
                        var nextpt = new PathPoint(new point_1.Point(pt.x + 1, pt.y + 1), OrientationEnum.Left);
                        possibleNextPoints.push(nextpt);
                    }
                }
                if (possibleNextPoints.length > 1) {
                    // TODO it's now not necessary anymore to aggregate all possibilities, the first one is going to be the correct
                    // selection to trace the entire border, so the if checks above can include a skip once ssible point is found again
                    pt = possibleNextPoints[0];
                    FacetBorderTracer.addPointToPath(path, pt, xWall, f, yWall);
                }
                else if (possibleNextPoints.length == 1) {
                    pt = possibleNextPoints[0];
                    FacetBorderTracer.addPointToPath(path, pt, xWall, f, yWall);
                }
                else
                    finished = true;
            }
            // clear up the walls set for the path so the array can be reused
            for (var _i = 0, path_1 = path; _i < path_1.length; _i++) {
                var pt_1 = path_1[_i];
                switch (pt_1.orientation) {
                    case OrientationEnum.Left:
                        xWall.set(pt_1.x, pt_1.y, false);
                        break;
                    case OrientationEnum.Top:
                        yWall.set(pt_1.x, pt_1.y, false);
                        break;
                    case OrientationEnum.Right:
                        xWall.set(pt_1.x + 1, pt_1.y, false);
                        break;
                    case OrientationEnum.Bottom:
                        yWall.set(pt_1.x, pt_1.y + 1, false);
                        break;
                }
            }
            return path;
        };
        /**
         * Add a point to the border path and ensure the correct xWall/yWalls is set
         */
        FacetBorderTracer.addPointToPath = function (path, pt, xWall, f, yWall) {
            path.push(pt);
            switch (pt.orientation) {
                case OrientationEnum.Left:
                    xWall.set(pt.x, pt.y, true);
                    break;
                case OrientationEnum.Top:
                    yWall.set(pt.x, pt.y, true);
                    break;
                case OrientationEnum.Right:
                    xWall.set(pt.x + 1, pt.y, true);
                    break;
                case OrientationEnum.Bottom:
                    yWall.set(pt.x, pt.y + 1, true);
                    break;
            }
        };
        return FacetBorderTracer;
    }());
    exports.FacetBorderTracer = FacetBorderTracer;
    var FacetBorderSegmenter = /** @class */ (function () {
        function FacetBorderSegmenter() {
        }
        /**
         *  Builds border segments that are shared between facets
         *  While border paths are all nice and fancy, they are not linked to neighbour facets
         *  So any change in the paths makes a not so nice gap between the facets, which makes smoothing them out impossible
         */
        FacetBorderSegmenter.buildFacetBorderSegments = function (facetResult, nrOfTimesToHalvePoints, onUpdate) {
            if (nrOfTimesToHalvePoints === void 0) { nrOfTimesToHalvePoints = 2; }
            if (onUpdate === void 0) { onUpdate = null; }
            return __awaiter(this, void 0, void 0, function () {
                var segmentsPerFacet;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            segmentsPerFacet = FacetBorderSegmenter.prepareSegmentsPerFacet(facetResult);
                            // now reduce the segment complexity with Haar wavelet reduction to smooth them out and make them
                            // more curvy with data points instead of zig zag of a grid
                            FacetBorderSegmenter.reduceSegmentComplexity(facetResult, segmentsPerFacet, nrOfTimesToHalvePoints);
                            // now see which segments of facets with the prepared segments of the neighbour facets
                            // and point them to the same one
                            return [4 /*yield*/, FacetBorderSegmenter.matchSegmentsWithNeighbours(facetResult, segmentsPerFacet, onUpdate)];
                        case 1:
                            // now see which segments of facets with the prepared segments of the neighbour facets
                            // and point them to the same one
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         *  Chops up the border paths per facet into segments adjacent tothe same neighbour
         */
        FacetBorderSegmenter.prepareSegmentsPerFacet = function (facetResult) {
            var segmentsPerFacet = new Array(facetResult.facets.length);
            for (var _i = 0, _a = facetResult.facets; _i < _a.length; _i++) {
                var f = _a[_i];
                if (f != null) {
                    var segments = [];
                    if (f.borderPath.length > 1) {
                        var currentPoints = [];
                        currentPoints.push(f.borderPath[0]);
                        for (var i = 1; i < f.borderPath.length; i++) {
                            var oldNeighbour = f.borderPath[i - 1].getNeighbour(facetResult);
                            var curNeighbour = f.borderPath[i].getNeighbour(facetResult);
                            var isTransitionPoint = false;
                            if (oldNeighbour != curNeighbour) {
                                isTransitionPoint = true;
                            }
                            else {
                                // it's possible that due to inner facets inside the current facet that the 
                                // border is interrupted on that facet's side, but not on the neighbour's side
                                if (oldNeighbour != -1) {
                                    // check for tight rotations to break path if diagonals contain a different neighbour, 
                                    //see https://i.imgur.com/o6Srqwj.png for visual path of the issue
                                    if (f.borderPath[i - 1].x == f.borderPath[i].x &&
                                        f.borderPath[i - 1].y == f.borderPath[i].y) {
                                        // rotation turn
                                        // check the diagonal neighbour to see if it remains the same
                                        //   +---+---+
                                        //   | dN|   |
                                        //   +---xxxx> (x = wall, dN = diagNeighbour)
                                        //   |   x f |
                                        //   +---v---+                                          
                                        if ((f.borderPath[i - 1].orientation == OrientationEnum.Top && f.borderPath[i].orientation == OrientationEnum.Left) ||
                                            (f.borderPath[i - 1].orientation == OrientationEnum.Left && f.borderPath[i].orientation == OrientationEnum.Top)) {
                                            var diagNeighbour = facetResult.facetMap.get(f.borderPath[i].x - 1, f.borderPath[i].y - 1);
                                            if (diagNeighbour != oldNeighbour)
                                                isTransitionPoint = true;
                                        }
                                        //   +---+---+
                                        //   |   | dN|
                                        //   <xxxx---+ (x = wall, dN = diagNeighbour)
                                        //   | f x   |
                                        //   +---v---+                                              
                                        else if ((f.borderPath[i - 1].orientation == OrientationEnum.Top && f.borderPath[i].orientation == OrientationEnum.Right) ||
                                            (f.borderPath[i - 1].orientation == OrientationEnum.Right && f.borderPath[i].orientation == OrientationEnum.Top)) {
                                            var diagNeighbour = facetResult.facetMap.get(f.borderPath[i].x + 1, f.borderPath[i].y - 1);
                                            if (diagNeighbour != oldNeighbour)
                                                isTransitionPoint = true;
                                        }
                                        //   +---^---+
                                        //   |   x f |
                                        //   +---xxxx> (x = wall, dN = diagNeighbour)
                                        //   | dN|   |
                                        //   +---+---+                                              
                                        else if ((f.borderPath[i - 1].orientation == OrientationEnum.Bottom && f.borderPath[i].orientation == OrientationEnum.Left) ||
                                            (f.borderPath[i - 1].orientation == OrientationEnum.Left && f.borderPath[i].orientation == OrientationEnum.Bottom)) {
                                            var diagNeighbour = facetResult.facetMap.get(f.borderPath[i].x - 1, f.borderPath[i].y + 1);
                                            if (diagNeighbour != oldNeighbour)
                                                isTransitionPoint = true;
                                        }
                                        //   +---^---+
                                        //   | f x   |
                                        //   <xxxx---+ (x = wall, dN = diagNeighbour)
                                        //   |   | dN|
                                        //   +---+---+                                          
                                        else if ((f.borderPath[i - 1].orientation == OrientationEnum.Bottom && f.borderPath[i].orientation == OrientationEnum.Right) ||
                                            (f.borderPath[i - 1].orientation == OrientationEnum.Right && f.borderPath[i].orientation == OrientationEnum.Bottom)) {
                                            var diagNeighbour = facetResult.facetMap.get(f.borderPath[i].x + 1, f.borderPath[i].y + 1);
                                            if (diagNeighbour != oldNeighbour)
                                                isTransitionPoint = true;
                                        }
                                    }
                                }
                            }
                            if (isTransitionPoint) {
                                // aha! a transition point, create the current points as new segment
                                // and start a new list
                                if (currentPoints.length > 0) {
                                    var segment = new PathSegment(currentPoints, oldNeighbour);
                                    segments.push(segment);
                                    currentPoints = [];
                                }
                            }
                            currentPoints.push(f.borderPath[i]);
                        }
                        // finally check if there is a remainder partial segment and either prepend
                        // the points to the first segment if they have the same neighbour or construct a
                        // new segment
                        if (currentPoints.length > 0) {
                            var oldNeighbour = f.borderPath[f.borderPath.length - 1].getNeighbour(facetResult);
                            if (segments.length > 0 && segments[0].neighbour == oldNeighbour) {
                                // the first segment and the remainder of the last one are the same part
                                // add the current points to the first segment by prefixing it
                                var mergedPoints = currentPoints.concat(segments[0].points);
                                segments[0].points = mergedPoints;
                            }
                            else {
                                // add the remainder as final segment
                                var segment = new PathSegment(currentPoints, oldNeighbour);
                                segments.push(segment);
                                currentPoints = [];
                            }
                        }
                    }
                    segmentsPerFacet[f.id] = segments;
                }
            }
            return segmentsPerFacet;
        };
        /**
         * Reduces each segment border path points
         */
        FacetBorderSegmenter.reduceSegmentComplexity = function (facetResult, segmentsPerFacet, nrOfTimesToHalvePoints) {
            for (var _i = 0, _a = facetResult.facets; _i < _a.length; _i++) {
                var f = _a[_i];
                if (f != null) {
                    for (var _b = 0, _c = segmentsPerFacet[f.id]; _b < _c.length; _b++) {
                        var segment = _c[_b];
                        for (var i = 0; i < nrOfTimesToHalvePoints; i++)
                            segment.points = FacetBorderSegmenter.reduceSegmentHaarWavelet(segment.points);
                    }
                }
            }
        };
        /**
         *  Remove the points by taking the average per pair and using that as a new point
         *  in the reduced segment. The delta values that create the Haar wavelet are not tracked
         *  because they are unneeded.
         */
        FacetBorderSegmenter.reduceSegmentHaarWavelet = function (newpath) {
            if (newpath.length <= 5)
                return newpath;
            var reducedPath = [];
            reducedPath.push(newpath[0]);
            for (var i = 1; i < newpath.length - 2; i += 2) {
                var cx = (newpath[i].x + newpath[i + 1].x) / 2;
                var cy = (newpath[i].y + newpath[i + 1].y) / 2;
                reducedPath.push(new PathPoint(new point_1.Point(cx, cy), OrientationEnum.Left));
            }
            // close the loop
            reducedPath.push(newpath[newpath.length - 1]);
            return reducedPath;
        };
        /**
         *  Matches all segments with each other between facets and their neighbour
         *  A segment matches when the start and end match or the start matches with the end and vice versa
         *  (then the segment will need to be traversed in reverse order)
         */
        FacetBorderSegmenter.matchSegmentsWithNeighbours = function (facetResult, segmentsPerFacet, onUpdate) {
            if (onUpdate === void 0) { onUpdate = null; }
            return __awaiter(this, void 0, void 0, function () {
                var MAX_DISTANCE, _i, _a, f, count, _b, _c, f, debug, s, segment, neighbourFacet, matchFound, neighbourSegments, ns, neighbourSegment;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            MAX_DISTANCE = 2;
                            // reserve room
                            for (_i = 0, _a = facetResult.facets; _i < _a.length; _i++) {
                                f = _a[_i];
                                if (f != null)
                                    f.borderSegments = new Array(segmentsPerFacet[f.id].length);
                            }
                            count = 0;
                            _b = 0, _c = facetResult.facets;
                            _d.label = 1;
                        case 1:
                            if (!(_b < _c.length)) return [3 /*break*/, 5];
                            f = _c[_b];
                            if (!(f != null)) return [3 /*break*/, 3];
                            debug = false;
                            for (s = 0; s < segmentsPerFacet[f.id].length; s++) {
                                segment = segmentsPerFacet[f.id][s];
                                if (segment != null && f.borderSegments[s] == null) {
                                    f.borderSegments[s] = new FacetBoundarySegment(segment, segment.neighbour, false);
                                    if (debug)
                                        console.log("Setting facet " + f.id + " segment " + s + " to " + f.borderSegments[s]);
                                    if (segment.neighbour != -1) {
                                        neighbourFacet = facetResult.facets[segment.neighbour];
                                        matchFound = false;
                                        if (neighbourFacet != null) {
                                            neighbourSegments = segmentsPerFacet[segment.neighbour];
                                            for (ns = 0; ns < neighbourSegments.length; ns++) {
                                                neighbourSegment = neighbourSegments[ns];
                                                // only try to match against the segments that aren't processed yet
                                                // and which are adjacent to the boundary of the current facet
                                                if (neighbourSegment != null && neighbourSegment.neighbour == f.id) {
                                                    if (segment.points[0].distanceTo(neighbourSegment.points[0]) <= MAX_DISTANCE &&
                                                        segment.points[segment.points.length - 1].distanceTo(neighbourSegment.points[neighbourSegment.points.length - 1]) <= MAX_DISTANCE) {
                                                        // start & end points match 
                                                        if (debug)
                                                            console.log("Match found for facet " + f.id + " to neighbour " + neighbourFacet.id);
                                                        neighbourFacet.borderSegments[ns] = new FacetBoundarySegment(segment, f.id, false);
                                                        if (debug)
                                                            console.log("Setting facet " + neighbourFacet.id + " segment " + ns + " to " + neighbourFacet.borderSegments[ns]);
                                                        segmentsPerFacet[neighbourFacet.id][ns] = null;
                                                        matchFound = true;
                                                        break;
                                                    }
                                                    else if (segment.points[0].distanceTo(neighbourSegment.points[neighbourSegment.points.length - 1]) <= MAX_DISTANCE &&
                                                        segment.points[segment.points.length - 1].distanceTo(neighbourSegment.points[0]) <= MAX_DISTANCE) {
                                                        // start & end points match  but in reverse order
                                                        if (debug)
                                                            console.log("Reverse match found for facet " + f.id + " to neighbour " + neighbourFacet.id);
                                                        neighbourFacet.borderSegments[ns] = new FacetBoundarySegment(segment, f.id, true);
                                                        if (debug)
                                                            console.log("Setting facet " + neighbourFacet.id + " segment " + ns + " to " + neighbourFacet.borderSegments[ns]);
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
                            if (!(count % 100 == 0)) return [3 /*break*/, 3];
                            return [4 /*yield*/, common_2.delay(0)];
                        case 2:
                            _d.sent();
                            if (onUpdate != null)
                                onUpdate(f.id / facetResult.facets.length);
                            _d.label = 3;
                        case 3:
                            count++;
                            _d.label = 4;
                        case 4:
                            _b++;
                            return [3 /*break*/, 1];
                        case 5:
                            if (onUpdate != null)
                                onUpdate(1);
                            return [2 /*return*/];
                    }
                });
            });
        };
        return FacetBorderSegmenter;
    }());
    exports.FacetBorderSegmenter = FacetBorderSegmenter;
    var FacetLabelPlacer = /** @class */ (function () {
        function FacetLabelPlacer() {
        }
        /**
         *  Determines where to place the labels for each facet. This is done by calculating where
         *  in the polygon the largest circle can be contained, also called the pole of inaccessibility
         *  That's the spot where there will be the most room for the label.
         *  One tricky gotcha: neighbour facets can lay completely inside other facets and can overlap the label
         *  if only the outer border of the facet is taken in account. This is solved by adding the neighbours facet polygon that fall
         *  within the facet as additional polygon rings (why does everything look so easy to do yet never is under the hood :/)
         */
        FacetLabelPlacer.buildFacetLabelBounds = function (facetResult, onUpdate) {
            if (onUpdate === void 0) { onUpdate = null; }
            return __awaiter(this, void 0, void 0, function () {
                var count, _i, _a, f, polyRings, borderPath, onlyOuterRing, _b, _c, neighbourIdx, neighbourPath, fallsInside, result, innerPadding;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            count = 0;
                            _i = 0, _a = facetResult.facets;
                            _d.label = 1;
                        case 1:
                            if (!(_i < _a.length)) return [3 /*break*/, 5];
                            f = _a[_i];
                            if (!(f != null)) return [3 /*break*/, 3];
                            polyRings = [];
                            borderPath = f.getFullPathFromBorderSegments();
                            // outer path must be first ring
                            polyRings.push(borderPath);
                            onlyOuterRing = [borderPath];
                            // now add all the neighbours of the facet as "inner" rings,
                            // regardless if they are inner or not. These are seen as areas where the label
                            // cannot be placed
                            if (f.neighbourFacetsIsDirty)
                                FacetCreator.buildFacetNeighbour(f, facetResult);
                            for (_b = 0, _c = f.neighbourFacets; _b < _c.length; _b++) {
                                neighbourIdx = _c[_b];
                                neighbourPath = facetResult.facets[neighbourIdx].getFullPathFromBorderSegments();
                                fallsInside = FacetLabelPlacer.doesNeighbourFallInsideInCurrentFacet(neighbourPath, f, onlyOuterRing);
                                if (fallsInside)
                                    polyRings.push(neighbourPath);
                            }
                            result = polylabel_1.polylabel(polyRings);
                            f.labelBounds = new boundingbox_1.BoundingBox();
                            innerPadding = 2 * Math.sqrt(2 * result.distance);
                            f.labelBounds.minX = result.pt.x - innerPadding;
                            f.labelBounds.maxX = result.pt.x + innerPadding;
                            f.labelBounds.minY = result.pt.y - innerPadding;
                            f.labelBounds.maxY = result.pt.y + innerPadding;
                            if (!(count % 100 == 0)) return [3 /*break*/, 3];
                            return [4 /*yield*/, common_2.delay(0)];
                        case 2:
                            _d.sent();
                            if (onUpdate != null)
                                onUpdate(f.id / facetResult.facets.length);
                            _d.label = 3;
                        case 3:
                            count++;
                            _d.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 1];
                        case 5:
                            if (onUpdate != null)
                                onUpdate(1);
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         *  Checks whether a neighbour border path is fully within the current facet border path
         */
        FacetLabelPlacer.doesNeighbourFallInsideInCurrentFacet = function (neighbourPath, f, onlyOuterRing) {
            var fallsInside = true;
            // fast test to see if the neighbour falls inside the bbox of the facet
            for (var i = 0; i < neighbourPath.length && fallsInside; i++) {
                if (neighbourPath[i].x >= f.bbox.minX && neighbourPath[i].x <= f.bbox.maxX &&
                    neighbourPath[i].y >= f.bbox.minY && neighbourPath[i].y <= f.bbox.maxY) {
                    //ok
                }
                else {
                    fallsInside = false;
                }
            }
            if (fallsInside) {
                // do a more fine grained but more expensive check to see if each of the points fall within the polygon
                for (var i = 0; i < neighbourPath.length && fallsInside; i++) {
                    var distance = polylabel_1.pointToPolygonDist(neighbourPath[i].x, neighbourPath[i].y, onlyOuterRing);
                    if (distance < 0) {
                        // falls outside
                        fallsInside = false;
                    }
                }
            }
            return fallsInside;
        };
        return FacetLabelPlacer;
    }());
    exports.FacetLabelPlacer = FacetLabelPlacer;
});
/**
 * Module that manages the GUI when processing
 */
define("guiprocessmanager", ["require", "exports", "common", "facetmanagement", "gui", "structs/point", "colorreductionmanagement"], function (require, exports, common_3, facetmanagement_1, gui_1, point_2, colorreductionmanagement_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ProcessResult = /** @class */ (function () {
        function ProcessResult() {
        }
        return ProcessResult;
    }());
    exports.ProcessResult = ProcessResult;
    /**
     *  Manages the GUI states & processes the image step by step
     */
    var GUIProcessManager = /** @class */ (function () {
        function GUIProcessManager() {
        }
        GUIProcessManager.process = function (settings, cancellationToken) {
            return __awaiter(this, void 0, void 0, function () {
                var c, ctx, imgData, width, height, newWidth, newHeight, newHeight, newWidth, tempCanvas, tabsOutput, kmeansImgData, colormapResult, facetResult, cBorderSegment, processResult;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            c = document.getElementById("canvas");
                            ctx = c.getContext("2d");
                            imgData = ctx.getImageData(0, 0, c.width, c.height);
                            if (settings.resizeImageIfTooLarge && (c.width > settings.resizeImageWidth || c.height > settings.resizeImageHeight)) {
                                width = c.width;
                                height = c.height;
                                if (width > settings.resizeImageWidth) {
                                    newWidth = settings.resizeImageWidth;
                                    newHeight = c.height / c.width * settings.resizeImageWidth;
                                    width = newWidth;
                                    height = newHeight;
                                }
                                if (height > settings.resizeImageHeight) {
                                    newHeight = settings.resizeImageHeight;
                                    newWidth = width / height * newHeight;
                                    width = newWidth;
                                    height = newHeight;
                                }
                                tempCanvas = document.createElement("canvas");
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
                            tabsOutput = M.Tabs.getInstance(document.getElementById("tabsOutput"));
                            return [4 /*yield*/, GUIProcessManager.processKmeansClustering(imgData, tabsOutput, ctx, settings, cancellationToken)];
                        case 1:
                            kmeansImgData = _a.sent();
                            colormapResult = colorreductionmanagement_1.ColorReducer.createColorMap(kmeansImgData);
                            return [4 /*yield*/, GUIProcessManager.processFacetBuilding(imgData, colormapResult, cancellationToken)];
                        case 2:
                            facetResult = _a.sent();
                            // facet reduction
                            return [4 /*yield*/, GUIProcessManager.processFacetReduction(facetResult, tabsOutput, settings, colormapResult, cancellationToken)];
                        case 3:
                            // facet reduction
                            _a.sent();
                            // facet border tracing
                            return [4 /*yield*/, GUIProcessManager.processFacetBorderTracing(tabsOutput, facetResult, cancellationToken)];
                        case 4:
                            // facet border tracing
                            _a.sent();
                            return [4 /*yield*/, GUIProcessManager.processFacetBorderSegmentation(facetResult, tabsOutput, settings, cancellationToken)];
                        case 5:
                            cBorderSegment = _a.sent();
                            // facet label placement
                            return [4 /*yield*/, GUIProcessManager.processFacetLabelPlacement(facetResult, cBorderSegment, tabsOutput, cancellationToken)];
                        case 6:
                            // facet label placement
                            _a.sent();
                            processResult = new ProcessResult();
                            processResult.facetResult = facetResult;
                            processResult.colorsByIndex = colormapResult.colorsByIndex;
                            return [2 /*return*/, processResult];
                    }
                });
            });
        };
        GUIProcessManager.processKmeansClustering = function (imgData, tabsOutput, ctx, settings, cancellationToken) {
            return __awaiter(this, void 0, void 0, function () {
                var cKmeans, ctxKmeans, kmeansImgData;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            gui_1.time("K-means clustering");
                            cKmeans = document.getElementById("cKMeans");
                            cKmeans.width = imgData.width;
                            cKmeans.height = imgData.height;
                            ctxKmeans = cKmeans.getContext("2d");
                            ctxKmeans.fillStyle = "white";
                            ctxKmeans.fillRect(0, 0, cKmeans.width, cKmeans.height);
                            kmeansImgData = ctxKmeans.getImageData(0, 0, cKmeans.width, cKmeans.height);
                            tabsOutput.select("kmeans-pane");
                            $(".status.kMeans").addClass("active");
                            return [4 /*yield*/, colorreductionmanagement_1.ColorReducer.applyKMeansClustering(imgData, kmeansImgData, ctx, settings, function (kmeans) {
                                    var progress = (100 - (kmeans.currentDeltaDistanceDifference > 100 ? 100 : kmeans.currentDeltaDistanceDifference)) / 100;
                                    $("#statusKMeans").css("width", Math.round(progress * 100) + "%");
                                    ctxKmeans.putImageData(kmeansImgData, 0, 0);
                                    console.log(kmeans.currentDeltaDistanceDifference);
                                    if (cancellationToken.isCancelled)
                                        throw new Error("Cancelled");
                                })];
                        case 1:
                            _a.sent();
                            $(".status").removeClass("active");
                            $(".status.kMeans").addClass("complete");
                            gui_1.timeEnd("K-means clustering");
                            return [2 /*return*/, kmeansImgData];
                    }
                });
            });
        };
        GUIProcessManager.processFacetBuilding = function (imgData, colormapResult, cancellationToken) {
            return __awaiter(this, void 0, void 0, function () {
                var facetResult;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            gui_1.time("Facet building");
                            $(".status.facetBuilding").addClass("active");
                            return [4 /*yield*/, facetmanagement_1.FacetCreator.getFacets(imgData.width, imgData.height, colormapResult.imgColorIndices, function (progress) {
                                    if (cancellationToken.isCancelled)
                                        throw new Error("Cancelled");
                                    $("#statusFacetBuilding").css("width", Math.round(progress * 100) + "%");
                                })];
                        case 1:
                            facetResult = _a.sent();
                            $(".status").removeClass("active");
                            $(".status.facetBuilding").addClass("complete");
                            gui_1.timeEnd("Facet building");
                            return [2 /*return*/, facetResult];
                    }
                });
            });
        };
        GUIProcessManager.processFacetReduction = function (facetResult, tabsOutput, settings, colormapResult, cancellationToken) {
            return __awaiter(this, void 0, void 0, function () {
                var cReduction, ctxReduction, reductionImgData;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            gui_1.time("Facet reduction");
                            cReduction = document.getElementById("cReduction");
                            cReduction.width = facetResult.width;
                            cReduction.height = facetResult.height;
                            ctxReduction = cReduction.getContext("2d");
                            ctxReduction.fillStyle = "white";
                            ctxReduction.fillRect(0, 0, cReduction.width, cReduction.height);
                            reductionImgData = ctxReduction.getImageData(0, 0, cReduction.width, cReduction.height);
                            tabsOutput.select("reduction-pane");
                            $(".status.facetReduction").addClass("active");
                            return [4 /*yield*/, facetmanagement_1.FacetReducer.reduceFacets(settings.removeFacetsSmallerThanNrOfPoints, settings.removeFacetsFromLargeToSmall, colormapResult.colorsByIndex, facetResult, colormapResult.imgColorIndices, function (progress) {
                                    if (cancellationToken.isCancelled)
                                        throw new Error("Cancelled");
                                    // update status & image                
                                    $("#statusFacetReduction").css("width", Math.round(progress * 100) + "%");
                                    var idx = 0;
                                    for (var j = 0; j < facetResult.height; j++) {
                                        for (var i = 0; i < facetResult.width; i++) {
                                            var facet = facetResult.facets[facetResult.facetMap.get(i, j)];
                                            var rgb = colormapResult.colorsByIndex[facet.color];
                                            reductionImgData.data[idx++] = rgb[0];
                                            reductionImgData.data[idx++] = rgb[1];
                                            reductionImgData.data[idx++] = rgb[2];
                                            idx++;
                                        }
                                    }
                                    ctxReduction.putImageData(reductionImgData, 0, 0);
                                })];
                        case 1:
                            _a.sent();
                            $(".status").removeClass("active");
                            $(".status.facetReduction").addClass("complete");
                            gui_1.timeEnd("Facet reduction");
                            return [2 /*return*/];
                    }
                });
            });
        };
        GUIProcessManager.processFacetBorderTracing = function (tabsOutput, facetResult, cancellationToken) {
            return __awaiter(this, void 0, void 0, function () {
                var cBorderPath, ctxBorderPath;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            gui_1.time("Facet border tracing");
                            tabsOutput.select("borderpath-pane");
                            cBorderPath = document.getElementById("cBorderPath");
                            cBorderPath.width = facetResult.width;
                            cBorderPath.height = facetResult.height;
                            ctxBorderPath = cBorderPath.getContext("2d");
                            $(".status.facetBorderPath").addClass("active");
                            return [4 /*yield*/, facetmanagement_1.FacetBorderTracer.buildFacetBorderPaths(facetResult, function (progress) {
                                    if (cancellationToken.isCancelled)
                                        throw new Error("Cancelled");
                                    // update status & image
                                    $("#statusFacetBorderPath").css("width", Math.round(progress * 100) + "%");
                                    ctxBorderPath.fillStyle = "white";
                                    ctxBorderPath.fillRect(0, 0, cBorderPath.width, cBorderPath.height);
                                    for (var _i = 0, _a = facetResult.facets; _i < _a.length; _i++) {
                                        var f = _a[_i];
                                        if (f != null && f.borderPath != null) {
                                            ctxBorderPath.beginPath();
                                            ctxBorderPath.moveTo(f.borderPath[0].getWallX(), f.borderPath[0].getWallY());
                                            for (var i = 1; i < f.borderPath.length; i++) {
                                                ctxBorderPath.lineTo(f.borderPath[i].getWallX(), f.borderPath[i].getWallY());
                                            }
                                            ctxBorderPath.stroke();
                                        }
                                    }
                                })];
                        case 1:
                            _a.sent();
                            $(".status").removeClass("active");
                            $(".status.facetBorderPath").addClass("complete");
                            gui_1.timeEnd("Facet border tracing");
                            return [2 /*return*/];
                    }
                });
            });
        };
        GUIProcessManager.processFacetBorderSegmentation = function (facetResult, tabsOutput, settings, cancellationToken) {
            return __awaiter(this, void 0, void 0, function () {
                var cBorderSegment, ctxBorderSegment;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            gui_1.time("Facet border segmentation");
                            cBorderSegment = document.getElementById("cBorderSegmentation");
                            cBorderSegment.width = facetResult.width;
                            cBorderSegment.height = facetResult.height;
                            ctxBorderSegment = cBorderSegment.getContext("2d");
                            tabsOutput.select("bordersegmentation-pane");
                            $(".status.facetBorderSegmentation").addClass("active");
                            return [4 /*yield*/, facetmanagement_1.FacetBorderSegmenter.buildFacetBorderSegments(facetResult, settings.nrOfTimesToHalveBorderSegments, function (progress) {
                                    if (cancellationToken.isCancelled)
                                        throw new Error("Cancelled");
                                    // update status & image
                                    $("#statusFacetBorderSegmentation").css("width", Math.round(progress * 100) + "%");
                                    ctxBorderSegment.fillStyle = "white";
                                    ctxBorderSegment.fillRect(0, 0, cBorderSegment.width, cBorderSegment.height);
                                    for (var _i = 0, _a = facetResult.facets; _i < _a.length; _i++) {
                                        var f = _a[_i];
                                        if (f != null && progress > f.id / facetResult.facets.length) {
                                            ctxBorderSegment.beginPath();
                                            var path = f.getFullPathFromBorderSegments();
                                            ctxBorderSegment.moveTo(path[0].x, path[0].y);
                                            for (var i = 1; i < path.length; i++) {
                                                ctxBorderSegment.lineTo(path[i].x, path[i].y);
                                            }
                                            ctxBorderSegment.stroke();
                                        }
                                    }
                                })];
                        case 1:
                            _a.sent();
                            $(".status").removeClass("active");
                            $(".status.facetBorderSegmentation").addClass("complete");
                            gui_1.timeEnd("Facet border segmentation");
                            return [2 /*return*/, cBorderSegment];
                    }
                });
            });
        };
        GUIProcessManager.processFacetLabelPlacement = function (facetResult, cBorderSegment, tabsOutput, cancellationToken) {
            return __awaiter(this, void 0, void 0, function () {
                var cLabelPlacement, ctxLabelPlacement;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            gui_1.time("Facet label placement");
                            cLabelPlacement = document.getElementById("cLabelPlacement");
                            cLabelPlacement.width = facetResult.width;
                            cLabelPlacement.height = facetResult.height;
                            ctxLabelPlacement = cLabelPlacement.getContext("2d");
                            ctxLabelPlacement.fillStyle = "white";
                            ctxLabelPlacement.fillRect(0, 0, cBorderSegment.width, cBorderSegment.height);
                            ctxLabelPlacement.drawImage(cBorderSegment, 0, 0);
                            tabsOutput.select("labelplacement-pane");
                            $(".status.facetLabelPlacement").addClass("active");
                            return [4 /*yield*/, facetmanagement_1.FacetLabelPlacer.buildFacetLabelBounds(facetResult, function (progress) {
                                    if (cancellationToken.isCancelled)
                                        throw new Error("Cancelled");
                                    // update status & image
                                    $("#statusFacetLabelPlacement").css("width", Math.round(progress * 100) + "%");
                                    for (var _i = 0, _a = facetResult.facets; _i < _a.length; _i++) {
                                        var f = _a[_i];
                                        if (f != null && f.labelBounds != null) {
                                            ctxLabelPlacement.fillStyle = "red";
                                            ctxLabelPlacement.fillRect(f.labelBounds.minX, f.labelBounds.minY, f.labelBounds.width, f.labelBounds.height);
                                        }
                                    }
                                })];
                        case 1:
                            _a.sent();
                            $(".status").removeClass("active");
                            $(".status.facetLabelPlacement").addClass("complete");
                            gui_1.timeEnd("Facet label placement");
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         *  Creates a vector based SVG image of the facets with the given configuration
         */
        GUIProcessManager.createSVG = function (facetResult, colorsByIndex, sizeMultiplier, fill, stroke, addColorLabels, fontSize, onUpdate) {
            if (fontSize === void 0) { fontSize = 6; }
            if (onUpdate === void 0) { onUpdate = null; }
            return __awaiter(this, void 0, void 0, function () {
                var xmlns, svg, count, _i, _a, f, newpath, useSegments, i, svgPath, data, i, midpointX, midpointY, txt, subsvg, g;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            xmlns = "http://www.w3.org/2000/svg";
                            svg = document.createElementNS(xmlns, "svg");
                            svg.setAttribute("width", sizeMultiplier * facetResult.width + "");
                            svg.setAttribute("height", sizeMultiplier * facetResult.height + "");
                            count = 0;
                            _i = 0, _a = facetResult.facets;
                            _b.label = 1;
                        case 1:
                            if (!(_i < _a.length)) return [3 /*break*/, 5];
                            f = _a[_i];
                            if (!(f != null && f.borderSegments.length > 0)) return [3 /*break*/, 3];
                            newpath = [];
                            useSegments = true;
                            if (useSegments) {
                                newpath = f.getFullPathFromBorderSegments();
                            }
                            else {
                                for (i = 0; i < f.borderPath.length; i++) {
                                    newpath.push(new point_2.Point(f.borderPath[i].getWallX(), f.borderPath[i].getWallY()));
                                }
                            }
                            if (newpath[0].x != newpath[newpath.length - 1].x || newpath[0].y != newpath[newpath.length - 1].y)
                                newpath.push(newpath[0]); //close loop if necessary
                            svgPath = document.createElementNS("http://www.w3.org/2000/svg", 'path');
                            data = "M ";
                            data += newpath[0].x * sizeMultiplier + " " + newpath[0].y * sizeMultiplier + " ";
                            for (i = 1; i < newpath.length; i++) {
                                midpointX = (newpath[i].x + newpath[i - 1].x) / 2;
                                midpointY = (newpath[i].y + newpath[i - 1].y) / 2;
                                data += "Q " + (midpointX * sizeMultiplier) + " " + (midpointY * sizeMultiplier) + " " + (newpath[i].x * sizeMultiplier) + " " + (newpath[i].y * sizeMultiplier) + " ";
                            }
                            svgPath.setAttribute("data-facetId", f.id + "");
                            //Set path's data
                            svgPath.setAttribute("d", data);
                            if (stroke)
                                svgPath.style.stroke = "#000";
                            else {
                                // make the border the same color as the fill color if there is no border stroke
                                // to not have gaps in between facets
                                if (fill)
                                    svgPath.style.stroke = "rgb(" + colorsByIndex[f.color][0] + "," + colorsByIndex[f.color][1] + "," + colorsByIndex[f.color][2] + ")";
                            }
                            svgPath.style.strokeWidth = "1px"; //Set stroke width
                            if (fill)
                                svgPath.style.fill = "rgb(" + colorsByIndex[f.color][0] + "," + colorsByIndex[f.color][1] + "," + colorsByIndex[f.color][2] + ")";
                            else
                                svgPath.style.fill = "none";
                            svg.appendChild(svgPath);
                            // add the color labels if necessary. I mean, this is the whole idea behind the paint by numbers part
                            // so I don't know why you would hide them
                            if (addColorLabels) {
                                txt = document.createElementNS(xmlns, "text");
                                txt.setAttribute("x", "50%");
                                txt.setAttribute("y", "50%");
                                txt.setAttribute("alignment-baseline", "middle");
                                txt.setAttribute("text-anchor", "middle");
                                txt.setAttribute("font-family", "Tahoma");
                                txt.setAttribute("font-size", fontSize + "");
                                txt.textContent = f.color + "";
                                subsvg = document.createElementNS(xmlns, "svg");
                                subsvg.setAttribute("width", f.labelBounds.width * sizeMultiplier + "");
                                subsvg.setAttribute("height", f.labelBounds.height * sizeMultiplier + "");
                                subsvg.setAttribute("overflow", "visible");
                                subsvg.appendChild(txt);
                                g = document.createElementNS(xmlns, "g");
                                g.setAttribute("class", "label");
                                g.setAttribute("transform", "translate(" + f.labelBounds.minX * sizeMultiplier + "," + f.labelBounds.minY * sizeMultiplier + ")");
                                g.appendChild(subsvg);
                                svg.appendChild(g);
                            }
                            if (!(count % 100 == 0)) return [3 /*break*/, 3];
                            return [4 /*yield*/, common_3.delay(0)];
                        case 2:
                            _b.sent();
                            if (onUpdate != null)
                                onUpdate(f.id / facetResult.facets.length);
                            _b.label = 3;
                        case 3:
                            count++;
                            _b.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 1];
                        case 5:
                            if (onUpdate != null)
                                onUpdate(1);
                            return [2 /*return*/, svg];
                    }
                });
            });
        };
        return GUIProcessManager;
    }());
    exports.GUIProcessManager = GUIProcessManager;
});
/**
 * Module that provides function the GUI uses and updates the DOM accordingly
 */
define("gui", ["require", "exports", "common", "guiprocessmanager", "settings"], function (require, exports, common_4, guiprocessmanager_1, settings_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var processResult = null;
    var cancellationToken = new common_4.CancellationToken();
    var timers = {};
    function time(name) {
        console.time(name);
        timers[name] = new Date();
    }
    exports.time = time;
    function timeEnd(name) {
        console.timeEnd(name);
        var ms = new Date().getTime() - timers[name].getTime();
        log(name + ": " + ms + "ms");
        delete timers[name];
    }
    exports.timeEnd = timeEnd;
    function log(str) {
        $("#log").append("<br/><span>" + str + "</span>");
    }
    exports.log = log;
    function parseSettings() {
        var settings = new settings_2.Settings();
        if ($("#optColorSpaceRGB").prop("checked"))
            settings.kMeansClusteringColorSpace = settings_2.ClusteringColorSpace.RGB;
        else if ($("#optColorSpaceHSL").prop("checked"))
            settings.kMeansClusteringColorSpace = settings_2.ClusteringColorSpace.HSL;
        else if ($("#optColorSpaceRGB").prop("checked"))
            settings.kMeansClusteringColorSpace = settings_2.ClusteringColorSpace.LAB;
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
    exports.parseSettings = parseSettings;
    function process() {
        return __awaiter(this, void 0, void 0, function () {
            var settings, tabsOutput, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        settings = parseSettings();
                        // cancel old process & create new
                        cancellationToken.isCancelled = true;
                        cancellationToken = new common_4.CancellationToken();
                        return [4 /*yield*/, guiprocessmanager_1.GUIProcessManager.process(settings, cancellationToken)];
                    case 1:
                        processResult = _a.sent();
                        return [4 /*yield*/, updateOutput()];
                    case 2:
                        _a.sent();
                        tabsOutput = M.Tabs.getInstance(document.getElementById("tabsOutput"));
                        tabsOutput.select("output-pane");
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        log("Error: " + e_1.message + " at " + e_1.stack);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    exports.process = process;
    function updateOutput() {
        return __awaiter(this, void 0, void 0, function () {
            var showLabels, fill, stroke, sizeMultiplier, fontSize, svg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(processResult != null)) return [3 /*break*/, 2];
                        showLabels = $("#chkShowLabels").prop("checked");
                        fill = $("#chkFillFacets").prop("checked");
                        stroke = $("#chkShowBorders").prop("checked");
                        sizeMultiplier = parseInt($("#txtSizeMultiplier").val() + "");
                        fontSize = parseInt($("#txtLabelFontSize").val() + "");
                        $("#statusSVGGenerate").css("width", "0%");
                        $(".status.SVGGenerate").removeClass("complete");
                        $(".status.SVGGenerate").addClass("active");
                        return [4 /*yield*/, guiprocessmanager_1.GUIProcessManager.createSVG(processResult.facetResult, processResult.colorsByIndex, sizeMultiplier, fill, stroke, showLabels, fontSize, function (progress) {
                                if (cancellationToken.isCancelled)
                                    throw new Error("Cancelled");
                                $("#statusSVGGenerate").css("width", Math.round(progress * 100) + "%");
                            })];
                    case 1:
                        svg = _a.sent();
                        $("#svgContainer").empty().append(svg);
                        $("#palette").empty().append(createPaletteHtml(processResult.colorsByIndex));
                        $('#palette .color').tooltip();
                        $(".status").removeClass("active");
                        $(".status.SVGGenerate").addClass("complete");
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    }
    exports.updateOutput = updateOutput;
    function createPaletteHtml(colorsByIndex) {
        var html = "";
        for (var c = 0; c < colorsByIndex.length; c++) {
            var style = "background-color: " + ("rgb(" + colorsByIndex[c][0] + "," + colorsByIndex[c][1] + "," + colorsByIndex[c][2] + ")");
            html += "<div class=\"color\" class=\"tooltipped\" style=\"" + style + "\" data-tooltip=\"" + colorsByIndex[c][0] + "," + colorsByIndex[c][1] + "," + colorsByIndex[c][2] + "\">" + c + "</div>";
        }
        return $(html);
    }
    function downloadPalettePng() {
        if (processResult == null)
            return;
        var colorsByIndex = processResult.colorsByIndex;
        var canvas = document.createElement("canvas");
        var nrOfItemsPerRow = 10;
        var nrRows = Math.ceil(colorsByIndex.length / nrOfItemsPerRow);
        var margin = 10;
        var cellWidth = 80;
        var cellHeight = 70;
        canvas.width = margin + nrOfItemsPerRow * (cellWidth + margin);
        canvas.height = margin + nrRows * (cellHeight + margin);
        var ctx = canvas.getContext("2d");
        ctx.translate(0.5, 0.5);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < colorsByIndex.length; i++) {
            var color = colorsByIndex[i];
            var x = margin + (i % nrOfItemsPerRow) * (cellWidth + margin);
            var y = margin + Math.floor(i / nrOfItemsPerRow) * (cellHeight + margin);
            ctx.fillStyle = "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
            ctx.fillRect(x, y, cellWidth, cellHeight - 20);
            ctx.strokeStyle = "#888";
            ctx.strokeRect(x, y, cellWidth, cellHeight - 20);
            var nrText = i + "";
            ctx.fillStyle = "black";
            ctx.strokeStyle = "#CCC";
            ctx.font = "20px Tahoma";
            var nrTextSize = ctx.measureText(nrText);
            ctx.lineWidth = 2;
            ctx.strokeText(nrText, x + cellWidth / 2 - nrTextSize.width / 2, y + cellHeight / 2 - 5);
            ctx.fillText(nrText, x + cellWidth / 2 - nrTextSize.width / 2, y + cellHeight / 2 - 5);
            ctx.lineWidth = 1;
            ctx.font = "10px Tahoma";
            var rgbText = "RGB: " + Math.floor(color[0]) + "," + Math.floor(color[1]) + "," + Math.floor(color[2]);
            var rgbTextSize = ctx.measureText(rgbText);
            ctx.fillStyle = "black";
            ctx.fillText(rgbText, x + cellWidth / 2 - rgbTextSize.width / 2, y + cellHeight - 10);
        }
        var dataURL = canvas.toDataURL("image/png");
        var dl = document.createElement("a");
        document.body.appendChild(dl);
        dl.setAttribute("href", dataURL);
        dl.setAttribute("download", "palette.png");
        dl.click();
    }
    exports.downloadPalettePng = downloadPalettePng;
    function downloadPNG() {
        if ($("#svgContainer svg").length > 0) {
            var svg = $("#svgContainer svg").get(0);
            var svgAsXML = (new XMLSerializer).serializeToString(svg);
            saveSvgAsPng($("#svgContainer svg").get(0), "paintbynumbers.png");
        }
    }
    exports.downloadPNG = downloadPNG;
    function downloadSVG() {
        if ($("#svgContainer svg").length > 0) {
            var svgEl = $("#svgContainer svg").get(0);
            svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            var svgData = svgEl.outerHTML;
            var preface = '<?xml version="1.0" standalone="no"?>\r\n';
            var svgBlob = new Blob([preface, svgData], { type: "image/svg+xml;charset=utf-8" });
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
    exports.downloadSVG = downloadSVG;
    function loadExample(imgId) {
        // load image
        var img = document.getElementById(imgId);
        var c = document.getElementById("canvas");
        var ctx = c.getContext("2d");
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
    var Clipboard = /** @class */ (function () {
        function Clipboard(canvas_id, autoresize) {
            this.ctrl_pressed = false;
            this.command_pressed = false;
            this.paste_event_support = false;
            var _self = this;
            this.canvas = document.getElementById(canvas_id);
            this.ctx = this.canvas.getContext("2d");
            this.autoresize = autoresize;
            //handlers
            document.addEventListener('keydown', function (e) {
                _self.on_keyboard_action(e);
            }, false); //firefox fix
            document.addEventListener('keyup', function (e) {
                _self.on_keyboardup_action(e);
            }, false); //firefox fix
            document.addEventListener('paste', function (e) {
                _self.paste_auto(e);
            }, false); //official paste handler
            this.init();
        }
        //constructor - we ignore security checks here
        Clipboard.prototype.init = function () {
            this.pasteCatcher = document.createElement("div");
            this.pasteCatcher.setAttribute("id", "paste_ff");
            this.pasteCatcher.setAttribute("contenteditable", "");
            this.pasteCatcher.style.cssText = 'opacity:0;position:fixed;top:0px;left:0px;width:10px;margin-left:-20px;';
            document.body.appendChild(this.pasteCatcher);
            var _self = this;
            // create an observer instance
            var observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (_self.paste_event_support === true || _self.ctrl_pressed == false || mutation.type != 'childList') {
                        //we already got data in paste_auto()
                        return true;
                    }
                    //if paste handle failed - capture pasted object manually
                    if (mutation.addedNodes.length == 1) {
                        if (mutation.addedNodes[0].src != undefined) {
                            //image
                            _self.paste_createImage(mutation.addedNodes[0].src);
                        }
                        //register cleanup after some time.
                        setTimeout(function () {
                            _self.pasteCatcher.innerHTML = '';
                        }, 20);
                    }
                    return false;
                });
            });
            var target = document.getElementById('paste_ff');
            var config = { attributes: true, childList: true, characterData: true };
            observer.observe(target, config);
        };
        //default paste action
        Clipboard.prototype.paste_auto = function (e) {
            this.paste_event_support = false;
            if (this.pasteCatcher != undefined) {
                this.pasteCatcher.innerHTML = '';
            }
            if (e.clipboardData) {
                var items = e.clipboardData.items;
                if (items) {
                    this.paste_event_support = true;
                    //access data directly
                    for (var i = 0; i < items.length; i++) {
                        if (items[i].type.indexOf("image") !== -1) {
                            //image
                            var blob = items[i].getAsFile();
                            var URLObj = window.URL || window.webkitURL;
                            var source = URLObj.createObjectURL(blob);
                            this.paste_createImage(source);
                        }
                    }
                    e.preventDefault();
                }
                else {
                    //wait for DOMSubtreeModified event
                    //https://bugzilla.mozilla.org/show_bug.cgi?id=891247
                }
            }
        };
        ;
        //on keyboard press
        Clipboard.prototype.on_keyboard_action = function (event) {
            var k = event.keyCode;
            //ctrl
            if (k == 17 || event.metaKey || event.ctrlKey) {
                if (this.ctrl_pressed == false)
                    this.ctrl_pressed = true;
            }
            //v
            if (k == 86) {
                if (document.activeElement != undefined && document.activeElement.type == 'text') {
                    //let user paste into some input
                    return false;
                }
                if (this.ctrl_pressed == true && this.pasteCatcher != undefined) {
                    this.pasteCatcher.focus();
                }
            }
            return false;
        };
        ;
        //on keyboard release
        Clipboard.prototype.on_keyboardup_action = function (event) {
            //ctrl
            if (event.ctrlKey == false && this.ctrl_pressed == true) {
                this.ctrl_pressed = false;
            }
            //command
            else if (event.metaKey == false && this.command_pressed == true) {
                this.command_pressed = false;
                this.ctrl_pressed = false;
            }
        };
        ;
        //draw pasted image to canvas
        Clipboard.prototype.paste_createImage = function (source) {
            var pastedImage = new Image();
            var self = this;
            pastedImage.onload = function () {
                if (self.autoresize == true) {
                    //resize
                    self.canvas.width = pastedImage.width;
                    self.canvas.height = pastedImage.height;
                }
                else {
                    //clear canvas
                    self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
                }
                self.ctx.drawImage(pastedImage, 0, 0);
            };
            pastedImage.src = source;
        };
        ;
        return Clipboard;
    }());
    exports.Clipboard = Clipboard;
});
define("main", ["require", "exports", "lib/clipboard", "gui"], function (require, exports, clipboard_1, gui_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    $(document).ready(function () {
        var _this = this;
        $('.tabs').tabs();
        $('.tooltipped').tooltip();
        var clip = new clipboard_1.Clipboard("canvas", true);
        gui_2.loadExample("imgSmall");
        $("#btnProcess").click(function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, gui_2.process()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        });
        $("#chkShowLabels, #chkFillFacets, #chkShowBorders, #txtSizeMultiplier, #txtLabelFontSize").change(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, gui_2.updateOutput()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        $("#btnDownloadSVG").click(function () {
            gui_2.downloadSVG();
        });
        $("#btnDownloadPNG").click(function () {
            gui_2.downloadPNG();
        });
        $("#btnDownloadPalettePNG").click(function () {
            gui_2.downloadPalettePng();
        });
        $("#lnkTrivial").click(function () { gui_2.loadExample("imgTrivial"); return false; });
        $("#lnkSmall").click(function () { gui_2.loadExample("imgSmall"); return false; });
        $("#lnkMedium").click(function () { gui_2.loadExample("imgMedium"); return false; });
    });
});
