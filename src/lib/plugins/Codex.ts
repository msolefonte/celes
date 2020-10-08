'use strict';

import * as path from 'path';
import {Source, UnlockedOrInProgressAchievement} from '../../types';
import {SteamEmulatorScraper} from './lib/SteamEmulatorScraper';
import {normalizeProgress} from './lib/Common';
import omit from 'lodash.omit';


class Codex extends SteamEmulatorScraper {
    readonly source: Source = 'Codex';
    readonly achievementLocationFiles: string[] = [
        'achievements.ini'
    ];
    readonly achievementWatcherRootPath: string;

    private readonly publicDataPath: string = <string>process.env['Public'];
    private readonly appDataPath: string = <string>process.env['APPDATA'];

    constructor(achievementWatcherRootPath: string) {
        super();
        this.achievementWatcherRootPath = achievementWatcherRootPath;
    }

    normalizeUnlockedOrInProgressAchievementList(achievementList: any): UnlockedOrInProgressAchievement[] {
        const UnlockedOrInProgressAchievementList: UnlockedOrInProgressAchievement[] = [];

        const filter: string[] = ['SteamAchievements', 'Steam64', 'Steam'];
        achievementList = omit(achievementList.ACHIEVE_DATA || achievementList, filter);

        Object.keys(achievementList).forEach((achievementName) => {
            const achievementData: any = achievementList[achievementName];
            const normalizedProgress = normalizeProgress(achievementData.CurProgress, achievementData.MaxProgress);

            if (achievementData.Achieved === '1') {
                UnlockedOrInProgressAchievementList.push({
                    name: achievementName,
                    achieved: 1,
                    currentProgress: normalizedProgress.currentProgress,
                    maxProgress: normalizedProgress.maximProgress,
                    unlockTime: achievementData.UnlockTime,
                });
            } else if (normalizedProgress.maximProgress > 0) {
                UnlockedOrInProgressAchievementList.push({
                    name: achievementName,
                    achieved: 0,
                    currentProgress: normalizedProgress.currentProgress,
                    maxProgress: normalizedProgress.maximProgress,
                    unlockTime: achievementData.UnlockTime,
                });
            }
        });

        return UnlockedOrInProgressAchievementList;
    }

    getSpecificFoldersToScan(): string[] {
        return [
            path.join(this.publicDataPath, 'Documents/Steam/CODEX'),
            path.join(this.appDataPath, 'Steam/CODEX')
        ];
    }
}

export {Codex};