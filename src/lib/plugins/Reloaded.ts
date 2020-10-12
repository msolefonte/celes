'use strict';

import * as path from 'path';
import {
    ReloadedAchievementData,
    ReloadedAchievementList,
    Source,
    UnlockedOrInProgressAchievement
} from '../../types';
import {normalizeProgress, normalizeTimestamp} from './lib/Common';
import {SteamEmulatorScraper} from './lib/SteamEmulatorScraper';
import {WrongSourceError} from '../utils/Errors';
import omit from 'lodash.omit';

class Reloaded extends SteamEmulatorScraper {
    private static is3dmAchievementList(achievementList: ReloadedAchievementList) {
        return 'State' in achievementList;
    }

    readonly source: Source = 'Reloaded';
    readonly achievementWatcherRootPath: string;
    readonly achievementLocationFiles: string[] = [
        'stats/achievements.ini'
    ];

    private readonly programDataPath: string = <string>process.env['PROGRAMDATA'];

    constructor(achievementWatcherRootPath: string) {
        super();
        this.achievementWatcherRootPath = achievementWatcherRootPath;
    }

    normalizeUnlockedOrInProgressAchievementList(achievementList: ReloadedAchievementList): UnlockedOrInProgressAchievement[] {
        const UnlockedOrInProgressAchievementList: UnlockedOrInProgressAchievement[] = [];

        if (Reloaded.is3dmAchievementList(achievementList)) {
            throw new WrongSourceError();
        }

        const filter: string[] = ['Steam', 'Steam64'];
        achievementList = omit(achievementList, filter);

        Object.keys(achievementList).forEach((achievementName: string) => {
            const achievementData: ReloadedAchievementData = achievementList[achievementName];
            const normalizedProgress = normalizeProgress(achievementData.CurProgress, achievementData.MaxProgress);

            if (achievementData.State === '0100000001') {
                UnlockedOrInProgressAchievementList.push({
                    name: achievementName,
                    achieved: 1,
                    currentProgress: normalizedProgress.currentProgress, // TODO CHECK THIS ONE. PROGRESS IS A WEIRD STRING
                    maxProgress: normalizedProgress.maximProgress,
                    unlockTime: normalizeTimestamp(achievementData.Time)
                });
            } else if (normalizedProgress.maximProgress > 0) {
                UnlockedOrInProgressAchievementList.push({
                    name: achievementName,
                    achieved: 0,
                    currentProgress: normalizedProgress.currentProgress,
                    maxProgress: normalizedProgress.maximProgress,
                    unlockTime: normalizeTimestamp(achievementData.Time)
                });
            }
        });

        return UnlockedOrInProgressAchievementList;
    }

    getSpecificFoldersToScan(): string[] {
        return [
            path.join(this.programDataPath, 'Steam') + '/*'
        ];
    }
}

export {Reloaded};