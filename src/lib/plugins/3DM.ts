'use strict';

import * as path from 'path';
import {
    ReloadedAchievementList,
    Source,
    TDMAchievementList1,
    TDMAchievementList2,
    UnlockedOrInProgressAchievement
} from '../../types';
import {SteamEmulatorScraper} from './utils/SteamEmulatorScraper';
import {WrongSourceDetectedError} from '../utils/Errors';
import {normalizeTimestamp} from './utils/Common';

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

    normalizeActiveAchievements(achievementList: ReloadedAchievementList | TDMAchievementList1 | TDMAchievementList2): UnlockedOrInProgressAchievement[] {
        const activeAchievements: UnlockedOrInProgressAchievement[] = [];

        if ('State' in achievementList) {
            Object.keys(achievementList.State).forEach((achievementName: string) => {
                activeAchievements.push({
                    name: achievementName,
                    achieved: 1,
                    currentProgress: 0,
                    maxProgress: 0,
                    unlockTime: normalizeTimestamp((<TDMAchievementList1> achievementList).Time[achievementName])
                });
            });
        } else {
            Object.keys(achievementList.Steam).forEach((achievementName: string) => {
                if(achievementName === 'ACHCount') {
                    throw new WrongSourceDetectedError();
                }

                activeAchievements.push({
                    name: achievementName,
                    achieved: 1,
                    currentProgress: 0,
                    maxProgress: 0,
                    unlockTime: 0
                });
            });
        }

        return activeAchievements;
    }

    getSpecificFoldersToScan(): string[] {
        return [
            path.join(this.programDataPath, 'Steam') + '/*'
        ];
    }
}

export {Reloaded};