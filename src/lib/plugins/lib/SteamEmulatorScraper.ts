'use strict';

import * as path from 'path';
import {GameSchema, ScanResult, Source, UnlockedOrInProgressAchievement} from '../../../types';
import {existsSync, promises as fs} from 'fs';
import {AchievementsScraper} from './AchievementsScraper';
import {SSEConfigParser} from './SSEConfigParser';
import {SteamUtils} from './SteamUtils';
import glob from 'fast-glob';
import ini from 'ini';
import normalize from 'normalize-path';

// TODO CHECK LOGS / THROWS
// TODO PASS LOGGER TO PLUGINS

abstract class SteamEmulatorScraper implements AchievementsScraper {
    protected abstract readonly achievementWatcherRootPath: string;
    protected abstract readonly achievementLocationFiles: string[];
    protected abstract readonly source: Source;

    abstract normalizeUnlockedOrInProgressAchievementList(achievementList: unknown): UnlockedOrInProgressAchievement[];

    abstract getSpecificFoldersToScan(): string[];

    async scan(additionalFoldersToScan: string[] = []): Promise<ScanResult[]> {
        const specificFoldersToScan: string[] = this.getSpecificFoldersToScan();
        const foldersToScan: string[] = await this.getFoldersToScan(specificFoldersToScan, additionalFoldersToScan);

        const gamesMetadata: ScanResult[] = [];
        for (const dir of await glob(foldersToScan, { onlyDirectories: true, absolute: true })) {
            let achievementLocationFileFound = false;
            for (const achievementLocationFile of this.achievementLocationFiles) {
                if (existsSync(path.join(dir, achievementLocationFile))) {
                    achievementLocationFileFound = true;
                    break;
                }
            }

            if (!achievementLocationFileFound) {
                continue;
            }

            const gameMetadata: ScanResult = {
                appId: path.parse(dir).name.toString(),
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

    async getGameSchema(appId: string, language: string): Promise<GameSchema> {
        return SteamUtils.getGameSchema(this.achievementWatcherRootPath, appId, language);
    }

    async getUnlockedOrInProgressAchievements(game: ScanResult): Promise<UnlockedOrInProgressAchievement[]> {
        const achievementList: unknown = await this.getAchievementListFromGameFolder(<string>game.data.path);
        return this.normalizeUnlockedOrInProgressAchievementList(achievementList);
    }

    getSource(): Source {
        return this.source;
    }

    protected async getFoldersToScan(specificFolders: string[], additionalFolders: string[]): Promise<string[]> {
        // let foldersToScan: string[] = [];
        let foldersToScan: string[] = specificFolders; // FIXME FOR RELEASE

        if (additionalFolders.length > 0) {
            foldersToScan = foldersToScan.concat(additionalFolders);
        }

        foldersToScan = foldersToScan.map((dir) => {
            return normalize(dir) + '/([0-9]+)';
        });

        return foldersToScan;
    }

    private async getAchievementListFromGameFolder(gameFolder: string): Promise<unknown> {
        let achievementList: unknown = {};

        for (const file of this.achievementLocationFiles) {
            try {
                const achievementFilePath: string = path.join(gameFolder, file);

                if (this.source == 'SmartSteamEmu' && file === 'stats.bin') {
                    achievementList = SSEConfigParser.parse(await fs.readFile(achievementFilePath));
                } else if (path.parse(file).ext == '.json') {
                    achievementList = JSON.parse(await fs.readFile(achievementFilePath, 'utf8'));
                } else {
                    achievementList = ini.parse(await fs.readFile(achievementFilePath, 'utf8'));
                }
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    throw error;
                }
            }
        }

        return achievementList;
    }
}

export {SteamEmulatorScraper};