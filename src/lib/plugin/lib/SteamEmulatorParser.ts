'use strict';

import {IGameData, IGameMetadata, ISteamLanguage, IUnlockedAchievement} from '../../../types';
// @ts-ignore
import {Parser} from './Parser';
import {SteamUtils} from './SteamUtils';

const glob = require('fast-glob');
const path = require('path');
const steamLanguages = require('../../../../locale/steam.json');

// TODO CHECK LOGS / THROWS

abstract class SteamEmulatorParser implements Parser {
    abstract readonly source: string;

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

    async getGameData(appId: string, lang: string, key?: string | undefined): Promise<IGameData> {
        if (!steamLanguages.some((language: ISteamLanguage) => {
            return language.api === lang;
        })) {
            throw 'Unsupported API language code';
        }

        // @ts-ignore TODO FIXME PATCH FOR TS
        const keyUsage = key;

        let gameData: IGameData;
        const gameCachePath = SteamUtils.getGameCachePath(appId, lang);

        if (await SteamUtils.validSteamGameDataCacheExists(gameCachePath)) {
            gameData = await SteamUtils.getGameDataFromCache(gameCachePath);
        } else {
            // if (key) {
            // TODO DEBATE WITH ANTHONY
            //     gameData = await SteamUtils.getGameDataUsingOwnApiKey(appId, lang, key);
            // } else {
            gameData = await SteamUtils.getGameDataFromServer(appId, lang);
            // }
            await SteamUtils.updateGameDataCache(gameCachePath, gameData);
        }

        return gameData;
    }

    async getAchievements(game: IGameMetadata): Promise<IUnlockedAchievement[]> {
        const achievementList: Object = await SteamUtils.getAchievementListFromGameFolder(<string> game.data.path);
        return this.normalizeUnlockedAchievementList(achievementList);
    }
}

export {SteamEmulatorParser};