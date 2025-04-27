/**
 * @license
 * Copyright (c) 2025, The-LukeZ
 * All rights reserved.
 */

/**
 * Base validation result type.
 */
type ValidationResult<T> = {
  /**
   * Indicates whether the validation was successful or not.
   */
  isValid: boolean;
  /**
   * An array of error messages if the validation failed.
   */
  errors: string[];
};

type PropertyValidationResult<T> = ValidationResult<T> & {
  /**
   * The validated value, but now of the expected type.
   */
  value: T;
};

type ObjectValidationResult<T> = ValidationResult<T> & {
  /**
   * The validated value, but now of the expected type with the wrong properties removed.
   *
   * This is useful for when you want to validate an object and only keep the properties that were valid.
   *
   * For example, if you have an object with properties `a`, `b`, and `c`, and only `a` and `b` are valid,
   * the `value` property will only contain `a` and `b`, while `c` will be removed.
   */
  value: Partial<T>;
};

/**
 * Interface for a generic validator.
 *
 * @template T - The type of the value being validated.
 */
interface IValidator<T> {
  /**
   * Validates the given value and returns a validation result.
   *
   * @param value - The value to be validated.
   * @returns A validation result containing the validity status, errors, and the validated value.
   */
  validate(value: unknown): PropertyValidationResult<T> | ObjectValidationResult<T>;
}

/**
 * Custom check type for additional validation logic.
 *
 * This type is used to define custom validation checks that can be applied to the value being validated.
 */
type CustomCheck = {
  /**
   *
   * @param value - The value to be validated.
   * @returns `true` if the value passes the custom check, `false` otherwise.
   *
   * Remember that this function should be designed to return `false` for invalid values.
   */
  validator: (value: unknown) => boolean;
  /**
   * Error message to be displayed if the custom check fails.
   *
   * - Use `%t` to refer to the real type of the value being validated.
   * - Use `%v` to refer to the value that was given.
   */
  errorMessage: string;
};

// Generic property validator
class PropertyValidator<T> implements IValidator<T> {
  /**
   * The expected type of the value being validated.
   *
   * @readonly
   * @memberof PropertyValidator
   */
  public readonly expectedType: string;
  /**
   * A function that checks if the value is of the expected type.
   *
   * @protected
   * @memberof PropertyValidator
   */
  protected readonly typeCheck: (value: unknown) => value is T;
  /**
   * An array of custom checks to be performed on the value.
   *
   * @protected
   * @memberof PropertyValidator
   */
  protected readonly customChecks: CustomCheck[];

  constructor(expectedType: string, typeCheck: (value: unknown) => value is T, customChecks: CustomCheck[] = []) {
    this.expectedType = expectedType;
    this.typeCheck = typeCheck;
    this.customChecks = customChecks;
  }

  validate(value: unknown): PropertyValidationResult<T> {
    const errors: string[] = [];

    // Type check
    if (!this.typeCheck(value)) {
      errors.push(`Invalid type for property: expected '${this.expectedType}', got '${typeof value}' instead.`);
      return { isValid: false, errors, value: value as T };
    }

    // Custom checks
    const typedValue = value as T;
    for (const check of this.customChecks) {
      if (!check.validator(typedValue)) {
        errors.push(check.errorMessage.replace("%t", typeof typedValue).replace("%v", String(typedValue)));
      }
    }
    return {
      isValid: errors.length === 0,
      errors,
      value: typedValue as T,
    };
  }
}

interface IUnionValidator<T> extends IValidator<T> {
  readonly allowedValues: T[];
}

class UnionValidator<T> implements IUnionValidator<T> {
  /**
   * The only allowed types for the value being validated.
   *
   * @memberof UnionValidator
   */
  public readonly allowedValues: T[];
  /**
   * A function that checks if the value is of one of the allowed types. If not, it will return `false`.
   *
   * @protected
   * @memberof UnionValidator
   */
  protected readonly unionCheck: (value: unknown) => value is T;
  /**
   * An array of custom checks to be performed on the value.

   *
   * @protected
   * @memberof UnionValidator
   */
  protected readonly customChecks: CustomCheck[];

  constructor(allowedValues: T[], customChecks: CustomCheck[] = []) {
    this.allowedValues = allowedValues;
    this.unionCheck = (value): value is T => allowedValues.includes(value as T);
    this.customChecks = customChecks;
  }

  static createBase<T>(...allowedValues: T[]): UnionValidator<T> {
    return new UnionValidator(allowedValues);
  }

  validate(value: unknown): PropertyValidationResult<T> {
    const errors: string[] = [];

    // Type check
    if (!this.unionCheck(value)) {
      errors.push(
        `Invalid type for property: expected one of [${this.allowedValues.join(", ")}], got '${String(value).slice(0, 10)}' instead.`,
      );
      return { isValid: false, errors, value: value as T };
    }

    // Custom checks
    const typedValue = value as T;
    for (const check of this.customChecks) {
      if (!check.validator(typedValue)) {
        errors.push(check.errorMessage.replace("%t", typeof typedValue).replace("%v", String(typedValue)));
      }
    }
    return {
      isValid: errors.length === 0,
      errors,
      value: typedValue,
    };
  }
}

// Create validators for common types
const StringValidator = new PropertyValidator<string>("string", (value): value is string => typeof value === "string");

const NumberValidator = new PropertyValidator<number>("number", (value): value is number => typeof value === "number");

const BooleanValidator = new PropertyValidator<boolean>("boolean", (value): value is boolean => typeof value === "boolean");

// Simplified validator class that handles both simple and nested properties
class ObjectValidator<T extends object> implements IValidator<T> {
  private validators: Map<keyof T, IValidator<any>> = new Map();

  addValidator<K extends keyof T>(key: K, validator: IValidator<any>): ObjectValidator<T> {
    this.validators.set(key, validator);
    return this;
  }

  validate(value: unknown): ObjectValidationResult<T> {
    const errors: string[] = [];
    const validatedValues: Partial<T> = {};

    if (typeof value !== "object" || value === null) {
      errors.push("Input must be an object");
      return { isValid: false, errors, value: {} as T };
    }

    for (const [key, validator] of this.validators.entries()) {
      const result = validator.validate((value as Record<keyof T, unknown>)[key]);
      if (!result.isValid) {
        errors.push(`Property '${String(key)}': ${result.errors.join(", ")}`);
      } else {
        validatedValues[key] = result.value;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      value: validatedValues,
    };
  }

  /**
   * Returns an array of all properties that are being checked by this validator.
   *
   * @readonly
   * @memberof ObjectValidator
   */
  get propertiesToCheck(): (keyof T)[] {
    return Array.from(this.validators.keys());
  }

  /**
   * Returns an array of all validators that are being used by this validator.
   *
   * @readonly
   * @type {IValidator<any>[]}
   * @memberof ObjectValidator
   */
  get validatorsList(): IValidator<any>[] {
    return Array.from(this.validators.values());
  }
}

export default ObjectValidator;
export { BooleanValidator, NumberValidator, ObjectValidator, PropertyValidator, StringValidator, UnionValidator };
export type { CustomCheck, IUnionValidator, IValidator, ValidationResult };
