
export type RGB = number[];

export interface IMap<T> {
    [key: string]: T;
}

export function delay(ms: number) {
    return new Promise((exec) => window.setTimeout(exec, ms));
}

export class CancellationToken {
    public isCancelled: boolean = false;
}
