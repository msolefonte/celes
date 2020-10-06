'use strict';

import {ScanResult, GameSchema, Source, UnlockedOrInProgressAchievement} from '../../../types';
// @ts-ignore
import {AchievementsScraper} from './AchievementsScraper';
import {SteamUtils} from './SteamUtils';

const glob = require('fast-glob');
const path = require('path');

// TODO CHECK LOGS / THROWS

abstract class SteamEmulatorScraper implements AchievementsScraper {
    abstract readonly source: Source;
    readonly steamLanguages: string[] = [
        'arabic', 'bulgarian', 'schinese', 'tchinese', 'czech', 'danish', 'dutch', 'english', 'finnish', 'french',
        'german', 'greek', 'hungarian', 'italian', 'japanese', 'korean', 'norwegian', 'polish', 'portuguese',
        'brazilian', 'romanian', 'russian', 'spanish', 'latam', 'swedish', 'thai', 'turkish', 'ukrainian', 'vietnamese'
    ];

    abstract normalizeUnlockedOrInProgressAchievementList(achievementList: any): UnlockedOrInProgressAchievement[];

    abstract getSpecificFoldersToScan(): string[];

    async scan(additionalFoldersToScan: string[] = []): Promise<ScanResult[]> {
        const specificFoldersToScan: string[] = this.getSpecificFoldersToScan();
        const foldersToScan: string[] = await SteamUtils.getFoldersToScan(specificFoldersToScan, additionalFoldersToScan);

        const gamesMetadata: ScanResult[] = [];
        for (const dir of await glob(foldersToScan, {onlyDirectories: true, absolute: true})) {

            const gameMetadata: ScanResult = {
                appId: path.parse(dir).name,
                data: {
                    type: 'file',
                    path: dir
                },
                source: this.source,
                platform: "Steam"
            };

            gamesMetadata.push(gameMetadata);
        }

        return gamesMetadata;
    }

    async getGameSchema(appId: string, lang: string): Promise<GameSchema> {
        if (!this.steamLanguages.includes(lang)) {
            // TODO Add debug log here
            lang = "english";
        }

        return SteamUtils.getGameSchema(appId, lang);
    }

    async getUnlockedOrInProgressAchievements(game: ScanResult): Promise<UnlockedOrInProgressAchievement[]> {
        const achievementList: Object = await SteamUtils.getAchievementListFromGameFolder(<string>game.data.path);
        return this.normalizeUnlockedOrInProgressAchievementList(achievementList);
    }

    getSource() {
        return this.source;
    }
}

export {SteamEmulatorScraper};