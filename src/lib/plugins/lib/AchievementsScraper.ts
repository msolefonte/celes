import {IGameMetadata, IGameSchema, IUnlockedAchievement} from '../../../types';

interface AchievementsScraper {
    getUnlockedAchievements(game: IGameMetadata): Promise<IUnlockedAchievement[]>;

    getGameSchema(appId: string, lang?: string, key?: string): Promise<IGameSchema>;

    scan(additionalFoldersToScan?: string[]): Promise<IGameMetadata[]>;
}

export {AchievementsScraper};