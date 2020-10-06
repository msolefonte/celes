// 'use strict';
//
// import {CelesConfig, GameData} from '../types';
// import {Celes} from './Celes';
//
// const fs = require('fs');
// const path = require('path');
// const mkdirp = require('mkdirp');
//
//
// class CelesLauncher {
//     private achievementWatcherRootPath: string = path.join(<string>process.env['APPDATA'], 'Achievement Watcher');
//     private configFilePath: string = path.join(this.achievementWatcherRootPath, 'config/celes.json');
//     private readonly configVersion: string = "v1";
//
//     private async generateDefaultCelesConfig(): Promise<CelesConfig> {
//         const defaultCelesConfig: CelesConfig = {
//             apiVersion: this.configVersion,
//             additionalFoldersToScan: [
//                 "D:\\Games\\Sparrow\\Final Fantasy X X-2 HD Remaster",
//                 "D:\\Games\\Sparrow\\FINAL FANTASY VIII REMASTERED"
//             ],
//             systemLanguage: 'english',
//             ignoreSourceAtMerge: true,
//             useOldestUnlockTime: true
//         }
//
//         await mkdirp(path.dirname(this.configFilePath));
//         await fs.promises.writeFile(this.configFilePath, JSON.stringify(defaultCelesConfig, undefined, 2));
//
//         return defaultCelesConfig;
//     }
//
//     private async getCelesConfig(): Promise<CelesConfig> {
//         if (fs.existsSync(this.configFilePath)) {
//             try {
//                 const celesConfig: CelesConfig = <CelesConfig>JSON.parse(await fs.promises.readFile(this.configFilePath));
//
//                 if (celesConfig.apiVersion === this.configVersion) {
//                     return celesConfig;
//                 } else {
//                     console.warn("Config version not valid. Expected " + this.configVersion + ", found " + celesConfig.apiVersion + ".");
//                 }
//             } catch (error) {
//                 console.debug('Celes config not valid. Generating a new file.')
//             }
//         } else {
//             console.debug('Celes config not found. Generating a new file.')
//         }
//
//
//         return this.generateDefaultCelesConfig();
//     }
//
//     private async getCeles(): Promise<Celes> {
//         const celesConfig: CelesConfig = await this.getCelesConfig();
//         return new Celes(
//             celesConfig.additionalFoldersToScan,
//             celesConfig.systemLanguage,
//             celesConfig.ignoreSourceAtMerge,
//             celesConfig.useOldestUnlockTime
//         );
//     }
//
//     async import(filePath: string, force = false): Promise<GameData[]> {
//         const celes: Celes = await this.getCeles();
//         return celes.import(filePath, force);
//     }
//
//     async export(filePath: string): Promise<void> {
//         const celes: Celes = await this.getCeles();
//         return celes.export(filePath);
//     }
//
//     async load(callbackProgress?: Function): Promise<GameData[]> {
//         const celes: Celes = await this.getCeles();
//         return celes.load(callbackProgress);
//     }
//
//     async pull(callbackProgress?: Function): Promise<GameData[]> {
//         const celes: Celes = await this.getCeles();
//         return celes.pull(callbackProgress);
//     }
// }
//
// export {CelesLauncher};