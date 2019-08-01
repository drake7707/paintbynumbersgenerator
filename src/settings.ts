import { RGB } from "./common";

export enum ClusteringColorSpace {
    RGB = 0,
    HSL = 1,
    LAB = 2,
}

export class Settings {
    public kMeansNrOfClusters: number = 16;
    public kMeansMinDeltaDifference: number = 1;
    public kMeansClusteringColorSpace: ClusteringColorSpace = ClusteringColorSpace.RGB;

    public kMeansColorRestrictions: Array<RGB | string> = [];

    public colorAliases: { [key: string]: RGB } = {};

    public removeFacetsSmallerThanNrOfPoints: number = 20;
    public removeFacetsFromLargeToSmall: boolean = true;
    public nrOfTimesToHalveBorderSegments: number = 2;

    public resizeImageIfTooLarge: boolean = true;
    public resizeImageWidth: number = 1024;
    public resizeImageHeight: number = 1024;
}
