'use strict';

import {ICelesConfig, IExportableGameData, IExportableUnlockedAchievements} from '../types';
import {Celes} from './Celes';

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');


class CelesLauncher {
    private achievementWatcherRootPath: string = path.join(<string>process.env['APPDATA'], 'Achievement Watcher');
    private configFilePath: string = path.join(this.achievementWatcherRootPath, 'config/celes.json');
    private readonly configVersion: string = "v1";

    private async generateDefaultCelesConfig(): Promise<ICelesConfig> {
        const defaultCelesConfig: ICelesConfig = {
            apiVersion: this.configVersion,
            additionalFoldersToScan: [
                "D:\\Games\\Sparrow\\Final Fantasy X X-2 HD Remaster",
                "D:\\Games\\Sparrow\\FINAL FANTASY VIII REMASTERED"
            ],
            systemLanguage: 'english',
            ignoreSourceAtMerge: true,
            useOldestUnlockTime: true
        }

        await mkdirp(path.dirname(this.configFilePath));
        await fs.promises.writeFile(this.configFilePath, JSON.stringify(defaultCelesConfig, undefined, 2));

        return defaultCelesConfig;
    }

    private async getCelesConfig(): Promise<ICelesConfig> {
        if (fs.existsSync(this.configFilePath)) {
            try {
                const celesConfig: ICelesConfig = <ICelesConfig>JSON.parse(await fs.promises.readFile(this.configFilePath));

                if (celesConfig.apiVersion === this.configVersion) {
                    return celesConfig;
                } else {
                    console.warn("Config version not valid. Expected " + this.configVersion + ", found " + celesConfig.apiVersion + ".");
                }
            } catch (error) {
                console.debug('Celes config not valid. Generating a new file.')
            }
        } else {
            console.debug('Celes config not found. Generating a new file.')
        }


        return this.generateDefaultCelesConfig();
    }

    private async getCeles(): Promise<Celes> {
        const celesConfig: ICelesConfig = await this.getCelesConfig();
        return new Celes(
            celesConfig.additionalFoldersToScan,
            celesConfig.systemLanguage,
            celesConfig.ignoreSourceAtMerge,
            celesConfig.useOldestUnlockTime
        );
    }

    async import(filePath: string, force = false): Promise<IExportableGameData[]> {
        const celes: Celes = await this.getCeles();
        return celes.import(filePath, force);
    }

    async export(filePath: string): Promise<void> {
        const celes: Celes = await this.getCeles();
        return celes.export(filePath);
    }

    async load(callbackProgress?: Function): Promise<IExportableGameData[]> {
        const celes: Celes = await this.getCeles();
        return celes.load(callbackProgress);
    }

    async scrap(callbackProgress?: Function): Promise<IExportableUnlockedAchievements[]> {
        const celes: Celes = await this.getCeles();
        return celes.scrap(callbackProgress);
    }

    async pull(callbackProgress?: Function): Promise<IExportableGameData[]> {
        const celes: Celes = await this.getCeles();
        return celes.pull(callbackProgress);
    }
}

export {CelesLauncher};