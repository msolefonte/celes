[![NPM version](https://badge.fury.io/js/%40achievement-watcher%2Fceles.svg)](https://www.npmjs.com/package/@achievement-watcher/celes)
[![NodeJS CI Actions Status](https://img.shields.io/github/workflow/status/achievement-watcher/celes/nodejs-ci)](https://github.com/achievement-watcher/celes/actions)
[![Codecov](https://codecov.io/gh/achievement-watcher/celes/branch/master/graph/badge.svg)](https://codecov.io/gh/achievement-watcher/celes)
[![Maintainability](https://api.codeclimate.com/v1/badges/8e48291929dd5190e908/maintainability)](https://codeclimate.com/github/achievement-watcher/celes/maintainability)
[![License](https://img.shields.io/github/license/achievement-watcher/celes)](https://github.com/achievement-watcher/celes/blob/master/LICENSE)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](https://github.com/achievement-watcher/celes/blob/master/CONTRIBUTING.md)

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
multiple sources. It includes multiples funcionalities like detecting games, loading schemas and generating a list of
unlocked achievements, together with import and export features. It also has a built-in database, which allows it to 
store local caches than can also be used by other tools of the 
[Achievement Watcher](https://www.github.com/achievement-watcher/) project. 

To see the list of compatible sources and platforms, refer to 
[COMPATIBILITY](https://github.com/achievement-watcher/celes/blob/master/docs/COMPATIBILTY.md).

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

Celes is the main class exported and the one that has to be used principaly. If can be widely configured as presented
below:

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
    of the files stored under (src/lib/plugins)[src/lib/plugins]. By deafault, all of them are enabled.
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
[src/lib/Celes.ts](https://github.com/achievement-watcher/celes/blob/master/src/lib/Celes.ts) file. In the case of the 
NPM package, the detailed explanation should be instead at 
[dist/lib/Celes.d.ts](https://github.com/achievement-watcher/celes/blob/master/dist/lib/Celes.d.ts).

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

Contributions are welcome. See [CONTRIBUTING](https://github.com/achievement-watcher/celes/blob/master/CONTRIBUTING.md) 
for more information.

## License

Distributed under the GPL-3.0 License. See [LICENSE](https://github.com/achievement-watcher/celes/blob/master/LICENSE) 
for more information.

## Legal Aspects

For legal aspects, see [legal](https://github.com/achievement-watcher/legal).
