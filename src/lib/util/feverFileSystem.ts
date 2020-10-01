// TODO OR USE https://github.com/xan105/node-fs

"use strict";
//
// const crypto = require('crypto');
const fs = require('fs');
const mkdirp = require('mkdirp');
const moment = require('moment');
const path = require('path');
// const rimraf = require('rimraf');
//
const ffs: any = {
  sync: {},
  promises: {}
};
//
// ffs.promises.mkdir = function (dirPath: String, options= {}) {
//   return new Promise((resolve,reject) => {
//       mkdirp(dirPath, options, function (err: Error) {
//             if (err) {
//               return reject(err);
//             } else {
//               return resolve();
//             }
//       });
//   });
// }
//
// ffs.sync.mkdir = function (dirPath: String, options={}) {
//   return mkdirp.sync(dirPath, options);
// }
//
// ffs.promises.rmdir = function (dirPath: String, options={}) {
//   return new Promise((resolve,reject) => {
//       rimraf(dirPath, options, function (err) {
//             if (err) {
//               return reject(err);
//             } else {
//               return resolve();
//             }
//       });
//   });
// }
//
// ffs.sync.rmdir = function (dirPath: String, options={}) {
//   return rimraf.sync(dirPath, options);
// }
//
// ffs.promises.hashFile = function(filePath: String, algorithm="sha1"){
//
//   let sum = crypto.createHash(algorithm);
//   let stream = fs.createReadStream(filePath);
//
//   return new Promise((resolve, reject) => {
//       stream
//         .on('error', (error) => {
//           return reject(error);
//         })
//         .on('data', (chunk) => {
//           try
//           {
//               sum.update(chunk);
//           } catch (error) {
//               return reject(error);
//           }
//         })
//         .on('end', () => {
//           return resolve(sum.digest('hex'));
//         });
//   });
//
// }
//
// ffs.sync.hashFile = function(filePath: String, algorithm="sha1"){
//   let sum = crypto.createHash(algorithm);
//   sum.update(fs.readFileSync(filePath));
//   return sum.digest('hex');
// }
//
// TODO PFF FIXME HARD
ffs.promises.existsAndIsYoungerThan = function (path: String, option: any = {}) {

   let options = {
    timeUnit: option.timeUnit || 'days',
    time: option.time || 7,
    isDir : option.isDir || false
   }

   return new Promise((resolve, reject) => {
      fs.stat(path, function(err: any, stats: any) {
          if (err) {
            return resolve(false);
          } else {
            let exists = (options.isDir) ? stats.isDirectory() : stats.isFile();

            if (exists) {
              try{
                return resolve(moment().diff(moment(stats.mtime),options.timeUnit) <= options.time);
              } catch(err) {
                return reject(err);
              }
            } else {
              return resolve(false);
            }
          }
      });
   });
}
//
// ffs.sync.existsAndIsYoungerThan = function (path: String, option = {}) {
//
//    let options = {
//     timeUnit: option.timeUnit || 'days',
//     time: option.time || 7,
//     isDir : option.isDir || false
//    }
//
//   try {
//     let stats = fs.statSync(path);
//     let exists = (options.isDir) ? stats.isDirectory() : stats.isFile();
//     if (exists) {
//         try{
//             return moment().diff(moment(stats.mtime),options.timeUnit) <= options.time;
//         } catch(err) {
//            throw err;
//         }
//     } else {
//       return false;
//     }
//   }catch(err) {
//     return false;
//   }
// }
//
// ffs.promises.exists = function (path, isDir=false) {
//    return new Promise((resolve) => {
//       fs.stat(path, function(err,stats) {
//           if (err) {
//             return resolve(false);
//           } else {
//             let result = (isDir) ? stats.isDirectory() : stats.isFile();
//             return resolve(result);
//           }
//       });
//    });
// }
//
// ffs.sync.exists = function (path, isDir=false) {
//   try {
//     let stats = fs.statSync(path);
//     let result = (isDir) ? stats.isDirectory() : stats.isFile();
//     return result;
//   }catch(err) {
//     return false;
//   }
// }
//
// ffs.promises.stats = function (path) {
//    return new Promise((resolve) => {
//       fs.stat(path, function(err,stats) {
//           if (err) {
//             return resolve({});
//           } else {
//             return resolve(stats);
//           }
//       });
//    });
// }
//
// ffs.sync.stats = function (path) {
//   try {
//     let stats = fs.statSync(path);
//     return stats;
//   }catch(err) {
//     return {};
//   }
// }
//
// ffs.promises.mv = function (oldPath, newPath) {
//   return new Promise((resolve, reject) => {
//      mkdirp(path.parse(newPath).dir, function (err) {
//             if (err) {
//               return reject(err);
//             } else {
//               fs.rename(oldPath, newPath, function(err){
//                     if (err) {
//                         fs.copyFile(oldPath, newPath, function(err) {
//                             if (err) {
//                               return reject(err);
//                             } else {
//                                 fs.unlink(oldPath, function(err) {
//                                   return resolve(newPath);
//                                 });
//                             }
//                         });
//                     } else {
//                       return resolve(newPath);
//                     }
//               });
//          }
//      });
//   })
// }
//
// ffs.sync.mv = function (oldPath, newPath) {
//   mkdirp.sync(newPath);
//   try {
//     fs.renameSync(oldPath, newPath);
//     return newPath;
//   } catch(e) {
//     fs.copyFileSync(oldPath, newPath);
//     try {
//       fs.unlinkSync(oldPath);
//     }catch(e){}
//     return newPath;
//   }
// }
//
// ffs.promises.writeFile = function(filePath, data, options) {
//   return new Promise((resolve,reject) => {
//       mkdirp(path.parse(filePath).dir, function (err) {
//           if (err) {
//             return reject(err);
//           } else {
//               fs.writeFile(filePath, data, options, function (err) {
//                   if (err) {
//                     return reject(err);
//                   } else {
//                     return resolve(filePath);
//                   }
//               });
//          }
//       });
//   });
// }
//
ffs.sync.writeFile = function(filePath: string, data: any, options: any) {
    mkdirp.sync(path.parse(filePath).dir);
    fs.writeFileSync(filePath, data, options);
    return filePath;
}
//
// ffs.promises.copyFile = function(src, dest, flags) {
//   return new Promise((resolve,reject) => {
//       mkdirp(path.parse(dest).dir, function (err) {
//           if (err) {
//             return reject(err);
//           } else {
//               fs.copyFile(src, dest, flags, function (err) {
//                   if (err) {
//                     return reject(err);
//                   } else {
//                     return resolve();
//                   }
//               })
//          }
//       })
//   })
// }
//
// ffs.sync.copyFile = function(src, dest, flags) {
//     mkdirp.sync(path.parse(dest).dir);
//     fs.copyFileSync(src, dest, flags);
// }

ffs.promises.readFile = function(filePath: string, options: any) {
  return new Promise((resolve,reject) => {
     fs.readFile(filePath, options, function (err: any ,data: any) {
           if (err) {
               return reject(err);
           } else {
              return resolve(data);
          }
     });
  });
}

// ffs.sync.readFile = fs.readFileSync;
//
// ffs.promises.unlink = ffs.promises.rm = function(filePath) {
//   return new Promise((resolve) => {
//      fs.unlink(filePath, function (err) { return resolve() });
//   });
// }
//
// ffs.sync.unlink = ffs.sync.rm = function(filePath) {
//    try {
//     fs.unlinkSync(filePath);
//    }catch(e){}
// }
export { ffs };