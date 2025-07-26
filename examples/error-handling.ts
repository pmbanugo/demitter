/**
 * @fileoverview Example demonstrating error handling in the distributed event emitter
 */

import { createDistributedEmitter, createForwarder } from "../src/index.js";

async function errorHandlingExample(): Promise<void> {
  console.log("🚀 Starting error handling example...\n");

  // Start forwarder
  const forwarder = await createForwarder({
    xsubPort: 5557,
    xpubPort: 5558,
    loggerOptions: { level: "warn" }, // Only show warnings and errors
  });

  try {
    const emitter = await createDistributedEmitter({
      xsubAddress: "tcp://localhost:5557",
      xpubAddress: "tcp://localhost:5558",
    });

    // Set up error event listener
    emitter.on("distributed:error", (error: any) => {
      console.log("❌ Distributed error occurred:", {
        type: error.type,
        message: error.error,
        eventName: error.eventName || "N/A",
      });
    });

    // Set up regular event listener
    emitter.on("test-event", (data: any) => {
      console.log("✅ Received test-event:", data);
    });

    await new Promise<void>((resolve) => setTimeout(resolve, 100));

    console.log("📤 Emitting valid event...");
    await emitter.emit("test-event", { message: "This should work fine" });

    // Wait for valid event to process
    await new Promise<void>((resolve) => setTimeout(resolve, 200));

    console.log("\n📤 Emitting event with problematic data...");

    // Create circular reference (will cause serialization error)
    const circularData: any = { name: "test" };
    circularData.self = circularData;

    await emitter.emit("problematic-event", circularData);

    // Wait for error to be emitted
    await new Promise<void>((resolve) => setTimeout(resolve, 200));

    console.log("\n🧹 Cleaning up...");
    await emitter.close();
  } finally {
    await forwarder.close();
  }

  console.log("✅ Error handling example complete");
}

errorHandlingExample().catch((error: Error) => {
  console.error("❌ Example failed:", error);
  process.exit(1);
});
