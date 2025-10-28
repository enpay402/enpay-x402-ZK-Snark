# ZK402 - Zero-Knowledge Payment Protocol

A production-ready implementation of the x402 protocol with ZK-SNARK proof systems for private and secure blockchain transactions.

## Overview

ZK402 is a zero-knowledge payment protocol that enables private transactions on blockchain networks. It uses ZK-SNARKs (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge) to prove transaction validity without revealing sensitive information.

## Features

- **Private Transactions**: Hide transaction amounts and participants while maintaining verifiability
- **ZK-SNARK Proofs**: Generate and verify cryptographic proofs for transaction validity
- **Merkle Tree Integration**: Efficient batch verification of multiple transactions
- **Poseidon Hash Function**: Optimized hash function for zero-knowledge circuits
- **Field Arithmetic**: Complete implementation of finite field operations
- **Encryption Layer**: AES-GCM encryption for sensitive data

## Directory Structure

```
ZK402/
├── core/
│   └── x402Protocol.ts      # Main protocol implementation
├── proofs/
│   └── zkSnark.ts           # ZK-SNARK proof generation and verification
├── circuits/
│   └── paymentCircuit.ts    # Circuit definitions for payment logic
├── crypto/
│   ├── poseidon.ts          # Poseidon hash implementation
│   └── encryption.ts        # Encryption utilities
└── utils/
    ├── fieldMath.ts         # Finite field arithmetic
    └── merkleTree.ts        # Merkle tree implementation
```

## Core Components

### X402 Protocol (`core/x402Protocol.ts`)

The main protocol class that orchestrates private transactions:

```typescript
import { X402Protocol } from './ZK402/core/x402Protocol';

const protocol = new X402Protocol();

const privateTransaction = await protocol.createPrivateTransaction(
  fromAddress,
  toAddress,
  amount,
  secret
);

const isValid = await protocol.verifyPrivateTransaction(privateTransaction);
```

**Key Features:**
- Create private transactions with encrypted amounts
- Generate nullifiers to prevent double-spending
- Create commitments for transaction verification
- Batch multiple transactions with Merkle proofs
- Verify transaction validity using ZK-SNARKs

### ZK-SNARK Proofs (`proofs/zkSnark.ts`)

Implementation of Groth16 ZK-SNARK proof system:

```typescript
import { generateProof, verifyProof } from './ZK402/proofs/zkSnark';

const proof = await generateProof({
  from: senderAddress,
  to: recipientAddress,
  amount: '1000000000000000000',
  nullifier: nullifierHash,
  commitment: commitmentHash,
  secret: userSecret
});

const isValid = await verifyProof(proof, publicInputs);
```

**Key Features:**
- Groth16 proof generation
- Witness calculation from inputs
- Proof serialization and deserialization
- Public input verification
- BN128 elliptic curve support

### Payment Circuits (`circuits/paymentCircuit.ts`)

Circuit definitions for payment validation:

```typescript
import { PaymentCircuit } from './ZK402/circuits/paymentCircuit';

const circuit = new PaymentCircuit();
circuit.setSignal('amount', amountBigInt);
circuit.setSignal('nullifier', nullifierBigInt);
circuit.addRangeConstraint('amount', minAmount, maxAmount);
const isValid = circuit.verifyCircuit();
```

**Key Features:**
- Signal management for circuit inputs
- Constraint definitions (equality, multiplication, range)
- Commitment and nullifier computation
- Witness generation
- Circuit verification

### Cryptographic Utilities

#### Poseidon Hash (`crypto/poseidon.ts`)

ZK-friendly hash function optimized for circuits:

```typescript
import { buildPoseidon, poseidonHash } from './ZK402/crypto/poseidon';

const poseidon = await buildPoseidon();
const hash = poseidon([input1, input2, input3]);
```

#### Encryption (`crypto/encryption.ts`)

AES-GCM encryption for transaction data:

```typescript
import { encryptAmount, decryptAmount } from './ZK402/crypto/encryption';

const encrypted = await encryptAmount('1000000', secret);
const decrypted = await decryptAmount(encrypted, secret);
```

### Utilities

#### Field Math (`utils/fieldMath.ts`)

Complete finite field arithmetic operations:

```typescript
import { addMod, mulMod, invMod, powMod } from './ZK402/utils/fieldMath';

const sum = addMod(a, b);
const product = mulMod(a, b);
const inverse = invMod(a);
const power = powMod(base, exponent);
```

#### Merkle Tree (`utils/merkleTree.ts`)

Efficient Merkle tree for batch verification:

```typescript
import { MerkleTree } from './ZK402/utils/merkleTree';

const tree = new MerkleTree(leaves);
const root = tree.getRoot();
const proof = tree.getProof(index);
const isValid = MerkleTree.verifyProof(leaf, proof, root, index);
```

## Transaction Flow

1. **Transaction Creation**:
   - User provides sender, recipient, amount, and secret
   - Protocol generates nullifier (prevents double-spending)
   - Protocol generates commitment (hides transaction details)
   - Amount is encrypted using AES-GCM

2. **Proof Generation**:
   - Circuit witness is calculated from inputs
   - ZK-SNARK proof is generated using Groth16
   - Proof includes public inputs (nullifier, commitment)

3. **Verification**:
   - Verifier checks proof validity
   - Public inputs are validated
   - Commitment structure is verified
   - No sensitive information is revealed

4. **Batch Processing**:
   - Multiple transactions are collected
   - Merkle tree is constructed from commitments
   - Batch proof is generated for efficiency
   - All transactions are verified at once

## Security Features

- **Zero-Knowledge**: Transaction amounts and secrets never revealed
- **Non-Interactive**: Proofs don't require back-and-forth communication
- **Nullifiers**: Prevent double-spending attacks
- **Commitments**: Bind transactions to specific recipients
- **Merkle Proofs**: Efficient membership verification
- **Field Arithmetic**: All operations in secure finite field
- **Encryption**: AES-GCM with PBKDF2 key derivation

## Field Parameters

- **Field Size**: 21888242871839275222246405745257275088548364400416034343698204186575808495617 (BN128 curve)
- **Subgroup Order**: 21888242871839275222246405745257275088696311157297823662689037894645226208583
- **Curve**: BN128 (used in Ethereum)
- **Hash Function**: Poseidon (optimized for ZK circuits)

## Integration Example

```typescript
import { X402Protocol } from './ZK402/core/x402Protocol';
import { ethers } from 'ethers';

async function sendPrivatePayment() {
  const protocol = new X402Protocol();

  const sender = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1';
  const recipient = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';
  const amount = ethers.parseEther('1.0');
  const secret = 'my-secret-key';

  const privateTransaction = await protocol.createPrivateTransaction(
    sender,
    recipient,
    amount,
    secret
  );

  const isValid = await protocol.verifyPrivateTransaction(privateTransaction);

  if (isValid) {
    console.log('Transaction verified successfully!');
  }
}
```

## Performance

- **Proof Generation**: ~100-500ms (depending on circuit complexity)
- **Proof Verification**: ~10-50ms
- **Merkle Proof Generation**: O(log n) where n is number of leaves
- **Field Operations**: Constant time O(1)
- **Hash Operations**: Optimized for ZK circuits

## Roadmap

- [ ] Smart contract integration for on-chain verification
- [ ] Multi-asset support
- [ ] Batch withdrawal optimization
- [ ] Enhanced privacy with mixing
- [ ] Mobile SDK implementation
- [ ] Hardware wallet integration

## License

MIT License - See LICENSE file for details

## References

- [ZK-SNARKs Explained](https://z.cash/technology/zksnarks/)
- [Groth16 Protocol](https://eprint.iacr.org/2016/260.pdf)
- [Poseidon Hash](https://eprint.iacr.org/2019/458.pdf)
- [BN128 Curve](https://eips.ethereum.org/EIPS/eip-196)
