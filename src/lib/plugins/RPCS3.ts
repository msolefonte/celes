// 'use strict';
//
// import * as path from 'path';
// import {
//     Ali213AchievementData,
//     Ali213AchievementList, GameSchema, Platform, ScanResult,
//     Source,
//     UnlockedOrInProgressAchievement
// } from '../../types';
// import {existsSync, promises as fs} from 'fs';
// import {AchievementsScraper} from './utils/AchievementsScraper';
// import glob from 'fast-glob';
//
// class RPCS3 implements AchievementsScraper {
//     private readonly binary: string = 'rpcs3.exe';
//     private readonly platform: Platform = 'PS3';
//     private readonly source: Source = 'RPCS3';
//     private readonly magic = {
//         header: Buffer.from('818F54AD','hex'),
//         delimiter: [Buffer.from('0400000050','hex'), Buffer.from('0600000060','hex')]
//     };
//     private readonly schemaFileName: string = 'TROPCONF.SFM';
//     private readonly userDataFileName: string = 'TROPUSR.DAT';
//     private readonly achievementWatcherRootPath: string;
//
//     constructor(achievementWatcherRootPath: string) {
//         this.achievementWatcherRootPath = achievementWatcherRootPath;
//     }
//
//     getPlatform(): Platform {
//         return this.platform;
//     }
//
//     getSource(): Source {
//         return this.source;
//     }
//
//     async getUnlockedOrInProgressAchievements(game: ScanResult): Promise<UnlockedOrInProgressAchievement[]> {
//         return []
//     }
//
//     async scan(additionalFoldersToScan: string[]): Promise<ScanResult[]> {
//         const scanResult: ScanResult[] = [];
//
//         for (const folder of additionalFoldersToScan) {
//             if (await existsSync(path.join(folder, this.binary))) {
//                 const users: string[] = await glob('([0-9])+', {
//                     cwd: path.join(folder, 'dev_hdd0/home'),
//                     onlyDirectories: true,
//                     absolute: false
//                 });
//
//                 for (const user of users) {
//                     try {
//                         const games = await glob('*', {
//                             cwd: path.join(folder, 'dev_hdd0/home', user, 'trophy'),
//                             onlyDirectories: true,
//                             absolute: false
//                         });
//
//                         for (const game of games) {
//                             try {
//                                 scanResult.push({
//                                     appId: path.join(folder, 'dev_hdd0/home', user, 'trophy', game),
//                                     platform: this.platform,
//                                     source: this.source,
//                                     data: {}
//                                 });
//                             } catch (err) {
//                                 //Do nothing => try with next game
//                                 console.log('log1');
//                             }
//                         }
//                     } catch (err) {
//                         //Do nothing => try with next user
//                         console.log('log2');
//                     }
//                 }
//             }
//         }
//
//         return scanResult;
//     }
//
//     async getGameSchema(appId: string): Promise<GameSchema> {
//         const file = await fs.readFile(path.join(appId, this.schemaFileName),'utf-8');
//         const schema = await util.promisify(xml2js.parseString)(file,{explicitArray: false, explicitRoot: false, ignoreAttrs: false, emptyTag: null});
//
//         const result = {
//             name : schema['title-name'],
//             appid : schema.npcommid,
//             system: 'playstation',
//             img: {
//                 header: 'file:///'+path.join(appId, 'ICON0.PNG').replace(/\\/g,'/')
//             },
//             achievement: {
//                 total : schema.trophy.length,
//                 list : schema.trophy.map((trophy) => {
//                     return {
//                         name: parseInt(trophy['$'].id),
//                         hidden: (trophy['$'].hidden === 'yes') ? 1 : 0,
//                         type: trophy['$'].ttype,
//                         displayName: trophy.name,
//                         description: trophy.detail,
//                         icon:'file:///'+path.join(appId, `TROP${trophy['$'].id}.png`).replace(/\\/g,'/'),
//                         icongray:'file:///'+path.join(appId, `TROP${trophy['$'].id}.png`).replace(/\\/g,'/')
//                     }
//                 })
//             }
//         };
//
//         return result;
//     }
// }
//
// export {RPCS3};
//
// // "use strict";
// //
// // const path = require('path');
// // const util = require('util');
// // const xml2js = require('xml2js');
// // const glob = require("fast-glob");
// // const ffs = require("@xan105/fs");
// //
// // const magic = {
// //     header : Buffer.from('818F54AD','hex'),
// //     delimiter : [ Buffer.from('0400000050','hex'), Buffer.from('0600000060','hex') ]
// // };
// //
// // const files = {
// //     schema: "TROPCONF.SFM",
// //     userData: "TROPUSR.DAT"
// // };
//
// // module.exports.getGameData = async (dir) => {
// //     try {
// //
// //         let file = await ffs.readFile(path.join(dir,files.schema),"utf-8");
// //         let schema = await util.promisify(xml2js.parseString)(file,{explicitArray: false, explicitRoot: false, ignoreAttrs: false, emptyTag: null});
// //
// //         let result = {
// //             name : schema['title-name'],
// //             appid : schema.npcommid,
// //             system: "playstation",
// //             img: {
// //                 header: "file:///"+path.join(dir,"ICON0.PNG").replace(/\\/g,"/")
// //             },
// //             achievement: {
// //                 total : schema.trophy.length,
// //                 list : schema.trophy.map((trophy) => {
// //                     return {
// //                         name: parseInt(trophy['$'].id),
// //                         hidden: (trophy['$'].hidden === "yes") ? 1 : 0,
// //                         type: trophy['$'].ttype,
// //                         displayName: trophy.name,
// //                         description: trophy.detail,
// //                         icon:"file:///"+path.join(dir,`TROP${trophy['$'].id}.png`).replace(/\\/g,"/"),
// //                         icongray:"file:///"+path.join(dir,`TROP${trophy['$'].id}.png`).replace(/\\/g,"/")
// //                     }
// //                 })
// //             }
// //         };
// //
// //         return result;
// //
// //     }catch(err){
// //         throw err;
// //     }
// // }
// //
// // module.exports.getAchievements = async (dir,length) => {
// //     try {
// //
// //         let result = [];
// //
// //         let file = await ffs.readFile(path.join(dir,files.userData));
// //
// //         if (!file.toString('hex').startsWith(magic.header.toString('hex'))) throw `Unexpected ${files.userData} file format`
// //
// //         let headerEndPos = indexOf(file.toString('hex'),magic.delimiter[0].toString('hex'),2) + magic.delimiter[0].toString('hex').length;
// //         let separator = new RegExp(magic.delimiter[0].toString('hex') + "|" + magic.delimiter[1].toString('hex') , "g");
// //
// //         let trimmed = file.toString('hex').slice(headerEndPos);
// //         let data = trimmed.split(separator);
// //
// //         if(data.length !== length*2) throw `Unexpected number of achievements in ${files.userData}`;
// //
// //         for (let i=0;i<=length-1;i++) {
// //             try {
// //
// //                 let timestamp = data[i].slice(32,40);
// //
// //                 result.push({
// //                     id : parseInt(data[i].slice(6,8),16),
// //                     UnlockTime : (timestamp == "ffffffff") ? 0 : parseInt(timestamp,16),
// //                     Achieved : (data[i+length].slice(30,32) === "01") ? true : false
// //                 });
// //             }catch(err){
// //                 //Do nothing -> try to parse the next one
// //             }
// //         }
// //
// //         return result;
// //
// //     }catch(err){
// //         throw err;
// //     }
// // }
// //
// // function indexOf(str, pattern, n) {
// //     var i = -1;
// //
// //     while (n-- && i++ < str.length) {
// //         i = str.indexOf(pattern, i);
// //         if (i < 0) break;
// //     }
// //
// //     return i;
// // }