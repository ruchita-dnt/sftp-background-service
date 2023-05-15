import { GeneralError } from './GeneralError';

export class Forbidden extends GeneralError {
    constructor(message: string) {
        super(403, 'Forbidden', message);
        Error.captureStackTrace(this, this.constructor);
    }
}
