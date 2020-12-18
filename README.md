[![NPM version](https://badge.fury.io/js/%40achievement-watcher%2Fceles.svg)](https://www.npmjs.com/package/@achievement-watcher/celes)
[![NodeJS CI Actions Status](https://img.shields.io/github/workflow/status/msolefonte/celes/nodejs-ci)](https://github.com/msolefonte/celes/actions)
[![Codecov](https://codecov.io/gh/msolefonte/celes/branch/master/graph/badge.svg)](https://codecov.io/gh/msolefonte/celes)
[![Maintainability](https://api.codeclimate.com/v1/badges/8e48291929dd5190e908/maintainability)](https://codeclimate.com/github/msolefonte/celes/maintainability)
[![License](https://img.shields.io/github/license/msolefonte/celes)](https://github.com/msolefonte/celes/blob/master/LICENSE)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](https://github.com/msolefonte/celes/blob/master/CONTRIBUTING.md)

# Celes

Celes is an Open Source file and registry scraper that obtains and stores game achievements, whatever the origin. 

## Table of Contents

* [About the Project](#about-the-project)
  * [Built With](#built-with)
* [Getting Started](#getting-started)
  * [Installation](#installation)
* [Usage](#usage)
* [Contributing](#contributing)
* [License](#license)
* [Legal Aspects](#legal-aspects)

## About the project

Celes is a Typescript library that allows other tools to scrap files and registries to obtain user achievements from
multiple sources. It includes multiples functionalities like detecting games, loading schemas and generating a list of
unlocked achievements, together with import and export features. It also has a built-in database, which allows it to 
store local caches than can also be used by other tools.
 
Initially part of the *Achievement Watcher* project, now it has been released as an independent tool due to the 
organization being closed. The repository is going to be keep as an Open Source archive to facilitate and guide
future developments in the same field.

To see the list of compatible sources and platforms, refer to 
[COMPATIBILITY](https://github.com/msolefonte/celes/blob/master/docs/COMPATIBILTY.md).

### Built with

* [Typescript](https://www.typescriptlang.org/)

## Getting Started

### Prerequisites

You need NPM to install Celes. If you don't have it, you can download it at 
[https://www.npmjs.com/](https://www.npmjs.com/).

### Installation

Celes is available at NPM, so you can install it directly from there:

```
npm install --save @achievement-watcher/celes
```

## Usage

### API

#### Import

```typescript
import {Celes} from '@achievement-watcher/celes'
```

#### The Celes Object

Celes is the main class exported and the one that has to be used in the majority of cases. If can be widely configured 
as presented below:

```typescript
class Celes {
    constructor(
        achievementWatcherRootPath: string, 
        additionalFoldersToScan?: string[], 
        enabledPlugins?: string[], 
        steamPluginMode?: 0 | 1 | 2, 
        systemLanguage?: string, 
        useOldestUnlockTime?: boolean
    ) {}
}
```

##### Constructor parameters explanation

* *achievementWatcherRootPath:* __string__: Root path of the data folder of the Achievement Watcher project. It should
    be created in the installation of Achievement Watcher and, usually, it defaults to `%APPDATA%/Achievement Watcher`.
    Inside of it, caches and schemas and user stats are stored.
* *additionalFoldersToScan?:* __string[]__: List of folders defined by the user to scan. Used by some plugins to try
    to scrap achievement data from there.
* *enabledPlugins?:* __string[]__: List of plugin names that have to be used. The plugin names are defined by the name
    of the files stored under (src/lib/plugins)[src/lib/plugins]. By default, all of them are enabled.
* *steamPluginMode?:* __0 | 1 | 2__: Work mode of the Steam plugin:
    * __0__ -> Disabled. 
    * __1__ -> Enabled. Only Installed games are shown.
    * __2__ -> Enabled. All games are shown.
* *systemLanguage?:* __string__: User defined language. Defaults to english.
* *useOldestUnlockTime?:* __boolean__: Method to be used when merging same achievements from different sources. By
  default, oldest unlock time is used, which means that, under collision, the unlock time stored is the most ancient 
  one.
  
#### Celes API

This is the list of public methods available at Celes. An always-updated explanation can be found inside of the 
[src/lib/Celes.ts](https://github.com/msolefonte/celes/blob/master/src/lib/Celes.ts) file. In the case of the 
NPM package, the detailed explanation should be instead at 
[dist/lib/Celes.d.ts](https://github.com/msolefonte/celes/blob/master/dist/lib/Celes.d.ts).

##### Pull

```
async pull(callbackProgress?: (progress: number) => void): Promise<ScrapResult> {};
```

##### Load

```
async load(callbackProgress?: (progress: number) => void): Promise<GameData[]> {};
``` 

##### Export

```
async export(filePath: string): Promise<void> {};
```

##### Import

```
async import(filePath: string, force?: boolean): Promise<GameData[]> {};
```   

##### Add Game

```
async addGame(appId: string, platform: Platform): Promise<void> {};
```    

##### Remove manually added Game

```
async removeManuallAddedGame(appId: string, platform: Platform): Promise<void> {};
```    

##### Unlock Achievement

```
async unlockAchievement(appId: string, platform: Platform, achievementId: string, unlockTime = 0): Promise<void> {};
```    

##### Remove Manually Unlocked Achievement

```
async removeManuallyUnlockedAchievement(appId: string, platform: Platform, achievementId: string): Promise<void> {};
```  

##### Set Achievement Unlock Time

```
async setAchievementUnlockTime(appId: string, source: Source, platform: Platform, achievementId: string, 
                               unlockTime: number): Promise<void> {};
```

##### Add Game Playtime

```
async addGamePlaytime(appId: string, platform: Platform, playtime: number, 
                      force?: boolean): Promise<void> {};
```

## Contributing

Contributions are welcome. See [CONTRIBUTING](https://github.com/msolefonte/celes/blob/master/CONTRIBUTING.md) 
for more information.

## License

Distributed under the GPL-3.0 License. See [LICENSE](https://github.com/msolefonte/celes/blob/master/LICENSE) 
for more information.

## Legal Aspects

Celes is a technology able to connect and scrap achievements from both legal and non-legal sources. These sources,
in the second cases, are related to games installed locally using cracks, emulators or any other technologies that
may be related to cases of intellectual property being robbed or damaged. In any case, while this is a technical
possibility, we do not enforce or support these practises and do not want to be associated with them. 

As a matter of fact, any issue related to piracy is going to be removed and no support is going to be given in relation
to obtaining games or roms from non-legal sources. Following this, any user is responsible of the content placed in its
own issues, commentaries, code, pull requests or other additions.

Finally, in relation to the Achievement Watcher project. This component has been separated from it and there is no
association between both. Any legal issue related to this project should not be reflected there and vice verse.
