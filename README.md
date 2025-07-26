# Demitter

A distributed event emitter system for Node.js.

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
