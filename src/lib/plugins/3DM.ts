'use strict';

import * as path from 'path';
import {
    Source,
    TDMAchievementList1,
    TDMAchievementList2,
    UnlockedOrInProgressAchievement
} from '../../types';
import {SteamEmulatorScraper} from './lib/SteamEmulatorScraper';
import {normalizeTimestamp} from './lib/Common';

class Reloaded extends SteamEmulatorScraper {
    readonly source: Source = '3DM';
    readonly achievementWatcherRootPath: string;
    readonly achievementLocationFiles: string[] = [
        'stats/achievements.ini', // TODO CHECK (STATS/*) ?
        'RemoteStorage/steam_achievement.ini'
    ];

    private readonly programDataPath: string = <string>process.env['PROGRAMDATA'];

    constructor(achievementWatcherRootPath: string) {
        super();
        this.achievementWatcherRootPath = achievementWatcherRootPath;
    }

    normalizeUnlockedOrInProgressAchievementList(achievementList: TDMAchievementList1 | TDMAchievementList2): UnlockedOrInProgressAchievement[] {
        const UnlockedOrInProgressAchievementList: UnlockedOrInProgressAchievement[] = [];

        if ('State' in achievementList) {
            Object.keys(achievementList.State).forEach((achievementName: string) => {
                UnlockedOrInProgressAchievementList.push({
                    name: achievementName,
                    achieved: 1,
                    currentProgress: 0,
                    maxProgress: 0,
                    unlockTime: normalizeTimestamp(achievementList.Time[achievementName])
                });
            });
        } else {
            Object.keys(achievementList.Steam).forEach((achievementName: string) => {
                UnlockedOrInProgressAchievementList.push({
                    name: achievementName,
                    achieved: 1,
                    currentProgress: 0,
                    maxProgress: 0,
                    unlockTime: 0
                });
            });
        }

        return UnlockedOrInProgressAchievementList;
    }

    getSpecificFoldersToScan(): string[] {
        return [
            path.join(this.programDataPath, 'Steam') + '/*'
        ];
    }
}

export {Reloaded};