'use strict';

import {ICelesConfig} from '../types';
import {Celes} from './Celes';

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');


class CelesLauncher {
    private achievementWatcherRootPath: string = path.join(<string>process.env['APPDATA'], 'Achievement Watcher');
    private configFilePath: string = path.join(this.achievementWatcherRootPath, 'celes/config.json');

    private async generateDefaultCelesConfig(): Promise<void> {
        const defaultCelesConfig: ICelesConfig = {
            additionalFoldersToScan: [],
            systemLanguage: 'english',
            ignoreSourceAtMerge: true,
            useOldestUnlockTime: true
        }

        await mkdirp(path.dirname(this.configFilePath));
        await fs.promises.writeFile(this.configFilePath, JSON.stringify(defaultCelesConfig));
    }

    private async getCelesConfig(): Promise<ICelesConfig> {
        if (!fs.existsSync(this.configFilePath)) {
            await this.generateDefaultCelesConfig();
        }

        return <ICelesConfig>JSON.parse(await fs.promises.readFile(this.configFilePath));
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

    async import(filePath: string, force: boolean = false): Promise<void> {
        const celes: Celes = await this.getCeles();
        return celes.import(filePath, force);
    }

    async export(filePath: string): Promise<void> {
        const celes: Celes = await this.getCeles();
        await celes.export(filePath);
    }

    async load(showPercentage: boolean = false): Promise<void> {
        const celes: Celes = await this.getCeles();

        if (showPercentage) {
            await celes.load((percent: number) => console.log(percent));
        } else {
            await celes.load();
        }
    }
}

export {CelesLauncher};