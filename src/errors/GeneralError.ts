export class GeneralError extends Error {
  code: number;

  status: string;

  constructor(code: number, status: string, message: string) {
    super(message);
    this.code = code;
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }

  getCode() {
    return this.code;
  }

  toJSON() {
    return {
      code: this.code,
      status: this.status,
      message: this.message,
    };
  }
}
