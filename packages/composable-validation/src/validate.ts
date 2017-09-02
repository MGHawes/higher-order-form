import { chain, flatMap, mapValues, pickBy, some } from 'lodash';

export type ValidationErrors = Array<string>;
export type Template<T> = {
  [P in keyof T]?: Validator<T[P]>
};

export interface Validator<T> {
  validate(item: T): ValidationErrors | ValidationResult<T>
}

export interface ValueValidator<T> extends Validator<T> {
  validate(item: T): ValidationErrors
}

export class ObjectValidator<T> implements Validator<T> {
  private template: Template<T>;

  constructor(temp: Template<T>) { this.template = temp }

  validate(object: T): ValidationResult<T> {
    return pickBy(
      mapValues(
        this.template,
        <K extends keyof T>(validator: Validator<T[K]>, key: K) => validator.validate(object[key]),
      ),
      (errors) => errors && errors.length > 0,
    )
  }
}

export type ValidationResult<T> = {
  [P in keyof T]?: ValidationErrors | ValidationResult<T[P]>
};

export const rules = <T>(...validators: Array<ValueValidator<T>>): ValueValidator<T> =>
  ({ validate: (value: T) => flatMap(validators, (validator) => validator.validate(value)) });

// ToDo fix validateKey
export const validateKey =
  <T, K extends keyof T>(objectValidator: Validator<T>, key: K, value: T[K]): ValidationErrors => {
    const validator: ValueValidator<T[K]> | undefined = objectValidator[key];
    return validator != null ? validator(value) : [];
  };


export const hasValidationErrors = <T>(result: ValidationResult<T>): boolean =>
  some(result as object, (validationErrors: ValidationErrors) => (validationErrors && validationErrors.length > 0));
