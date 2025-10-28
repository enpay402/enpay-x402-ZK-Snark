import { ethers } from 'ethers';
import { generateProof, verifyProof } from '../proofs/zkSnark';
import { encryptAmount, decryptAmount } from '../crypto/encryption';

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: bigint;
  timestamp: number;
  proof?: string;
  nullifier: string;
  commitment: string;
}

export interface PrivateTransaction {
  encryptedAmount: string;
  proof: string;
  nullifier: string;
  commitment: string;
  publicInputs: string[];
}

export class X402Protocol {
  private provider: ethers.Provider | null = null;

  constructor(provider?: ethers.Provider) {
    this.provider = provider || null;
  }

  async createPrivateTransaction(
    from: string,
    to: string,
    amount: bigint,
    secret: string
  ): Promise<PrivateTransaction> {
    const nullifier = this.generateNullifier(from, secret);
    const commitment = this.generateCommitment(to, amount, nullifier);

    const encryptedAmount = await encryptAmount(amount.toString(), secret);

    const proof = await generateProof({
      from,
      to,
      amount: amount.toString(),
      nullifier,
      commitment,
      secret
    });

    return {
      encryptedAmount,
      proof,
      nullifier,
      commitment,
      publicInputs: [nullifier, commitment]
    };
  }

  async verifyPrivateTransaction(
    privateTransaction: PrivateTransaction
  ): Promise<boolean> {
    try {
      const isValid = await verifyProof(
        privateTransaction.proof,
        privateTransaction.publicInputs
      );

      return isValid;
    } catch (error) {
      console.error('Verification failed:', error);
      return false;
    }
  }

  async decryptTransactionAmount(
    encryptedAmount: string,
    secret: string
  ): Promise<bigint> {
    const decrypted = await decryptAmount(encryptedAmount, secret);
    return BigInt(decrypted);
  }

  generateNullifier(address: string, secret: string): string {
    const hash = ethers.keccak256(
      ethers.solidityPacked(['address', 'string'], [address, secret])
    );
    return hash;
  }

  generateCommitment(
    recipient: string,
    amount: bigint,
    nullifier: string
  ): string {
    const hash = ethers.keccak256(
      ethers.solidityPacked(
        ['address', 'uint256', 'bytes32'],
        [recipient, amount, nullifier]
      )
    );
    return hash;
  }

  async batchTransactions(
    transactions: PrivateTransaction[]
  ): Promise<{ batchProof: string; batchRoot: string }> {
    const commitments = transactions.map(tx => tx.commitment);
    const batchRoot = this.computeMerkleRoot(commitments);

    const batchProof = await generateProof({
      transactions: transactions.map(tx => ({
        commitment: tx.commitment,
        nullifier: tx.nullifier
      })),
      merkleRoot: batchRoot
    });

    return {
      batchProof,
      batchRoot
    };
  }

  private computeMerkleRoot(leaves: string[]): string {
    if (leaves.length === 0) return ethers.ZeroHash;
    if (leaves.length === 1) return leaves[0];

    const newLevel: string[] = [];
    for (let i = 0; i < leaves.length; i += 2) {
      const left = leaves[i];
      const right = i + 1 < leaves.length ? leaves[i + 1] : leaves[i];
      const combined = ethers.keccak256(
        ethers.solidityPacked(['bytes32', 'bytes32'], [left, right])
      );
      newLevel.push(combined);
    }

    return this.computeMerkleRoot(newLevel);
  }

  async createMerkleProof(
    leaves: string[],
    leafIndex: number
  ): Promise<string[]> {
    const proof: string[] = [];
    let currentLevel = leaves;
    let currentIndex = leafIndex;

    while (currentLevel.length > 1) {
      const newLevel: string[] = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : currentLevel[i];

        if (i === currentIndex || i + 1 === currentIndex) {
          proof.push(i === currentIndex ? right : left);
        }

        const combined = ethers.keccak256(
          ethers.solidityPacked(['bytes32', 'bytes32'], [left, right])
        );
        newLevel.push(combined);
      }

      currentIndex = Math.floor(currentIndex / 2);
      currentLevel = newLevel;
    }

    return proof;
  }

  verifyMerkleProof(
    leaf: string,
    proof: string[],
    root: string,
    index: number
  ): boolean {
    let currentHash = leaf;
    let currentIndex = index;

    for (const proofElement of proof) {
      if (currentIndex % 2 === 0) {
        currentHash = ethers.keccak256(
          ethers.solidityPacked(['bytes32', 'bytes32'], [currentHash, proofElement])
        );
      } else {
        currentHash = ethers.keccak256(
          ethers.solidityPacked(['bytes32', 'bytes32'], [proofElement, currentHash])
        );
      }
      currentIndex = Math.floor(currentIndex / 2);
    }

    return currentHash === root;
  }
}

export default X402Protocol;
