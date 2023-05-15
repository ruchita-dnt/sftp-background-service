import { GeneralError } from './GeneralError';

export class NotFound extends GeneralError {
    constructor(message: string) {
        super(404, 'Not Found', message);
        Error.captureStackTrace(this, this.constructor);
    }
}
