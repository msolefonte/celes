# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 24/10/2020

- Initial commit

## [1.0.1] - 24/10/2020

- For testing purposes

## [1.0.2] - 24/10/2020

- For testing purposes

## [1.0.3] - 27/10/2020

- Update README.md to use absolute links
- Minor refactoring 
    - Turn classes with only static methods into collections of independent functions
    - Add mantainability
- Add tests
    - Merge collisions
        - Achievement progress
        - Achievement unlock time
        - Achievement unlock time (with useOldestUnlockTime flag set to false)

## [1.1.0] - 13/11/2020

- Remove fs-ext and reflect the new concurrency problem
- Fix a bug that happend when a database game with invalid values was loaded
- Add methods to the API of Celes
    - addGame()
    - removeManaullyAddedGame()
    - unlockAchievement()
    - removeManuallyUnlockedAchievement()
- Add tests for the new methods
- Minor fixes
