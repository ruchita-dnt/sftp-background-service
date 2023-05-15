import { GeneralError } from './GeneralError';

export class Unauthorized extends GeneralError {
    constructor(message: string) {
        super(401, 'Unauthorized', message);
        Error.captureStackTrace(this, this.constructor);
    }
}
