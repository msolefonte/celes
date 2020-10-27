// TODO ADD TEST MERGE PROGRESS OK
// TODO ADD TEST MERGE TIMES OK
// TODO ADD TEST MERGE TIMES USEOLDEST OK
import {
    Achievement,
    GameData,
    GameSchemaBody,
    GameStatsBody,
    Source,
    SourceStats,
    UnlockedOrInProgressAchievement
} from '../../types';

function cleanMergedGameDataCollection(mergedGameDataCollection: {[key: string]: GameData},
                                                             useOldestUnlockTime: boolean) {
    for (const key in mergedGameDataCollection) {
        mergedGameDataCollection[key].stats.sources = mergedGameDataCollection[key].stats.sources.filter(
            (source: SourceStats) => {
                return source.source !== 'Merge';
            }
        );

        mergedGameDataCollection[key].stats.sources.push(
            generateMergeSource(
                mergedGameDataCollection[key],
                useOldestUnlockTime
            )
        );
    }
}

/**
 * NOTE: First game data has priority in the schemas: name, description, images... Put always the most updated first.
 *
 * @param gameDataCollections
 * @param useOldestUnlockTime
 */
export function mergeGameDataCollections(gameDataCollections: GameData[][], useOldestUnlockTime = true): GameData[] {
    const mergedGameDataCollection: {[key: string]: GameData} = {};

    for (const gameDataCollection of gameDataCollections) {
        for (const gameData of gameDataCollection) {
            const gameDataUniqueKey: string = gameData.appId + gameData.platform;

            if (!(gameDataUniqueKey in mergedGameDataCollection)) {
                mergedGameDataCollection[gameDataUniqueKey] = gameData;
            } else {
                mergedGameDataCollection[gameDataUniqueKey] = mergeGameDataCollection(
                    mergedGameDataCollection[gameDataUniqueKey],
                    gameData,
                    useOldestUnlockTime
                );
            }
        }
    }

    cleanMergedGameDataCollection(mergedGameDataCollection, useOldestUnlockTime);

    return Object.keys(mergedGameDataCollection).map(function (appId: string) {
        return mergedGameDataCollection[appId];
    });
}

function fixAchievementsColission(ach1: UnlockedOrInProgressAchievement, ach2: UnlockedOrInProgressAchievement,
                                  useOldestUnlockTime: boolean) {
    if (ach1.currentProgress > ach2.currentProgress) {
        return ach1;
    } else {
        if (useOldestUnlockTime) {
            if (ach1.unlockTime < ach2.unlockTime) {
                return ach1;
            }
        } else {
            if (ach1.unlockTime > ach2.unlockTime) {
                return ach1;
            }
        }
    }

    return ach2;
}

function mergeActiveAchievements(activeAchievementsCollection: UnlockedOrInProgressAchievement[][],
                                 useOldestUnlockTime: boolean): UnlockedOrInProgressAchievement[] {
    const mergedActiveAchievements: { [key: string]: UnlockedOrInProgressAchievement } = {};

    for (const activeAchievements of activeAchievementsCollection) {
        for (const achievement of activeAchievements) {
            if (!(achievement.name in mergedActiveAchievements)) {
                mergedActiveAchievements[achievement.name] = achievement;
            } else {
                mergedActiveAchievements[achievement.name] = fixAchievementsColission(
                    mergedActiveAchievements[achievement.name], achievement, useOldestUnlockTime)
            }
        }
    }

    return Object.keys(mergedActiveAchievements).map(function (name) {
        return mergedActiveAchievements[name];
    });
}

function generateMergeSource(gameData: GameData, useOldestUnlockTime: boolean): SourceStats {
    return {
        source: 'Merge',
        achievements: {
            active: mergeActiveAchievements(gameData.stats.sources.map(
                (sourceStats: SourceStats) => {
                    return sourceStats.achievements.active;
                }
            ), useOldestUnlockTime)
        }
    };
}

function mergeSourceStats(st1: SourceStats, st2: SourceStats, useOldestUnlockTime: boolean): SourceStats {
    return {
        source: st1.source,
        achievements: {
            active: mergeActiveAchievements([st1.achievements.active, st2.achievements.active], useOldestUnlockTime)
        }
    };
}

function fixGameDataCollectionSchemaCollision(gameDataCollection: GameData[]): GameSchemaBody {
    let mergedAchievementsTotal = 0;
    let mergedAchievementsList: Achievement[] = [];

    for (const gameData of gameDataCollection) {
        if (gameData.schema.achievements.total > mergedAchievementsTotal) {
            mergedAchievementsTotal = gameData.schema.achievements.total;
            mergedAchievementsList = gameData.schema.achievements.list;
        }
    }

    const gameSchemaBody: GameSchemaBody = {
        name: gameDataCollection[0].schema.name,
        img: gameDataCollection[0].schema.img,
        achievements: {
            total: mergedAchievementsTotal,
            list: mergedAchievementsList
        }
    }

    if (gameDataCollection[0].schema.binary !== undefined) {
        gameSchemaBody.binary = gameDataCollection[0].schema.binary;
    }

    return gameSchemaBody;
}

function fixGameDataCollectionStatsCollision(gameDataCollection: GameData[], useOldestUnlockTime: boolean): GameStatsBody {
    const mergedSourceStats: { [key: string]: SourceStats } = {};
    let maxPlaytime = 0;

    for (const gameData of gameDataCollection) {
        for (const sourceStats of gameData.stats.sources) {
            const sourceKey: Source = sourceStats.source;

            if (!(sourceKey in mergedSourceStats)) {
                mergedSourceStats[sourceKey] = sourceStats;
            } else {
                mergedSourceStats[sourceKey] = mergeSourceStats(
                    mergedSourceStats[sourceKey],
                    sourceStats,
                    useOldestUnlockTime
                );
            }
        }

        if (gameData.stats.playtime > maxPlaytime) {
            maxPlaytime = gameData.stats.playtime;
        }
    }

    return {
        sources: Object.keys(mergedSourceStats).map(function (appId: string) {
            return mergedSourceStats[appId];
        }),
        playtime: maxPlaytime
    }
}

function mergeGameDataCollection(gd1: GameData, gd2: GameData, useOldestUnlockTime: boolean): GameData {
    const mergedSchema: GameSchemaBody = fixGameDataCollectionSchemaCollision([gd1, gd2]);
    const mergedStats: GameStatsBody = fixGameDataCollectionStatsCollision([gd1, gd2], useOldestUnlockTime);

    return {
        apiVersion: gd1.apiVersion,
        appId: gd1.appId,
        platform: gd1.platform,
        schema: mergedSchema,
        stats: mergedStats
    }
}