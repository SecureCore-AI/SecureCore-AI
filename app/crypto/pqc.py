"""
Quantum-Proof Cryptography (QPC) module.

IMPORTANT / HONEST SCOPE NOTE:
This module provides a working AES-256-GCM envelope-encryption layer today,
plus a clean seam (`KEMProvider`) for plugging in a real post-quantum KEM
(e.g. ML-KEM / Kyber via the `liboqs-python` package) and a real post-quantum
signature scheme (e.g. ML-DSA / Dilithium) once that library is available in
your deployment environment. As shipped, the KEM step uses X25519 (classical,
NOT quantum-resistant by itself) so the code runs without extra system
dependencies. Swap `ClassicalX25519KEM` for a liboqs-backed implementation to
get genuine quantum resistance for the key-encapsulation step -- the rest of
the pipeline (AES-256-GCM data encryption, hash-chained audit integrity)
does not need to change.

Recommended production upgrade path:
    pip install liboqs-python
    from oqs import KeyEncapsulation
    kem = KeyEncapsulation("ML-KEM-768")
    -> implement KEMProvider.generate_keypair / encapsulate / decapsulate
       using kem.generate_keypair(), kem.encap_secret(), kem.decap_secret()

Everything that consumes this module (credential vault, artefact storage,
audit hashing) only talks to the interfaces below, so upgrading the
underlying primitive is a single-file change.
"""
import hashlib
import hmac
import os
from abc import ABC, abstractmethod
from dataclasses import dataclass

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.asymmetric.x25519 import (
    X25519PrivateKey, X25519PublicKey
)
from cryptography.hazmat.primitives import serialization


# ---------------------------------------------------------------------------
# KEM abstraction -- swap the implementation, not the callers
# ---------------------------------------------------------------------------
@dataclass
class KeyPair:
    public_bytes: bytes
    private_bytes: bytes


class KEMProvider(ABC):
    @abstractmethod
    def generate_keypair(self) -> KeyPair: ...

    @abstractmethod
    def encapsulate(self, public_bytes: bytes) -> tuple[bytes, bytes]:
        """Returns (ciphertext, shared_secret)."""

    @abstractmethod
    def decapsulate(self, private_bytes: bytes, ciphertext: bytes) -> bytes:
        """Returns shared_secret."""


class ClassicalX25519KEM(KEMProvider):
    """Placeholder KEM used until a PQC library (e.g. liboqs) is installed.
    Do NOT rely on this alone for long-term quantum resistance."""

    def generate_keypair(self) -> KeyPair:
        priv = X25519PrivateKey.generate()
        pub = priv.public_key()
        return KeyPair(
            public_bytes=pub.public_bytes(
                encoding=serialization.Encoding.Raw,
                format=serialization.PublicFormat.Raw,
            ),
            private_bytes=priv.private_bytes(
                encoding=serialization.Encoding.Raw,
                format=serialization.PrivateFormat.Raw,
                encryption_algorithm=serialization.NoEncryption(),
            ),
        )

    def encapsulate(self, public_bytes: bytes) -> tuple[bytes, bytes]:
        ephemeral = X25519PrivateKey.generate()
        ephemeral_pub = ephemeral.public_key().public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw,
        )
        peer_pub = X25519PublicKey.from_public_bytes(public_bytes)
        shared_secret = ephemeral.exchange(peer_pub)
        # "ciphertext" for an ECDH-based KEM is the ephemeral public key
        return ephemeral_pub, hashlib.sha256(shared_secret).digest()

    def decapsulate(self, private_bytes: bytes, ciphertext: bytes) -> bytes:
        priv = X25519PrivateKey.from_private_bytes(private_bytes)
        peer_pub = X25519PublicKey.from_public_bytes(ciphertext)
        shared_secret = priv.exchange(peer_pub)
        return hashlib.sha256(shared_secret).digest()


# Swap this line for a liboqs-backed provider to go fully post-quantum.
active_kem: KEMProvider = ClassicalX25519KEM()


# ---------------------------------------------------------------------------
# Envelope encryption for credentials / sensitive artefacts
# ---------------------------------------------------------------------------
class SecureVault:
    """Encrypts secrets (credentials, tokens, sensitive artefacts) at rest
    using KEM-derived keys + AES-256-GCM. The KEM layer is where PQC is
    injected (see module docstring)."""

    def __init__(self, kem: KEMProvider = active_kem):
        self.kem = kem

    def seal(self, plaintext: bytes, recipient_public_bytes: bytes) -> dict:
        ciphertext_kem, shared_secret = self.kem.encapsulate(recipient_public_bytes)
        nonce = os.urandom(12)
        aesgcm = AESGCM(shared_secret)
        ct = aesgcm.encrypt(nonce, plaintext, associated_data=None)
        return {
            "kem_ciphertext": ciphertext_kem.hex(),
            "nonce": nonce.hex(),
            "ciphertext": ct.hex(),
        }

    def unseal(self, sealed: dict, recipient_private_bytes: bytes) -> bytes:
        shared_secret = self.kem.decapsulate(
            recipient_private_bytes, bytes.fromhex(sealed["kem_ciphertext"])
        )
        aesgcm = AESGCM(shared_secret)
        return aesgcm.decrypt(
            bytes.fromhex(sealed["nonce"]), bytes.fromhex(sealed["ciphertext"]), associated_data=None
        )


# ---------------------------------------------------------------------------
# Tamper-evident hash chaining for the audit log (HMAC, quantum-safe as a
# symmetric primitive when using SHA-256/384 with sufficiently long keys)
# ---------------------------------------------------------------------------
def chain_hash(prev_hash: str | None, entry_payload: str, chain_key: bytes) -> str:
    """Computes an HMAC-SHA256 chain hash so any historical audit log
    modification is detectable (prev_hash included => tamper anywhere breaks
    the whole downstream chain)."""
    msg = f"{prev_hash or ''}|{entry_payload}".encode("utf-8")
    return hmac.new(chain_key, msg, hashlib.sha256).hexdigest()
