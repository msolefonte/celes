// "use strict";
//
//
// const path = require("path");
// const request = require('request-zero');
// const ffs = require("../util/feverFS.ts");
//
// const cacheRoot = path.join(process.env['APPDATA'], "Achievement Watcher");
// const file = path.join(cacheRoot, "cfg/exclusion.db");
//
// module.exports.get = async () => {
//
//   const url = "https://api.xan105.com/steam/getBogusList";
//
//   let exclude = [
//       480, //Space War
//       753, //Steam Config
//       250820, //SteamVR
//       228980 //Steamworks Common Redistributables
//   ];
//
//   try{
//       let srvExclusion = (await request.getJson(url)).data;
//       console.log("blacklist from srv:");
//       console.log(srvExclusion);
//       exclude = [...new Set([...exclude,...srvExclusion])];
//   }catch(err){
//       //Do nothing
//  }
//
//  try{
//       let userExclusion = JSON.parse(await ffs.promises.readFile(file,"utf8"));
//       exclude = [...new Set([...exclude,...userExclusion])];
//  }catch(err){
//       //Do nothing
//  }
//
//  return exclude;
//
// }
//
// module.exports.reset = async() => {
//   try{
//     await ffs.promises.writeFile(file,JSON.stringify([], null, 2),"utf8");
//   }catch(err){
//     throw err;
//   }
// }
//
// module.exports.add = async (appid) => {
//     try{
//
//         console.log(`Blacklisting ${appid} ...`);
//
//         let userExclusion;
//
//         try{
//           userExclusion = JSON.parse(await ffs.promises.readFile(file,"utf8"));
//         }catch(e){
//           userExclusion = [];
//         }
//
//         if (!userExclusion.includes(appid)) {
//           userExclusion.push(appid);
//           await ffs.promises.writeFile(file,JSON.stringify(userExclusion, null, 2),"utf8");
//           console.log("Done.");
//         } else {
//           console.log("Already blacklisted.");
//         }
//
//     }catch(err){
//         throw err;
//     }
// }