import assert from 'assert';
import timeout from 'node:timers/promises'
import { Task } from './taskqueue';

export function assertRoughlyEqual(got:number, expected:number, msg:string, decimals:number) {
    let withinBounds = Math.abs(got - expected) < Math.pow(10, -decimals)
    assert.equal(withinBounds, true, `assertRoughlyEqual failed got: ${got}, expected: ${expected}: ${msg}`)
}

export function simpleTask(id:string, n:number, wait:number): Task<number> {
    return {
        id, 
        do: async () => {
            await timeout.setTimeout(wait)
            return n
        }
    }
}

export function errorTask(id:string, err: Error, wait:number): Task<number> {
    return {
        id, 
        do: async () => {
            await timeout.setTimeout(wait)
            throw err
        }
    }
}

export type TestSuite<T> = {
    [key:string]:T
}