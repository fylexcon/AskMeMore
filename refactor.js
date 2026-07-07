import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const memoryStorePath = path.join(__dirname, "apps/api/src/repositories/memory.ts");
let memoryStore = fs.readFileSync(memoryStorePath, "utf-8");

const methods = [
  "createOtp", "validateOtp", "getOtp", "findUserByEmail", "findUserById",
  "upsertUser", "markUserDeleted", "saveSession", "getSessionByAccessToken",
  "getSessionByRefreshToken", "revokeSession", "createRelationship",
  "joinRelationship", "getRelationshipForUser", "getRelationshipIdForUser",
  "saveUnlockCode", "redeemUnlockCode", "setAdminEntitlement", "getEntitlement",
  "upsertProgress", "getProgressSummary", "appendAIRequest", "appendAnalytics",
  "appendReportedQuestion", "setContentManifest", "setFeatureFlag"
];

for (const method of methods) {
  const regex = new RegExp(`(  |\\t)(${method}\\()`, "g");
  memoryStore = memoryStore.replace(regex, "$1async $2");
}

fs.writeFileSync(memoryStorePath, memoryStore);

const runtimePath = path.join(__dirname, "apps/api/src/services/runtime.ts");
let runtime = fs.readFileSync(runtimePath, "utf-8");
runtime = runtime.replace(/issueSession\(userId: string, deviceName: string\): SessionRecord;/g, "issueSession(userId: string, deviceName: string): Promise<SessionRecord>;");
runtime = runtime.replace(/refreshSession\(refreshToken: string\): SessionRecord \| null;/g, "refreshSession(refreshToken: string): Promise<SessionRecord | null>;");
runtime = runtime.replace(/validateAccessToken\(accessToken: string\): SessionRecord \| null;/g, "validateAccessToken(accessToken: string): Promise<SessionRecord | null>;");
runtime = runtime.replace(/revokeRefreshToken\(refreshToken: string\): void;/g, "revokeRefreshToken(refreshToken: string): Promise<void>;");
runtime = runtime.replace(/issueSession\(userId, deviceName\) {/g, "async issueSession(userId, deviceName) {");
runtime = runtime.replace(/refreshSession\(refreshToken\) {/g, "async refreshSession(refreshToken) {");
runtime = runtime.replace(/validateAccessToken\(accessToken\) {/g, "async validateAccessToken(accessToken) {");
runtime = runtime.replace(/revokeRefreshToken\(refreshToken\) {/g, "async revokeRefreshToken(refreshToken) {");

runtime = runtime.replace(/store\.saveSession\(session\)/g, "await store.saveSession(session)");
runtime = runtime.replace(/existing = store\.getSessionByRefreshToken/g, "existing = await store.getSessionByRefreshToken");
runtime = runtime.replace(/store\.revokeSession/g, "await store.revokeSession");
runtime = runtime.replace(/return store\.getSessionByAccessToken/g, "return await store.getSessionByAccessToken");
runtime = runtime.replace(/return runtime\.issueSession/g, "return await runtime.issueSession");
runtime = runtime.replace(/store: MemoryStore;/g, "store: IStore;");

const istore = `
export interface IStore {
  createOtp(email: string, code: string, deviceName: string, expiresAt: string): Promise<void>;
  validateOtp(email: string, code: string): Promise<boolean>;
  getOtp(email: string): Promise<import("../types.js").OtpRecord | null>;
  findUserByEmail(email: string): Promise<import("../types.js").UserRecord | null>;
  findUserById(userId: string): Promise<import("../types.js").UserRecord | null>;
  upsertUser(email: string): Promise<import("../types.js").UserRecord>;
  markUserDeleted(userId: string): Promise<void>;
  saveSession(session: import("../types.js").SessionRecord): Promise<void>;
  getSessionByAccessToken(token: string): Promise<import("../types.js").SessionRecord | null>;
  getSessionByRefreshToken(token: string): Promise<import("../types.js").SessionRecord | null>;
  revokeSession(refreshToken: string): Promise<void>;
  createRelationship(userId: string, displayName: string): Promise<import("../types.js").RelationshipRecord | null>;
  joinRelationship(userId: string, inviteCode: string): Promise<{ error: "already_joined" | "not_found" | "full" } | { relationship: import("../types.js").RelationshipRecord }>;
  getRelationshipForUser(userId: string): Promise<(import("../types.js").RelationshipRecord & { memberCount: number }) | null>;
  getRelationshipIdForUser(userId: string): Promise<string | null>;
  saveUnlockCode(code: import("../types.js").UnlockCodeRecord): Promise<void>;
  redeemUnlockCode(code: string, userId: string, relationshipId: string): Promise<{ error: "not_found" | "already_redeemed" } | { expiresAt: string }>;
  setAdminEntitlement(relationshipId: string): Promise<void>;
  getEntitlement(relationshipId: string | null): Promise<import("@ask-me-more/contracts").EntitlementStatus>;
  upsertProgress(userId: string, rollups: import("@ask-me-more/contracts").ProgressRollupInput[]): Promise<string>;
  getProgressSummary(userId: string): Promise<import("@ask-me-more/contracts").ProgressSummary>;
  appendAIRequest(record: import("../types.js").AIRequestRecord): Promise<void>;
  appendAnalytics(record: import("../types.js").AnalyticsEventRecord): Promise<void>;
  appendReportedQuestion(record: import("../types.js").ReportedQuestionRecord): Promise<void>;
  setContentManifest(update: import("../types.js").ContentManifestRecord): Promise<void>;
  setFeatureFlag(flag: import("../types.js").FeatureFlagRecord): Promise<void>;
}
`;

runtime = runtime.replace("export type AppRuntime = {", istore + "\\nexport type AppRuntime = {");
fs.writeFileSync(runtimePath, runtime);

const appTsPath = path.join(__dirname, "apps/api/src/app.ts");
let appTs = fs.readFileSync(appTsPath, "utf-8");
appTs = appTs.replace(/store\?: MemoryStore;/g, "store?: import('./services/runtime.js').IStore;");
fs.writeFileSync(appTsPath, appTs);

// Refactor routes
const routesDir = path.join(__dirname, "apps/api/src/routes");
const files = fs.readdirSync(routesDir);
for (const file of files) {
  if (!file.endsWith(".ts")) continue;
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, "utf-8");
  
  // replace app.runtime.store.method() with await app.runtime.store.method()
  for (const method of methods) {
    const regex = new RegExp(\`([^a-zA-Z0-9_])(app\\.runtime\\.store\\.\${method}\\()\`, "g");
    content = content.replace(regex, "$1await $2");
  }
  content = content.replace(/([^a-zA-Z0-9_])(app\.runtime\.issueSession\()/g, "$1await $2");
  content = content.replace(/([^a-zA-Z0-9_])(app\.runtime\.refreshSession\()/g, "$1await $2");
  content = content.replace(/([^a-zA-Z0-9_])(app\.runtime\.revokeRefreshToken\()/g, "$1await $2");
  content = content.replace(/await await /g, "await ");
  
  fs.writeFileSync(filePath, content);
}

console.log("Refactoring complete");
