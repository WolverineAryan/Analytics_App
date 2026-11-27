import fs from "fs";
import path from "path";
import mongoose from "mongoose";

let memoryServer: { stop: () => Promise<unknown> } | null = null;

/**
 * Connects to MongoDB using MONGODB_URI, or falls back to a local
 * persisted MongoMemoryServer when USE_IN_MEMORY_DB=true is set.
 */
export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  const useMemory = process.env.USE_IN_MEMORY_DB === "true" || !uri;

  if (useMemory) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const dbPath = path.resolve(__dirname, "../../.mongodb-data");
    fs.mkdirSync(dbPath, { recursive: true });

    const server = await MongoMemoryServer.create({
      instance: {
        dbPath,
        storageEngine: "wiredTiger",
      },
    });
    memoryServer = server;
    const memUri = server.getUri();
    await mongoose.connect(memUri);
    console.log(`[db] Connected to local persisted MongoDB (${dbPath})`);
    return;
  }

  await mongoose.connect(uri);
  console.log("[db] Connected to MongoDB");
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
