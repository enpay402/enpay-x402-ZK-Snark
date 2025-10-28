export const FIELD_SIZE = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');

export const SUBGROUP_ORDER = BigInt('21888242871839275222246405745257275088696311157297823662689037894645226208583');

export function mod(a: bigint, m: bigint = FIELD_SIZE): bigint {
  const result = a % m;
  return result >= 0n ? result : result + m;
}

export function addMod(a: bigint, b: bigint, m: bigint = FIELD_SIZE): bigint {
  return mod(mod(a) + mod(b), m);
}

export function subMod(a: bigint, b: bigint, m: bigint = FIELD_SIZE): bigint {
  return mod(mod(a) - mod(b), m);
}

export function mulMod(a: bigint, b: bigint, m: bigint = FIELD_SIZE): bigint {
  return mod(mod(a) * mod(b), m);
}

export function powMod(base: bigint, exp: bigint, m: bigint = FIELD_SIZE): bigint {
  if (exp === 0n) return 1n;
  if (exp === 1n) return mod(base, m);

  let result = 1n;
  let b = mod(base, m);
  let e = exp;

  while (e > 0n) {
    if (e % 2n === 1n) {
      result = mod(result * b, m);
    }
    b = mod(b * b, m);
    e = e / 2n;
  }

  return result;
}

export function invMod(a: bigint, m: bigint = FIELD_SIZE): bigint {
  const [gcd, x] = extendedGCD(mod(a, m), m);

  if (gcd !== 1n) {
    throw new Error('Modular inverse does not exist');
  }

  return mod(x, m);
}

function extendedGCD(a: bigint, b: bigint): [bigint, bigint, bigint] {
  if (b === 0n) {
    return [a, 1n, 0n];
  }

  const [gcd, x1, y1] = extendedGCD(b, a % b);
  const x = y1;
  const y = x1 - (a / b) * y1;

  return [gcd, x, y];
}

export function divMod(a: bigint, b: bigint, m: bigint = FIELD_SIZE): bigint {
  return mulMod(a, invMod(b, m), m);
}

export function isQuadraticResidue(a: bigint, p: bigint = FIELD_SIZE): boolean {
  if (a === 0n) return true;
  const exp = (p - 1n) / 2n;
  return powMod(a, exp, p) === 1n;
}

export function sqrtMod(a: bigint, p: bigint = FIELD_SIZE): bigint {
  if (!isQuadraticResidue(a, p)) {
    throw new Error('Square root does not exist in field');
  }

  if (p % 4n === 3n) {
    const exp = (p + 1n) / 4n;
    return powMod(a, exp, p);
  }

  throw new Error('General case not implemented');
}

export function randomFieldElement(): bigint {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  let result = 0n;
  for (let i = 0; i < bytes.length; i++) {
    result = (result << 8n) | BigInt(bytes[i]);
  }

  return mod(result);
}

export function toBigIntLE(bytes: Uint8Array): bigint {
  let result = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) {
    result = (result << 8n) | BigInt(bytes[i]);
  }
  return result;
}

export function fromBigIntLE(value: bigint, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  let v = value;

  for (let i = 0; i < length; i++) {
    bytes[i] = Number(v & 0xFFn);
    v = v >> 8n;
  }

  return bytes;
}

export function isInField(value: bigint): boolean {
  return value >= 0n && value < FIELD_SIZE;
}

export function assertInField(value: bigint): void {
  if (!isInField(value)) {
    throw new Error(`Value ${value} is not in the field`);
  }
}

export default {
  FIELD_SIZE,
  SUBGROUP_ORDER,
  mod,
  addMod,
  subMod,
  mulMod,
  powMod,
  invMod,
  divMod,
  isQuadraticResidue,
  sqrtMod,
  randomFieldElement,
  toBigIntLE,
  fromBigIntLE,
  isInField,
  assertInField
};
