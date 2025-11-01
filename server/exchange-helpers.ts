import { decryptCredential } from "./encryption";
import type { ExchangeConnection } from "@shared/schema";

export function getDecryptedCredentials(connection: ExchangeConnection) {
  return {
    apiKey: connection.apiKey,
    apiSecret: decryptCredential(connection.apiSecret),
    passphrase: connection.passphrase ? decryptCredential(connection.passphrase) : undefined,
    isTestnet: connection.isTestnet,
  };
}
