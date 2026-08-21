export function isString<T>(value: T): value is T & string {
  return Object.prototype.toString.call(value) === "[object String]";
}

export function isNumber<T>(value: T): value is T & number {
  return Number.isFinite(value);
}
