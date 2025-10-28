export { X402Protocol } from './core/x402Protocol';
export type { Transaction, PrivateTransaction } from './core/x402Protocol';

export { ZKSnarkProver, generateProof, verifyProof } from './proofs/zkSnark';
export type { ProofInput, Proof, VerificationKey } from './proofs/zkSnark';

export { PaymentCircuit } from './circuits/paymentCircuit';
export type { CircuitSignals, CircuitConstraints } from './circuits/paymentCircuit';

export { buildPoseidon, poseidonHash } from './crypto/poseidon';

export {
  encryptAmount,
  decryptAmount,
  generateRandomSecret,
  hashSecret,
  encryptData,
  decryptData
} from './crypto/encryption';

export {
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
  assertInField,
  FIELD_SIZE,
  SUBGROUP_ORDER
} from './utils/fieldMath';

export { MerkleTree } from './utils/merkleTree';

export default {
  X402Protocol,
  ZKSnarkProver,
  PaymentCircuit,
  MerkleTree,
  buildPoseidon,
  poseidonHash,
  encryptAmount,
  decryptAmount,
  generateProof,
  verifyProof,
  generateRandomSecret,
  hashSecret
};
