import { GeneralError } from './GeneralError';

export class BadRequest extends GeneralError {
    errors?: Record<string, unknown>;

    constructor(message: string, errors?: Record<string, unknown>) {
        super(400, 'Bad Request', message);
        this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            code: this.code,
            status: this.status,
            message: this.message,
            errors: this.errors,
        };
    }
}
