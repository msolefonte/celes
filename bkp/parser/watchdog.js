"use strict";

const path = require("path");
const glob = require("fast-glob");
const ffs = require("../util/feverFS.js");

const cacheRoot = path.join(process.env['APPDATA'], "Achievement Watcher");
const cache = path.join(cacheRoot, "steam_cache/data");

module.exports.scan = async () => {
  try{
    let data = [];
    
      for (let file of await glob("([0-9])+.db",{cwd: cache, onlyFiles: true, absolute: false})){
        
        data.push({ 
                    appid: file.replace(".db",""),
                    source: "Achievement Watcher : Watchdog", 
                    data: {
                      type: "cached"
                    }
                });
      
      }
      
      return data;
    
  }catch(err){
    throw err;
  }
}

module.exports.getAchievements = async (appID) => {
  try{
    return JSON.parse(await ffs.promises.readFile(path.join(cache,`${appID}.db`),"utf8"));
  }catch(err){
    throw err;
  }
}