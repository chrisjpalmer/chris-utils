export type Task<R> = { id: string, do: () => Promise<R> }
export type Callback<R> = (task:Task<R>, outcome:Outcome<R>) => void
export type Outcome<R> = {
  result: R | null
  err: Error | null
}

type Wrapped<R> = {
  task: Task<R>,
  outcome: Outcome<R>
}

// adapted from https://dev.to/eslamelkholy/nodejs-building-concurrent-operations-with-queue-319f
export class TaskQueue<R> {
  verbose: boolean
  concurrency: number;
  callback: Callback<R>
  
  running:number;
  queue: Task<R>[]
  todo: number
  done: boolean;
  doneResolve: (() => void) | null

  constructor (concurrency:number, callback:Callback<R>, verbose:boolean = false) {
    this.concurrency = concurrency
    this.running = 0
    this.queue = []
    this.callback = callback
    this.todo = 0;
    this.done = true;
    this.doneResolve = null;
    this.verbose = verbose
  }

  async do (tasks:Task<R>[]) {
    if(!this.done) {
      throw new Error('work is already in progress')
    }

    if(tasks.length == 0) {
      return
    }

    let complete = new Promise<void>((resolve) => {
      this.doneResolve = resolve
    })
    this.done = false;
    this.todo = tasks.length;

    // load queue and start executor
    this.queue = [...tasks]
    process.nextTick(this.next.bind(this))
    
    await complete

    this.done = true
    this.doneResolve = null;
  }

  next () {
    let i = 0;
    
    while (this.running < this.concurrency && this.queue.length > 0) {
      const task = <Task<R>> this.queue.shift()
      this.log('task issued', performance.now(), 'running: ', this.running, 'i: ', i)

      wrapTask(task).then((wrapped) => {
        this.callback(wrapped.task, wrapped.outcome)
        this.todo--
        this.log('task completed', performance.now() ,'running: ', this.running, 'result', wrapped.outcome.result, 'todo', this.todo)
        if(this.todo == 0 && this.doneResolve) {
          this.doneResolve()
        }
        
        this.running--
        process.nextTick(this.next.bind(this))
      })

      this.running++
      i++
    }
  }

  log(message?: any, ...optionalParams: any[]) {
    if(this.verbose) {
      console.log(message, ...optionalParams)
    }
  }
}



function wrapTask<R>(t:Task<R>): Promise<Wrapped<R>> {
  let res = t.do();
  return res.then((r) => {
    return {task:t, outcome:{result:r, err: null}}
  }).catch(e => {
    return {task:t, outcome:{result: null, err:e}}
  })
}