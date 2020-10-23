[![Node version](https://img.shields.io/node/v/celes.svg)](http://nodejs.org/download/)
[![NodeJS CI Actions Status](https://img.shields.io/github/workflow/status/achievement-watcher/celes/nodejs-ci)](https://github.com/achievement-watcher/celes/workflows/nodejs-ci/action)
[![Codecov](https://codecov.io/gh/achievement-watcher/celes/branch/master/graph/badge.svg)](https://codecov.io/gh/achievement-watcher/celes)
[![Maintainability](https://api.codeclimate.com/v1/badges/8e48291929dd5190e908/maintainability)](https://codeclimate.com/github/achievement-watcher/celes/maintainability)
[![License](https://img.shields.io/github/license/achievement-watcher/celes)](LICENSE)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/dwyl/esta/issues)

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

To see the list of compatible sources and platforms, refer to [COMPATIBILITY](docs/COMPATIBILTY.md).

### Built with

* [Typescript](https://www.typescriptlang.org/)

## Getting Started

### Prerequisites

You need NPM to install Celes. If you don't have it, you can download it at 
[https://www.npmjs.com/](https://www.npmjs.com/).

### Installation

Celes is available at NPM, so you can install it directly from there:

```
npm install celes --save
```

## Usage

### API

TBD

## Contributing

Contributions are welcome. See [CONTRIBUTING](CONTRIBUTING.md) for more information.

## License

Distributed under the GPL-3.0 License. See [LICENSE](LICENSE) for more information.

## Legal Aspects

For legal aspects, see [legal](https://github.com/achievement-watcher/legal).