import {INormalizedProgress} from '../../../types';

function normalizeProgress(curProgress: string, maxProgress: string): INormalizedProgress {
    let currentProgress: number, maximProgress: number;
    if (Number.parseInt(maxProgress) === 0) {
        currentProgress = 0;
        maximProgress = 0;
    } else {
        currentProgress = Math.floor(Number.parseFloat(curProgress) / Number.parseFloat(maxProgress) * 100);
        maximProgress = 100;
    }

    return {currentProgress: currentProgress, maximProgress: maximProgress};
}

function normalizeTimestamp(time: string): number {
    return new DataView(new Uint8Array(Buffer.from(time, 'hex')).buffer).getUint32(0, true) || 0;
}

export {normalizeProgress, normalizeTimestamp};