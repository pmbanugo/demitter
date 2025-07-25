/**
 * @fileoverview Pub/Sub Forwarder - A standalone message broker
 * that forwards messages between distributed event emitters.
 */

import { Proxy, XPublisher, XSubscriber } from "zeromq";
import { pino } from "pino";

/**
 * Configuration options for the forwarder
 * @typedef {Object} ForwarderConfig
 * @property {number} [xsubPort=5555] - Port for XSUB socket (receives from publishers)
 * @property {number} [xpubPort=5556] - Port for XPUB socket (sends to subscribers)
 * @property {string} [xsubAddress] - Full address for XSUB socket
 * @property {string} [xpubAddress] - Full address for XPUB socket
 * @property {Object} [loggerOptions] - Pino logger configuration options
 */

/**
 * Forwarder instance returned by createForwarder
 * @typedef {Object} ForwarderInstance
 * @property {import('zeromq').Proxy} proxy - The ZeroMQ proxy instance
 * @property {import('pino').Logger} logger - The pino logger instance
 * @property {() => Promise<void>} close - Function to gracefully shutdown the forwarder
 */

/**
 * Creates and starts a ZeroMQ Pub/Sub forwarder
 * @param {ForwarderConfig} [config={}] - Configuration options
 * @returns {Promise<ForwarderInstance>} Object containing proxy instance and close function
 */
export async function createForwarder(config = {}) {
  const {
    xsubPort = Number(process.env.XSUB_PORT) || 5555,
    xpubPort = Number(process.env.XPUB_PORT) || 5556,
    xsubAddress = process.env.XSUB_ADDRESS || `tcp://*:${xsubPort}`,
    xpubAddress = process.env.XPUB_ADDRESS || `tcp://*:${xpubPort}`,
    loggerOptions = {},
  } = config;

  // Configure logger with environment variables
  const logLevel = process.env.LOG_LEVEL || "info";
  const logger = pino({
    level: logLevel,
    ...loggerOptions,
  });

  // eslint-ignore
  const proxy = new Proxy(new XSubscriber(), new XPublisher());

  try {
    // Bind XSUB socket (receives from publishers)
    await proxy.frontEnd.bind(xsubAddress);
    logger.info({ address: xsubAddress }, "XSUB socket bound");

    // Bind XPUB socket (sends to subscribers)
    await proxy.backEnd.bind(xpubAddress);
    logger.info({ address: xpubAddress }, "XPUB socket bound");

    // Start the proxy
    proxy.run();
    logger.info("ZeroMQ Pub/Sub forwarder started");

    return {
      proxy,
      logger,
      async close() {
        logger.info("Stopping forwarder...");
        proxy.terminate();
        await proxy.frontEnd.close();
        await proxy.backEnd.close();
        logger.info("Forwarder stopped");
      },
    };
  } catch (error) {
    logger.error(
      { error: /** @type {Error} */ (error).message },
      "Failed to start forwarder"
    );
    throw error;
  }
}

/**
 * Starts a standalone forwarder process
 * Can be run directly: node src/forwarder.js
 * @returns {Promise<ForwarderInstance>} The forwarder instance
 */
export async function startStandaloneForwarder() {
  const forwarder = await createForwarder();

  // Graceful shutdown handling
  const shutdown = async (/** @type {string} */ signal) => {
    forwarder.logger.info({ signal }, "Received shutdown signal");
    await forwarder.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("SIGUSR2", shutdown); // nodemon restart signal

  return forwarder;
}

// Run as standalone if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startStandaloneForwarder().catch((error) => {
    console.error("Failed to start forwarder:", error.message);
    process.exit(1);
  });
}
