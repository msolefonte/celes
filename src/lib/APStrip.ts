    // async makeList(option: any, callbackProgress: Function = () => {}): Promise<any> {
    //         let result: any = [];
    //
    //         let appIdList = await discover(option.achievement_source);
    //
    //         if (appIdList.length > 0) {
    //             let count = 1;
    //
    //             for (let appid of appIdList) {
    //
    //                 let percent = Math.floor((count / appIdList.length) * 100);
    //
    //                 let game;
    //                 let isDuplicate = false;
    //
    //                 try {
    //
    //                     if (result.some(res => res.appid == appid.appid) && option.achievement.mergeDuplicate) {
    //                         game = result.find(elem => elem.appid == appid.appid);
    //                         isDuplicate = true;
    //                     // } else if (appid.data.type === 'rpcs3') {
    //                     //     game = await rpcs3.getGameData(appid.data.path);
    //                     // } else if (appid.data.type === 'uplay' || appid.data.type === 'lumaplay') {
    //                     //     game = await uplay.getGameData(appid.appid, option.achievement.lang);
    //                     } else {
    //                         game = await steam.getGameData({
    //                             appID: appid.appid,
    //                             lang: option.achievement.lang,
    //                             key: option.steam.apiKey
    //                         });
    //                     }
    //
    //                     if (!option.achievement.mergeDuplicate && appid.source) {
    //                         game.source = appid.source;
    //                     }
    //
    //                     let root = {};
    //                     try {
    //                         if (appid.data.type === 'file') {
    //
    //                             root = await steam.getAchievementsFromFile(appid.data.path);
    //                             //Note to self: Empty file should be considered as a 0% game -> do not throw an error just issue a warning
    //                             if (root.constructor === Object && Object.entries(root).length === 0) {
    //                                 console.log(`[${appid.appid}] Warning ! Achievement file in '${appid.data.path}' is probably empty`);
    //                             }
    //
    //                         // } else if (appid.data.type === 'reg') {
    //                         //
    //                         //     root = await greenluma.getAchievements(appid.data.root, appid.data.path);
    //
    //                         } else if (appid.data.type === 'steamAPI') {
    //
    //                             root = await steam.getAchievementsFromAPI({
    //                                 appID: appid.appid,
    //                                 user: appid.data.userID,
    //                                 path: appid.data.cachePath,
    //                                 key: option.steam.apiKey
    //                             });
    //
    //                         // } else if (appid.data.type === 'rpcs3') {
    //                         //
    //                         //     root = await rpcs3.getAchievements(appid.data.path, game.achievement.total);
    //                         //
    //                         // } else if (appid.data.type === 'lumaplay') {
    //                         //
    //                         //     root = uplay.getAchievementsFromLumaPlay(appid.data.root, appid.data.path);
    //
    //                         } else if (appid.data.type === 'cached') {
    //
    //                             root = await watchdog.getAchievements(appid.appid);
    //
    //                         } else {
    //
    //                             throw 'Not yet implemented';
    //
    //                         }
    //                     } catch (err) {
    //                         console.log(`[${appid.appid}] Error parsing local achievements data => ${err}`);
    //                     }
    //
    //                     for (let i in root) {
    //
    //                         try {
    //
    //                             let achievement = game.achievement.list.find((elem) => {
    //                                 if (root[i].crc) {
    //                                     return root[i].crc.includes(crc32(elem.name).toString(16)); //(SSE) crc module removes leading 0 when dealing with anything below 0x1000 -.-'
    //                                 } else {
    //                                     let apiname = root[i].id || root[i].apiname || root[i].name || i;
    //                                     return elem.name == apiname || elem.name.toString().toUpperCase() == apiname.toString().toUpperCase(); //uppercase == uppercase : cdx xcom chimera (apiname doesn't match case with steam schema)
    //                                 }
    //                             });
    //                             if (!achievement) {
    //                                 throw 'ACH_NOT_FOUND_IN_SCHEMA';
    //                             }
    //
    //                             let parsed = {
    //                                 Achieved: (root[i].Achieved == 1 || root[i].achieved == 1 || root[i].State == 1 || root[i].HaveAchieved == 1 || root[i].Unlocked == 1 || root[i].earned || root[i] == 1) ? true : false,
    //                                 CurProgress: root[i].CurProgress || 0,
    //                                 MaxProgress: root[i].MaxProgress || 0,
    //                                 UnlockTime: root[i].UnlockTime || root[i].unlocktime || root[i].HaveAchievedTime || root[i].HaveHaveAchievedTime || root[i].Time || root[i].earned_time || 0
    //                             };
    //
    //                             if (!parsed.Achieved && parsed.MaxProgress != 0 && parsed.CurProgress != 0 && parsed.MaxProgress == parsed.CurProgress) { //CODEX Gears5 (09/2019)  && Gears tactics (05/2020)
    //                                 parsed.Achieved = true;
    //                             }
    //
    //                             if (isDuplicate) {
    //                                 if (parsed.Achieved && !achievement.Achieved) {
    //                                     achievement.Achieved = true;
    //                                 }
    //
    //                                 if ((!achievement.CurProgress && parsed.CurProgress > 0) || (parsed.CurProgress > 0 && parsed.MaxProgress == achievement.MaxProgress && parsed.CurProgress > achievement.CurProgress)) {
    //                                     achievement.CurProgress = parsed.CurProgress;
    //                                 }
    //
    //                                 if (!achievement.MaxProgress && parsed.MaxProgress > 0) {
    //                                     achievement.MaxProgress = parsed.MaxProgress;
    //                                 }
    //
    //                                 if (option.achievement.timeMergeRecentFirst) {
    //                                     if ((!achievement.UnlockTime || achievement.UnlockTime == 0) || parsed.UnlockTime > achievement.UnlockTime) { //More recent first
    //                                         achievement.UnlockTime = parsed.UnlockTime;
    //                                     }
    //                                 } else {
    //                                     if ((!achievement.UnlockTime || achievement.UnlockTime == 0) || (parsed.UnlockTime > 0 && parsed.UnlockTime < achievement.UnlockTime)) { //Oldest first
    //                                         achievement.UnlockTime = parsed.UnlockTime;
    //                                     }
    //                                 }
    //                             } else {
    //                                 Object.assign(achievement, parsed);
    //                             }
    //
    //                         } catch (err) {
    //                             if (err === 'ACH_NOT_FOUND_IN_SCHEMA') {
    //                                 console.log(`[${appid.appid}] Achievement not found in game schema data ?! ... Achievement was probably deleted or renamed over time`);
    //                             } else {
    //                                 console.log(`[${appid.appid}] Unexpected Error: ${err}`);
    //                             }
    //                         }
    //                     }
    //
    //                     game.achievement.unlocked = game.achievement.list.filter(ach => ach.Achieved == 1).length;
    //                     if (!isDuplicate) {
    //                         result.push(game);
    //                     }
    //
    //                     //loop appid
    //                 } catch (err) {
    //                     console.log(`[${appid.appid}] Error parsing local achievements data => ${err} > SKIPPING`);
    //                 }
    //
    //                 callbackProgress(percent);
    //                 count = count + 1;
    //             }
    //
    //         }
    //
    //         return result;
    // }