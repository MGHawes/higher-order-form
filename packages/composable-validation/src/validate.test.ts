import { endsWith, flatten, startsWith } from 'lodash';
import { hasValidationErrors, rules, ObjectValidator, ValueValidator, Validator } from './validate';
import {} from 'jest';

export const maxLength = (max: number): ValueValidator<string | null> => ({
  validate: (value: string | null) =>
    (value != null && value.length > max) ? [`Text must be less than ${max} characters`] : []
});

export const minLength = (min: number): ValueValidator<string | null> => ({
  validate: (value: string | null) =>
    (value != null && value.length < min) ? [`Must be at least ${min} characters`] : []
});

describe('rules', () => {
  it('will return the result of all of the individual validators, combined into a single array', () => {
    const beginsWithA: ValueValidator<string> = ({
      validate: (someString: string) => startsWith(someString, 'a') ? ['starts with a'] : []
  });
    const finishesWithC: ValueValidator<string> = ({
      validate: (someString: string) => endsWith(someString, 'c') ? ['ends with c'] : []
  });
    const lengthValidator: ValueValidator<string>  = ({
      validate: (someString: string) => someString.length === 0 ? ['required'] : []
    });

    const combinedValidator: ValueValidator<string> = rules(
      beginsWithA,
      finishesWithC,
      lengthValidator,
    );

    const sampleInput = 'abc';
    const validationResult: Array<string> = combinedValidator.validate(sampleInput);

    expect(validationResult).toEqual(flatten([beginsWithA.validate(sampleInput), finishesWithC.validate(sampleInput)]));
  });
});

describe('validate', () => {
  it('returns an object with key value pairs for values which fail validation', () => {
    type MyObject = { name: string };
    const constraints: ObjectValidator<MyObject> = new ObjectValidator({ name: rules(minLength(5), maxLength(10)) });
    const validationResult = constraints.validate({ name: '' }).name;

    expect(validationResult && validationResult.length).toBeGreaterThan(0);
  });

  it('returns an object which only has keys for values that have validation errors', () => {
    type OtherObject = { name: string, validKey: number };
    const constraints: ObjectValidator<OtherObject> = new ObjectValidator<OtherObject>({
      name: rules(minLength(5), maxLength(10)),
      validKey: { validate: (number: number) => [] },
    });
    const validationResult = constraints.validate({ name: '', validKey: 6 });

    expect(validationResult.name.length).toBeGreaterThan(0);
    expect(validationResult.validKey).toBeUndefined();
  })
});

describe('hasValidationErrors', () => {
  it('returns true if the object any non-empty errors', () => {
    expect(hasValidationErrors({ key: ['error'], otherKey: [] })).toBe(true);
  });

  it('returns false if the object has no keys', () => {
    expect(hasValidationErrors({})).toBe(false);
  });

  it('returns false if all ValidationErrors are empty', () => {
    expect(hasValidationErrors({ someKey: [] })).toBe(false);
  });
});
