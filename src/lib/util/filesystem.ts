import {unitOfTime} from 'moment';

const fs = require('fs').promises;
const moment = require('moment');

async function existsAndIsYoungerThan(path: String, time: number = 7, timeUnit: unitOfTime.Diff = 'days', isDir: boolean = false) {
    try {
        const stats = await fs.stat(path);

        if ((isDir) ? stats.isDirectory() : stats.isFile()) {
            return moment().diff(moment(stats.mtime), timeUnit) <= time;
        } else {
            return false;
        }
    } catch (e) {
        return false;
    }
}

async function mkdirp(path: String) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
}

export {existsAndIsYoungerThan, mkdirp}