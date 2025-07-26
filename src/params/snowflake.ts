export function match(param?: string) {
  return param && /^\d{15,25}$/.test(param);
}
