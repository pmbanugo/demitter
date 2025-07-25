#!/usr/bin/env node

/**
 * @fileoverview CLI for starting the ZeroMQ Pub/Sub forwarder
 */

import { startStandaloneForwarder } from './forwarder.js'

const help = `
demitter-forwarder - ZeroMQ Pub/Sub Forwarder

Usage: node src/cli.js [options]

Environment Variables:
  XSUB_PORT     Port for XSUB socket (default: 5555)
  XPUB_PORT     Port for XPUB socket (default: 5556) 
  XSUB_ADDRESS  Full address for XSUB socket (default: tcp://*:XSUB_PORT)
  XPUB_ADDRESS  Full address for XPUB socket (default: tcp://*:XPUB_PORT)
  LOG_LEVEL     Log level (default: info)

Examples:
  node src/cli.js
  XSUB_PORT=6000 XPUB_PORT=6001 node src/cli.js
  LOG_LEVEL=debug node src/cli.js
`

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(help)
  process.exit(0)
}

startStandaloneForwarder().catch(error => {
  console.error('Failed to start forwarder:', error.message)
  process.exit(1)
})
