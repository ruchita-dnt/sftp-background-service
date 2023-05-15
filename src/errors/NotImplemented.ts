import { GeneralError } from './GeneralError';

export class NotImplemented extends GeneralError {
    constructor(message: string) {
        super(501, 'Not Implemented', message);
        Error.captureStackTrace(this, this.constructor);
    }
}
