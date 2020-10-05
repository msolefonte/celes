// TODO

// 'use strict';
//
// // const { remote } = require('electron');
// import {ScanResult, ILegitSteamGameMetadata, ISteamLanguage, SteamUser} from '../../types';
//
// const path = require('path');
// const glob = require('fast-glob');
// const normalize = require('normalize-path');
// const ini = require('ini');
// const omit = require('lodash.omit');
// const moment = require('moment');
// const request = require('request-zero');
// // const urlParser = require('url');
// const ffs = require('../util/feverFS.ts');
// const htmlParser = require('node-html-parser').parse;
// const regedit = require('regodit');
// const steamID = require('../util/steamID');
// const steamLanguages = require("../locale/steam.json");
// const sse = require('./sse.js');
//
// // TODO CHECK LOGS / THROWS
//
// class LegitSteamParser {
//     private readonly publicDataPath: string = <string>process.env['Public'];
//     private readonly appDataPath: string = <string>process.env['APPDATA'];
//     private readonly localAppDataPath: string = <string>process.env['LOCALAPPDATA'];
//     private readonly programDataPath: string = <string>process.env['PROGRAMDATA'];
//     private readonly achievementWatcherRootPath = path.join(<string>process.env['APPDATA'], 'Achievement Watcher');
//
//     constructor() {
//     }
//
//     async scan(listingType: 0 | 1 | 2 = 0): Promise<ScanResult[]> {
//         const gamesMetadata: ScanResult[] = [];
//
//         if (regedit.RegKeyExists('HKCU', 'Software/Valve/Steam') && listingType > 0) {
//             const steamPath = await this.getSteamPath();
//             const steamCache = path.join(steamPath, 'appcache/stats');
//             const publicUsers = await this.getSteamUsers(steamPath);
//
//             const legitGamesList: ILegitSteamGameMetadata[] = (await glob('UserGameStats_*([0-9])_*([0-9]).bin', {
//                 cwd: steamCache,
//                 onlyFiles: true,
//                 absolute: false
//             })).map((filename: string) => {
//                 const matches: RegExpMatchArray = <RegExpMatchArray>filename.match(/([0-9]+)/g);
//                 return {
//                     userId: matches[0],
//                     appId: matches[1]
//                 };
//             });
//
//             for (let game of legitGamesList) {
//                 let isInstalled = true;
//                 if (listingType == 1) {
//                     isInstalled = (await regedit.promises.RegQueryIntegerValue('HKCU',
//                         `Software/Valve/Steam/Apps/${game.appId}`, 'Installed') === '1');
//                 }
//                 const user: SteamUser = <SteamUser> publicUsers.find(user => user.user == game.userId);
//
//                 if (user && isInstalled) {
//                     gamesMetadata.push({
//                         appId: game.appId,
//                         source: `Steam (${user.name})`,
//                         data: {
//                             type: 'steamAPI',
//                             userId: user,
//                             cachePath: steamCache
//                         }
//                     });
//                 }
//             }
//         } else {
//             throw 'Legit Steam not found or disabled.';
//         }
//
//         return gamesMetadata;
//     }
//
//     async getGameMetadata(config: any) {
//         if (!steamLanguages.some( (language: ISteamLanguage) => { return language.api === config.lang } )) {
//               throw "Unsupported API language code";
//         }
//
//         const cache = path.join(this.achievementWatcherRootPath, 'steam_cache/schema', config.lang);
//
//         try {
//
//             let filePath = path.join(`${cache}`, `${config.appID}.db`);
//
//             let result;
//
//             if (await ffs.promises.existsAndIsYoungerThan(filePath, {timeUnit: 'month', time: 1})) {
//                 result = JSON.parse(await ffs.promises.readFile(filePath));
//             } else {
//                 if (config.key) {
//                     result = await getSteamData(config);
//                 } else {
//                     result = await getSteamDataFromSRV(config.appID, config.lang);
//                 }
//                 ffs.promises.writeFile(filePath, JSON.stringify(result, null, 2)).catch((err) => {
//                 });
//             }
//
//             return result;
//
//         } catch (err) {
//             throw 'Could not load Steam data.';
//         }
//     }
//
//     async getAchievementsFromFile(filePath) {
//         try {
//
//             const files = [
//                 'achievements.ini',
//                 'achievements.json',
//                 'achiev.ini',
//                 'stats.ini',
//                 'Achievements.Bin',
//                 'achieve.dat',
//                 'Achievements.ini',
//                 'stats/achievements.ini',
//                 'stats.bin',
//                 'stats/CreamAPI.Achievements.cfg'
//             ];
//
//             const filter = ['SteamAchievements', 'Steam64', 'Steam'];
//
//             let local;
//             for (let file of files) {
//                 try {
//
//                     if (path.parse(file).ext == '.json') {
//                         local = JSON.parse(await ffs.promises.readFile(path.join(filePath, file), 'utf8'));
//                     } else if (file === 'stats.bin') {
//                         local = sse.parse(await ffs.promises.readFile(path.join(filePath, file)));
//                     } else {
//                         local = ini.parse(await ffs.promises.readFile(path.join(filePath, file), 'utf8'));
//                     }
//                     break;
//                 } catch (e) {
//                 }
//             }
//             if (!local) {
//                 throw `No achievement file found in '${filePath}'`;
//             }
//
//             let result = {};
//
//             if (local.AchievementsUnlockTimes && local.Achievements) { //hoodlum DARKSiDERS
//
//                 for (let i in local.Achievements) {
//                     if (local.Achievements[i] == 1) {
//                         result[`${i}`] = {Achieved: '1', UnlockTime: local.AchievementsUnlockTimes[i] || null};
//                     }
//                 }
//             } else if (local.State && local.Time) { //3DM
//
//                 for (let i in local.State) {
//                     if (local.State[i] == '0101') {
//                         result[i] = {
//                             Achieved: '1',
//                             UnlockTime: new DataView(new Uint8Array(Buffer.from(local.Time[i].toString(), 'hex')).buffer).getUint32(0, true) || null
//                         };
//                     }
//                 }
//             } else {
//                 result = omit(local.ACHIEVE_DATA || local, filter);
//             }
//
//             for (let i in result) {
//                 if (result[i].State) { //RLD!
//                     try {
//                         //uint32 little endian
//                         result[i].State = new DataView(new Uint8Array(Buffer.from(result[i].State.toString(), 'hex')).buffer).getUint32(0, true);
//                         result[i].CurProgress = new DataView(new Uint8Array(Buffer.from(result[i].CurProgress.toString(), 'hex')).buffer).getUint32(0, true);
//                         result[i].MaxProgress = new DataView(new Uint8Array(Buffer.from(result[i].MaxProgress.toString(), 'hex')).buffer).getUint32(0, true);
//                         result[i].Time = new DataView(new Uint8Array(Buffer.from(result[i].Time.toString(), 'hex')).buffer).getUint32(0, true);
//                     } catch (e) {
//                     }
//                 } else if (result[i].unlocktime && result[i].unlocktime.length === 7) { //creamAPI
//                     result[i].unlocktime = +result[i].unlocktime * 1000; //cf: https://cs.rin.ru/forum/viewtopic.php?p=2074273#p2074273 | timestamp is invalid/incomplete
//                 }
//             }
//
//             return result;
//
//         } catch (err) {
//             throw err;
//         }
//     }
//
//     async getAchievementsFromAPI(cfg) {
//
//         try {
//
//             let result;
//
//             let cache = {
//                 local: path.join(this.achievementWatcherRootPath, 'steam_cache/user', cfg.user.user, `${cfg.appID}.db`),
//                 steam: path.join(`${cfg.path}`, `UserGameStats_${cfg.user.user}_${cfg.appID}.bin`)
//             };
//
//             let time = {
//                 local: 0,
//                 steam: 0
//             };
//
//             let local = await ffs.promises.stats(cache.local);
//             if (Object.keys(local).length > 0) {
//                 time.local = moment(local.mtime).valueOf();
//             }
//
//             let steamStats = await ffs.promises.stats(cache.steam);
//             if (Object.keys(steamStats).length > 0) {
//                 time.steam = moment(steamStats.mtime).valueOf();
//             } else {
//                 throw 'No Steam cache file found';
//             }
//
//             if (time.steam > time.local) {
//                 if (cfg.key) {
//                     result = await getSteamUserStats(cfg);
//                 } else {
//                     result = await getSteamUserStatsFromSRV(cfg.user.id, cfg.appID);
//                 }
//                 ffs.promises.writeFile(cache.local, JSON.stringify(result, null, 2)).catch((err) => {
//                 });
//
//             } else {
//                 result = JSON.parse(await ffs.promises.readFile(cache.local));
//             }
//
//             return result;
//
//         } catch (err) {
//             throw 'Could not load Steam User Stats.';
//         }
//
//     }
//
//     private async getSteamPath() {
//         /*
//           Some SteamEmu change HKCU/Software/Valve/Steam/SteamPath to the game's dir
//           Fallback to Software/WOW6432Node/Valve/Steam/InstallPath in this case
//           NB: Steam client correct the key on startup
//         */
//
//         const regHives = [
//             {root: 'HKCU', key: 'Software/Valve/Steam', name: 'SteamPath'},
//             {root: 'HKLM', key: 'Software/WOW6432Node/Valve/Steam', name: 'InstallPath'}
//         ];
//
//         let steamPath;
//
//         for (let regHive of regHives) {
//
//             steamPath = await regedit.promises.RegQueryStringValue(regHive.root, regHive.key, regHive.name);
//             if (steamPath) {
//                 if (await ffs.promises.exists(path.join(steamPath, 'steam.exe'))) {
//                     break;
//                 }
//             }
//         }
//
//         if (!steamPath) {
//             throw 'Steam Path not found';
//         }
//         return steamPath;
//     }
//
//     private async getSteamUsers(steamPath: string): Promise<SteamUser[]> {
//         let steamUsers: SteamUser[] = [];
//
//         let users = await regedit.promises.RegListAllSubkeys('HKCU', 'Software/Valve/Steam/Users');
//         if (!users) {
//             users = await glob('*([0-9])', {
//                 cwd: path.join(steamPath, 'userdata'),
//                 onlyDirectories: true,
//                 absolute: false
//             });
//         }
//
//         if (users.length == 0) {
//             throw 'No Steam User ID found';
//         }
//         for (let user of users) {
//             let id = steamID.to64(user);
//             let data = await steamID.whoIs(id);
//
//             if (data.privacyState === 'public') {
//                 console.log(`${user} - ${id} (${data.steamID}) is public`);
//                 steamUsers.push({
//                     user: user,
//                     id: id,
//                     name: data.steamID
//                 });
//             } else {
//                 console.log(`${user} - ${id} (${data.steamID}) is not public`);
//             }
//         }
//
//         if (steamUsers.length > 0) {
//             return steamUsers;
//         } else {
//             throw 'Public profile: none.';
//         }
//     }
//
//     getSteamUserStatsFromSRV(user, appID) {
//
//         const url = `https://api.xan105.com/steam/user/${user}/stats/${appID}`;
//
//         return new Promise((resolve, reject) => {
//
//             request.getJson(url).then((data) => {
//
//                 if (data.error) {
//                     return reject(data.error);
//                 } else if (data.data) {
//                     return resolve(data.data);
//                 } else {
//                     return reject('Unexpected Error');
//                 }
//
//             }).catch((err) => {
//                 return reject(err);
//             });
//
//         });
//     }
//
//     async getSteamUserStats(cfg) {
//
//         const url = `http://api.steampowered.com/SteamUserStats/GetPlayerAchievements/v0001/?appid=${cfg.appID}&key=${cfg.key}&steamid=${cfg.user.id}"`;
//
//         try {
//
//             let result = await request.getJson(url);
//             return result.playerstats.achievements;
//
//         } catch (err) {
//             throw err;
//         }
//
//     };
//
//     getSteamDataFromSRV(appID, lang) {
//
//         const url = `https://api.xan105.com/steam/ach/${appID}?lang=${lang}`;
//
//         return new Promise((resolve, reject) => {
//
//             request.getJson(url).then((data) => {
//
//                 if (data.error) {
//                     return reject(data.error);
//                 } else if (data.data) {
//                     return resolve(data.data);
//                 } else {
//                     return reject('Unexpected Error');
//                 }
//
//             }).catch((err) => {
//                 return reject(err);
//             });
//
//         });
//     }
//
//     getSteamData(cfg) {
//
//         const url = {
//             api: `https://api.steampowered.com/SteamUserStats/GetSchemaForGame/v0002/?key=${cfg.key}&appid=${cfg.appID}&l=${cfg.lang}&format=json`,
//             store: `https://store.steampowered.com/api/appdetails?appids=${cfg.appID}`
//         };
//
//         return new Promise((resolve, reject) => {
//
//             Promise.all([request.getJson(url.api), request.getJson(url.store, {headers: {'Accept-Language': 'en-US;q=1.0'}}), scrapSteamDB(cfg.appID)]).then(function (data) {
//
//                 try {
//
//                     let schema = data[0].game.availableGameStats;
//                     let appdetail = data[1][cfg.appID].data;
//                     let steamdb = data[2];
//
//                     let result = {
//                         name: (data[1][cfg.appID].success) ? appdetail.name : steamdb.name, //If the game is no longer available in the store fallback to steamdb
//                         appid: cfg.appID,
//                         binary: path.parse(steamdb.binary).base,
//                         img: {
//                             header: (data[1][cfg.appID].success) ? appdetail.header_image.split('?')[0] : steamdb.header, //If the game is no longer available in the store fallback to steamdb
//                             background: (data[1][cfg.appID].success) ? appdetail.background.split('?')[0] : null,
//                             icon: steamdb.icon
//                         },
//                         achievement: {
//                             total: schema.achievements.length,
//                             list: schema.achievements
//                         }
//                     };
//
//                     return resolve(result);
//
//                 } catch (err) {
//                     return reject(err);
//                 }
//
//             }).catch((err) => {
//                 return reject(err);
//             });
//         });
//     }
//
//     async scrapSteamDB(appID) {
//         try {
//             let data = await request(`https://steamdb.info/app/${appID}/`);
//             let html = htmlParser(data.body);
//
//             let binaries = html.querySelector('#config table tbody').innerHTML.split('</tr>\n<tr>').map((tr) => {
//
//                 let data = tr.split('</td>\n');
//
//                 return {
//                     executable: data[1].replace(/<\/?[^>]+>/gi, '').replace(/[\r\n]/g, ''),
//                     windows: data[4].includes(`aria-label="windows"`) || (!data[4].includes(`aria-label="macOS"`) && !data[4].includes(`aria-label="Linux"`)) ? true : false,
//                 };
//
//             });
//
//             let result = {
//                 binary: binaries.find(binary => binary.windows).executable.match(/([^\\\/\:\*\?\"\<\>\|])+$/)[0],
//                 icon: html.querySelector('.app-icon.avatar').attributes.src,
//                 header: html.querySelector('.app-logo').attributes.src,
//                 name: html.querySelector('.css-truncate').innerHTML
//             };
//
//             return result;
//
//         } catch (err) {
//             throw err;
//         }
//     }
//
//     async getFoldersToScan(additionalFoldersToScan: string[]): string[] {
//         let foldersToScan: string[] = [
//             path.join(this.publicDataPath, 'Documents/Steam/CODEX'),
//             path.join(this.appDataPath, 'Goldberg SteamEmu Saves'),
//             path.join(this.appDataPath, 'Steam/CODEX'),
//             path.join(this.programDataPath, 'Steam') + '/*',
//             path.join(this.localAppDataPath, 'SKIDROW'),
//             path.join(this.appDataPath, 'SmartSteamEmu'),
//             path.join(this.appDataPath, 'CreamAPI')
//         ];
//
//         const DocsFolderPath: string = await regedit.promises.RegQueryStringValue('HKCU',
//             'Software/Microsoft/Windows/CurrentVersion/Explorer/User Shell Folders', 'Personal');
//         if (DocsFolderPath) {
//             foldersToScan = foldersToScan.concat([
//                 path.join(DocsFolderPath, 'Skidrow')
//             ]);
//         }
//
//         if (additionalFoldersToScan.length > 0) {
//             foldersToScan = foldersToScan.concat(additionalFoldersToScan);
//         }
//
//         foldersToScan = foldersToScan.map((dir) => {
//             return normalize(dir) + '/([0-9]+)';
//         });
//
//         return foldersToScan;
//     }
// }
//
// // export = {scan, scanLegit, getGameData, getAchievementsFromFile, getAchievementsFromAPI};
// export = {SteamParser};

// TODO DRAFT HERE

// // TODO LEGIT
// async scanLegitSteam(listingType: 0 | 1 | 2 = 0): Promise<ScanResult[]> {
//     const gamesMetadata: ScanResult[] = [];
//
//     if (regedit.RegKeyExists('HKCU', 'Software/Valve/Steam') && listingType > 0) {
//         const steamPath = await this.getSteamPath();
//         const steamCache = path.join(steamPath, 'appcache/stats');
//         const publicUsers = await this.getSteamUsers(steamPath);
//
//         const legitGamesList: ILegitSteamGameMetadata[] = (await glob('UserGameStats_*([0-9])_*([0-9]).bin', {
//             cwd: steamCache,
//             onlyFiles: true,
//             absolute: false
//         })).map((filename: string) => {
//             const matches: RegExpMatchArray = <RegExpMatchArray>filename.match(/([0-9]+)/g);
//             return {
//                 userId: matches[0],
//                 appId: matches[1]
//             };
//         });
//
//         for (let game of legitGamesList) {
//             let isInstalled = true;
//             if (listingType == 1) {
//                 isInstalled = (await regedit.promises.RegQueryIntegerValue('HKCU',
//                     `Software/Valve/Steam/Apps/${game.appId}`, 'Installed') === '1');
//             }
//             const user: SteamUser = <SteamUser> publicUsers.find(user => user.user == game.userId);
//
//             if (user && isInstalled) {
//                 gamesMetadata.push({
//                     appId: game.appId,
//                     source: `Steam (${user.name})`,
//                     data: {
//                         type: 'steamAPI',
//                         userId: user,
//                         cachePath: steamCache
//                     }
//                 });
//             }
//         }
//     } else {
//         throw 'Legit Steam not found or disabled.';
//     }
//
//     return gamesMetadata;
// }

// // TODO LEGIT
// async getAchievementsFromAPI(cfg) {
//
//     try {
//
//         let result;
//
//         let cache = {
//             local: path.join(this.achievementWatcherRootPath, 'steam_cache/user', cfg.user.user, `${cfg.appID}.db`),
//             steam: path.join(`${cfg.path}`, `UserGameStats_${cfg.user.user}_${cfg.appID}.bin`)
//         };
//
//         let time = {
//             local: 0,
//             steam: 0
//         };
//
//         let local = await ffs.promises.stats(cache.local);
//         if (Object.keys(local).length > 0) {
//             time.local = moment(local.mtime).valueOf();
//         }
//
//         let steamStats = await ffs.promises.stats(cache.steam);
//         if (Object.keys(steamStats).length > 0) {
//             time.steam = moment(steamStats.mtime).valueOf();
//         } else {
//             throw 'No Steam cache file found';
//         }
//
//         if (time.steam > time.local) {
//             if (cfg.key) {
//                 result = await getSteamUserStats(cfg);
//             } else {
//                 result = await getSteamUserStatsFromSRV(cfg.user.id, cfg.appID);
//             }
//             ffs.promises.writeFile(cache.local, JSON.stringify(result, null, 2)).catch((err) => {
//             });
//
//         } else {
//             result = JSON.parse(await ffs.promises.readFile(cache.local));
//         }
//
//         return result;
//
//     } catch (err) {
//         throw 'Could not load Steam User Stats.';
//     }
//
// }



// private async getSteamPath() {
//     /*
//       Some SteamEmu change HKCU/Software/Valve/Steam/SteamPath to the game's dir
//       Fallback to Software/WOW6432Node/Valve/Steam/InstallPath in this case
//       NB: Steam client correct the key on startup
//     */
//
//     const regHives = [
//         {root: 'HKCU', key: 'Software/Valve/Steam', name: 'SteamPath'},
//         {root: 'HKLM', key: 'Software/WOW6432Node/Valve/Steam', name: 'InstallPath'}
//     ];
//
//     let steamPath;
//
//     for (let regHive of regHives) {
//
//         steamPath = await regedit.promises.RegQueryStringValue(regHive.root, regHive.key, regHive.name);
//         if (steamPath) {
//             if (await ffs.promises.exists(path.join(steamPath, 'steam.exe'))) {
//                 break;
//             }
//         }
//     }
//
//     if (!steamPath) {
//         throw 'Steam Path not found';
//     }
//     return steamPath;
// }
//
// private async getSteamUsers(steamPath: string): Promise<SteamUser[]> {
//     let steamUsers: SteamUser[] = [];
//
//     let users = await regedit.promises.RegListAllSubkeys('HKCU', 'Software/Valve/Steam/Users');
//     if (!users) {
//         users = await glob('*([0-9])', {
//             cwd: path.join(steamPath, 'userdata'),
//             onlyDirectories: true,
//             absolute: false
//         });
//     }
//
//     if (users.length == 0) {
//         throw 'No Steam User ID found';
//     }
//     for (let user of users) {
//         let id = steamID.to64(user);
//         let data = await steamID.whoIs(id);
//
//         if (data.privacyState === 'public') {
//             console.log(`${user} - ${id} (${data.steamID}) is public`);
//             steamUsers.push({
//                 user: user,
//                 id: id,
//                 name: data.steamID
//             });
//         } else {
//             console.log(`${user} - ${id} (${data.steamID}) is not public`);
//         }
//     }
//
//     if (steamUsers.length > 0) {
//         return steamUsers;
//     } else {
//         throw 'Public profile: none.';
//     }
// }
//
// getSteamUserStatsFromSRV(user, appID) {
//
//     const url = `https://api.xan105.com/steam/user/${user}/stats/${appID}`;
//
//     return new Promise((resolve, reject) => {
//
//         request.getJson(url).then((data) => {
//
//             if (data.error) {
//                 return reject(data.error);
//             } else if (data.data) {
//                 return resolve(data.data);
//             } else {
//                 return reject('Unexpected Error');
//             }
//
//         }).catch((err) => {
//             return reject(err);
//         });
//
//     });
// }
//
// async getSteamUserStats(cfg) {
//
//     const url = `http://api.steampowered.com/SteamUserStats/GetPlayerAchievements/v0001/?appid=${cfg.appID}&key=${cfg.key}&steamid=${cfg.user.id}"`;
//
//     try {
//
//         let result = await request.getJson(url);
//         return result.playerstats.achievements;
//
//     } catch (err) {
//         throw err;
//     }
//
// };
//

//