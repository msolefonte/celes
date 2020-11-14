import * as path from 'path';
import {closeSync, promises as fs, openSync} from 'fs';
// import {flockSync} from 'fs-ext';

/**
 * FIXME CelesMutex does not work anymore as we have not found any solution to implement an inter-process context-aware
 *  mutex for Node.js. The previous iteration involved 'fs-ext' but it is not contex-aware, so a proper fix has to be
 *  done.
 *
 *  More information about this problem can be found at this post of StackOverflow:
 *  https://stackoverflow.com/questions/64801893/inter-process-context-aware-mutex-for-node-js
 */
export class CelesMutex {
    private readonly lockPath: string;

    constructor(achievementWatcherRootPath: string) {
        this.lockPath = path.join(achievementWatcherRootPath, 'celes/celes.lock');
    }

    async lock(): Promise<number> {
        await fs.mkdir(path.dirname(this.lockPath), { recursive: true });
        const fileDescriptor: number = openSync(this.lockPath, 'w');
        // FIXME
        // flockSync(fileDescriptor, 'ex');

        return fileDescriptor;
    }

    unlock(lockId: number): void {
        closeSync(lockId);
    }
}