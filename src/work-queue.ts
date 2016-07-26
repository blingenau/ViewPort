export interface IWorkQueue {
    empty(): boolean;
    push(work: () => any): void;
}

export class WorkQueue implements IWorkQueue {
    private queue: (() => void)[] = [];

    public empty(): boolean {
        return this.queue.length === 0;
    }

    public push(work: () => any): void {
        this.queue.push(work);
        if (this.queue.length === 1) {
            process.nextTick(() => this.dispatchWork());
        }
    }

    private dispatchWork(): void {
        Promise.resolve()
        .then(() => this.queue[0]())
        .catch(err => {
            console.log(`Work item failed: ${JSON.stringify(err, null, 4)}`);
        })
        .then(() => {
            this.queue.shift();
            if (!this.empty()) {
                process.nextTick(() => this.dispatchWork());
            }
        });
    }
}