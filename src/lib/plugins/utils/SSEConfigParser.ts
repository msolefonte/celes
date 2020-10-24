'use strict';

import {SSEAchievement} from '../../../types';

class UnexpectedFileContentError extends Error {
    constructor() {
        super('Unexpected file content');
    }
}

class SSEConfigParser {
    static parse(buffer: Buffer): SSEAchievement[] {
        const header = buffer.slice(0, 4);
        const entryCount = parseInt(header.slice(0, 1).reverse().toString('hex'), 16);

        const data = SSEConfigParser.bufferSplit(buffer.slice(header.length, buffer.length), 24);
        if (data.length !== entryCount) {
            throw new UnexpectedFileContentError();
        }

        const achievements: SSEAchievement[] = [];

        for (const entry of data) {
            const achieved: number = parseInt(entry.slice(20, 21).toString('hex'), 16);

            achievements.push({
                crc: entry.slice(0, 4).reverse().toString('hex'),
                Achieved: achieved,
                UnlockTime: parseInt(entry.slice(8, 12).reverse().toString('hex'), 16)
            });
        }

        return achievements;
    }

    private static bufferSplit(buffer: Buffer, n: number) {
        const result: Buffer[] = [];
        for (let i = 0, j = 1; i < buffer.length; i += n, j++) {
            result.push(buffer.slice(i, n * j));
        }
        return result;
    }
}

export {UnexpectedFileContentError, SSEConfigParser};