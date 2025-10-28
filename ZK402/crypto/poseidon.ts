const FIELD_SIZE = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');

const POSEIDON_CONSTANTS = {
  t: 6,
  nRoundsF: 8,
  nRoundsP: 57,
};

function mod(a: bigint, m: bigint = FIELD_SIZE): bigint {
  const result = a % m;
  return result >= 0n ? result : result + m;
}

function pow5(x: bigint): bigint {
  const x2 = mod(x * x);
  const x4 = mod(x2 * x2);
  return mod(x4 * x);
}

class PoseidonHash {
  private C: bigint[] = [];
  private M: bigint[][] = [];
  private t: number;
  private nRoundsF: number;
  private nRoundsP: number;

  constructor() {
    this.t = POSEIDON_CONSTANTS.t;
    this.nRoundsF = POSEIDON_CONSTANTS.nRoundsF;
    this.nRoundsP = POSEIDON_CONSTANTS.nRoundsP;
    this.initializeConstants();
  }

  private initializeConstants(): void {
    const totalRounds = this.nRoundsF + this.nRoundsP;

    for (let i = 0; i < totalRounds * this.t; i++) {
      this.C.push(BigInt(i + 1) * BigInt(0x30644e72e131a029b85045b68181585d));
    }

    for (let i = 0; i < this.t; i++) {
      this.M[i] = [];
      for (let j = 0; j < this.t; j++) {
        this.M[i][j] = BigInt((i + 1) * (j + 1));
      }
    }
  }

  private ark(state: bigint[], round: number): bigint[] {
    const newState = [...state];
    for (let i = 0; i < this.t; i++) {
      newState[i] = mod(newState[i] + this.C[round * this.t + i]);
    }
    return newState;
  }

  private sbox(state: bigint[], round: number, fullRound: boolean): bigint[] {
    const newState = [...state];
    if (fullRound) {
      for (let i = 0; i < this.t; i++) {
        newState[i] = pow5(newState[i]);
      }
    } else {
      newState[0] = pow5(newState[0]);
    }
    return newState;
  }

  private mix(state: bigint[]): bigint[] {
    const newState: bigint[] = new Array(this.t).fill(0n);
    for (let i = 0; i < this.t; i++) {
      for (let j = 0; j < this.t; j++) {
        newState[i] = mod(newState[i] + mod(this.M[i][j] * state[j]));
      }
    }
    return newState;
  }

  hash(inputs: bigint[]): bigint {
    let state: bigint[] = new Array(this.t).fill(0n);

    for (let i = 0; i < inputs.length && i < this.t - 1; i++) {
      state[i + 1] = mod(inputs[i]);
    }

    const halfRoundsF = this.nRoundsF / 2;

    for (let r = 0; r < halfRoundsF; r++) {
      state = this.ark(state, r);
      state = this.sbox(state, r, true);
      state = this.mix(state);
    }

    for (let r = 0; r < this.nRoundsP; r++) {
      state = this.ark(state, halfRoundsF + r);
      state = this.sbox(state, halfRoundsF + r, false);
      state = this.mix(state);
    }

    for (let r = 0; r < halfRoundsF; r++) {
      state = this.ark(state, halfRoundsF + this.nRoundsP + r);
      state = this.sbox(state, halfRoundsF + this.nRoundsP + r, true);
      state = this.mix(state);
    }

    return state[0];
  }
}

let poseidonInstance: PoseidonHash | null = null;

export async function buildPoseidon(): Promise<(inputs: bigint[]) => bigint> {
  if (!poseidonInstance) {
    poseidonInstance = new PoseidonHash();
  }

  return (inputs: bigint[]) => {
    if (!poseidonInstance) {
      throw new Error('Poseidon not initialized');
    }
    return poseidonInstance.hash(inputs);
  };
}

export function poseidonHash(inputs: bigint[]): bigint {
  if (!poseidonInstance) {
    poseidonInstance = new PoseidonHash();
  }
  return poseidonInstance.hash(inputs);
}

export default buildPoseidon;
