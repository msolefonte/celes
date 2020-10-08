import * as path from 'path';
import {flockSync} from 'fs-ext';
import fs from 'fs';

class CelesMutex {
    private static readonly lockPath: string = path.join(<string>process.env['APPDATA'], 'Achievement Watcher/celes/celes.lock');

    static lock(): number {
        const fileDescriptor: number = fs.openSync(CelesMutex.lockPath, 'w');
        flockSync(fileDescriptor, 'ex');

        return fileDescriptor;
    }

    static unlock(lockId: number): void {
        fs.closeSync(lockId);
    }
}

export {CelesMutex}