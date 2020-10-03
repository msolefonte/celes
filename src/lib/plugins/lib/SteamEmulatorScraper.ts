'use strict';

import {IGameMetadata, IGameSchema, IUnlockedAchievement} from '../../../types';
// @ts-ignore
import {AchievementsScraper} from './AchievementsScraper';
import {SteamUtils} from './SteamUtils';

const glob = require('fast-glob');
const path = require('path');

// TODO CHECK LOGS / THROWS

abstract class SteamEmulatorScraper implements AchievementsScraper {
    abstract readonly source: string;
    readonly steamLanguages: string[] = [
        'arabic', 'bulgarian', 'schinese', 'tchinese', 'czech', 'danish', 'dutch', 'english', 'finnish', 'french',
        'german', 'greek', 'hungarian', 'italian', 'japanese', 'korean', 'norwegian', 'polish', 'portuguese',
        'brazilian', 'romanian', 'russian', 'spanish', 'latam', 'swedish', 'thai', 'turkish', 'ukrainian', 'vietnamese'
    ];

    abstract normalizeUnlockedAchievementList(achievementList: any): IUnlockedAchievement[];

    abstract getSpecificFoldersToScan(): string[];

    async scan(additionalFoldersToScan: string[] = []): Promise<IGameMetadata[]> {
        const specificFoldersToScan: string[] = this.getSpecificFoldersToScan();
        const foldersToScan: string[] = await SteamUtils.getFoldersToScan(specificFoldersToScan, additionalFoldersToScan);

        const gamesMetadata: IGameMetadata[] = [];
        for (let dir of await glob(foldersToScan, {onlyDirectories: true, absolute: true})) {

            const gameMetadata: IGameMetadata = {
                appId: path.parse(dir).name,
                data: {
                    type: 'file',
                    path: dir
                },
                source: this.source
            };

            gamesMetadata.push(gameMetadata);
        }

        return gamesMetadata;
    }

    async getGameSchema(appId: string, lang: string): Promise<IGameSchema> {
        if (!this.steamLanguages.includes(lang)) {
            // TODO Add debug log here
            lang = "english";
        }

        let gameSchema: IGameSchema;
        const gameCachePath = SteamUtils.getGameCachePath(appId, lang);

        if (await SteamUtils.validSteamGameSchemaCacheExists(gameCachePath)) {
            gameSchema = await SteamUtils.getGameSchemaFromCache(gameCachePath);
        } else {
            gameSchema = await SteamUtils.getGameSchemaFromServer(appId, lang, this.source);
            await SteamUtils.updateGameSchemaCache(gameCachePath, gameSchema);
        }

        return gameSchema;
    }

    async getUnlockedAchievements(game: IGameMetadata): Promise<IUnlockedAchievement[]> {
        const achievementList: Object = await SteamUtils.getAchievementListFromGameFolder(<string>game.data.path);
        return this.normalizeUnlockedAchievementList(achievementList);
    }
}

export {SteamEmulatorScraper};