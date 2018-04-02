
export enum ClusteringColorSpace {
    RGB = 0,
    HSL = 1,
    LAB = 2
}

export class Settings {
    kMeansNrOfClusters: number = 16;
    kMeansMinDeltaDifference: number = 1;
    kMeansClusteringColorSpace: ClusteringColorSpace = ClusteringColorSpace.RGB;
    removeFacetsSmallerThanNrOfPoints: number = 20;
    removeFacetsFromLargeToSmall: boolean = true;
    nrOfTimesToHalveBorderSegments: number = 2;

    resizeImageIfTooLarge: boolean = true;
    resizeImageWidth: number = 1024;
    resizeImageHeight: number = 1024;
}
