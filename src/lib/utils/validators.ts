/**
 * Schema Validator - A tool for validating objects against a schema.
 * Supports multiple types including bigint and null values.
 */

/**
 * Defines the possible data types supported by the schema validator.
 */
type SchemaType = "null" | "string" | "number" | "boolean" | "object" | "array" | "bigint" | "enum";

/**
 * Represents the schema definition for a single property within an object or array.
 * Defines validation rules like type, required status, length, range, and patterns.
 */
interface SchemaProperty {
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
  items?: SchemaProperty;
  /**
   * Defines the allowed values for the property. This is used when the type is "string" or "number".
   * The value must be one of the specified values in the enum array.
   */
  enum?: (string | number)[];
  /**
   * Defines the schema for properties in an object. This is used when the type is "object".
   */
  properties?: Record<string, SchemaProperty>;
}

/**
 * Represents the overall schema structure for an object of type T.
 * It's a record where keys are property names of T and values are their corresponding SchemaProperty definitions.
 * @template T The type of the object being described by the schema.
 */
type Schema<T> = Record<keyof T, SchemaProperty>;

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
    schemaProperties: Record<string, SchemaProperty>,
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
      const propSchema = schemaProperties[propName];
      const currentPath = path ? `${path}.${propName}` : propName;
      const value = data[propName];

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
  private validateArray(data: any[], itemSchema: SchemaProperty, path: string, errors: ValidationError[]): any[] {
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
          validatedArray.push(this.validateObject(item, itemSchema.properties, itemPath, errors));
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
  private hasType(propSchema: SchemaProperty, type: SchemaType): boolean {
    if (Array.isArray(propSchema.type)) {
      return propSchema.type.includes(type);
    }
    return propSchema.type === type;
  }

  /**
   * Validates a single property against its schema
   */
  private validateProperty(value: any, propSchema: SchemaProperty, path: string, errors: ValidationError[]): boolean {
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
    else if (typeof value === "object") return "object";
    else if (typeof value === "string") return "string";
    else if (typeof value === "number") return "number";
    else if (typeof value === "boolean") return "boolean";
    else if (typeof value === "bigint") return "bigint";
    else return "string"; // Fallback
  }

  /**
   * Validates a string value
   */
  private validateString(value: string, propSchema: SchemaProperty, path: string, errors: ValidationError[]): boolean {
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
  private validateNumber(value: number, propSchema: SchemaProperty, path: string, errors: ValidationError[]): boolean {
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
  private validateBigInt(value: bigint, propSchema: SchemaProperty, path: string, errors: ValidationError[]): boolean {
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
  private validateEnum(value: string | number, propSchema: SchemaProperty, path: string, errors: ValidationError[]): boolean {
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

// Tests
const testSchema1 = new SchemaValidator({
  name: { type: "string", required: true, minLength: 3, maxLength: 10 },
  age: { type: "number", required: true, minimum: 0, maximum: 120 },
  email: { type: "string", required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
});

const testData1 = {
  name: "John",
  age: 25,
  email: "john.doe@example.com",
};
const result1 = testSchema1.validate(testData1);
console.log("Test 1 Result:", result1.isValid ? "Valid" : "Invalid", result1.errors, result1.value);

const enumTestSchema = new SchemaValidator<{
  field1: "value1" | "value2" | "value3";
  field2: 1 | 2 | 3;
  field3: boolean;
  field4: null;
  field5: { nestedField: string };
  field6: string[];
  field7: bigint;
  field8: string;
  field9: string;
  field10: number;
  field11: bigint;
  field12: number[];
}>({
  field1: { type: "string", enum: ["value1", "value2", "value3"] },
  field2: { type: "number", enum: [1, 2, 3] },
  field3: { type: "boolean" },
  field4: { type: "null" },
  field5: { type: "object", properties: { nestedField: { type: "string" } } },
  field6: { type: "array", items: { type: "string" } },
  field7: { type: "bigint" },
  field8: { type: "string", pattern: /^[a-zA-Z0-9]+$/ },
  field9: { type: "string", minLength: 5, maxLength: 10 },
  field10: { type: "number", minimum: 0, maximum: 100 },
  field11: { type: "bigint", minimum: BigInt(0), maximum: BigInt(100) },
  field12: { type: "array", items: { type: "number", minimum: 0, maximum: 10 } },
});

const correctEnumTestData = {
  field1: "value1",
  field2: 2,
  field3: true,
  field4: null,
  field5: { nestedField: "nestedValue" },
  field6: ["item1", "item2"],
  field7: BigInt(10),
  field8: "validString123",
  field9: "valid",
  field10: 50,
  field11: BigInt(50),
  field12: [1, 2, 3],
};
const correctEnumResult = enumTestSchema.validate(correctEnumTestData);
console.log(
  "Enum Test Result (Should be correct):",
  correctEnumResult.isValid ? "Valid" : "Invalid",
  correctEnumResult.errors,
  correctEnumResult.value,
);

const incorrectEnumTestData = {
  field1: "invalidValue", // invalid enum value
  field2: 4, // invalid enum value
  field3: true, // valid boolean
  field4: null, // valid null
  field5: { nestedField: "nestedValue" }, // valid object
  field6: ["item1", "item2"], // valid array
  field7: BigInt(10), // valid bigint
  field8: "validString123", // valid string
  field9: "valid", // valid string
  field10: 50, // valid number
  field11: BigInt(50), // valid bigint
  field12: [1, 2, 3], // valid array
};
const incorrectEnumResult = enumTestSchema.validate(incorrectEnumTestData);
console.log(
  "Enum Test Result (Should be incorrect):",
  incorrectEnumResult.isValid ? "Valid" : "Invalid",
  incorrectEnumResult.errors,
  incorrectEnumResult.value,
);
