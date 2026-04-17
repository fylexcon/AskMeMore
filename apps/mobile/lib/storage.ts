import * as SecureStore from "expo-secure-store";

import type { AuthSession, EntitlementStatus, RelationshipSummary } from "@ask-me-more/contracts";

const SESSION_KEY = "ask-me-more.session";
const RELATIONSHIP_KEY = "ask-me-more.relationship";
const ENTITLEMENT_KEY = "ask-me-more.entitlement";

async function readJson<T>(key: string): Promise<T | null> {
  const raw = await SecureStore.getItemAsync(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

async function writeJson(key: string, value: unknown) {
  await SecureStore.setItemAsync(key, JSON.stringify(value));
}

export async function loadPersistedSession() {
  const [session, relationship, entitlement] = await Promise.all([
    readJson<AuthSession>(SESSION_KEY),
    readJson<RelationshipSummary | null>(RELATIONSHIP_KEY),
    readJson<EntitlementStatus | null>(ENTITLEMENT_KEY),
  ]);

  return {
    session,
    relationship,
    entitlement,
  };
}

export async function persistSession(session: AuthSession) {
  await writeJson(SESSION_KEY, session);
}

export async function persistRelationship(relationship: RelationshipSummary | null) {
  if (relationship) {
    await writeJson(RELATIONSHIP_KEY, relationship);
    return;
  }
  await SecureStore.deleteItemAsync(RELATIONSHIP_KEY);
}

export async function persistEntitlement(entitlement: EntitlementStatus | null) {
  if (entitlement) {
    await writeJson(ENTITLEMENT_KEY, entitlement);
    return;
  }
  await SecureStore.deleteItemAsync(ENTITLEMENT_KEY);
}

export async function clearPersistedSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(SESSION_KEY),
    SecureStore.deleteItemAsync(RELATIONSHIP_KEY),
    SecureStore.deleteItemAsync(ENTITLEMENT_KEY),
  ]);
}
