'use strict';

import {IUnlockedAchievement} from '../../types';
import {normalizeProgress} from './lib/Common';

// @ts-ignore
import {SteamEmulatorScraper} from './lib/SteamEmulatorScraper';

const omit = require('lodash.omit');
const path = require('path');

class Codex extends SteamEmulatorScraper {
    readonly source: string = 'Codex';

    private readonly publicDataPath: string = <string>process.env['Public'];
    private readonly appDataPath: string = <string>process.env['APPDATA'];

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

            if (achievementData.Achieved === '1') {
                unlockedAchievementList.push({
                    name: achievementName,
                    achieved: 1,
                    currentProgress: normalizedProgress.currentProgress,
                    maxProgress: normalizedProgress.maximProgress,
                    unlockTime: achievementData.UnlockTime,
                });
            } else if (normalizedProgress.maximProgress > 0) {
                unlockedAchievementList.push({
                    name: achievementName,
                    achieved: 0,
                    currentProgress: normalizedProgress.currentProgress,
                    maxProgress: normalizedProgress.maximProgress,
                    unlockTime: achievementData.UnlockTime,
                });
            }
        });

        return unlockedAchievementList;
    }

    getSpecificFoldersToScan(): string[] {
        return [
            path.join(this.publicDataPath, 'Documents/Steam/CODEX'),
            path.join(this.appDataPath, 'Steam/CODEX')
        ];
    }
}

export {Codex};