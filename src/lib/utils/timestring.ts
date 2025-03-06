// timestring.ts

/**
 * Timestring Parser (TS)
 * ~~~~~~~~~~~~~~~~~~~~~~
 *
 * This script provides functionality to parse human-readable timestrings
 * into floating numbers. It supports various time units and allows
 * customization through options.
 *
 * It is originally taken from the npm-module ["timestring"](https://www.npmjs.com/package/timestring) (Javascript)
 * but converted into TypeScript with additional functionality.
 */

interface Options {
  hoursPerDay?: number;
  daysPerWeek?: number;
  weeksPerMonth?: number;
  monthsPerYear?: number;
  daysPerYear?: number;
}

export interface UnitMap {
  [key: string]: string[];
}

export const DEFAULT_OPTS: Options = {
  hoursPerDay: 24,
  daysPerWeek: 7,
  weeksPerMonth: 4,
  monthsPerYear: 12,
  daysPerYear: 365.25,
};

export const DEFAULT_UNIT_MAP: UnitMap = {
  ms: ["ms", "milli", "millisecond", "milliseconds"],
  s: ["s", "sec", "secs", "second", "seconds"],
  m: ["m", "min", "mins", "minute", "minutes"],
  h: ["h", "hr", "hrs", "hour", "hours"],
  d: ["d", "day", "days"],
  w: ["w", "week", "weeks"],
  mth: ["mon", "mth", "mths", "month", "months"],
  y: ["y", "yr", "yrs", "year", "years"],
};

type ReturnUnit = "ms" | "s" | "m" | "h" | "d" | "w" | "mth" | "y";

interface ParseTimestringOptions {
  returnUnit?: ReturnUnit;
  options?: Options;
  unitMap?: UnitMap;
}

/**
 * Parses a human-readable timestring into a floating number.
 *
 * Returns seconds by default.
 */
export function parseTimestring(
  value: string | number,
  opts: ParseTimestringOptions = { returnUnit: "s", options: DEFAULT_OPTS, unitMap: DEFAULT_UNIT_MAP },
): number {
  if (typeof value === "number" || /^\d+$/.test(value)) {
    value = value + "s";
  }

  const matches = value.toLowerCase().match(/[-+]?[0-9.]+[a-z]+/g);

  if (!matches) {
    throw new Error(`Failed to parse value: \`${value}\``);
  }

  const UNIT_VALUES = getUnitValues(opts.options!);
  const UNIT_MAP = getUnitMap(opts.unitMap!);
  let totalSeconds = 0;

  for (const match of matches) {
    const val = parseFloat(match.match(/[0-9.]+/)![0]);
    const unit = match.match(/[a-z]+/)![0];
    totalSeconds += getSeconds(val, unit, UNIT_VALUES, UNIT_MAP);
  }

  if (opts.returnUnit) {
    return convert(totalSeconds, opts.returnUnit, UNIT_VALUES, UNIT_MAP);
  }

  return totalSeconds;
}

function getUnitValues(opts: Options): { [key: string]: number } {
  const unitValues: { [key: string]: number } = {
    ms: 0.001,
    s: 1,
    m: 60,
    h: 3600,
  };

  const _opts = { ...DEFAULT_OPTS, ...opts };

  unitValues["d"] = _opts.hoursPerDay! * unitValues["h"];
  unitValues["w"] = _opts.daysPerWeek! * unitValues["d"];
  unitValues["mth"] = (_opts.daysPerYear! / _opts.monthsPerYear!) * unitValues["d"];
  unitValues["y"] = _opts.daysPerYear! * unitValues["d"];

  return unitValues;
}

function getSeconds(value: number, unit: string, unitValues: { [key: string]: number }, unitMap: UnitMap): number {
  return value * unitValues[getUnitKey(unit, unitMap)];
}

function getUnitKey(unit: string, unitMap: UnitMap): string {
  for (const key in unitMap) {
    if (unitMap[key].includes(unit)) {
      return key;
    }
  }
  throw new Error(`The unit '${unit}' is not supported.`);
}

function getUnitMap(unitMap: UnitMap): UnitMap {
  return { ...DEFAULT_UNIT_MAP, ...unitMap };
}

function convert(value: number, unit: string, unitValues: { [key: string]: number }, unitMap: UnitMap): number {
  return value / unitValues[getUnitKey(unit, unitMap)];
}
