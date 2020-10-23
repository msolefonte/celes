class InvalidApiVersionError extends Error {
    constructor(expected: string, found: string) {
        super('API version not valid. Expected ' + expected + ', found ' + found);
    }
}

class FileNotFoundError extends Error {
    constructor(filePath: string) {
        super('File ' + filePath + ' not found');
    }
}

class PlatformNotAvailableError extends Error {
    constructor(platform: string) {
        super('Platform not available: ' + platform);
    }
}

class SteamGameCacheNotFound extends Error {
    constructor(appId: string) {
        super('Steam not found for game ' + appId);
    }
}

class SteamNotFoundError extends Error {
    constructor() {
        super('Steam path not found. Is it installed?');
    }
}

class SteamPublicUsersNotFoundError extends Error {
    constructor() {
        super('No Steam users were found. Are their profiles public?');
    }
}

class WrongSourceDetectedError extends Error {
    constructor() {
        super('Wrong source detected');
    }
}

export {
    InvalidApiVersionError,
    FileNotFoundError,
    PlatformNotAvailableError,
    SteamGameCacheNotFound,
    SteamNotFoundError,
    SteamPublicUsersNotFoundError,
    WrongSourceDetectedError
}