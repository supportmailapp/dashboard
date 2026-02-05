export function match(param?: string) {
  return param && /^[a-f0-9]{24}$/i.test(param);
}
