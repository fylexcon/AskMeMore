import * as SQLite from "expo-sqlite";

import type { CategoryId, ProgressSummary, QuestionSource } from "@ask-me-more/contracts";
import { deckManifest } from "@ask-me-more/content";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

type PendingRollup = {
  key: string;
  categoryId: CategoryId;
  source: QuestionSource;
  answeredCount: number;
  completedDeck: boolean;
  happenedOn: string;
};

export type LocalSnapshot = {
  summary: ProgressSummary;
  recentByCategory: Record<CategoryId, string[]>;
};

function emptySummary(): ProgressSummary {
  return {
    streakDays: 0,
    totalAnswered: 0,
    decksStarted: 0,
    syncedAt: null,
    perCategory: Object.fromEntries(
      deckManifest.categories.map((category) => [
        category.id,
        {
          answeredCount: 0,
          totalQuestions: category.totalQuestions,
          completed: false,
        },
      ]),
    ) as ProgressSummary["perCategory"],
  };
}

async function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("ask-me-more.db");
  }
  return dbPromise;
}

export async function initializeLocalDatabase() {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS question_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id TEXT NOT NULL,
      source TEXT NOT NULL,
      question TEXT NOT NULL,
      answered_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS deck_progress (
      category_id TEXT PRIMARY KEY NOT NULL,
      answered_count INTEGER NOT NULL DEFAULT 0,
      total_questions INTEGER NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS daily_activity (
      day TEXT PRIMARY KEY NOT NULL,
      answered_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS pending_sync (
      key TEXT PRIMARY KEY NOT NULL,
      category_id TEXT NOT NULL,
      source TEXT NOT NULL,
      answered_count INTEGER NOT NULL,
      completed_deck INTEGER NOT NULL DEFAULT 0,
      happened_on TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  for (const category of deckManifest.categories) {
    await db.runAsync(
      `INSERT OR IGNORE INTO deck_progress (category_id, answered_count, total_questions, completed)
       VALUES (?, 0, ?, 0)`,
      category.id,
      category.totalQuestions,
    );
  }
}

export async function loadLocalSnapshot(): Promise<LocalSnapshot> {
  const db = await getDb();
  const progressRows = (await db.getAllAsync(
    "SELECT category_id, answered_count, total_questions, completed FROM deck_progress",
  )) as Array<{
    category_id: CategoryId;
    answered_count: number;
    total_questions: number;
    completed: number;
  }>;

  const dayRows = (await db.getAllAsync(
    "SELECT day, answered_count FROM daily_activity ORDER BY day DESC",
  )) as Array<{ day: string; answered_count: number }>;

  const historyRows = (await db.getAllAsync(
    `SELECT category_id, question
     FROM question_history
     ORDER BY answered_at DESC
     LIMIT 30`,
  )) as Array<{ category_id: CategoryId; question: string }>;

  const summary = emptySummary();
  for (const row of progressRows) {
    summary.perCategory[row.category_id] = {
      answeredCount: row.answered_count,
      totalQuestions: row.total_questions,
      completed: Boolean(row.completed),
    };
  }

  summary.totalAnswered = Object.values(summary.perCategory).reduce(
    (sum, entry) => sum + entry.answeredCount,
    0,
  );
  summary.decksStarted = Object.values(summary.perCategory).filter((entry) => entry.answeredCount > 0).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = new Set(dayRows.filter((row) => row.answered_count > 0).map((row) => row.day));
  while (days.has(today.toISOString().slice(0, 10))) {
    summary.streakDays += 1;
    today.setDate(today.getDate() - 1);
  }

  const recentByCategory = Object.fromEntries(
    deckManifest.categories.map((category) => [category.id, [] as string[]]),
  ) as Record<CategoryId, string[]>;

  for (const row of historyRows) {
    if (recentByCategory[row.category_id].length < 5) {
      recentByCategory[row.category_id].push(row.question);
    }
  }

  return {
    summary,
    recentByCategory,
  };
}

export async function recordAnsweredQuestion(input: {
  categoryId: CategoryId;
  source: QuestionSource;
  question: string;
  completedDeck: boolean;
}) {
  const db = await getDb();
  const today = new Date().toISOString().slice(0, 10);
  const key = `${today}:${input.categoryId}:${input.source}:${Date.now()}`;

  await db.runAsync(
    `INSERT INTO question_history (category_id, source, question, answered_at)
     VALUES (?, ?, ?, ?)`,
    input.categoryId,
    input.source,
    input.question,
    new Date().toISOString(),
  );

  await db.runAsync(
    `UPDATE deck_progress
     SET answered_count = answered_count + 1,
         completed = CASE WHEN ? = 1 THEN 1 ELSE completed END
     WHERE category_id = ?`,
    input.completedDeck ? 1 : 0,
    input.categoryId,
  );

  await db.runAsync(
    `INSERT INTO daily_activity (day, answered_count)
     VALUES (?, 1)
     ON CONFLICT(day) DO UPDATE SET answered_count = answered_count + 1`,
    today,
  );

  await db.runAsync(
    `INSERT INTO pending_sync (key, category_id, source, answered_count, completed_deck, happened_on)
     VALUES (?, ?, ?, ?, ?, ?)`,
    key,
    input.categoryId,
    input.source,
    1,
    input.completedDeck ? 1 : 0,
    today,
  );
}

export async function listPendingSyncRollups(): Promise<PendingRollup[]> {
  const db = await getDb();
  const rows = (await db.getAllAsync(
    "SELECT key, category_id, source, answered_count, completed_deck, happened_on FROM pending_sync ORDER BY key ASC LIMIT 100",
  )) as Array<{
    key: string;
    category_id: CategoryId;
    source: QuestionSource;
    answered_count: number;
    completed_deck: number;
    happened_on: string;
  }>;

  return rows.map((row) => ({
    key: row.key,
    categoryId: row.category_id,
    source: row.source,
    answeredCount: row.answered_count,
    completedDeck: Boolean(row.completed_deck),
    happenedOn: row.happened_on,
  }));
}

export async function markRollupsSynced(keys: string[]) {
  if (keys.length === 0) {
    return;
  }

  const db = await getDb();
  const placeholders = keys.map(() => "?").join(", ");
  await db.runAsync(`DELETE FROM pending_sync WHERE key IN (${placeholders})`, ...keys);
}
