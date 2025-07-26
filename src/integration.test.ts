/**
 * @fileoverview Integration tests for the complete distributed event system
 */

import test from "node:test";
import assert from "node:assert";
import { setTimeout } from "node:timers/promises";
import { createDistributedEmitter } from "./distributed-emitter.js";
import { createForwarder } from "./forwarder.js";

test("End-to-end distributed event emission", async () => {
  // Use unique ports for this test
  const xsubPort = 8555;
  const xpubPort = 8556;

  // Start the forwarder
  const forwarder = await createForwarder({
    xsubPort,
    xpubPort,
    loggerOptions: { level: "silent" }, // Suppress logs during tests
  });

  try {
    // Create two distributed emitters
    const emitter1 = await createDistributedEmitter({
      xsubAddress: `tcp://localhost:${xsubPort}`,
      xpubAddress: `tcp://localhost:${xpubPort}`,
    });

    const emitter2 = await createDistributedEmitter({
      xsubAddress: `tcp://localhost:${xsubPort}`,
      xpubAddress: `tcp://localhost:${xpubPort}`,
    });

    // Set up listener on emitter2
    const receivedEvents: any[] = [];
    emitter2.on("test-message", (data: any) => {
      receivedEvents.push(data);
    });

    // Give a moment for subscriptions to propagate
    await setTimeout(100);

    // Emit from emitter1
    await emitter1.emit("test-message", { sender: "emitter1", value: 42 });

    // Give a moment for message to propagate
    await setTimeout(100);

    // Verify the message was received
    assert.strictEqual(receivedEvents.length, 1);
    assert.deepStrictEqual(receivedEvents[0], {
      sender: "emitter1",
      value: 42,
    });

    await emitter1.close();
    await emitter2.close();
  } finally {
    await forwarder.close();
  }
});

test("Multiple events and complex data types", async () => {
  const xsubPort = 8557;
  const xpubPort = 8558;

  const forwarder = await createForwarder({
    xsubPort,
    xpubPort,
    loggerOptions: { level: "silent" },
  });

  try {
    const publisher = await createDistributedEmitter({
      xsubAddress: `tcp://localhost:${xsubPort}`,
      xpubAddress: `tcp://localhost:${xpubPort}`,
    });

    const subscriber = await createDistributedEmitter({
      xsubAddress: `tcp://localhost:${xsubPort}`,
      xpubAddress: `tcp://localhost:${xpubPort}`,
    });

    const receivedEvents = new Map<string, any>();

    // Subscribe to multiple event types
    subscriber.on("string-event", (data: any) => {
      receivedEvents.set("string-event", data);
    });

    subscriber.on("object-event", (data: any) => {
      receivedEvents.set("object-event", data);
    });

    subscriber.on("array-event", (data: any) => {
      receivedEvents.set("array-event", data);
    });

    await setTimeout(100);

    // Emit various data types
    await publisher.emit("string-event", "Hello World");
    await publisher.emit("object-event", {
      nested: { value: 123 },
      array: [1, 2, 3],
      date: new Date("2024-01-01"),
    });
    await publisher.emit("array-event", [{ id: 1 }, { id: 2 }, { id: 3 }]);

    await setTimeout(200);

    // Verify all events were received correctly
    assert.strictEqual(receivedEvents.get("string-event"), "Hello World");

    const objectEvent = receivedEvents.get("object-event");
    assert.strictEqual(objectEvent.nested.value, 123);
    assert.deepStrictEqual(objectEvent.array, [1, 2, 3]);
    assert.ok(objectEvent.date instanceof Date);

    const arrayEvent = receivedEvents.get("array-event");
    assert.strictEqual(arrayEvent.length, 3);
    assert.strictEqual(arrayEvent[0].id, 1);

    await publisher.close();
    await subscriber.close();
  } finally {
    await forwarder.close();
  }
});

test("Dynamic subscription management", async () => {
  const xsubPort = 8559;
  const xpubPort = 8560;

  const forwarder = await createForwarder({
    xsubPort,
    xpubPort,
    loggerOptions: { level: "silent" },
  });

  try {
    const publisher = await createDistributedEmitter({
      xsubAddress: `tcp://localhost:${xsubPort}`,
      xpubAddress: `tcp://localhost:${xpubPort}`,
    });

    const subscriber = await createDistributedEmitter({
      xsubAddress: `tcp://localhost:${xsubPort}`,
      xpubAddress: `tcp://localhost:${xpubPort}`,
    });

    let eventCount = 0;

    // Add a listener
    const unsubscribe = subscriber.on("dynamic-event", () => {
      eventCount++;
    });

    await setTimeout(100);

    // Emit while subscribed
    await publisher.emit("dynamic-event", "test1");
    await setTimeout(100);
    assert.strictEqual(eventCount, 1);

    // Remove the listener
    unsubscribe();
    await setTimeout(100);

    // Emit after unsubscribing - should not receive
    await publisher.emit("dynamic-event", "test2");
    await setTimeout(100);
    assert.strictEqual(eventCount, 1); // Should still be 1

    await publisher.close();
    await subscriber.close();
  } finally {
    await forwarder.close();
  }
});

test("Multiple subscribers for same event", async () => {
  const xsubPort = 8561;
  const xpubPort = 8562;

  const forwarder = await createForwarder({
    xsubPort,
    xpubPort,
    loggerOptions: { level: "silent" },
  });

  try {
    const publisher = await createDistributedEmitter({
      xsubAddress: `tcp://localhost:${xsubPort}`,
      xpubAddress: `tcp://localhost:${xpubPort}`,
    });

    const subscriber1 = await createDistributedEmitter({
      xsubAddress: `tcp://localhost:${xsubPort}`,
      xpubAddress: `tcp://localhost:${xpubPort}`,
    });

    const subscriber2 = await createDistributedEmitter({
      xsubAddress: `tcp://localhost:${xsubPort}`,
      xpubAddress: `tcp://localhost:${xpubPort}`,
    });

    let count1 = 0;
    let count2 = 0;

    subscriber1.on("broadcast-event", () => {
      count1++;
    });
    subscriber2.on("broadcast-event", () => {
      count2++;
    });

    await setTimeout(100);

    await publisher.emit("broadcast-event", "broadcast message");
    await setTimeout(100);

    // Both subscribers should receive the event
    assert.strictEqual(count1, 1);
    assert.strictEqual(count2, 1);

    await publisher.close();
    await subscriber1.close();
    await subscriber2.close();
  } finally {
    await forwarder.close();
  }
});

test("Local and distributed emission coexistence", async () => {
  const xsubPort = 8563;
  const xpubPort = 8564;

  const forwarder = await createForwarder({
    xsubPort,
    xpubPort,
    loggerOptions: { level: "silent" },
  });

  try {
    const emitter1 = await createDistributedEmitter({
      xsubAddress: `tcp://localhost:${xsubPort}`,
      xpubAddress: `tcp://localhost:${xpubPort}`,
    });

    const emitter2 = await createDistributedEmitter({
      xsubAddress: `tcp://localhost:${xsubPort}`,
      xpubAddress: `tcp://localhost:${xpubPort}`,
    });

    let emitter1LocalCount = 0;
    let emitter1DistributedCount = 0;
    let emitter2Count = 0;

    // Both emitters listen to the same event
    emitter1.on("shared-event", () => {
      emitter1LocalCount++;
    });
    emitter2.on("shared-event", () => {
      emitter2Count++;
    });

    // Emitter1 also listens to distributed events from emitter2
    emitter1.on("from-emitter2", () => {
      emitter1DistributedCount++;
    });

    await setTimeout(100);

    // Test 1: Emit from emitter1 - emitter1 local listener should be called once,
    // emitter2 should also receive it, but emitter1 should NOT receive its own message
    await emitter1.emit("shared-event", "test data");
    await setTimeout(100);

    assert.strictEqual(
      emitter1LocalCount,
      1,
      "Emitter1 local listener should be called once"
    );
    assert.strictEqual(
      emitter2Count,
      1,
      "Emitter2 should receive the distributed message"
    );

    // Test 2: Emit from emitter2 - only emitter1 should receive this distributed event
    await emitter2.emit("from-emitter2", "from emitter2");
    await setTimeout(100);

    assert.strictEqual(
      emitter1DistributedCount,
      1,
      "Emitter1 should receive distributed event from emitter2"
    );

    // Verify counts haven't changed unexpectedly
    assert.strictEqual(
      emitter1LocalCount,
      1,
      "Emitter1 local count should still be 1"
    );
    assert.strictEqual(emitter2Count, 1, "Emitter2 count should still be 1");

    await emitter1.close();
    await emitter2.close();
  } finally {
    await forwarder.close();
  }
});
