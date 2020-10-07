'use strict';

import * as path from 'path';
import {GameSchema, ScanResult, Source, UnlockedOrInProgressAchievement} from '../../../types';
import {AchievementsScraper} from './AchievementsScraper';
import {SSEConfigParser} from './SSEConfigParser';
import {SteamUtils} from './SteamUtils';
import {promises as fs} from 'fs';
import glob from 'fast-glob'
import ini from 'ini';
import normalize from 'normalize-path';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import regedit from 'regodit'; // TODO LOOK FOR ALTERNATIVES


// TODO CHECK LOGS / THROWS
// TODO PASS LOGGER TO PLUGINS

abstract class SteamEmulatorScraper implements AchievementsScraper {
    abstract readonly source: Source;
    readonly steamLanguages: string[] = [
        'arabic', 'bulgarian', 'schinese', 'tchinese', 'czech', 'danish', 'dutch', 'english', 'finnish', 'french',
        'german', 'greek', 'hungarian', 'italian', 'japanese', 'korean', 'norwegian', 'polish', 'portuguese',
        'brazilian', 'romanian', 'russian', 'spanish', 'latam', 'swedish', 'thai', 'turkish', 'ukrainian', 'vietnamese'
    ];

    // TODO MAKE ABSTRACT
    achievementLocationFiles: string[] = [
        'achievements.ini',
        'achievements.json',
        'achiev.ini',
        'stats.ini',
        'Achievements.Bin',
        'achieve.dat',
        'Achievements.ini',
        'stats/achievements.ini',
        'stats.bin',
        'stats/CreamAPI.Achievements.cfg'
    ];

    abstract normalizeUnlockedOrInProgressAchievementList(achievementList: unknown): UnlockedOrInProgressAchievement[];

    abstract getSpecificFoldersToScan(): string[];

    async scan(additionalFoldersToScan: string[] = []): Promise<ScanResult[]> {
        const specificFoldersToScan: string[] = this.getSpecificFoldersToScan();
        const foldersToScan: string[] = await this.getFoldersToScan(specificFoldersToScan, additionalFoldersToScan);

        const gamesMetadata: ScanResult[] = [];
        for (const dir of await glob(foldersToScan, {onlyDirectories: true, absolute: true})) {

            const gameMetadata: ScanResult = {
                appId: path.parse(dir).name,
                data: {
                    type: 'file',
                    path: dir
                },
                source: this.source,
                platform: 'Steam'
            };

            gamesMetadata.push(gameMetadata);
        }

        return gamesMetadata;
    }

    async getGameSchema(appId: string, lang: string): Promise<GameSchema> {
        if (!this.steamLanguages.includes(lang)) {
            // TODO Add debug log here
            lang = 'english';
        }

        return SteamUtils.getGameSchema(appId, lang);
    }

    async getUnlockedOrInProgressAchievements(game: ScanResult): Promise<UnlockedOrInProgressAchievement[]> {
        const achievementList: unknown = await this.getAchievementListFromGameFolder(<string>game.data.path);
        return this.normalizeUnlockedOrInProgressAchievementList(achievementList);
    }

    getSource(): Source {
        return this.source;
    }

    private async getFoldersToScan(specificFolders: string[], additionalFolders: string[]): Promise<string[]> {
        let foldersToScan: string[] = specificFolders;

        const DocsFolderPath: string = await regedit.promises.RegQueryStringValue('HKCU',
            'Software/Microsoft/Windows/CurrentVersion/Explorer/User Shell Folders', 'Personal');
        if (DocsFolderPath) {
            foldersToScan = foldersToScan.concat([
                path.join(DocsFolderPath, 'Skidrow')
            ]);
        }

        if (additionalFolders.length > 0) {
            foldersToScan = foldersToScan.concat(additionalFolders);
        }

        foldersToScan = foldersToScan.map((dir) => {
            return normalize(dir) + '/([0-9]+)';
        });

        return foldersToScan;
    }

    // TODO NOT CLEAR
    private async getAchievementListFromGameFolder(gameFolder: string): Promise<unknown> {
        let local: unknown;
        for (const file of this.achievementLocationFiles) {
            try {
                const achievementFile: string = path.join(gameFolder, file);
                if (path.parse(file).ext == '.json') {
                    local = JSON.parse(await fs.readFile(achievementFile, 'utf8'));
                } else if (file === 'stats.bin') {
                    local = SSEConfigParser.parse(await fs.readFile(achievementFile));
                } else {
                    local = ini.parse(await fs.readFile(achievementFile, 'utf8'));
                }
                break;
            } catch (e) {
                // TODO ADD DEBUG VERBOSE
                // console.debug(e);
            }
        }
        if (!local) {
            // TODO ADD PROPER LOGGER
            // console.debug(`No achievement files found in '${gameFolder}'`);
            local = {}
        }

        return local;
    }
}

export {SteamEmulatorScraper};