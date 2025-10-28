import { ethers } from 'ethers';

export class MerkleTree {
  private leaves: string[];
  private layers: string[][];
  private depth: number;

  constructor(leaves: string[], depth?: number) {
    this.leaves = leaves;
    this.depth = depth || Math.ceil(Math.log2(leaves.length)) || 1;
    this.layers = [];
    this.buildTree();
  }

  private buildTree(): void {
    let currentLayer = [...this.leaves];

    while (currentLayer.length < 2 ** this.depth) {
      currentLayer.push(ethers.ZeroHash);
    }

    this.layers.push(currentLayer);

    while (currentLayer.length > 1) {
      const nextLayer: string[] = [];

      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : currentLayer[i];
        const hash = this.hashPair(left, right);
        nextLayer.push(hash);
      }

      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }
  }

  private hashPair(left: string, right: string): string {
    return ethers.keccak256(
      ethers.solidityPacked(['bytes32', 'bytes32'], [left, right])
    );
  }

  getRoot(): string {
    return this.layers[this.layers.length - 1][0];
  }

  getProof(index: number): string[] {
    if (index < 0 || index >= this.leaves.length) {
      throw new Error('Index out of bounds');
    }

    const proof: string[] = [];
    let currentIndex = index;

    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i];
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

      if (siblingIndex < layer.length) {
        proof.push(layer[siblingIndex]);
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return proof;
  }

  getProofWithPositions(index: number): { proof: string[]; positions: boolean[] } {
    if (index < 0 || index >= this.leaves.length) {
      throw new Error('Index out of bounds');
    }

    const proof: string[] = [];
    const positions: boolean[] = [];
    let currentIndex = index;

    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i];
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

      if (siblingIndex < layer.length) {
        proof.push(layer[siblingIndex]);
        positions.push(isRightNode);
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return { proof, positions };
  }

  static verifyProof(
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

  static verifyProofWithPositions(
    leaf: string,
    proof: string[],
    positions: boolean[],
    root: string
  ): boolean {
    let currentHash = leaf;

    for (let i = 0; i < proof.length; i++) {
      const proofElement = proof[i];
      const isRight = positions[i];

      if (isRight) {
        currentHash = ethers.keccak256(
          ethers.solidityPacked(['bytes32', 'bytes32'], [proofElement, currentHash])
        );
      } else {
        currentHash = ethers.keccak256(
          ethers.solidityPacked(['bytes32', 'bytes32'], [currentHash, proofElement])
        );
      }
    }

    return currentHash === root;
  }

  addLeaf(leaf: string): number {
    this.leaves.push(leaf);
    this.buildTree();
    return this.leaves.length - 1;
  }

  updateLeaf(index: number, newLeaf: string): void {
    if (index < 0 || index >= this.leaves.length) {
      throw new Error('Index out of bounds');
    }

    this.leaves[index] = newLeaf;
    this.buildTree();
  }

  getLeaves(): string[] {
    return [...this.leaves];
  }

  getDepth(): number {
    return this.depth;
  }

  getLayer(layerIndex: number): string[] {
    if (layerIndex < 0 || layerIndex >= this.layers.length) {
      throw new Error('Layer index out of bounds');
    }
    return [...this.layers[layerIndex]];
  }
}

export default MerkleTree;
