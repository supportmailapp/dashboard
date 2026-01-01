export function match(param?: string) {
  return param && /^\d{17,23}$/.test(param);
}
