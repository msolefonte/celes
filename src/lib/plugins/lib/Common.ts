import {NormalizedProgress} from '../../../types';
import {promises as fs} from 'fs';
import moment from 'moment';

async function existsAndIsYoungerThan(path: string, time = 7, timeUnit: moment.unitOfTime.Diff = 'days', isDir = false): Promise<boolean> {
    try {
        const stats = await fs.stat(path);

        if ((isDir) ? stats.isDirectory() : stats.isFile()) {
            return moment().diff(moment(stats.mtime), timeUnit) < time; // TODO ADD TEST INVALID CACHE
        } else {
            return false;
        }
    } catch (e) {
        return false;
    }
}

function normalizeProgress(curProgress: string, maxProgress: string): NormalizedProgress {
    let currentProgress: number, maximProgress: number;
    if (Number.parseInt(maxProgress) === 0) {
        currentProgress = 0;
        maximProgress = 0;
    } else {
        currentProgress = Math.floor(Number.parseFloat(curProgress) / Number.parseFloat(maxProgress) * 100); // TODO ADD TEST GAME WITH PROGRESS
        maximProgress = 100;
    }

    return {currentProgress: currentProgress, maximProgress: maximProgress};
}

function normalizeTimestamp(time: string): number {
    try {
        return new DataView(new Uint8Array(Buffer.from(time, 'hex')).buffer).getUint32(0, true);
    }catch (error) {
        return 0;
    }
}

export {existsAndIsYoungerThan, normalizeProgress, normalizeTimestamp};