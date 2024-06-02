import ora from 'ora'
import { Ora } from 'ora'

export class SpinAfter {
    timeoutId: NodeJS.Timeout | null
    spinAfter: number
    spinner: Ora

    constructor(spinAfter: number) {
        this.spinAfter = spinAfter;
        this.timeoutId = null;
        this.spinner = ora();
    }

    start(message: string) {
        this.spinner.text = message;
        this._start();
    }

    setMessage(message: string) {
        this.spinner.text = message
    }

    private _start() {
        this.timeoutId = setTimeout(() => {
            this.spinner.start()
            this.timeoutId = null;
        }, this.spinAfter)
    }

    reset() {
        this.stop()
        this._start();
    }

    stop() {
        this.spinner.stop()
        if(this.timeoutId !== null) {
            clearTimeout(this.timeoutId)
        }
    }
}