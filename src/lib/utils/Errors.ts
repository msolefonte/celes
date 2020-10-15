class InvalidApiVersionError extends Error {
    constructor(expected: string, found: string) {
        super('API version not valid. Expected ' + expected + ', found ' + found + '.')
    }
}

class FileNotFoundError extends Error {
    constructor(filePath: string) {
        super('File ' + filePath + ' not found.');
    }
}

class WrongSourceDetectedError extends Error {
    constructor() {
        super('Wrong source detected.')
    }
}

export {
    InvalidApiVersionError,
    FileNotFoundError,
    WrongSourceDetectedError
}