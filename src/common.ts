
export type RGB = number[];

export interface IMap<T> {
    [key: string]: T;
}

export async function delay(ms: number) {
    if (typeof window !== "undefined") {
        return new Promise((exec) => (<any> window).setTimeout(exec, ms));
    } else {
        return new Promise((exec) => exec());
    }
}

export class CancellationToken {
    public isCancelled: boolean = false;
}
