import {Achievement, GameData, Source, SourceStats, UnlockedOrInProgressAchievement} from '../../types';

class Merger {
    static mergeGameDataCollections(gameDataCollections: GameData[][], useOldestUnlockTime = true): GameData[] {
        const mergedGameDataCollection: { [key: string]: GameData } = {};

        for (let i = 0; i < gameDataCollections.length; i++) {
            for (let j = 0; j < gameDataCollections[i].length; j++) {
                const gameData: GameData = gameDataCollections[i][j];
                const gameDataUniqueKey: string = gameData.appid + gameData.platform;

                if (!(gameDataUniqueKey in mergedGameDataCollection)) {
                    mergedGameDataCollection[gameDataUniqueKey] = gameData;
                } else {
                    mergedGameDataCollection[gameDataUniqueKey] = this.mergeGameDatas(
                        mergedGameDataCollection[gameDataUniqueKey],
                        gameData,
                        useOldestUnlockTime
                    );
                }
            }
        }

        for (let i = 0; i < gameDataCollections.length; i++) {
            for (let j = 0; j < gameDataCollections[i].length; j++) {
                const gameData: GameData = gameDataCollections[i][j];
                const gameDataReference = mergedGameDataCollection[gameData.appid + gameData.platform];

                gameDataReference.stats.sources = gameDataReference.stats.sources.filter(
                    (source: SourceStats) => {
                        return source.source !== 'Merge';
                    }
                );

                gameDataReference.stats.sources.push(this.generateMergeSource(gameDataReference, useOldestUnlockTime));
            }
        }

        return Object.keys(mergedGameDataCollection).map(function (appId: string) {
            return mergedGameDataCollection[appId];
        });
    }

    private static mergeActiveAchievements(activeAchievementsCollection: UnlockedOrInProgressAchievement[][], useOldestUnlockTime: boolean): UnlockedOrInProgressAchievement[] {
        const mergedActiveAchievements: { [key: string]: UnlockedOrInProgressAchievement } = {};

        for (let i = 0; i < activeAchievementsCollection.length; i++) {
            for (let j = 0; j < activeAchievementsCollection[i].length; j++) {
                const achievement: UnlockedOrInProgressAchievement = activeAchievementsCollection[i][j];
                if (!(achievement.name in mergedActiveAchievements)) {
                    mergedActiveAchievements[achievement.name] = achievement;
                } else {
                    if (achievement.currentProgress > mergedActiveAchievements[achievement.name].currentProgress) {
                        mergedActiveAchievements[achievement.name] = achievement;
                    } else if (useOldestUnlockTime) {
                        if (achievement.unlockTime < mergedActiveAchievements[achievement.name].unlockTime) {
                            mergedActiveAchievements[achievement.name] = achievement;
                        }
                    } else {
                        if (achievement.unlockTime > mergedActiveAchievements[achievement.name].unlockTime) {
                            mergedActiveAchievements[achievement.name] = achievement;
                        }
                    }
                }
            }
        }

        return Object.keys(mergedActiveAchievements).map(function (name) {
            return mergedActiveAchievements[name];
        });
    }

    private static generateMergeSource(gameData: GameData, useOldestUnlockTime: boolean): SourceStats {
        return {
            source: 'Merge',
            achievements: {
                active: this.mergeActiveAchievements(gameData.stats.sources.map(
                    (sourceStats: SourceStats) => {
                        return sourceStats.achievements.active;
                    }
                ), useOldestUnlockTime)
            }
        };
    }

    private static mergeSourceStats(st1: SourceStats, st2: SourceStats, useOldestUnlockTime: boolean): SourceStats {
        return {
            source: st1.source,
            achievements: {
                active: this.mergeActiveAchievements([st1.achievements.active, st2.achievements.active], useOldestUnlockTime)
            }
        };
    }

    private static mergeGameDatas(gd1: GameData, gd2: GameData, useOldestUnlockTime: boolean): GameData {
        const mergedSourceStats: { [key: string]: SourceStats } = {};
        const gameDatas = [gd1, gd2];

        let mergedAchievementsTotal: number = gd1.schema.achievements.total;
        let mergedAchievementsList: Achievement[] = gd1.schema.achievements.list;
        let maxPlaytime = 0;

        for (let i = 0; i < gameDatas.length; i++) {
            const gameData: GameData = gameDatas[i];

            for (let j = 0; j < gameData.stats.sources.length; j++) {
                const sourceStats: SourceStats = gameData.stats.sources[j];
                const sourceKey: Source = sourceStats.source;

                if (!(sourceKey in mergedSourceStats)) {
                    mergedSourceStats[sourceKey] = sourceStats;
                } else {
                    mergedSourceStats[sourceKey] = this.mergeSourceStats(
                        mergedSourceStats[sourceKey],
                        sourceStats,
                        useOldestUnlockTime
                    );
                }
            }

            if (gameData.schema.achievements.total > mergedAchievementsTotal) {
                mergedAchievementsTotal = gameData.schema.achievements.total;
                mergedAchievementsList = gameData.schema.achievements.list;
            }

            if (gameData.stats.playtime > maxPlaytime) {
                maxPlaytime = gameData.stats.playtime;
            }
        }

        const mergedGameData: GameData = {
            apiVersion: gd1.apiVersion,
            appid: gd1.appid,
            platform: gd1.platform,
            schema: {
                name: gd1.schema.name,
                img: gd1.schema.img,
                achievements: {
                    total: mergedAchievementsTotal,
                    list: mergedAchievementsList
                }
            },
            stats: {
                sources: Object.keys(mergedSourceStats).map(function (appId: string) {
                    return mergedSourceStats[appId];
                }),
                playtime: maxPlaytime,
            }
        };

        if ('binary' in gd1.schema) {
            mergedGameData.schema.binary = gd1.schema.binary;
        }

        return mergedGameData;
    }
}

export {Merger};