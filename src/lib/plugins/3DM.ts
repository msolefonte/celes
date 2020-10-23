'use strict';

import * as path from 'path';
import {
    ReloadedAchievementList,
    Source,
    TDMAchievementList1,
    TDMAchievementList2,
    UnlockedOrInProgressAchievement
} from '../../types';
import {generateActiveAchievement, normalizeTimestamp} from './utils/Common';
import {SteamEmulatorScraper} from './utils/SteamEmulatorScraper';
import {WrongSourceDetectedError} from '../utils/Errors';

class Reloaded extends SteamEmulatorScraper {
    readonly source: Source = '3DM';
    readonly achievementWatcherRootPath: string;
    readonly achievementLocationFiles: string[] = [
        'stats/achievements.ini',
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
                activeAchievements.push(
                    generateActiveAchievement(
                        achievementName,
                        normalizeTimestamp((<TDMAchievementList1> achievementList).Time[achievementName])
                    )
                );
            });
        } else {
            Object.keys(achievementList.Steam).forEach((achievementName: string) => {
                if(achievementName === 'ACHCount') {
                    throw new WrongSourceDetectedError();
                }
                activeAchievements.push(generateActiveAchievement(achievementName));
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