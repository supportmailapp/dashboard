import timezones from "./timezones.json";

/**
 * Represents a timezone object.
 *
 * @example
 * {
 *   label: "Europe/Berlin (GMT+01:00)",
 *   tzCode: "Europe/Berlin",
 *   name: "(GMT+01:00) Berlin, Hamburg, Munich, Köln, Frankfurt am Main",
 *   utc: "+01:00"
 * }
 */
export interface TimeZone {
  /**
   * The label of the timezone.
   *
   * @example "Europe/Berlin (GMT+01:00)"
   */
  label: string;
  /**
   * The timezone code of the timezone.
   *
   * @example "Europe/Berlin"
   */
  tzCode: string;
  /**
   * The name of the timezone.
   *
   * @example "(GMT+01:00) Berlin, Hamburg, Munich, Köln, Frankfurt am Main"
   */
  name: string;
  /**
   * The offset of the timezone from UTC.
   *
   * @example "+01:00"
   */
  utc: string;
}

const tzMap = new Map<string, TimeZone>(timezones.map((tz) => [tz.tzCode, tz]));
export default timezones as TimeZone[];
/**
 * Lookup of a timezone by its code.
 */
export function getTimezone(tzCode: string) {
  return tzMap.get(tzCode) || null;
}
