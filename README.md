# Demitter - Distributed Event Emitter (Pub/Sub) for Node.js

Extend your events across processes, threads, and machines. Demitter brings the familiar [Node.js event API (via emittery)](https://github.com/sindresorhus/emittery) API to distributed systems, enabling real-time event communication between multiple Node.js processes with near-zero configuration.

## 🎬 See It In Action

[![Watch the live auction demo](https://cdn.hashnode.com/res/hashnode/image/upload/v1753995587144/e68de3ad-8d72-4c15-9674-907de936d572.gif?auto=format,compress&gif-q=60&format=webm)](https://www.youtube.com/watch?v=LqQShQ9-dsk)

**_Live auction system with multiple bidders across separate terminal processes - all synchronized in real-time_**

## ✨ Features

- 🚀 **Distributed Events**: Emit events across processes, threads, or machines
- ⚡ **Zero Configuration**: Works out of the box with sensible defaults
- 🎯 **Familiar API**: Extends the battle-tested [sindresorhus/emittery](https://github.com/sindresorhus/emittery) library
- 🛡️ **Type Safe**: Full TypeScript support
- 📦 **Lightweight**: Efficient binary serialization with minimal overhead
- 🔧 **Flexible**: Embedded or standalone message proxy/forwarder deployment options

## 📦 Installation

```bash
npm install demitter
# or
pnpm install demitter
# or
yarn add demitter
```

## 🚀 Quick Start

Get distributed events running in 3 steps:

### 1. Start the Message Forwarder

```javascript
import { createForwarder } from "demitter";

const forwarder = await createForwarder();
console.log("Forwarder ready - events can now flow between processes!");
```

### 2. Create Distributed Emitters

```javascript
import { createDistributedEmitter } from "demitter";

// In Process A
const emitterA = await createDistributedEmitter();

// In Process B
const emitterB = await createDistributedEmitter();
```

### 3. Emit Events Across Processes

```javascript
// Process A: Listen for events
emitterA.on("user:login", (data) => {
  console.log("User logged in:", data);
});

// Process B: Emit events that Process A will receive
emitterB.emit("user:login", { userId: 123, timestamp: Date.now() });
```

That's it! Events emitted in one process are automatically received by all other connected processes.

## 🔌 API Reference

Demitter extends the powerful [emittery](https://github.com/sindresorhus/emittery/tree/v1.2.0?tab=readme-ov-file#api) API with distributed capabilities. All emittery methods work exactly the same:

### Core Methods

```javascript
// All the familiar emittery methods work across processes:
await emitter.emit(eventName, data);
emitter.on(eventName, listener);
emitter.off(eventName, listener);
await emitter.once(eventName);
emitter.onAny(listener);
emitter.clearListeners();
// ... and many more
```

> 📖 **Full API Documentation**: See the complete [emittery API docs](https://github.com/sindresorhus/emittery/tree/v1.2.0?tab=readme-ov-file#api) for all available methods, TypeScript usage, and advanced features.

### Distributed-Specific APIs

#### `createDistributedEmitter(options?)`

Creates a new distributed emitter instance.

```javascript
const emitter = await createDistributedEmitter({
  xsubAddress: "tcp://localhost:5555", // Connect to forwarder
  xpubAddress: "tcp://localhost:5556", // Connect to forwarder
});
```

#### `createForwarder(options?)`

Creates and starts a message forwarder to enable event distribution.

```javascript
const forwarder = await createForwarder({
  xsubPort: 5555, // Default port for subscribers
  xpubPort: 5556, // Default port for publishers
});
```

#### `emitter.close()`

Closes the distributed emitter and cleans up connections.

```javascript
await emitter.close();
```

#### Events

- **`distributed:error`**: Emitted when distributed operations fail (network issues, serialization errors, etc.)

```javascript
emitter.on("distributed:error", (error) => {
  console.error("Distributed operation failed:", error);
});
```

## 🎯 Use Cases

- **Microservices Communication**: Event-driven architecture between services
- **Multi-Process Applications**: Coordinate events across worker processes
- **Real-Time Systems**: Live updates, notifications, and state synchronization
- **Distributed Logging**: Centralized event collection from multiple sources
- **Game Development**: Real-time multiplayer game state management
- **IoT Networks**: Device communication and sensor data distribution

## 🗂️ Examples

Explore practical examples in the [`examples/`](./examples/) directory:

- **[`basic-usage.ts`](./examples/basic-usage.ts)** - Simple distributed events setup
- **[`error-handling.ts`](./examples/error-handling.ts)** - Robust error handling patterns
- **[`live_auction/`](./examples/live_auction/)** - Complete live auction system demo
  - Multi-process auction with bidders, controller, and spectator dashboard
  - Real-time terminal UIs with charts and analytics
  - Intelligent bidding strategies and conflict resolution

### Running Examples

```bash
# Basic usage
pnpm run example:basic

# Error handling
pnpm run example:errors

# Live auction demo (see examples/live_auction/auction-demo/README.md)
cd examples/live_auction/auction-demo
pnpm install
pnpm run demo
```

## 🚀 Deployment Options

### Embedded Forwarder

Start the forwarder within your application:

```javascript
import { createForwarder, createDistributedEmitter } from "demitter";

const forwarder = await createForwarder();
const emitter = await createDistributedEmitter();
```

### Standalone Forwarder

Run the forwarder as a separate service:

```bash
# Using the CLI
npx demitter-forwarder

# Or start with custom ports
XSUB_PORT=7777 XPUB_PORT=8888 npx demitter-forwarder
```

### Docker Deployment

```dockerfile
FROM node:22-alpine
RUN npm install -g demitter
EXPOSE 5555 5556
CMD ["demitter-forwarder"]
```

## Architecture

The system consists of two main components:

1. **Pub/Sub Forwarder** - A standalone message broker that forwards events between distributed processes
2. **DistributedEmitter** - An extension of `Emittery` class in the [emittery library](#) for distributed event emission

## Pub/Sub Forwarder

The forwarder acts as a central message broker using ZeroMQ's XSUB-XPUB proxy pattern.

### Usage

#### As a global CLI command:

After installing the package globally:

```bash
npm install -g demitter
# or
pnpm install -g demitter
```

You can run the forwarder from anywhere:

```bash
# Start with default ports (XSUB: 5555, XPUB: 5556)
demitter-forwarder

# With custom ports
XSUB_PORT=6000 XPUB_PORT=6001 demitter-forwarder

# With debug logging
LOG_LEVEL=debug demitter-forwarder

# Show help
demitter-forwarder --help
```

#### As a local CLI command:

For projects with demitter as a dependency:

```bash
npx demitter-forwarder
```

#### As a standalone process:

```bash
# Start with default ports (XSUB: 5555, XPUB: 5556)
node src/forwarder.js

# Or using the CLI script
node src/cli.js

# With custom ports
XSUB_PORT=6000 XPUB_PORT=6001 node src/forwarder.js

# With debug logging
LOG_LEVEL=debug node src/forwarder.js
```

#### As a module:

```javascript
import { createForwarder } from "./src/forwarder.js";

// Start forwarder with default configuration
const forwarder = await createForwarder();

// Custom configuration
const forwarder = await createForwarder({
  xsubPort: 6000,
  xpubPort: 6001,
  loggerOptions: { level: "debug" },
});

// Graceful shutdown
await forwarder.close();
```

### Configuration

The forwarder can be configured using environment variables:

| Variable       | Default                | Description                                     |
| -------------- | ---------------------- | ----------------------------------------------- |
| `XSUB_PORT`    | 5555                   | Port for XSUB socket (receives from publishers) |
| `XPUB_PORT`    | 5556                   | Port for XPUB socket (sends to subscribers)     |
| `XSUB_ADDRESS` | `tcp://*:${XSUB_PORT}` | Full address for XSUB socket                    |
| `XPUB_ADDRESS` | `tcp://*:${XPUB_PORT}` | Full address for XPUB socket                    |
| `LOG_LEVEL`    | info                   | Logging level (debug, info, warn, error)        |

### CLI Help

```bash
demitter-forwarder --help
# or when running locally
node src/cli.js --help
```

## License

See [LICENSE](LICENSE) file.

## 🤝 Contributing

I'm open to contributions but the details for contributions are not yet finalized. If you have ideas or improvements, feel free to open an issue or start a discussion before you raise a pull request.
