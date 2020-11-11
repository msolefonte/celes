import {
    GameData,
    GameSchemaBody,
    GameStatsBody,
    Platform,
    Source,
    SourceStats,
    UnlockedOrInProgressAchievement
} from '../../types';
import {AchievementNotInSchemaError} from './errors';
import {CelesDbConnector} from './CelesDbConnector';
import {getGameSchema} from './utils';

function createManualSourceIfNotExists(gameData: GameData): void {
    for (const sourceStats of gameData.stats.sources) {
        if (sourceStats.source === 'Manual') {
            return;
        }
    }

    gameData.stats.sources.push({
        source: 'Manual',
        achievements: {
            active: []
        }
    })
}

function updateSourceAchievementUnlockTime(sourceStats: SourceStats, achievementId: string, unlockTime: number): void {
    for (const achievement of sourceStats.achievements.active) {
        if (achievement.name === achievementId) {
            achievement.unlockTime = unlockTime;
        }
    }
}

export function updateGameAchievementUnlockTime(gameData: GameData, source: Source, achievementId: string,
                                                unlockTime: number): void {
    for (const sourceStats of gameData.stats.sources) {
        if (sourceStats.source === source) {
            updateSourceAchievementUnlockTime(sourceStats, achievementId, unlockTime)
        }
    }
}

function unlockSourceAchievement(sourceStats: SourceStats, achievementId: string,
                                 unlockTime: number): void {
    sourceStats.achievements.active = sourceStats.achievements.active.filter(
        (achievement: UnlockedOrInProgressAchievement) => {
            return achievement.name !== achievementId;
        }
    );

    sourceStats.achievements.active.push({
        name: achievementId,
        achieved: 1,
        currentProgress: 0,
        maxProgress: 0,
        unlockTime: unlockTime
    });
}

export function unlockGameAchievement(gameData: GameData, achievementId: string, unlockTime: number): void {
    createManualSourceIfNotExists(gameData);
    for (const sourceStats of gameData.stats.sources) {
        if (sourceStats.source === 'Manual') {
            unlockSourceAchievement(sourceStats, achievementId, unlockTime);
        }
    }
}

export function removeManuallyUnlockedGameAchievement(gameData: GameData, achievementId: string): void {
    for (const sourceStats of gameData.stats.sources) {
        if (sourceStats.source === 'Manual') {
            sourceStats.achievements.active = sourceStats.achievements.active.filter(
                (achievement: UnlockedOrInProgressAchievement) => {
                    return achievement.name !== achievementId
                }
            );
        }
    }
}

export async function generateManualGame(achievementWatcherRootPath: string, appId: string, platform: Platform,
                                         apiVersion: string, systemLanguage: string): Promise<GameData> {
    let gameSchema: GameSchemaBody;
    let gameStats: GameStatsBody;

    const celesDbConnector = new CelesDbConnector(achievementWatcherRootPath);

    try {
        const originalGameData = await celesDbConnector.getGame(appId, platform, systemLanguage);
        gameSchema = originalGameData.schema;
        gameStats = originalGameData.stats;

        let manualSourceFound = false;
        for(const sourceStats of originalGameData.stats.sources) {
            if (sourceStats.source === 'Manual') {
                manualSourceFound = true;
                break;
            }
        }

        if (!manualSourceFound) {
            gameStats.sources.push({ source: 'Manual', achievements: { active: [] }})
        }
    } catch (e) {
        gameSchema = await getGameSchema(achievementWatcherRootPath, appId, platform, systemLanguage);
        gameStats = { sources: [{ source: 'Manual', achievements: { active: [] }}], playtime: 0 }
    }

    return {
        apiVersion: apiVersion,
        appId: appId,
        platform: platform,
        schema: gameSchema,
        stats: gameStats
    };
}

export function checkThatAchievementExistsInSchema(gameData: GameData, appId: string, platform: Platform,
                                                   achievementId: string): void {
    let achievementIdExistsInSchema = false;
    for (const achievement of gameData.schema.achievements.list) {
        if (achievement.name === achievementId) {
            achievementIdExistsInSchema = true;
            break;
        }
    }

    if (!achievementIdExistsInSchema) {
        throw new AchievementNotInSchemaError(appId, platform, achievementId);
    }
}