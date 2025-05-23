/**
 * Schema Validator - A tool for validating objects against a schema.
 * Supports multiple types including bigint and null values.
 */

import dayjs from "dayjs";

/**
 * Defines the possible data types supported by the schema validator.
 */
type SchemaType = "null" | "string" | "number" | "boolean" | "object" | "array" | "bigint" | "enum" | "date";

/**
 * Represents the schema definition for a single property within an object or array.
 * Defines validation rules like type, required status, length, range, and patterns.
 */
interface SchemaProperty<T> {
  /**
   * The type of the property. Can be a single type or an array of types.\
   * Supported types: "string", "number", "boolean", "object", "array", "null", "bigint".
   */
  type: SchemaType | SchemaType[];
  /**
   * Indicates if the property is required. If true, the property must be present in the object.
   * If false, the property is optional.
   *
   * @default false (optional)
   */
  required?: boolean;
  /**
   * Defines the minimum length for strings or arrays.
   */
  minLength?: number;
  /**
   * Defines the maximum length for strings or arrays.
   */
  maxLength?: number;
  /**
   * Defines the minimum value for numbers or bigints.
   */
  minimum?: number | bigint;
  /**
   * Defines the maximum value for numbers or bigints.
   */
  maximum?: number | bigint;
  /**
   * A regular expression pattern that the string value must match.
   */
  pattern?: RegExp | string;
  /**
   * Defines the schema for items in an array. This is used when the type is "array".
   */
  items?: SchemaProperty<T>;
  /**
   * Defines the allowed values for the property. This is used when the type is "string" or "number".
   * The value must be one of the specified values in the enum array.
   */
  enum?: (string | number)[];
  /**
   * Defines the schema for properties in an object. This is used when the type is "object".
   */
  properties?: Record<string, SchemaProperty<T>>;
  /**
   * Custom validation function that can be used to perform additional checks on the value.
   *
   * The function should return true if the value is valid, or false if it is invalid.
   *
   * @param value The value to validate.
   * @returns `true` if the value is valid, `false` otherwise.
   */
  customValidator?: (value: any) => boolean;
}

/**
 * Represents the overall schema structure for an object of type T.
 * It's a record where keys are property names of T and values are their corresponding SchemaProperty definitions.
 * @template T The type of the object being described by the schema.
 */
type Schema<T> = {
  [K in keyof T]: SchemaProperty<T>;
};

// Validation Return Type
/**
 * Represents the result of a validation operation.
 * Contains the validation status, a list of errors (if any), and the sanitized value.
 * @template T The type of the validated object.
 */
interface ValidationResult<T> {
  isValid: boolean;
  errors: ValidationError[];
  value: Partial<T>;
}

/**
 * Represents a single validation error, including the path to the invalid property and an error message.
 */
interface ValidationError {
  path: string;
  message: string;
}

/**
 * SchemaValidator class for validating objects against a schema
 */
export class SchemaValidator<T extends Record<string, any>> {
  private schema: Schema<T>;

  /**
   * Constructor to initialize the validator with a schema
   * @param schema The schema to validate against
   */
  constructor(schema: Schema<T>) {
    this.schema = schema;
  }

  /**
   * Validates an object against the defined schema
   * @param data The object to validate
   * @returns A ValidationResult with the validation status, errors, and sanitized value
   */
  validate(data: unknown): ValidationResult<T> {
    const errors: ValidationError[] = [];
    const validatedData = this.validateObject(data, this.schema, "", errors);

    return {
      isValid: errors.length === 0,
      errors,
      value: validatedData,
    };
  }

  /**
   * Validates an object recursively against the schema
   */
  private validateObject(
    data: any,
    schemaProperties: Record<string, SchemaProperty<T>>,
    path: string,
    errors: ValidationError[],
  ): Partial<T> {
    if (typeof data !== "object" || data === null) {
      errors.push({
        path: path || "root",
        message: `Expected an object, received: ${data === null ? "null" : typeof data}`,
      });
      return {};
    }

    const validatedObject: Record<string, any> = {};

    // Check all required fields
    for (const propName in schemaProperties) {
      const currentPath = path ? `${path}.${propName}` : propName;
      const value = data[propName];

      const propSchema = schemaProperties[propName];

      if (propSchema.properties) {
        // If schemaProperties is a SchemaValidator, validate the data using it
        const validator =
          propSchema.properties instanceof SchemaValidator
            ? propSchema.properties
            : new SchemaValidator(propSchema.properties);
        const result = validator.validate(value);
        if (!result.isValid) {
          errors.push(...result.errors);
        }
        validatedObject[propName] = result.value as Partial<T>;
        continue;
      }

      // Check if required field is present
      if (propSchema.required && value === undefined) {
        errors.push({
          path: currentPath,
          message: `Required field is missing`,
        });
        continue;
      }

      // If value is not present and not required, skip
      if (value === undefined) {
        continue;
      }

      // Type validation and specific validations
      const isValid = this.validateProperty(value, propSchema, currentPath, errors);

      if (isValid) {
        // If valid, add to the validated object
        if (value === null) {
          validatedObject[propName] = null;
        } else if (
          this.hasType(propSchema, "object") &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          propSchema.properties
        ) {
          validatedObject[propName] = this.validateObject(value, propSchema.properties, currentPath, errors);
        } else if (this.hasType(propSchema, "array") && Array.isArray(value) && propSchema.items) {
          validatedObject[propName] = this.validateArray(value, propSchema.items, currentPath, errors);
        } else {
          validatedObject[propName] = value;
        }
      }
    }

    return validatedObject as Partial<T>; // TS is hard sometimes
  }

  /**
   * Validates an array recursively against the schema
   */
  private validateArray(data: any[], itemSchema: SchemaProperty<T>, path: string, errors: ValidationError[]): any[] {
    if (!Array.isArray(data)) {
      errors.push({
        path,
        message: `Expected an array, received: ${typeof data}`,
      });
      return [];
    }

    const validatedArray: any[] = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const itemPath = `${path}[${i}]`;

      // Validate each array item against the item schema
      const isValid = this.validateProperty(item, itemSchema, itemPath, errors);

      if (isValid) {
        if (item === null) {
          // Add null only if allowed
          validatedArray.push(null);
        } else if (
          this.hasType(itemSchema, "object") &&
          typeof item === "object" &&
          !Array.isArray(item) &&
          itemSchema.properties
        ) {
          // Validate nested objects
          const validator =
            itemSchema.properties instanceof SchemaValidator
              ? itemSchema.properties
              : new SchemaValidator(itemSchema.properties);
          const res = validator.validate(item);
          if (!res.isValid) {
            errors.push(...res.errors);
          }
          validatedArray.push(res.value);
        } else if (this.hasType(itemSchema, "array") && Array.isArray(item) && itemSchema.items) {
          // Validate nested arrays
          validatedArray.push(this.validateArray(item, itemSchema.items, itemPath, errors));
        } else {
          // Add simple values
          validatedArray.push(item);
        }
      }
      // If not valid, the value is skipped
    }

    return validatedArray;
  }

  /**
   * Checks if the schema contains a specific type
   */
  private hasType(propSchema: SchemaProperty<T>, type: SchemaType): boolean {
    if (Array.isArray(propSchema.type)) {
      return propSchema.type.includes(type);
    }
    return propSchema.type === type;
  }

  /**
   * Validates a single property against its schema
   */
  private validateProperty(
    value: any,
    propSchema: SchemaProperty<T>,
    path: string,
    errors: ValidationError[],
  ): boolean {
    if (propSchema.customValidator !== undefined && !propSchema.customValidator(value)) {
      errors.push({
        path,
        message: `Custom validation failed`,
      });
      return false;
    }

    // Null value check
    if (value === null) {
      if (!this.hasType(propSchema, "null")) {
        errors.push({
          path,
          message: `Null is not allowed for this field`,
        });
        return false;
      }
      return true;
    }

    // Multiple type check
    const types = Array.isArray(propSchema.type) ? propSchema.type : [propSchema.type];
    const valueType = this.getValueType(value);

    if (!types.includes(valueType)) {
      errors.push({
        path,
        message: `Invalid type: expected one of [${types.join(", ")}], received: ${valueType}`,
      });
      return false;
    }

    // Specific validations based on type
    if (valueType === "string") {
      return this.validateString(value, propSchema, path, errors);
    } else if (valueType === "number") {
      return this.validateNumber(value, propSchema, path, errors);
    } else if (valueType === "bigint") {
      return this.validateBigInt(value, propSchema, path, errors);
    } else if (valueType === "boolean") {
      return true; // Boolean requires no further validation
    } else if (valueType === "date") {
      if (!dayjs(value).isValid()) {
        errors.push({
          path,
          message: `Invalid date format`,
        });
        return false;
      }
      return true;
    } else if (valueType === "object") {
      if (!propSchema.properties) {
        errors.push({
          path,
          message: `Schema definition for object is missing`,
        });
        return false;
      }
      return true;
    } else if (valueType === "array") {
      if (!propSchema.items) {
        errors.push({
          path,
          message: `Schema definition for array items is missing`,
        });
        return false;
      }
      return true;
    }

    return true;
  }

  /**
   * Determines the type of a value
   */
  private getValueType(value: any): SchemaType {
    if (value === null) return "null";
    else if (Array.isArray(value)) return "array";
    else if (value instanceof Date) return "date";
    else if (typeof value === "object") return "object";
    else if (typeof value === "number") return "number";
    else if (typeof value === "boolean") return "boolean";
    else if (typeof value === "bigint") return "bigint";
    else if (typeof value === "string") {
      // Check if string is a valid date format (ISO 8601)
      if (dayjs(value).isValid() && /^\d{4}-\d{2}-\d{2}(T|\s)\d{2}:\d{2}:\d{2}.*/.test(value)) return "date";
    }
    return "string"; // Fallback
  }

  /**
   * Validates a string value
   */
  private validateString(
    value: string,
    propSchema: SchemaProperty<T>,
    path: string,
    errors: ValidationError[],
  ): boolean {
    let isValid = true;

    if (propSchema.minLength !== undefined && value.length < propSchema.minLength) {
      errors.push({
        path,
        message: `String too short: minimum ${propSchema.minLength}, current ${value.length}`,
      });
      isValid = false;
    }

    if (propSchema.maxLength !== undefined && value.length > propSchema.maxLength) {
      errors.push({
        path,
        message: `String too long: maximum ${propSchema.maxLength}, current ${value.length}`,
      });
      isValid = false;
    }

    if (propSchema.pattern !== undefined) {
      const regex = new RegExp(propSchema.pattern);
      if (!regex.test(value)) {
        errors.push({
          path,
          message: `String does not match pattern: ${propSchema.pattern}`,
        });
        isValid = false;
      }
    }

    if (propSchema.enum !== undefined) {
      isValid = this.validateEnum(value, propSchema, path, errors);
    }

    return isValid;
  }

  /**
   * Validates a number value
   */
  private validateNumber(
    value: number,
    propSchema: SchemaProperty<T>,
    path: string,
    errors: ValidationError[],
  ): boolean {
    let isValid = true;

    if (propSchema.minimum !== undefined) {
      const min = typeof propSchema.minimum === "bigint" ? Number(propSchema.minimum) : propSchema.minimum;
      if (value < min) {
        errors.push({
          path,
          message: `Number too small: minimum ${min}, current ${value}`,
        });
        isValid = false;
      }
    }

    if (propSchema.maximum !== undefined) {
      const max = typeof propSchema.maximum === "bigint" ? Number(propSchema.maximum) : propSchema.maximum;
      if (value > max) {
        errors.push({
          path,
          message: `Number too large: maximum ${max}, current ${value}`,
        });
        isValid = false;
      }
    }

    if (propSchema.enum !== undefined) {
      isValid = this.validateEnum(value, propSchema, path, errors);
    }

    return isValid;
  }

  /**
   * Validates a BigInt value
   */
  private validateBigInt(
    value: bigint,
    propSchema: SchemaProperty<T>,
    path: string,
    errors: ValidationError[],
  ): boolean {
    let isValid = true;

    if (propSchema.minimum !== undefined) {
      const min = typeof propSchema.minimum === "number" ? BigInt(propSchema.minimum) : propSchema.minimum;
      if (value < min) {
        errors.push({
          path,
          message: `BigInt too small: minimum ${min}, current ${value}`,
        });
        isValid = false;
      }
    }

    if (propSchema.maximum !== undefined) {
      const max = typeof propSchema.maximum === "number" ? BigInt(propSchema.maximum) : propSchema.maximum;
      if (value > max) {
        errors.push({
          path,
          message: `BigInt too large: maximum ${max}, current ${value}`,
        });
        isValid = false;
      }
    }

    return isValid;
  }

  /**
   * Validates an enum value
   *
   * Either a string or number
   */
  private validateEnum(
    value: string | number,
    propSchema: SchemaProperty<T>,
    path: string,
    errors: ValidationError[],
  ): boolean {
    if (propSchema.enum && !propSchema.enum.includes(value)) {
      errors.push({
        path,
        message: `Invalid value: expected enum [${propSchema.enum.join(", ")}], received: ${value}`,
      });
      return false;
    }
    return true;
  }
}
