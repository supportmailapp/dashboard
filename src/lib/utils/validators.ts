/**
 * @fileoverview
 * Schema Validator - Ein Tool zur Validierung von Objekten gegen ein Schema.
 * Unterstützt multiple Typen und null-Werte.
 */

// Schema Typ-Definitionen
type SchemaType = "string" | "number" | "boolean" | "object" | "bigint" | "array" | "null";

interface SchemaProperty {
  // Unterstützt einzelnen Typ oder Array von Typen
  type: SchemaType | SchemaType[];
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  items?: SchemaProperty; // Für Arrays
  properties?: Record<string, SchemaProperty>; // Für verschachtelte Objekte
}

interface Schema {
  properties: Record<string, SchemaProperty>;
}

// Rückgabetyp der Validierung
interface ValidationResult<T> {
  isValid: boolean;
  errors: ValidationError[];
  value: T;
}

interface ValidationError {
  path: string;
  message: string;
}

/**
 * SchemaValidator Klasse zur Validierung von Objekten gegen ein Schema
 */
export class SchemaValidator<T extends Record<string, any>> {
  private schema: Schema;

  /**
   * Konstruktor zum Initialisieren des Validators mit einem Schema
   * @param schema Das Schema, gegen das validiert werden soll
   */
  constructor(schema: Schema) {
    this.schema = schema;
  }

  /**
   * Validiert ein Objekt gegen das definierte Schema
   * @param data Das zu validierende Objekt
   * @returns Ein ValidationResult mit dem Validierungsstatus, Fehlern und bereinigtem Wert
   */
  validate(data: any): ValidationResult<T> {
    const errors: ValidationError[] = [];
    const validatedData = this.validateObject(data, this.schema.properties, "", errors);

    return {
      isValid: errors.length === 0,
      errors,
      value: validatedData as T,
    };
  }

  /**
   * Validiert ein Objekt rekursiv gegen das Schema
   */
  private validateObject(
    data: any,
    schemaProperties: Record<string, SchemaProperty>,
    path: string,
    errors: ValidationError[],
  ): Record<string, any> {
    if (typeof data !== "object" || data === null) {
      errors.push({
        path: path || "root",
        message: `Erwartet wurde ein Objekt, erhalten: ${data === null ? "null" : typeof data}`,
      });
      return {};
    }

    const validatedObject: Record<string, any> = {};

    // Prüfe alle Pflichtfelder
    for (const propName in schemaProperties) {
      const propSchema = schemaProperties[propName];
      const currentPath = path ? `${path}.${propName}` : propName;
      const value = data[propName];

      // Prüfe, ob Pflichtfeld vorhanden ist
      if (propSchema.required && value === undefined) {
        errors.push({
          path: currentPath,
          message: `Pflichtfeld fehlt`,
        });
        continue;
      }

      // Wenn Wert nicht vorhanden und nicht erforderlich, überspringen
      if (value === undefined) {
        continue;
      }

      // Typ-Validierung und spezifische Validierungen
      const isValid = this.validateProperty(value, propSchema, currentPath, errors);

      if (isValid) {
        // Wenn gültig, füge zum validierten Objekt hinzu
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

    return validatedObject;
  }

  /**
   * Validiert ein Array rekursiv gegen das Schema
   */
  private validateArray(data: any[], itemSchema: SchemaProperty, path: string, errors: ValidationError[]): any[] {
    if (!Array.isArray(data)) {
      errors.push({
        path,
        message: `Erwartet wurde ein Array, erhalten: ${typeof data}`,
      });
      return [];
    }

    const validatedArray: any[] = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const itemPath = `${path}[${i}]`;

      // Validiere jeden Array-Eintrag gegen das Item-Schema
      const isValid = this.validateProperty(item, itemSchema, itemPath, errors);

      if (isValid) {
        if (item === null) {
          // Füge null nur hinzu, wenn es erlaubt ist
          validatedArray.push(null);
        } else if (
          this.hasType(itemSchema, "object") &&
          typeof item === "object" &&
          !Array.isArray(item) &&
          itemSchema.properties
        ) {
          // Validiere verschachtelte Objekte
          validatedArray.push(this.validateObject(item, itemSchema.properties, itemPath, errors));
        } else if (this.hasType(itemSchema, "array") && Array.isArray(item) && itemSchema.items) {
          // Validiere verschachtelte Arrays
          validatedArray.push(this.validateArray(item, itemSchema.items, itemPath, errors));
        } else {
          // Füge einfache Werte hinzu
          validatedArray.push(item);
        }
      }
      // Wenn nicht gültig, wird der Wert übersprungen
    }

    return validatedArray;
  }

  /**
   * Prüft, ob das Schema einen bestimmten Typ enthält
   */
  private hasType(propSchema: SchemaProperty, type: SchemaType): boolean {
    if (Array.isArray(propSchema.type)) {
      return propSchema.type.includes(type);
    }
    return propSchema.type === type;
  }

  /**
   * Validiert eine einzelne Eigenschaft gegen sein Schema
   */
  private validateProperty(value: any, propSchema: SchemaProperty, path: string, errors: ValidationError[]): boolean {
    // Null-Wert Prüfung
    if (value === null) {
      if (!this.hasType(propSchema, "null")) {
        errors.push({
          path,
          message: `Null ist für dieses Feld nicht erlaubt`,
        });
        return false;
      }
      return true;
    }

    // Mehrfach-Typ Prüfung
    const types = Array.isArray(propSchema.type) ? propSchema.type : [propSchema.type];
    const valueType = this.getValueType(value);

    if (!types.includes(valueType)) {
      errors.push({
        path,
        message: `Ungültiger Typ: erwartet wurde einer von [${types.join(", ")}], erhalten: ${valueType}`,
      });
      return false;
    }

    // Spezifische Validierungen je nach Typ
    if (valueType === "string") {
      return this.validateString(value, propSchema, path, errors);
    } else if (valueType === "number") {
      return this.validateNumber(value, propSchema, path, errors);
    } else if (valueType === "boolean") {
      return true; // Boolean erfordert keine weitere Validierung
    } else if (valueType === "object") {
      if (!propSchema.properties) {
        errors.push({
          path,
          message: `Schema-Definition für Objekt fehlt`,
        });
        return false;
      }
      return true;
    } else if (valueType === "array") {
      if (!propSchema.items) {
        errors.push({
          path,
          message: `Schema-Definition für Array-Elemente fehlt`,
        });
        return false;
      }
      return true;
    }

    return true;
  }

  /**
   * Ermittelt den Typ eines Wertes
   */
  private getValueType(value: any): SchemaType {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    if (typeof value === "object") return "object";
    if (typeof value === "string") return "string";
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";
    return "string"; // Fallback
  }

  /**
   * Validiert einen String-Wert
   */
  private validateString(value: string, propSchema: SchemaProperty, path: string, errors: ValidationError[]): boolean {
    let isValid = true;

    if (propSchema.minLength !== undefined && value.length < propSchema.minLength) {
      errors.push({
        path,
        message: `String zu kurz: minimum ${propSchema.minLength}, aktuell ${value.length}`,
      });
      isValid = false;
    }

    if (propSchema.maxLength !== undefined && value.length > propSchema.maxLength) {
      errors.push({
        path,
        message: `String zu lang: maximum ${propSchema.maxLength}, aktuell ${value.length}`,
      });
      isValid = false;
    }

    if (propSchema.pattern !== undefined) {
      const regex = new RegExp(propSchema.pattern);
      if (!regex.test(value)) {
        errors.push({
          path,
          message: `String entspricht nicht dem Muster: ${propSchema.pattern}`,
        });
        isValid = false;
      }
    }

    return isValid;
  }

  /**
   * Validiert einen Zahlen-Wert
   */
  private validateNumber(value: number, propSchema: SchemaProperty, path: string, errors: ValidationError[]): boolean {
    let isValid = true;

    if (propSchema.minimum !== undefined && value < propSchema.minimum) {
      errors.push({
        path,
        message: `Zahl zu klein: minimum ${propSchema.minimum}, aktuell ${value}`,
      });
      isValid = false;
    }

    if (propSchema.maximum !== undefined && value > propSchema.maximum) {
      errors.push({
        path,
        message: `Zahl zu groß: maximum ${propSchema.maximum}, aktuell ${value}`,
      });
      isValid = false;
    }

    return isValid;
  }
}
