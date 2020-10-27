import {
    GameData,
    GameSchema,
    Platform,
    ScrapError,
    ScrapResult,
    Source,
    UnlockedOrInProgressAchievement
} from '../../types';

export function generateActiveAchievement(name: string, unlockTime = 0, achieved: 1 | 0 = 1, currentProgress = 0,
                                          maxProgress = 0): UnlockedOrInProgressAchievement {
    return {
        name: name,
        achieved: achieved,
        currentProgress: currentProgress,
        maxProgress: maxProgress,
        unlockTime: unlockTime
    }
}

export function generateGameData(apiVersion: string, gameSchema: GameSchema, source: Source,
                                 activeAchievements: UnlockedOrInProgressAchievement[]): GameData {
    return {
        apiVersion: apiVersion,
        appId: gameSchema.appId,
        platform: gameSchema.platform,
        schema: {
            name: gameSchema.name,
            img: gameSchema.img,
            achievements: gameSchema.achievement
        },
        stats: {
            sources: [
                {
                    source: source,
                    achievements: {
                        active: activeAchievements
                    }
                }
            ],
            playtime: 0
        }
    };
}

export function generateScrapError(error: Error, pluginName?: string, platform?: Platform, source?: Source,
                                   appId?: string): ScrapError {
    const scrapError: ScrapError = {
        message: error.message,
        type: error.constructor.name
    };

    if (pluginName !== undefined) {
        scrapError.plugin = pluginName;
    }

    if (platform !== undefined) {
        scrapError.platform = platform;
    }

    if (source !== undefined) {
        scrapError.source = source;
    }

    if (appId !== undefined) {
        scrapError.appId = appId;
    }

    return scrapError;
}

export function generateScrapResult(gameDataCollection: GameData[], scrapErrors: ScrapError[]): ScrapResult {
    const scrapResult: ScrapResult = {
        data: gameDataCollection
    };

    if (scrapErrors.length > 0) {
        scrapResult.error = scrapErrors;
    }

    return scrapResult;
}