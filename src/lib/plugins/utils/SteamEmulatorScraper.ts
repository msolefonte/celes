import * as path from 'path';
import {Platform, ScanResult, Source, UnlockedOrInProgressAchievement} from '../../../types';
import {existsSync, promises as fs} from 'fs';
import {SteamScraper} from './SteamScraper';
import glob from 'fast-glob';
import normalize from 'normalize-path';
import {parse as parseIni} from 'js-ini';
import {parse as parseSse} from './sseConfigParser';

abstract class SteamEmulatorScraper extends SteamScraper {
    protected abstract readonly achievementWatcherRootPath: string;
    protected abstract readonly achievementLocationFiles: string[];
    protected abstract readonly source: Source;

    abstract normalizeActiveAchievements(achievementList: unknown): UnlockedOrInProgressAchievement[];

    abstract getSpecificFoldersToScan(): string[];

    async scan(additionalFoldersToScan: string[]): Promise<ScanResult[]> {
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
                    path: dir
                },
                source: this.source,
                platform: 'Steam'
            };

            gamesMetadata.push(gameMetadata);
        }

        return gamesMetadata;
    }

    async getUnlockedOrInProgressAchievements(game: ScanResult): Promise<UnlockedOrInProgressAchievement[]> {
        const achievementList: unknown = await this.getAchievementListFromGameFolder(<string>game.data.path);
        return this.normalizeActiveAchievements(achievementList);
    }

    getPlatform(): Platform {
        return 'Steam';
    }

    getSource(): Source {
        return this.source;
    }

    protected async getFoldersToScan(specificFolders: string[], additionalFolders: string[]): Promise<string[]> {
        let foldersToScan: string[] = specificFolders;

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
                    achievementList = parseSse(await fs.readFile(achievementFilePath));
                } else if (path.parse(file).ext == '.json') {
                    achievementList = JSON.parse(await fs.readFile(achievementFilePath, 'utf8'));
                } else {
                    achievementList = await parseIni(await fs.readFile(achievementFilePath, 'utf8'));
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