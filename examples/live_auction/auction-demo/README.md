# Live Auction Demo

This is a comprehensive **real-time live auction system** built to showcase the distributed event emitter capabilities of Demitter. Watch as multiple automated bidders compete in live auctions across separate terminal windows, with real-time event synchronization between all processes.

## What You'll Experience

When you run this demo, you'll see:

- **🏛️ Auction Controller**: Manages auction cycles, validates bids, shows real-time auction state and bidding activity
- **🤖 Automated Bidders**: Multiple smart bidders (conservative, aggressive, sniper strategies) competing in real-time
- **🎭 Spectator Dashboard**: Beautiful real-time analytics with charts, live feed, and auction statistics
- **⚡ Distributed Events**: All processes stay perfectly synchronized via Demitter's pub/sub messaging

Each terminal window shows live updates as bids are placed, auctions end, winners are declared, and new auctions begin.

## Features

- **Multi-process distributed architecture** with real-time event propagation
- **Rich terminal UIs** using blessed, blessed-contrib, and chalk
- **Intelligent bidding strategies** (conservative, aggressive, sniper)
- **Real-time analytics** with live charts and statistics
- **Automatic auction cycles** with bid validation and extensions
- **Heartbeat monitoring** with automatic cleanup of disconnected bidders

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm

### 1. Install Dependencies and Build

From the **root of the demitter repository**, run:

```sh
pnpm install  # Install all dependencies (root + workspace packages)
pnpm run build  # Build the Demitter library
```

This single command sequence will:

- Install dependencies for both the root project and the auction demo
- Build the demitter library and make it available to the auction demo
- Set up the workspace properly

### 2. Run the Live Demo

Open **4 separate terminal windows** and run these commands in order **from the auction demo directory** (`examples/live_auction/auction-demo`):

**Terminal 1 - Message Forwarder (start first):**

```sh
pnpm run start:forwarder
```

_This starts the Demitter message broker using the built-in CLI. You'll see connection logs._

**Terminal 2 - Auction Controller:**

```sh
pnpm run start:controller
```

_Shows live auction state, bids, and countdown timers._

**Terminal 3+ - Bidders (run 3-6 times for multiple bidders):**

```sh
pnpm run start:bidder
```

_Each bidder has a unique name (@guitar_hero, @vintage_seeker, etc.) and strategy._

**Terminal 4 - Spectator Dashboard:**

```sh
pnpm run start:spectator
```

_Beautiful real-time dashboard with charts and analytics._

### 4. Watch the Action!

- Auctions start automatically with random items (vintage guitars, art, etc.)
- Bidders compete using different strategies
- Watch real-time updates across all terminals
- Press `q` to exit any process
- Use `pnpm run cleanup` to stop all processes at once

## What Each Terminal Shows

### 🎪 Auction Controller Terminal

- 📋 Live auction status and item details
- ⏱️ Real-time countdown timer
- 💰 Incoming bids with bidder names and amounts
- 🏆 Auction results and winner announcements
- 📊 Overall auction statistics

### 🤖 Bidder Terminals

- 🎯 Your bidder's personality (@guitar_hero, @vintage_seeker, etc.)
- 💭 Decision-making process and strategy
- 📈 Current bid amounts and competition status
- ⚡ Real-time auction updates
- 💵 Your bidding activity

### 🎨 Spectator Dashboard (The Star of the Show!)

- 📊 Beautiful real-time charts and graphs
- 📈 Live bid activity visualization
- 👥 Active bidder leaderboard
- 🏆 Auction statistics and analytics
- 🎨 Rich terminal UI with colors and animations

## Architecture & Technical Details

### Distributed Event System

This demo showcases the **Demitter** library's distributed event capabilities:

- **Demitter Message Broker:** A proxy/message broker that handles event distribution
- **Event Distribution:** Real-time events across multiple Node.js processes
- **Fault Tolerance:** Automatic cleanup of disconnected bidders
- **Real-time Analytics:** Live statistics calculation and visualization

### Process Communication

All processes communicate through distributed events:

- `auction:started` - New auction begins
- `bid:placed` - Bidder makes a bid
- `auction:ended` - Auction concludes with winner
- `bidder:heartbeat` - Keep-alive signals for active bidders
- And many more real-time events...

## Configuration

Edit configuration files to customize the experience:

- `config/auction-config.js` - Auction timing, items, starting prices
- `config/bidder-strategies.js` - Bidding personalities and logic

## Cleanup

Stop all processes at once:

```sh
pnpm run cleanup
```

## Troubleshooting

### Common Issues

**"Module not found" errors:**

```sh
# Make sure to build from the repository root first
cd ../../..  # Go to repository root
pnpm run build
```

**Processes won't connect:**

- Start the forwarder first (`pnpm run start:forwarder`)
- Wait for "Forwarder listening" message before starting other processes
- Check that ports 5555/5556 are available

**No bidders showing up:**

- Start multiple bidder processes (`pnpm run start:bidder`)
- Each bidder gets a unique personality automatically
- Wait a few seconds for heartbeat registration

**Cleanup stuck processes:**

```sh
pnpm run cleanup
```

**Dashboard not updating:**

- Make sure spectator dashboard is started after controller
- Try restarting the spectator terminal

### Best Experience Tips

- Use at least 3-4 bidder processes for exciting competition
- Keep all terminals visible to see real-time synchronization
- The spectator dashboard is the most visually impressive component
- Auctions run for 30-45 seconds each - perfect for demonstrations

---

## Library Limitations, Impact, and Solutions

This demo is designed to showcase distributed event emission and real-time terminal UIs. The following known limitations and their impacts are accepted for this example:

1. **No Built-in State Replay or Late Join Sync**

   - **Impact:** Late joiners (bidders, dashboards) may display out-of-date information until the next event is broadcast.
   - **Solution:** Accepted for this demo. Late joiners will update on the next event.

2. **No Guaranteed Delivery or Message Persistence**

   - **Impact:** If a process is offline/disconnected when an event is emitted, it may miss critical events (e.g., auction end, winning bid).
   - **Solution:** Accepted for this demo. No message persistence or guaranteed delivery.

3. **No Built-in Process Discovery or Health Monitoring**

   - **Impact:** The system does not track which processes are online or provide health checks. The controller cannot reliably know the true set of active bidders or dashboards.
   - **Solution:** For this demo, join/leave events are used for basic tracking where possible. No advanced health monitoring.

4. **No Native TypeScript Support for Config Files**

   - **Impact:** Lint errors may appear in editors due to CommonJS config files, but this does not affect runtime.
   - **Solution:** Accepted for this demo.

5. **No Built-in Analytics or Aggregation**
   - **Impact:** Analytics events (e.g., bid velocity, heat maps) must be computed manually in the controller or dashboard.
   - **Solution:** Accepted for this demo; analytics are handled in the dashboard/controller.

---

For more details, see the product requirements in `../live_auction_prd.md`.
