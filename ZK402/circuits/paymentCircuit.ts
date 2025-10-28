import { ethers } from 'ethers';

export interface CircuitSignals {
  amount: bigint;
  nullifier: bigint;
  commitment: bigint;
  recipient: bigint;
  secret: bigint;
}

export interface CircuitConstraints {
  A: bigint[][];
  B: bigint[][];
  C: bigint[][];
}

export class PaymentCircuit {
  private signals: Map<string, bigint> = new Map();
  private constraints: CircuitConstraints = {
    A: [],
    B: [],
    C: []
  };

  constructor() {
    this.initializeCircuit();
  }

  private initializeCircuit(): void {
    this.signals.set('one', BigInt(1));
  }

  setSignal(name: string, value: bigint): void {
    this.signals.set(name, value);
  }

  getSignal(name: string): bigint | undefined {
    return this.signals.get(name);
  }

  defineConstraint(
    A: bigint[],
    B: bigint[],
    C: bigint[]
  ): void {
    this.constraints.A.push(A);
    this.constraints.B.push(B);
    this.constraints.C.push(C);
  }

  computeCommitment(
    recipient: string,
    amount: bigint,
    nullifier: string
  ): bigint {
    const hash = ethers.keccak256(
      ethers.solidityPacked(
        ['address', 'uint256', 'bytes32'],
        [recipient, amount, nullifier]
      )
    );
    return BigInt(hash);
  }

  computeNullifier(address: string, secret: string): bigint {
    const hash = ethers.keccak256(
      ethers.solidityPacked(['address', 'string'], [address, secret])
    );
    return BigInt(hash);
  }

  verifyRangeProof(value: bigint, min: bigint, max: bigint): boolean {
    return value >= min && value <= max;
  }

  addRangeConstraint(signal: string, min: bigint, max: bigint): void {
    const value = this.signals.get(signal);
    if (value === undefined) {
      throw new Error(`Signal ${signal} not found`);
    }

    const isInRange = this.verifyRangeProof(value, min, max);
    if (!isInRange) {
      throw new Error(`Signal ${signal} is out of range [${min}, ${max}]`);
    }

    this.defineConstraint(
      [value],
      [BigInt(1)],
      [value]
    );
  }

  addEqualityConstraint(signal1: string, signal2: string): void {
    const value1 = this.signals.get(signal1);
    const value2 = this.signals.get(signal2);

    if (value1 === undefined || value2 === undefined) {
      throw new Error('One or both signals not found');
    }

    this.defineConstraint(
      [value1],
      [BigInt(1)],
      [value2]
    );
  }

  addMultiplicationConstraint(
    signal1: string,
    signal2: string,
    resultSignal: string
  ): void {
    const value1 = this.signals.get(signal1);
    const value2 = this.signals.get(signal2);
    const result = this.signals.get(resultSignal);

    if (value1 === undefined || value2 === undefined || result === undefined) {
      throw new Error('One or more signals not found');
    }

    const computed = value1 * value2;
    if (computed !== result) {
      throw new Error('Multiplication constraint failed');
    }

    this.defineConstraint(
      [value1],
      [value2],
      [result]
    );
  }

  verifyCircuit(): boolean {
    try {
      for (let i = 0; i < this.constraints.A.length; i++) {
        const A = this.constraints.A[i];
        const B = this.constraints.B[i];
        const C = this.constraints.C[i];

        const sumA = A.reduce((acc, val) => acc + val, BigInt(0));
        const sumB = B.reduce((acc, val) => acc + val, BigInt(0));
        const sumC = C.reduce((acc, val) => acc + val, BigInt(0));

        if (sumA * sumB !== sumC) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Circuit verification failed:', error);
      return false;
    }
  }

  generateWitness(): bigint[] {
    const witness: bigint[] = [];

    this.signals.forEach((value) => {
      witness.push(value);
    });

    return witness;
  }

  reset(): void {
    this.signals.clear();
    this.constraints = { A: [], B: [], C: [] };
    this.initializeCircuit();
  }
}

export default PaymentCircuit;
