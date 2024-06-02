import assert from 'assert';
import test from 'node:test';
import { Outcome, Task, WrappedOutcome } from './taskqueue';
import { simpleTask, TestSuite } from './test';
import { OrderedTaskQueue } from './orderedtaskqueue';

interface Test {
    tasks: {
        task: Task<number>, 
        want: Outcome<number>
    }[]
    wantOrder: string[]
    wantOutcomes: WrappedOutcome<number>[]
    concurrency: number
}

const tests:TestSuite<Test> = {
    "no work": {
        concurrency: 1,
        tasks: [],
        wantOrder: [],
        wantOutcomes: [],
    },
    "concurrency 1": {
        concurrency: 1,
        tasks: [
            { task: simpleTask("1", 1, 700), want: { result: 1, err: null } },
            { task: simpleTask("2", 2, 300), want: { result: 2, err: null } },
            { task: simpleTask("3", 3, 100), want: { result: 3, err: null } }
        ],
        wantOrder: ["1", "2", "3"],
        wantOutcomes: [
            { taskId: "1", outcome: {result: 1, err: null}},
            { taskId: "2", outcome: {result: 2, err: null}},
            { taskId: "3", outcome: {result: 3, err: null}}
        ]
    },
    "concurrency 2": {
        concurrency: 2,
        tasks: [
            { task: simpleTask("1", 1, 700), want: { result: 1, err: null } },
            { task: simpleTask("2", 2, 300), want: { result: 2, err: null } },
            { task: simpleTask("3", 3, 100), want: { result: 3, err: null } }
        ],
        wantOrder: ["1", "2", "3"],
        wantOutcomes: [
            { taskId: "1", outcome: {result: 1, err: null}},
            { taskId: "2", outcome: {result: 2, err: null}},
            { taskId: "3", outcome: {result: 3, err: null}}
        ]
    },
    "concurrency 3": {
        concurrency: 3,
        tasks: [
            { task: simpleTask("1", 1, 700), want: { result: 1, err: null } },
            { task: simpleTask("2", 2, 300), want: { result: 2, err: null } },
            { task: simpleTask("3", 3, 100), want: { result: 3, err: null } }
        ],
        wantOrder: ["1", "2", "3"],
        wantOutcomes: [
            { taskId: "1", outcome: {result: 1, err: null}},
            { taskId: "2", outcome: {result: 2, err: null}},
            { taskId: "3", outcome: {result: 3, err: null}}
        ]
    },
};

test("ordered task queue", async (t) => {
    for (const testKey of Object.keys(tests)) {
        const testCase = tests[testKey];

        await t.test(testKey, async () => {
            let idx = 0;
            let queue = new OrderedTaskQueue<number>(testCase.concurrency, (taskId, outcome) => {
                let _t = testCase.tasks.find(_t => _t.task.id == taskId)
                assert.deepEqual(_t?.want, outcome)
                
                let wantId = testCase.wantOrder[idx]
                assert.strictEqual(wantId, taskId)

                idx++;
            })

            let outcomes = await queue.do(testCase.tasks.map(_t => _t.task))

            assert.deepEqual(outcomes, testCase.wantOutcomes)
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
        want: Outcome<number>,
    }[]
    wantOrder: string[]
    wantOutcomes: WrappedOutcome<number>[]
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
                wantOrder: ["1", "2", "3"],
                wantOutcomes: [
                    { taskId: "1", outcome: {result: 1, err: null}},
                    { taskId: "2", outcome: {result: 2, err: null}},
                    { taskId: "3", outcome: {result: 3, err: null}}
                ]
            },
            {
                tasks: [
                    { task: simpleTask("1", 1, 500), want: { result: 1, err: null } },
                    { task: simpleTask("2", 2, 500), want: { result: 2, err: null } },
                ],
                wantOrder: ["1", "2"],
                wantOutcomes: [
                    { taskId: "1", outcome: {result: 1, err: null}},
                    { taskId: "2", outcome: {result: 2, err: null}},
                ]
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
                wantOrder: ["1", "2", "3"],
                wantOutcomes: [
                    { taskId: "1", outcome: {result: 1, err: null}},
                    { taskId: "2", outcome: {result: 2, err: null}},
                    { taskId: "3", outcome: {result: 3, err: null}}
                ]
            },
            {
                tasks: [
                    { task: simpleTask("1", 1, 500), want: { result: 1, err: null } },
                    { task: simpleTask("2", 2, 500), want: { result: 2, err: null } },
                ],
                wantOrder: ["1", "2"],
                wantOutcomes: [
                    { taskId: "1", outcome: {result: 1, err: null}},
                    { taskId: "2", outcome: {result: 2, err: null}},
                ]
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
                wantOrder: ["1", "2", "3"],
                wantOutcomes: [
                    { taskId: "1", outcome: {result: 1, err: null}},
                    { taskId: "2", outcome: {result: 2, err: null}},
                    { taskId: "3", outcome: {result: 3, err: null}}
                ]
            },
            {
                tasks: [
                    { task: simpleTask("1", 1, 500), want: { result: 1, err: null } },
                    { task: simpleTask("2", 2, 500), want: { result: 2, err: null } },
                ],
                wantOrder: ["1", "2"],
                wantOutcomes: [
                    { taskId: "1", outcome: {result: 1, err: null}},
                    { taskId: "2", outcome: {result: 2, err: null}},
                ]
            }
        ]
    }
};

test("ordered task queue repeated use", async (t) => {
    for (const testKey of Object.keys(testsRepeatedUse)) {
        const testCase = testsRepeatedUse[testKey];

        await t.test(testKey, async () => {
            let useIdx = 0
            let taskIdx = 0;

            let queue = new OrderedTaskQueue<number>(testCase.concurrency, (taskId, outcome) => {
                const use = testCase.uses[useIdx]
                
                let _t = use.tasks.find(_t => _t.task.id == taskId)
                assert.deepEqual(_t?.want, outcome)
                
                let wantId = use.wantOrder[taskIdx]
                assert.strictEqual(wantId, taskId)

                taskIdx++;
            })

            for(const use of testCase.uses) {
                let outcomes = await queue.do(use.tasks.map(_t => _t.task))

                assert.deepEqual(outcomes, use.wantOutcomes)

                useIdx++;
                taskIdx = 0;
            }
        })
    }
})

test("ordered task queue already in use", async (t) => {
    let queue = new OrderedTaskQueue<number>(1, () => {})
    let original = queue.do([simpleTask("1", 1, 200)])

    try {
        await queue.do([simpleTask("1", 1, 200)])
    } catch(e) {
        assert.deepEqual(e, new Error('work is already in progress'))
    }

    // ensure all promises are finished before the test
    await original
})