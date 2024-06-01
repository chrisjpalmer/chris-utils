import { Callback, Outcome, Task, TaskQueue } from "./taskqueue";

export class OrderedTaskQueue<R> {
    taskQueue: TaskQueue<R>;
    callback:Callback<R>;

    outcomesMap: Map<string, Outcome<R>>
    tasks: Task<R>[]
    done: boolean;

    constructor(concurrency: number, callback: Callback<R>, verbose: boolean = false) {
        this.taskQueue = new TaskQueue(concurrency, (task, outcome) => this._callback(task, outcome), verbose)
        this.callback = callback
        this.done = true;
    }

    async do(tasks:Task<R>[]) {
        if(!this.done) {
            throw new Error('work is already in progress')
        }

        if(tasks.length == 0) {
            return
        }
      
        this.done = false
        this.tasks = [...tasks];
        this.outcomesMap = new Map();

        await this.taskQueue.do(tasks);

        this.done = true
    }

    _callback(task:Task<R>, outcome:Outcome<R>) {
        this.outcomesMap.set(task.id, outcome)
        this.callOrdered()
    }

    callOrdered() {
        while(this.tasks.length > 0) {
            let t = this.tasks[0]
            // console.log(this.tasks)
            if(!this.outcomesMap.has(t.id)) {
                // console.log('couldnt get it.. attempting to cheat', t, this.outcomesMap.get(t.id))
                return;
            }

            this.tasks.shift()
            this.callback(t, <Outcome<R>>this.outcomesMap.get(t.id))
        }
        
    }
}