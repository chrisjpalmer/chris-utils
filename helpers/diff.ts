
export interface Diff<T> { different: boolean, difference: T | null }

export type Differ<T> = (expected:T, actual:T) => Diff<T>;

export class DiffedField<T> {
    expected: T;
    actual: T;
    differ: Differ<T>;
    constructor(differ: Differ<T>, expected:T, actual:T) {
        this.expected = expected;
        this.actual = actual;
        this.differ = differ;
    }

    get diff(): Diff<T> {
        return this.differ(this.expected, this.actual)
    }
}