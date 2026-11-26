import mongoose from "mongoose";

let memoryServer: { stop: () => Promise<unknown> } | null = null;

/**
 * Connects to MongoDB using MONGODB_URI, or falls back to an ephemeral
 * in-memory MongoDB server when USE_IN_MEMORY_DB=true is set for local testing.
 */
export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  const useMemory = process.env.USE_IN_MEMORY_DB === "true" || !uri;

  if (useMemory) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const server = await MongoMemoryServer.create();
    memoryServer = server;
    const memUri = server.getUri();
    await mongoose.connect(memUri);
    console.log("[db] Connected to ephemeral in-memory MongoDB");
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
