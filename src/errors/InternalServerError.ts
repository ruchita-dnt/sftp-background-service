import { GeneralError } from './GeneralError';

export class InternalServerError extends GeneralError {
    constructor(message: string) {
        super(500, 'Internal Server Error', message);
        Error.captureStackTrace(this, this.constructor);
    }
}
