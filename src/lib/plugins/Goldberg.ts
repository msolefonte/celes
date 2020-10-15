'use strict';

import * as path from 'path';
import {
    CodexAchievementData,
    CodexAchievementList,
    GoldbergAchievementDataIni, GoldbergAchievementDataJson,
    GoldbergAchievementListIni,
    GoldbergAchievementListJson,
    Source,
    UnlockedOrInProgressAchievement
} from '../../types';
import {SteamEmulatorScraper} from './utils/SteamEmulatorScraper';
import {WrongSourceDetectedError} from '../utils/Errors';


class Goldberg extends SteamEmulatorScraper {
    readonly source: Source = 'Goldberg';
    readonly achievementWatcherRootPath: string;
    readonly achievementLocationFiles: string[] = [
        'achievements.ini',
        'achievements.json'
    ];

    private readonly appDataPath: string = <string>process.env['APPDATA'];

    constructor(achievementWatcherRootPath: string) {
        super();
        this.achievementWatcherRootPath = achievementWatcherRootPath;
    }

    normalizeActiveAchievements(achievementList: CodexAchievementList | GoldbergAchievementListIni | GoldbergAchievementListJson): UnlockedOrInProgressAchievement[] {
        const activeAchievements: UnlockedOrInProgressAchievement[] = [];

        Object.keys(achievementList).forEach((achievementName: string) => {
            const achievementData: CodexAchievementData | GoldbergAchievementDataIni | GoldbergAchievementDataJson = achievementList[achievementName];

            if ('Achieved' in achievementData) {
                if ('CurProgress' in achievementData || 'MaxProgress' in achievementData) {
                    throw new WrongSourceDetectedError();
                } else {
                    activeAchievements.push({
                        name: achievementName,
                        achieved: 1,
                        currentProgress: 0,
                        maxProgress: 0,
                        unlockTime: parseInt(achievementData.UnlockTime) * 1000,
                    });
                }
            } else if ('earned' in achievementData) {
                activeAchievements.push({
                    name: achievementName,
                    achieved: 1,
                    currentProgress: 0,
                    maxProgress: 0,
                    unlockTime: achievementData.earned_time * 1000,
                });
            }
        });

        return activeAchievements;
    }

    getSpecificFoldersToScan(): string[] {
        return [
            path.join(this.appDataPath, 'Goldberg SteamEmu Saves')
        ];
    }
}

export {Goldberg};