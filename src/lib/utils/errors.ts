export class InvalidApiVersionError extends Error {
    constructor(expected: string, found: string) {
        super('API version not valid. Expected ' + expected + ', found ' + found);
    }
}

export class FileNotFoundError extends Error {
    constructor(filePath: string) {
        super('File ' + filePath + ' not found');
    }
}

export class PlatformNotAvailableError extends Error {
    constructor(platform: string) {
        super('Platform not available: ' + platform);
    }
}

export class SteamGameCacheNotFound extends Error {
    constructor(appId: string) {
        super('Steam not found for game ' + appId);
    }
}

export class SteamNotFoundError extends Error {
    constructor() {
        super('Steam path not found. Is it installed?');
    }
}

export class SteamPublicUsersNotFoundError extends Error {
    constructor() {
        super('No Steam users were found. Are their profiles public?');
    }
}

export class UnexpectedFileContentError extends Error {
    constructor() {
        super('Unexpected file content');
    }
}

export class WrongSourceDetectedError extends Error {
    constructor() {
        super('Wrong source detected');
    }
}