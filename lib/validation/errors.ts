export type ValidationErrorCode =
  | "EMPTY_VALUE"
  | "INVALID_GITHUB_URL"
  | "UNSUPPORTED_GIT_PROVIDER"
  | "INVALID_COMMIT_SHA"
  | "INVALID_DEPLOYMENT_URL"
  | "PRIVATE_DEPLOYMENT_HOST"
  | "INVALID_MILESTONE";

export class InputValidationError extends Error {
  constructor(
    public readonly code: ValidationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "InputValidationError";
  }
}

