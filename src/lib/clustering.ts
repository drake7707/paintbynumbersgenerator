import { Random } from "../random";

export class Vector {

    public tag:any;
    
    constructor(public values: number[], public weight: number = 1) { }

    public distanceTo(p: Vector): number {
        let sumSquares = 0;
        for (let i: number = 0; i < this.values.length; i++) {
            sumSquares += (p.values[i] - this.values[i]) * (p.values[i] - this.values[i]);
        }

        return Math.sqrt(sumSquares);
    }

    /**
     *  Calculates the weighted average of the given points
     */
    public static average(pts: Vector[]): Vector {
        if (pts.length === 0) {
            throw Error("Can't average 0 elements");
        }

        const dims = pts[0].values.length;
        const values = [];
        for (let i: number = 0; i < dims; i++) {
            values.push(0);
        }

        let weightSum = 0;
        for (const p of pts) {
            weightSum += p.weight;

            for (let i: number = 0; i < dims; i++) {
                values[i] += p.weight * p.values[i];
            }
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

    constructor(private points: Vector[], public k: number, private random:Random, centroids: Vector[] | null = null) {

        if (centroids != null) {
            this.centroids = centroids;
            for (let i: number = 0; i < this.k; i++) {
                this.pointsPerCategory.push([]);
            }
        } else {
            this.initCentroids();
        }
    }

    private initCentroids() {
        for (let i: number = 0; i < this.k; i++) {
            this.centroids.push(this.points[Math.floor(this.points.length * this.random.next())]);
            this.pointsPerCategory.push([]);
        }
    }

    public step() {
        // clear category
        for (let i: number = 0; i < this.k; i++) {
            this.pointsPerCategory[i] = [];
        }

        // calculate points per centroid
        for (const p of this.points) {
            let minDist = Number.MAX_VALUE;
            let centroidIndex: number = -1;
            for (let k: number = 0; k < this.k; k++) {
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
        for (let k: number = 0; k < this.pointsPerCategory.length; k++) {
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
