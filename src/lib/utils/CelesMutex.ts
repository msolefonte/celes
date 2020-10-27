import * as path from 'path';
import {closeSync, promises as fs, openSync} from 'fs';
import {flockSync} from 'fs-ext';

export class CelesMutex {
    private readonly lockPath: string;

    constructor(achievementWatcherRootPath: string) {
        this.lockPath = path.join(achievementWatcherRootPath, 'celes/celes.lock');
    }

    async lock(): Promise<number> {
        await fs.mkdir(path.dirname(this.lockPath), { recursive: true });
        const fileDescriptor: number = openSync(this.lockPath, 'w');
        flockSync(fileDescriptor, 'ex');

        return fileDescriptor;
    }

    unlock(lockId: number): void {
        closeSync(lockId);
    }
}