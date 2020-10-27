import {GameSchema, Platform, ScanResult, Source, UnlockedOrInProgressAchievement} from '../../../types';
import {AchievementsScraper} from './AchievementsScraper';
import {getGameSchema as getSteamGameSchema} from './steamUtils';

abstract class SteamScraper implements AchievementsScraper {
    protected abstract readonly achievementWatcherRootPath: string;

    async getGameSchema(appId: string, language: string): Promise<GameSchema> {
        return getSteamGameSchema(this.achievementWatcherRootPath, appId, language);
    }

    abstract getUnlockedOrInProgressAchievements(game: ScanResult): Promise<UnlockedOrInProgressAchievement[]>;

    abstract scan(additionalFoldersToScan?: string[]): Promise<ScanResult[]>;

    abstract getPlatform(): Platform;

    abstract getSource(): Source;
}

export {SteamScraper};