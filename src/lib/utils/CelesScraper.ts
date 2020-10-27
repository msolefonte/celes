import {
    GameData,
    GameSchema,
    Platform,
    ScanResult,
    ScrapError,
    ScrapResult,
    Source,
    SteamPluginMode,
    UnlockedOrInProgressAchievement
} from '../../types';
import {generateGameData, generateScrapError, generateScrapResult} from './generator';
import {AchievementsScraper} from '../plugins/utils/AchievementsScraper';
import {concatIfExists} from './utils';

export class CelesScraper {
    private static parseScrapGameResult(scrapGameResult: GameData | ScrapError, gameDataCollection: GameData[],
                                        scrapErrors: ScrapError[]): void {
        if ('apiVersion' in scrapGameResult && scrapGameResult.apiVersion !== undefined) {
            gameDataCollection.push(scrapGameResult);
        } else {
            if ((<ScrapError>scrapGameResult).type !== 'WrongSourceDetectedError') {
                scrapErrors.push(<ScrapError>scrapGameResult);
            }
        }
    }

    private readonly achievementWatcherRootPath: string;
    private readonly additionalFoldersToScan: string[];
    private readonly apiVersion: string;
    private readonly enabledPlugins: string[];
    private readonly steamPluginMode: SteamPluginMode;
    private readonly systemLanguage: string;

    constructor(achievementWatcherRootPath: string, additionalFoldersToScan: string[], apiVersion: string,
                enabledPlugins: string[], steamPluginMode: SteamPluginMode, systemLanguage: string) {
        this.achievementWatcherRootPath = achievementWatcherRootPath;
        this.additionalFoldersToScan = additionalFoldersToScan;
        this.apiVersion = apiVersion;
        this.enabledPlugins = enabledPlugins;
        this.steamPluginMode = steamPluginMode;
        this.systemLanguage = systemLanguage;
    }

    private async scrapPluginGame(scraper: AchievementsScraper,
                                  scanResult: ScanResult, pluginsProgress: number, gamesProgress: number,
                                  maxProgress: number, baseProgress: number,
                                  callbackProgress?: (progress: number) => void): Promise<GameData | ScrapError> {
        const platform: Platform = scraper.getPlatform();
        const source: Source = scraper.getSource();
        let gameSchema: GameSchema;
        let activeAchievements: UnlockedOrInProgressAchievement[];

        try {
            gameSchema = await scraper.getGameSchema(scanResult.appId, this.systemLanguage);
        } catch (error) {
            // if (!(error instanceof InternalError)) { // TODO ADD BLACKLISTED I.E. 17515
            //     scrapErrors.push(generateScrapError(error, undefined, platform, source, listOfGames[j].appId));
            // }
            return generateScrapError(error, undefined, platform, source, scanResult.appId);
        }

        try {
            activeAchievements = await scraper.getUnlockedOrInProgressAchievements(scanResult);

            typeof callbackProgress === 'function' && callbackProgress(baseProgress +
                Math.floor((pluginsProgress * gamesProgress * maxProgress)));
            return generateGameData(this.apiVersion, gameSchema, source, activeAchievements);
        } catch (error) {
            return generateScrapError(error, undefined, platform, source, scanResult.appId);
        }
    }

    private async loadPlugin(pluginName: string): Promise<AchievementsScraper> {
        const plugin = await import('../plugins/' + pluginName);

        if (pluginName === 'Steam') {
            return new plugin[Object.keys(plugin)[0]](this.achievementWatcherRootPath, this.steamPluginMode);
        } else {
            return new plugin[Object.keys(plugin)[0]](this.achievementWatcherRootPath);
        }
    }

    private async scrapPlugin(pluginName: string, pluginsProgress: number, maxProgress: number, baseProgress: number,
                              callbackProgress?: (progress: number) => void): Promise<ScrapResult> {
        const gameDataCollection: GameData[] = [];
        const scrapErrors: ScrapError[] = [];

        const scraper: AchievementsScraper = await this.loadPlugin(pluginName);
        const listOfGames: ScanResult[] = await scraper.scan(this.additionalFoldersToScan);

        for (let j = 0; j < listOfGames.length; j++) {
            const scrapGameResult: GameData | ScrapError = await this.scrapPluginGame(scraper, listOfGames[j],
                pluginsProgress, (j + 1) / listOfGames.length, maxProgress, baseProgress, callbackProgress);

            CelesScraper.parseScrapGameResult(scrapGameResult, gameDataCollection, scrapErrors);
        }

        return generateScrapResult(gameDataCollection, scrapErrors);
    }

    async scrap(maxProgress: number, baseProgress: number, callbackProgress?: (progress: number) => void):
        Promise<ScrapResult> {
        let gameDataCollection: GameData[] = [];
        let scrapErrors: ScrapError[] = [];

        for (let i = 0; i < this.enabledPlugins.length; i++) {
            try {
                const pluginsProgress = (i + 1) / this.enabledPlugins.length;
                const pluginScrapResult: ScrapResult = await this.scrapPlugin(this.enabledPlugins[i], pluginsProgress,
                    maxProgress, baseProgress, callbackProgress);
                gameDataCollection = gameDataCollection.concat(pluginScrapResult.data);

                scrapErrors = <ScrapError[]>concatIfExists(scrapErrors, pluginScrapResult.error);
            } catch (error) {
                scrapErrors.push(generateScrapError(error, this.enabledPlugins[i]));
            }

            typeof callbackProgress === 'function' && callbackProgress(baseProgress + maxProgress);
        }

        return generateScrapResult(gameDataCollection, scrapErrors);
    }
}