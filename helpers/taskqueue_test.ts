import assert from 'assert';
import test from 'node:test';
import { Outcome, Task, TaskQueue } from './taskqueue';
import { simpleTask, assertRoughlyEqual, errorTask, TestSuite } from './test';

interface Test {
    tasks: {
        task: Task<number>, 
        want: Outcome<number>
    }[]
    concurrency: number
    wantTime:number
}

const tests:TestSuite<Test> = {
    "no work": {
        concurrency: 1,
        tasks: [],
        wantTime: 0,
    },
    "concurrency 1": {
        concurrency: 1,
        tasks: [
            { task: simpleTask("1", 1, 500), want: { result: 1, err: null } },
            { task: simpleTask("2", 2, 500), want: { result: 2, err: null } },
            { task: simpleTask("3", 3, 500), want: { result: 3, err: null } }
        ],
        wantTime: 1500,
    },
    "concurrency 2": {
        concurrency: 2,
        tasks: [
            { task: simpleTask("1", 1, 500), want: { result: 1, err: null } },
            { task: simpleTask("2", 2, 500), want: { result: 2, err: null } },
            { task: simpleTask("3", 3, 500), want: { result: 3, err: null } }
        ],
        wantTime: 1000
    },
    "concurrency 3": {
        concurrency: 3,
        tasks: [
            { task: simpleTask("1", 1, 500), want: { result: 1, err: null } },
            { task: simpleTask("2", 2, 500), want: { result: 2, err: null } },
            { task: simpleTask("3", 3, 500), want: { result: 3, err: null } }
        ],
        wantTime: 500,
    },
    "concurrency 4": {
        concurrency: 4,
        tasks: [
            { task: simpleTask("1", 1, 500), want: { result: 1, err: null } },
            { task: simpleTask("2", 2, 500), want: { result: 2, err: null } },
            { task: simpleTask("3", 3, 500), want: { result: 3, err: null } }
        ],
        wantTime: 500,
    },
    "error": {
        concurrency: 1,
        tasks: [
            { task: simpleTask("1", 1, 500), want: { result: 1, err: null } },
            { task: errorTask("2", new Error('an error occurred'), 500), want: { result: null, err: new Error('an error occurred') } },
            { task: simpleTask("3", 3, 500), want: { result: 3, err: null } }
        ],
        wantTime: 1500,
    },
    "mixed times, concurrency 1": {
        concurrency: 1,
        tasks: [
            { task: simpleTask("1", 1, 200), want: { result: 1, err: null } },
            { task: simpleTask("2", 2, 300), want: { result: 2, err: null } },
            { task: simpleTask("3", 3, 500), want: { result: 3, err: null } }
        ],
        wantTime: 1000,
    },
    "mixed times, concurrency 2 - a": {
        concurrency: 2,
        tasks: [
            { task: simpleTask("1", 1, 200), want: { result: 1, err: null } },
            { task: simpleTask("2", 2, 300), want: { result: 2, err: null } },
            { task: simpleTask("3", 3, 500), want: { result: 3, err: null } }
        ],
        wantTime: 700,
    },
    "mixed times, concurrency 2 - b": {
        concurrency: 2,
        tasks: [
            { task: simpleTask("2", 2, 300), want: { result: 2, err: null } },
            { task: simpleTask("1", 1, 200), want: { result: 1, err: null } },
            { task: simpleTask("3", 3, 500), want: { result: 3, err: null } }
        ],
        wantTime: 700,
    },
    "mixed times, concurrency 3": {
        concurrency: 3,
        tasks: [
            { task: simpleTask("1", 1, 200), want: { result: 1, err: null } },
            { task: simpleTask("2", 2, 300), want: { result: 2, err: null } },
            { task: simpleTask("3", 3, 500), want: { result: 3, err: null } }
        ],
        wantTime: 500,
    },
};

test("task queue", async (t) => {
    for (const testKey of Object.keys(tests)) {
        const testCase = tests[testKey];

        await t.test(testKey, async () => {
            let queue = new TaskQueue<number>(testCase.concurrency, (taskId, outcome) => {
                let _t = testCase.tasks.find(_t => _t.task.id == taskId)
                assert.notEqual(_t, null)
                assert.deepEqual(_t?.want, outcome)
            })

            const start = performance.now();
            await queue.do(testCase.tasks.map(_t => _t.task))
            let since = performance.now() - start

            assertRoughlyEqual(since / 1000, testCase.wantTime / 1000, "wantTime", 2) // must be within ~0.01s = 10ms
        })
    }
})

interface TestRepeatedUse {
    concurrency: number
    uses: Use[]
}

interface Use {
    tasks: {
        task: Task<number>, 
        want: Outcome<number>
    }[]
    wantTime:number
}


const testsRepeatedUse:TestSuite<TestRepeatedUse> = {
    "concurrency 1": {
        concurrency: 1,
        uses: [
            {
                tasks: [
                    { task: simpleTask("1", 1, 500), want: { result: 1, err: null } },
                    { task: simpleTask("2", 2, 500), want: { result: 2, err: null } },
                    { task: simpleTask("3", 3, 500), want: { result: 3, err: null } }
                ],
                wantTime: 1500,
            },
            {
                tasks: [
                    { task: simpleTask("1", 1, 500), want: { result: 1, err: null } },
                    { task: simpleTask("2", 2, 500), want: { result: 2, err: null } },
                ],
                wantTime: 1000
            }
        ]
    },
    "concurrency 2": {
        concurrency: 2,
        uses: [
            {
                tasks: [
                    { task: simpleTask("1", 1, 500), want: { result: 1, err: null } },
                    { task: simpleTask("2", 2, 500), want: { result: 2, err: null } },
                    { task: simpleTask("3", 3, 500), want: { result: 3, err: null } }
                ],
                wantTime: 1000,
            },
            {
                tasks: [
                    { task: simpleTask("1", 1, 500), want: { result: 1, err: null } },
                    { task: simpleTask("2", 2, 500), want: { result: 2, err: null } },
                ],
                wantTime: 500
            }
        ]
    },
    "concurrency 3": {
        concurrency: 3,
        uses: [
            {
                tasks: [
                    { task: simpleTask("1", 1, 500), want: { result: 1, err: null } },
                    { task: simpleTask("2", 2, 500), want: { result: 2, err: null } },
                    { task: simpleTask("3", 3, 500), want: { result: 3, err: null } }
                ],
                wantTime: 500,
            },
            {
                tasks: [
                    { task: simpleTask("1", 1, 500), want: { result: 1, err: null } },
                    { task: simpleTask("2", 2, 500), want: { result: 2, err: null } },
                ],
                wantTime: 500
            }
        ]
    }
};

test("task queue repeated use", async (t) => {
    for (const testKey of Object.keys(testsRepeatedUse)) {
        const testCase = testsRepeatedUse[testKey];

        await t.test(testKey, async () => {
            let useIdx = 0

            let queue = new TaskQueue<number>(testCase.concurrency, (taskId, outcome) => {
                const use = testCase.uses[useIdx]
                let _t = use.tasks.find(_t => _t.task.id == taskId)
                assert.notEqual(_t, null)
                assert.deepEqual(_t?.want, outcome)
            })

            for(const use of testCase.uses) {
                const start = performance.now();
                await queue.do(use.tasks.map(_t => _t.task))
                let since = performance.now() - start

                assertRoughlyEqual(since / 1000, use.wantTime / 1000, "wantTime", 2) // must be within ~0.01s = 10ms

                useIdx++;
            }
        })
    }
})

test("task queue already in use", async (t) => {
    let queue = new TaskQueue<number>(1, () => {})
    let original = queue.do([simpleTask("1", 1, 200)])

    try {
        await queue.do([simpleTask("1", 1, 200)])
    } catch(e) {
        assert.deepEqual(e, new Error('work is already in progress'))
    }

    // ensure all promises are finished before the test
    await original
})