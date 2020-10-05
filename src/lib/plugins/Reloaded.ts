'use strict';

import {ISource, IUnlockedAchievement} from '../../types';
import {normalizeProgress, normalizeTimestamp} from './lib/Common';

// @ts-ignore
import {SteamEmulatorScraper} from './lib/SteamEmulatorScraper';

const omit = require('lodash.omit');
const path = require('path');

class Reloaded extends SteamEmulatorScraper {
    readonly source: ISource = 'Reloaded - 3DM';

    private readonly programDataPath: string = <string>process.env['PROGRAMDATA'];

    constructor() {
        super();
    }

    normalizeUnlockedAchievementList(achievementList: any): IUnlockedAchievement[] {
        const unlockedAchievementList: IUnlockedAchievement[] = [];

        const filter: string[] = ['SteamAchievements', 'Steam64', 'Steam'];
        achievementList = omit(achievementList.ACHIEVE_DATA || achievementList, filter);

        Object.keys(achievementList).forEach((achievementName) => {
            const achievementData: any = achievementList[achievementName];
            const normalizedProgress = normalizeProgress(achievementData.CurProgress, achievementData.MaxProgress);

            if (achievementData.State === '0100000001') {
                unlockedAchievementList.push({
                    name: achievementName,
                    achieved: 1,
                    currentProgress: normalizedProgress.currentProgress,
                    maxProgress: normalizedProgress.maximProgress,
                    unlockTime: normalizeTimestamp(achievementData.Time)
                });
            } else if (normalizedProgress.maximProgress > 0) {
                unlockedAchievementList.push({
                    name: achievementName,
                    achieved: 0,
                    currentProgress: normalizedProgress.currentProgress,
                    maxProgress: normalizedProgress.maximProgress,
                    unlockTime: normalizeTimestamp(achievementData.Time)
                });
            }
        });

        return unlockedAchievementList;
    }

    getSpecificFoldersToScan(): string[] {
        return [
            path.join(this.programDataPath, 'Steam') + '/*'
        ];
    }
}

export {Reloaded};