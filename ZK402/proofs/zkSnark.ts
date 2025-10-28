import { ethers } from 'ethers';
import { buildPoseidon } from '../crypto/poseidon';

export interface ProofInput {
  [key: string]: any;
}

export interface Proof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

export interface VerificationKey {
  protocol: string;
  curve: string;
  nPublic: number;
  vk_alpha_1: string[];
  vk_beta_2: string[][];
  vk_gamma_2: string[][];
  vk_delta_2: string[][];
  vk_alphabeta_12: string[][];
  IC: string[][];
}

export class ZKSnarkProver {
  private poseidon: any;
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (!this.initialized) {
      this.poseidon = await buildPoseidon();
      this.initialized = true;
    }
  }

  async generateProof(inputs: ProofInput): Promise<string> {
    await this.initialize();

    const witness = await this.calculateWitness(inputs);
    const proof = await this.createProof(witness);

    return this.serializeProof(proof);
  }

  private async calculateWitness(inputs: ProofInput): Promise<bigint[]> {
    const witness: bigint[] = [];

    witness.push(BigInt(1));

    if (inputs.amount) {
      witness.push(BigInt(inputs.amount));
    }

    if (inputs.nullifier) {
      const nullifierBigInt = BigInt(inputs.nullifier);
      witness.push(nullifierBigInt);
    }

    if (inputs.commitment) {
      const commitmentBigInt = BigInt(inputs.commitment);
      witness.push(commitmentBigInt);
    }

    if (inputs.secret) {
      const secretHash = ethers.keccak256(ethers.toUtf8Bytes(inputs.secret));
      witness.push(BigInt(secretHash));
    }

    if (inputs.from) {
      witness.push(BigInt(inputs.from));
    }

    if (inputs.to) {
      witness.push(BigInt(inputs.to));
    }

    return witness;
  }

  private async createProof(witness: bigint[]): Promise<Proof> {
    const proofData: Proof = {
      pi_a: [
        witness[1]?.toString() || '0',
        witness[2]?.toString() || '0',
        '1'
      ],
      pi_b: [
        [witness[3]?.toString() || '0', witness[4]?.toString() || '0'],
        [witness[5]?.toString() || '0', witness[6]?.toString() || '0'],
        ['1', '0']
      ],
      pi_c: [
        witness[0]?.toString() || '1',
        this.poseidon([witness[1], witness[2]]).toString(),
        '1'
      ],
      protocol: 'groth16',
      curve: 'bn128'
    };

    return proofData;
  }

  private serializeProof(proof: Proof): string {
    return JSON.stringify(proof);
  }

  async verifyProof(
    proofStr: string,
    publicInputs: string[]
  ): Promise<boolean> {
    await this.initialize();

    try {
      const proof = JSON.parse(proofStr) as Proof;

      if (proof.protocol !== 'groth16') {
        return false;
      }

      const isValidStructure =
        proof.pi_a.length === 3 &&
        proof.pi_b.length === 3 &&
        proof.pi_c.length === 3;

      if (!isValidStructure) {
        return false;
      }

      const computedHash = this.poseidon([
        BigInt(proof.pi_a[0]),
        BigInt(proof.pi_a[1])
      ]);

      const expectedHash = BigInt(proof.pi_c[1]);

      const hashesMatch = computedHash === expectedHash;

      const publicInputsValid = publicInputs.every((input) => {
        const inputBigInt = BigInt(input);
        return inputBigInt > 0n;
      });

      return isValidStructure && hashesMatch && publicInputsValid;
    } catch (error) {
      console.error('Proof verification error:', error);
      return false;
    }
  }
}

const proverInstance = new ZKSnarkProver();

export async function generateProof(inputs: ProofInput): Promise<string> {
  return await proverInstance.generateProof(inputs);
}

export async function verifyProof(
  proof: string,
  publicInputs: string[]
): Promise<boolean> {
  return await proverInstance.verifyProof(proof, publicInputs);
}

export default ZKSnarkProver;
