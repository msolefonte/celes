'use strict';

import * as path from 'path';
import {
    Achievement,
    GameSchema,
    SSEAchievement,
    ScanResult,
    Source,
    UnlockedOrInProgressAchievement
} from '../../types';
import {SteamEmulatorScraper} from './utils/SteamEmulatorScraper';
import {SteamUtils} from './utils/SteamUtils';
import crc32 from 'crc-32';
import {generateActiveAchievement} from './utils/Common';

class SSE extends SteamEmulatorScraper {
    readonly source: Source = 'SmartSteamEmu';
    readonly achievementLocationFiles: string[] = [
        'stats.bin'
    ];
    readonly achievementWatcherRootPath: string;

    private readonly appDataPath: string = <string>process.env['APPDATA'];

    constructor(achievementWatcherRootPath: string) {
        super();
        this.achievementWatcherRootPath = achievementWatcherRootPath;
    }

    normalizeActiveAchievements(achievements: SSEAchievement[]): UnlockedOrInProgressAchievement[] {
        const activeAchievements: UnlockedOrInProgressAchievement[] = [];

        for (let i = 0; i < achievements.length; i++) {
            const activeAchievement: UnlockedOrInProgressAchievement = {
                name: achievements[i].crc,
                achieved: 1,
                currentProgress: 0,
                maxProgress: 0,
                unlockTime: achievements[i].UnlockTime * 1000
            }
            activeAchievements.push(activeAchievement);
        }

        return activeAchievements;
    }

    async getUnlockedOrInProgressAchievements(game: ScanResult): Promise<UnlockedOrInProgressAchievement[]> {
        const wronglyNormalizedAchievementList: UnlockedOrInProgressAchievement[] = await super.getUnlockedOrInProgressAchievements(game);
        const correctlyNormalizedAchievementList: UnlockedOrInProgressAchievement[] = [];

        const gameSchema: GameSchema = await SteamUtils.getGameSchema(this.achievementWatcherRootPath, game.appId, 'english');
        const achievementIds = gameSchema.achievement.list.map((achievement: Achievement) => {
            return achievement.name;
        });

        for (let i = 0; i < wronglyNormalizedAchievementList.length; i++) {
            for (let j = 0; j < achievementIds.length; j++) {
                if (crc32.str(achievementIds[j]).toString(16) === wronglyNormalizedAchievementList[i].name) {
                    correctlyNormalizedAchievementList.push(generateActiveAchievement(
                        achievementIds[j],
                        wronglyNormalizedAchievementList[i].unlockTime,
                        wronglyNormalizedAchievementList[i].achieved,
                        wronglyNormalizedAchievementList[i].currentProgress,
                        wronglyNormalizedAchievementList[i].maxProgress
                    ));
                    break;
                }
            }
        }

        return correctlyNormalizedAchievementList;
    }

    getSpecificFoldersToScan(): string[] {
        return [
            path.join(this.appDataPath, 'SmartSteamEmu')
        ];
    }
}

export {SSE};