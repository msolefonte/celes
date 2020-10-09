import * as path from 'path';
import {flockSync} from 'fs-ext';
import fs from 'fs';
import mkdirp from 'mkdirp';

class CelesMutex {
    private readonly lockPath: string;

    constructor(achievementWatcherRootPath: string) {
        this.lockPath = path.join(achievementWatcherRootPath, 'celes/celes.lock');
    }

    async lock(): Promise<number> {
        await mkdirp(path.dirname(this.lockPath));
        const fileDescriptor: number = fs.openSync(this.lockPath, 'w');
        flockSync(fileDescriptor, 'ex');

        return fileDescriptor;
    }

    unlock(lockId: number): void {
        fs.closeSync(lockId);
    }
}

export {CelesMutex}