/**
 * @fileoverview Unit tests for DistributedEmitter
 */

import test from "node:test";
import assert from "node:assert";
import {
  DistributedEmitter,
  createDistributedEmitter,
} from "./distributed-emitter.js";
import { createForwarder } from "./forwarder.js";

test("DistributedEmitter constructor", () => {
  const emitter = new DistributedEmitter();
  assert.ok(emitter instanceof DistributedEmitter);
  assert.ok(emitter.emit);
  assert.ok(emitter.on);
  assert.ok(emitter.once);
});

test("DistributedEmitter configuration", () => {
  const config = {
    xsubAddress: "tcp://localhost:7777",
    xpubAddress: "tcp://localhost:7778",
  };

  const emitter = new DistributedEmitter(config);
  assert.strictEqual((emitter as any)._xsubAddress, "tcp://localhost:7777");
  assert.strictEqual((emitter as any)._xpubAddress, "tcp://localhost:7778");
});

test("createDistributedEmitter factory function", async () => {
  // Use different ports to avoid conflicts
  const config = {
    xsubAddress: "tcp://localhost:9555",
    xpubAddress: "tcp://localhost:9556",
  };

  // Start forwarder first
  const forwarder = await createForwarder({
    xsubPort: 9555,
    xpubPort: 9556,
  });

  try {
    const emitter = await createDistributedEmitter(config);
    assert.ok(emitter instanceof DistributedEmitter);
    assert.strictEqual((emitter as any)._isInitialized, true);

    await emitter.close();
  } finally {
    await forwarder.close();
  }
});

test("Local emit functionality", async () => {
  const emitter = new DistributedEmitter();

  let eventReceived = false;
  let receivedData: any = null;

  emitter.on("test-event", (data: any) => {
    eventReceived = true;
    receivedData = data;
  });

  await emitter.emit("test-event", { message: "hello" });

  assert.strictEqual(eventReceived, true);
  assert.deepStrictEqual(receivedData, { message: "hello" });
});

test("Error handling for distributed errors", async () => {
  const emitter = new DistributedEmitter();

  let errorReceived = false;
  let errorData: any = null;

  emitter.on("distributed:error", (error: any) => {
    errorReceived = true;
    errorData = error;
  });

  // Initialize with invalid addresses to trigger error
  (emitter as any)._xsubAddress = "invalid://address";
  (emitter as any)._xpubAddress = "invalid://address";

  try {
    await emitter.initialize();
  } catch (error) {
    assert.ok(
      (error as Error).message.includes(
        "Failed to initialize DistributedEmitter"
      )
    );
  }
});
