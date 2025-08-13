/**
 * A TypeScript bitfield class for managing flags like permissions
 */
class Bitfield {
  private _bits: bigint;

  constructor(bits: bigint | number = BigInt(0)) {
    this._bits = BigInt(bits);
  }

  /**
   * Check if a specific bit is set
   */
  has(bit: bigint | number): boolean {
    const bitValue = BigInt(bit);
    return (this._bits & bitValue) === bitValue;
  }

  /**
   * Set one or more bits
   */
  set(...bits: (bigint | number)[]): this {
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
  clone(): Bitfield {
    return new Bitfield(this._bits);
  }

  /**
   * Combine this bitfield with another (OR operation)
   */
  combine(other: Bitfield): this {
    this._bits |= other.bits;
    return this;
  }

  /**
   * Remove bits that are set in another bitfield
   */
  subtract(other: Bitfield): this {
    this._bits &= ~other.bits;
    return this;
  }

  /**
   * Keep only bits that are set in both bitfields (AND operation)
   */
  intersect(other: Bitfield): this {
    this._bits &= other.bits;
    return this;
  }

  /**
   * Check if this bitfield equals another
   */
  equals(other: Bitfield): boolean {
    return this._bits === other.bits;
  }

  /**
   * Convert to binary string representation
   */
  toBinary(): string {
    return this._bits.toString(2);
  }

  /**
   * Convert to decimal string
   */
  toString(): string {
    return this._bits.toString();
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
}

const PermissionFlagsBits = {
  ADMIN: BigInt(1),
  MANAGER: BigInt(2),
  // TODO: idk what permissions to add here. maybe one time?
} as const;

// Type for permission resolution
export type PermissionResolvable = bigint | number | keyof typeof PermissionFlagsBits;

/**
 * Permissions-specific bitfield class with string key support
 */
class PermissionsBitfield extends Bitfield {
  /**
   * Utility function to resolve permission keys to bigint values
   */
  private resolvePermission(permission: PermissionResolvable): bigint {
    if (typeof permission === "string") {
      const resolved = PermissionFlagsBits[permission];
      if (resolved === undefined) {
        throw new Error(`Unknown permission: ${permission}`);
      }
      return resolved;
    }
    return BigInt(permission);
  }

  /**
   * Check if a specific permission is set
   */
  has(permission: PermissionResolvable): boolean {
    return super.has(this.resolvePermission(permission));
  }

  /**
   * Set one or more permissions
   */
  set(...permissions: PermissionResolvable[]): this {
    const resolved = permissions.map(this.resolvePermission);
    return super.set(...resolved);
  }

  /**
   * Unset/clear one or more permissions
   */
  unset(...permissions: PermissionResolvable[]): this {
    const resolved = permissions.map(this.resolvePermission);
    return super.unset(...resolved);
  }

  /**
   * Toggle one or more permissions
   */
  toggle(...permissions: PermissionResolvable[]): this {
    const resolved = permissions.map(this.resolvePermission);
    return super.toggle(...resolved);
  }

  /**
   * Check if ALL specified permissions are set
   */
  hasAll(...permissions: PermissionResolvable[]): boolean {
    const resolved = permissions.map(this.resolvePermission);
    return super.hasAll(...resolved);
  }

  /**
   * Check if ANY of the specified permissions are set
   */
  hasAny(...permissions: PermissionResolvable[]): boolean {
    const resolved = permissions.map(this.resolvePermission);
    return super.hasAny(...resolved);
  }

  /**
   * Create a copy of this permissions bitfield
   */
  clone(): PermissionsBitfield {
    return new PermissionsBitfield(this.bits);
  }

  /**
   * Combine this permissions bitfield with another (OR operation)
   */
  combine(other: PermissionsBitfield): this {
    return super.combine(other) as this;
  }

  /**
   * Remove permissions that are set in another bitfield
   */
  subtract(other: PermissionsBitfield): this {
    return super.subtract(other) as this;
  }

  /**
   * Keep only permissions that are set in both bitfields (AND operation)
   */
  intersect(other: PermissionsBitfield): this {
    return super.intersect(other) as this;
  }

  /**
   * Get array of permission names that are currently set
   */
  getSetPermissions(): (keyof typeof PermissionFlagsBits)[] {
    const setPermissions: (keyof typeof PermissionFlagsBits)[] = [];

    for (const [name, value] of Object.entries(PermissionFlagsBits)) {
      if (this.has(value)) {
        setPermissions.push(name as keyof typeof PermissionFlagsBits);
      }
    }

    return setPermissions;
  }
}

export { Bitfield, PermissionsBitfield };
