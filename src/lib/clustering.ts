
export class Vector {

    constructor(public values: number[], public weight: number = 1) { }

    distanceTo(p: Vector): number {
        let sumSquares = 0;
        for (let i: number = 0; i < this.values.length; i++) {
            sumSquares += (p.values[i] - this.values[i]) * (p.values[i] - this.values[i]);
        }

        return Math.sqrt(sumSquares);
    }

    /**
     *  Calculates the weighted average of the given points
     */
    static average(pts: Vector[]): Vector {
        if (pts.length == 0)
            throw Error("Can't average 0 elements");

        let dims = pts[0].values.length;
        let values = [];
        for (let i: number = 0; i < dims; i++)
            values.push(0);

        let weightSum = 0;
        for (let p of pts) {
            weightSum += p.weight;

            for (let i: number = 0; i < dims; i++)
                values[i] += p.weight * p.values[i];
        }

        for (let i: number = 0; i < values.length; i++) {
            values[i] /= weightSum;
        }

        return new Vector(values);
    }
}


export class KMeans {

    public currentIteration: number = 0;
    public pointsPerCategory: Vector[][] = [];

    public centroids: Vector[] = [];
    public currentDeltaDistanceDifference: number = 0;

    constructor(private points: Vector[], public k: number, centroids: Vector[] | null = null) {

        if (centroids != null) {
            this.centroids = centroids;
            for (let i: number = 0; i < this.k; i++)
                this.pointsPerCategory.push([]);
        }
        else
            this.initCentroids();
    }

    private initCentroids() {
        for (let i: number = 0; i < this.k; i++) {
            this.centroids.push(this.points[Math.floor(this.points.length * Math.random())]);
            this.pointsPerCategory.push([]);
        }
    }


    step() {
        // clear category
        for (let i: number = 0; i < this.k; i++) {
            this.pointsPerCategory[i] = [];
        }

        // calculate points per centroid
        for (let p of this.points) {
            let minDist = Number.MAX_VALUE;
            let centroidIndex: number = -1;
            for (let k: number = 0; k < this.k; k++) {
                let dist = this.centroids[k].distanceTo(p);
                if (dist < minDist) {
                    centroidIndex = k;
                    minDist = dist;

                }
            }
            this.pointsPerCategory[centroidIndex].push(p);
        }

        let totalDistanceDiff = 0;

        // adjust centroids
        for (let k: number = 0; k < this.pointsPerCategory.length; k++) {
            let cat = this.pointsPerCategory[k];
            if (cat.length > 0) {
                let avg = Vector.average(cat);

                let dist = this.centroids[k].distanceTo(avg);
                totalDistanceDiff += dist;
                this.centroids[k] = avg;
            }
        }
        this.currentDeltaDistanceDifference = totalDistanceDiff;


        this.currentIteration++;
    }
}
