
export type RGB = Array<number>;

export interface IMap<T> {
    [key: string]: T;
}


export function delay(ms: number) {
    return new Promise(exec => window.setTimeout(exec, ms));
}


export class CancellationToken {
    isCancelled: boolean = false;
}