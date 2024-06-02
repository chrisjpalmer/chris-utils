import { Callback, Outcome, Task, TaskQueue, WrappedOutcome } from "./taskqueue";

export class OrderedTaskQueue<R> {
    taskQueue: TaskQueue<R>;
    callback:Callback<R>;

    outcomesMap: Map<string, Outcome<R>>
    remainingTaskIds: string[]
    done: boolean;

    constructor(concurrency: number, callback: Callback<R>, verbose: boolean = false) {
        this.taskQueue = new TaskQueue(concurrency, (taskId, outcome) => this._callback(taskId, outcome), verbose)
        this.callback = callback
        this.done = true;
    }

    async do(tasks:Task<R>[]): Promise<WrappedOutcome<R>[]> {
        if(!this.done) {
            throw new Error('work is already in progress')
        }

        if(tasks.length == 0) {
            return []
        }
      
        let taskIds = tasks.map(t => t.id)
        
        this.done = false
        this.remainingTaskIds = [...taskIds];
        this.outcomesMap = new Map();

        await this.taskQueue.do(tasks);

        this.done = true

        return taskIds.map(taskId => {
            return {
                taskId: taskId,
                outcome: <Outcome<R>> this.outcomesMap.get(taskId),
            }
        })
    }

    _callback(taskId:string, outcome:Outcome<R>) {
        this.outcomesMap.set(taskId, outcome)
        this.callOrdered()
    }

    callOrdered() {
        while(this.remainingTaskIds.length > 0) {
            let taskId = this.remainingTaskIds[0]
            // console.log(this.tasks)
            if(!this.outcomesMap.has(taskId)) {
                // console.log('couldnt get it.. attempting to cheat', t, this.outcomesMap.get(t.id))
                return;
            }

            this.remainingTaskIds.shift()
            this.callback(taskId, <Outcome<R>>this.outcomesMap.get(taskId))
        }
        
    }
}