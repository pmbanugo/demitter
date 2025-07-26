/**
 * @fileoverview DistributedEmitter - Extends emittery for distributed event emission
 */

import Emittery, {
  type EventName,
  type EmitteryOncePromise,
  type UnsubscribeFunction,
  type ListenerChangedData,
} from "emittery";
import { Publisher, Subscriber } from "zeromq";
import { pack, unpack } from "msgpackr";
import hyperid from "hyperid";

/**
 * Configuration options for DistributedEmitter
 */
export interface DistributedEmitterConfig {
  /** Address to connect publisher to forwarder's Subscription channel */
  xsubAddress?: string;
  /** Address to connect subscriber to forwarder's Publication channel */
  xpubAddress?: string;
}

/**
 * Error event data for distributed events
 */
export interface DistributedErrorEventData {
  type: "deserialization" | "network" | "emission";
  error: string;
  topic?: string;
  eventName?: EventName;
  data?: unknown;
}

/**
 * Extended event data that includes distributed error events
 */
type DistributedEventData<EventData> = EventData & {
  "distributed:error": DistributedErrorEventData;
};

/**
 * Check if an event name can be distributed over the network
 */
function canDistributeEventName(eventName: EventName): boolean {
  switch (typeof eventName) {
    case "string":
    case "number":
      return true;
    case "symbol":
      // Only distribute symbols that have descriptions or are global symbols
      return (
        eventName.description !== undefined ||
        Symbol.keyFor(eventName) !== undefined
      );
    default:
      return false;
  }
}

/**
 * Serialize an event name for ZeroMQ transport
 */
function serializeEventName(eventName: EventName): string {
  switch (typeof eventName) {
    case "string":
      return `s:${eventName}`;
    case "symbol": {
      const globalKey = Symbol.keyFor(eventName);
      if (globalKey !== undefined) {
        return `g:${globalKey}`;
      }
      const description = eventName.description;
      if (description !== undefined) {
        return `y:${description}`;
      }
      throw new Error(
        "Cannot serialize symbol without description or global key over the network"
      );
    }
    case "number":
      return `n:${eventName}`;
    default:
      throw new Error(`Unsupported event name type: ${typeof eventName}`);
  }
}

/**
 * Deserialize an event name from ZeroMQ transport
 */
function deserializeEventName(serializedEventName: string): EventName {
  if (!serializedEventName || serializedEventName.length < 2) {
    throw new Error("Invalid serialized event name");
  }

  const type = serializedEventName[0];
  const value = serializedEventName.slice(2);

  switch (type) {
    case "s":
      return value;
    case "g":
      return Symbol.for(value); // Global symbol
    case "y":
      return Symbol(value); // Symbol with description
    case "n":
      return Number(value);
    default:
      throw new Error(`Unknown event name type: ${type}`);
  }
}

/**
 * A distributed event emitter that extends Emittery to work across processes/machines via ZeroMQ
 */
export class DistributedEmitter<
  EventData = Record<EventName, any>
> extends Emittery<DistributedEventData<EventData>> {
  private readonly _xsubAddress: string;
  private readonly _xpubAddress: string;
  private readonly _publisher: Publisher;
  private readonly _subscriber: Subscriber;
  private _isInitialized = false;
  private readonly _originId: string;

  /**
   * @param config - Configuration options
   */
  constructor(config: DistributedEmitterConfig = {}) {
    super();

    const {
      xsubAddress = process.env.XSUB_ADDRESS || "tcp://localhost:5555",
      xpubAddress = process.env.XPUB_ADDRESS || "tcp://localhost:5556",
    } = config;

    this._xsubAddress = xsubAddress;
    this._xpubAddress = xpubAddress;
    this._publisher = new Publisher();
    this._subscriber = new Subscriber();
    this._originId = hyperid()();

    this._setupEventHandlers();
  }

  /**
   * Initialize the ZeroMQ connections and start listening
   */
  async initialize(): Promise<void> {
    if (this._isInitialized) {
      return;
    }

    try {
      // Connect publisher to forwarder's XSUB socket
      this._publisher.connect(this._xsubAddress);

      // Connect subscriber to forwarder's XPUB socket
      this._subscriber.connect(this._xpubAddress);

      // Start listening for incoming messages
      this._startListening();

      this._isInitialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize DistributedEmitter: ${(error as Error).message}`
      );
    }
  }

  /**
   * Set up internal event handlers for dynamic subscription management
   */
  private _setupEventHandlers(): void {
    // Handle when listeners are added
    this.on(Emittery.listenerAdded, (data: ListenerChangedData) => {
      const { eventName } = data;
      // If this is the first listener for this event, subscribe to the topic
      // TODO: if the eventName is undefined, it means they used `.onAny()` or `.offAny()`, perhaps we should consider subscribing to all topics (i.e. `this._subscriber.subscribe()` instead)
      if (
        eventName &&
        this.listenerCount(eventName as keyof EventData) === 1 &&
        this._isInitialized
      ) {
        this._subscribeToTopic(eventName as EventName);
      }
    });

    // Handle when listeners are removed
    this.on(Emittery.listenerRemoved, (data: ListenerChangedData) => {
      const { eventName } = data;
      // If no more listeners for this event, unsubscribe from the topic
      // TODO: if the eventName is undefined, it means they used `.offAny()`, perhaps we should consider unsubscribing to all topics (i.e. `this._subscriber.unsubscribe()` instead)
      if (
        eventName &&
        this.listenerCount(eventName as keyof EventData) === 0 &&
        this._isInitialized
      ) {
        this._unsubscribeFromTopic(eventName as EventName);
      }
    });
  }

  /**
   * Subscribe to a ZeroMQ topic
   */
  private _subscribeToTopic(eventName: EventName): void {
    // Only subscribe to events that can be distributed
    if (!canDistributeEventName(eventName)) {
      return;
    }

    const serializedEventName = serializeEventName(eventName);
    this._subscriber.subscribe(serializedEventName);
  }

  /**
   * Unsubscribe from a ZeroMQ topic
   */
  private _unsubscribeFromTopic(eventName: EventName): void {
    // Only unsubscribe from events that can be distributed
    if (!canDistributeEventName(eventName)) {
      return;
    }

    const serializedEventName = serializeEventName(eventName);
    this._subscriber.unsubscribe(serializedEventName);
  }

  /**
   * Start listening for incoming messages from the subscriber
   */
  private _startListening(): void {
    // Use async iteration to continuously listen for messages
    (async () => {
      try {
        for await (const frames of this._subscriber) {
          try {
            // Expect 3-part message: [eventName, originId, data]
            if (frames.length !== 3) {
              continue; // Skip malformed messages
            }

            const [topicFrame, originIdFrame, payloadFrame] = frames;
            const serializedEventName = topicFrame.toString();
            const eventName = deserializeEventName(serializedEventName);
            const originId = originIdFrame.toString();

            // Check if this message originated from this instance
            if (originId === this._originId) {
              // Skip own messages to prevent feedback loop
              continue;
            }

            // Only unpack the payload if we're going to use it
            const data = unpack(payloadFrame);

            // Emit locally using parent's emit to avoid feedback loop
            super.emit(eventName as keyof EventData, data);
          } catch (deserializationError) {
            // Emit error event for deserialization failures
            super.emit("distributed:error", {
              type: "deserialization",
              error: (deserializationError as Error).message,
              topic: frames[0]?.toString(),
            } as DistributedEventData<EventData>["distributed:error"]);
          }
        }
      } catch (error) {
        // Emit error event for network/connection failures
        super.emit("distributed:error", {
          type: "network",
          error: (error as Error).message,
        } as DistributedEventData<EventData>["distributed:error"]);
      }
    })();
  }

  /**
   * Emit an event both locally and to the distributed system
   * Locally triggers an event asynchronously, optionally with some data.
   * Listeners are called in the order they were added, but executed concurrently.
   *
   * @returns A promise that resolves when all the event listeners are done. *Done* meaning executed if synchronous or resolved when an async/promise-returning function. You usually wouldn't want to wait for this, but you could for example catch possible errors. If any of the listeners throw/reject, the returned promise will be rejected with the error, but the other listeners will not be affected.
   */
  override async emit<Name extends keyof EventData>(
    eventName: Name,
    data?: EventData[Name]
  ): Promise<void> {
    // First emit locally to maintain emittery behavior
    await super.emit(eventName, data as any); // uses `as any` to avoid type warning. The underlying emittery implementation accepts two arguments where data is optional.

    // Then emit to the distributed system if initialized and event can be distributed
    if (this._isInitialized && canDistributeEventName(eventName as EventName)) {
      try {
        // Pack only the actual data
        const serializedData = pack(data);
        // Serialize the event name for ZeroMQ transport
        const serializedEventName = serializeEventName(eventName as EventName);
        // Send as 3-part message: [serializedEventName, originId, serializedData]
        await this._publisher.send([
          serializedEventName,
          this._originId,
          serializedData,
        ]);
      } catch (error) {
        // Emit error event for serialization or network failures
        await super.emit("distributed:error", {
          type: "emission",
          error: (error as Error).message,
          eventName,
          data,
        } as DistributedEventData<EventData>["distributed:error"]);
      }
    }
  }

  /**
   * Close the ZeroMQ connections and cleanup
   */
  async close(): Promise<void> {
    if (!this._isInitialized) {
      return;
    }

    try {
      // Close ZeroMQ sockets
      this._publisher.close();
      this._subscriber.close();

      // Clear all listeners
      this.clearListeners();

      this._isInitialized = false;
    } catch (error) {
      throw new Error(
        `Failed to close DistributedEmitter: ${(error as Error).message}`
      );
    }
  }
}

/**
 * Create and initialize a new DistributedEmitter instance
 */
export async function createDistributedEmitter<
  EventData = Record<EventName, any>
>(
  config: DistributedEmitterConfig = {}
): Promise<DistributedEmitter<EventData>> {
  const emitter = new DistributedEmitter<EventData>(config);
  await emitter.initialize();
  return emitter;
}
