class ApiServerBlacklistedIdError extends Error {
    constructor(appId: string) {
        super('App ID ' + appId + ' is blacklisted');
    }
}

class ApiServerInternalError extends Error {
    constructor(url: string) {
        super('API Server internal error. Request url: ' + url);
    }
}

class ApiServerInvalidResponseError extends Error {
    constructor(url: string) {
        super('API Server Invalid Response. Request url: ' + url);
    }
}

class ApiServerRequestError extends Error {
    constructor(url: string) {
        super('Error trying to reach API Server. Request url: ' + url);
    }
}

class InvalidApiVersionError extends Error {
    constructor(expected: string, found: string) {
        super('API version not valid. Expected ' + expected + ', found ' + found + '.')
    }
}

class ApiServerUnsupportedLanguageError extends Error {
    constructor(language: string) {
        super('Language ' + language + ' is not available');
    }
}

class FileNotFoundError extends Error {
    constructor(filePath: string) {
        super('File ' + filePath + ' not found.');
    }
}

class WrongSourceError extends Error {
    constructor() {
        super('Wrong source detected.')
    }
}

export {
    ApiServerBlacklistedIdError,
    ApiServerInternalError,
    ApiServerInvalidResponseError,
    ApiServerRequestError,
    ApiServerUnsupportedLanguageError,
    InvalidApiVersionError,
    FileNotFoundError,
    WrongSourceError
}