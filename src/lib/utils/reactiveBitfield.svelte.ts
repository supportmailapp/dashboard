/**
 * A reactive implementation of the Bitfield class.
 */
export class SvelteBitfield {
  private _bits = $state<bigint>(BigInt(0));

  constructor(bits: bigint | number | string | boolean = BigInt(0)) {
    this._bits = BigInt(bits);
  }

  /**
   * Check if a specific bit is set
   */
  has(bit: bigint | number | string | boolean): boolean {
    const bitValue = BigInt(bit);
    return (this._bits & bitValue) === bitValue;
  }

  /**
   * Set one or more bits
   */
  set(...bits: (bigint | number | string | boolean)[]): this {
    for (const bit of bits) {
      this._bits |= BigInt(bit);
    }
    return this;
  }

  /**
   * Unset/clear one or more bits
   */
  unset(...bits: (bigint | number)[]): this {
    for (const bit of bits) {
      this._bits &= ~BigInt(bit);
    }
    return this;
  }

  /**
   * Toggle one or more bits
   */
  toggle(...bits: (bigint | number)[]): this {
    for (const bit of bits) {
      this._bits ^= BigInt(bit);
    }
    return this;
  }

  /**
   * Check if ALL specified bits are set
   */
  hasAll(...bits: (bigint | number)[]): boolean {
    for (const bit of bits) {
      const bitValue = BigInt(bit);
      if ((this._bits & bitValue) !== bitValue) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if ANY of the specified bits are set
   */
  hasAny(...bits: (bigint | number)[]): boolean {
    for (const bit of bits) {
      const bitValue = BigInt(bit);
      if ((this._bits & bitValue) !== BigInt(0)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Clear all bits
   */
  clear(): this {
    this._bits = BigInt(0);
    return this;
  }

  /**
   * Get the raw bits value
   */
  get bits(): bigint {
    return this._bits;
  }

  /**
   * Set the raw bits value
   */
  set bits(value: bigint | number) {
    this._bits = BigInt(value);
  }

  /**
   * Create a copy of this bitfield
   */
  clone(): SvelteBitfield {
    return new SvelteBitfield(this._bits);
  }

  /**
   * Combine this bitfield with another (OR operation)
   */
  combine(other: SvelteBitfield): this {
    this._bits |= other.bits;
    return this;
  }

  /**
   * Remove bits that are set in another bitfield
   */
  subtract(other: SvelteBitfield): this {
    this._bits &= ~other.bits;
    return this;
  }

  /**
   * Keep only bits that are set in both bitfields (AND operation)
   */
  intersect(other: SvelteBitfield): this {
    this._bits &= other.bits;
    return this;
  }

  /**
   * Check if this bitfield equals another
   */
  equals(other: SvelteBitfield): boolean {
    return this._bits === other.bits;
  }

  /**
   * Convert to binary string representation
   */
  toBinary(): string {
    return this._bits.toString(2);
  }

  /**
   * Shortcut for `this.bits.toString()`
   */
  toString(): string {
    return this._bits.toString(10);
  }

  /**
   * Convert to hexadecimal string
   */
  toHex(): string {
    return "0x" + this._bits.toString(16).toUpperCase();
  }

  /**
   * Get array of individual bit positions that are set
   */
  getSetBits(): number[] {
    const setBits: number[] = [];
    let temp = this._bits;
    let position = 0;

    while (temp > BigInt(0)) {
      if (temp & BigInt(1)) {
        setBits.push(position);
      }
      temp >>= BigInt(1);
      position++;
    }

    return setBits;
  }

  /**
   * Count the number of set bits
   */
  popCount(): number {
    let count = 0;
    let temp = this._bits;

    while (temp > BigInt(0)) {
      count += Number(temp & BigInt(1));
      temp >>= BigInt(1);
    }

    return count;
  }

  /**
   * Alias for `popCount()`
   */
  get size(): number {
    return this.popCount();
  }

  toJSON(): any {
    return {
      bits: this._bits.toString(),
      size: this.size,
    };
  }
}
