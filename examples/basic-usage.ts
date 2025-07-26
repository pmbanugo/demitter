/**
 * @fileoverview Basic usage example of the distributed event emitter system
 */

import { createDistributedEmitter, createForwarder } from "../src/index.js";

async function basicUsageExample(): Promise<void> {
  console.log("🚀 Starting distributed event emitter example...\n");

  // Start the forwarder (message broker)
  console.log("📡 Starting forwarder...");
  const forwarder = await createForwarder({
    xsubPort: 5555,
    xpubPort: 5556,
    loggerOptions: { level: "info" },
  });
  console.log("✅ Forwarder started\n");

  // Create two distributed emitters (simulating different processes)
  console.log("🔌 Creating distributed emitters...");
  const emitter1 = await createDistributedEmitter({
    xsubAddress: "tcp://localhost:5555",
    xpubAddress: "tcp://localhost:5556",
  });

  const emitter2 = await createDistributedEmitter({
    xsubAddress: "tcp://localhost:5555",
    xpubAddress: "tcp://localhost:5556",
  });
  console.log("✅ Emitters created\n");

  // Set up event listeners
  console.log("👂 Setting up event listeners...");

  emitter1.on("user-action", (data: any) => {
    console.log(`[Emitter 1] Received user-action:`, data);
  });

  emitter2.on("system-notification", (data: any) => {
    console.log(`[Emitter 2] Received system-notification:`, data);
  });

  emitter2.on("user-action", (data: any) => {
    console.log(`[Emitter 2] Also received user-action:`, data);
  });

  // Give subscribers time to register
  await new Promise<void>((resolve) => setTimeout(resolve, 100));
  console.log("✅ Listeners registered\n");

  // Emit some events
  console.log("📤 Emitting events...\n");

  await emitter1.emit("user-action", {
    userId: "user123",
    action: "login",
    timestamp: new Date().toISOString(),
  });

  await emitter2.emit("system-notification", {
    type: "maintenance",
    message: "System will be down for maintenance at 2 AM",
    severity: "warning",
  });

  await emitter1.emit("user-action", {
    userId: "user456",
    action: "purchase",
    item: "premium-subscription",
    amount: 29.99,
  });

  // Wait for messages to propagate
  await new Promise<void>((resolve) => setTimeout(resolve, 500));

  console.log("\n🧹 Cleaning up...");
  await emitter1.close();
  await emitter2.close();
  await forwarder.close();
  console.log("✅ Cleanup complete");
}

// Handle graceful shutdown
const shutdown = async (): Promise<void> => {
  console.log("\n⚠️  Received shutdown signal, cleaning up...");
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Run the example
basicUsageExample().catch((error: Error) => {
  console.error("❌ Example failed:", error);
  process.exit(1);
});
