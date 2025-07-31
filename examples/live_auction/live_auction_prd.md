# Live Auction System - Terminal Demo
## Product Requirements Document

### 1. Overview

A real-time, distributed live auction system demonstrating the Distributed Event Emitter capabilities through multiple terminal processes. The system simulates a high-stakes auction environment where multiple bidders compete across different processes, showcasing real-time synchronization, conflict resolution, and high-frequency event handling.

### 2. Goals & Objectives

**Primary Goal:** Demonstrate the Distributed Event Emitter's ability to handle high-frequency, time-sensitive events with perfect synchronization across multiple processes.

**Success Metrics:**
- Zero bid conflicts or data inconsistencies
- Sub-100ms latency for bid propagation
- Smooth handling of 10+ concurrent bidders
- Clear, engaging terminal visualization
- Obvious "wow factor" for technical audiences

### 3. User Stories

**As a Demo Viewer:**
- I want to see multiple terminal windows with live auction activity
- I want to understand immediately that these are separate processes communicating
- I want to see real-time bid updates, countdowns, and winner announcements
- I want to see system statistics and performance metrics

**As a Spectator/Analyst:**
- I want rich visual analytics showing bid trends and competition patterns
- I want to see bidder rivalry dynamics and competition heat maps
- I want historical auction data and performance comparisons
- I want entertainment value through gamified bidding visualization
- I want to monitor multiple auctions simultaneously

**As a Bidder Process:**
- I want to place bids that immediately appear on all other processes
- I want to see when other bidders outbid me in real-time
- I want to see auction countdown timers synchronized across all processes
- I want clear visual feedback when I win or lose an auction

### 4. Technical Architecture

#### 4.1 System Components

1. **Auction Controller Process**
   - Manages auction lifecycle (start, countdown, end)
   - Validates bids and resolves conflicts
   - Broadcasts auction state changes
   - Handles auction item progression

2. **Bidder Processes (Multiple)**
   - Automated bidding logic with random strategies
   - Responds to auction events
   - Places bids based on configured parameters
   - Displays real-time auction status

3. **Spectator/Viewer Dashboard Process**
   - Rich terminal UI using blessed-contrib for charts and graphs
   - Real-time auction monitoring for observers/analysts
   - Historical bid analytics and trending
   - Multi-auction overview with live statistics
   - System performance visualization

4. **Admin Monitor Process**
   - Technical system monitoring (network, performance, errors)
   - Process health and resource usage tracking
   - Message routing statistics and latency metrics
   - Debug information and system diagnostics

5. **Distributed Emitter Pub/Sub Forwarder**
   - Routes all auction events between processes

#### 4.2 Event Types

```javascript
// Auction lifecycle events
'auction:started' - { itemId, itemName, startingBid, duration }
'auction:ended' - { itemId, winnerId, finalBid, totalBids }
'auction:countdown' - { itemId, timeRemaining }

// Bidding events
'bid:placed' - { itemId, bidderId, amount, timestamp }
'bid:accepted' - { itemId, bidderId, amount, previousBid }
'bid:rejected' - { itemId, bidderId, amount, reason }
'bid:outbid' - { itemId, bidderId, newAmount, newBidderId }

// Analytics events (for spectator dashboard)
'analytics:bid_velocity' - { itemId, bidsPerMinute, trend }
'analytics:bidder_activity' - { bidderId, totalBids, avgBidAmount }
'analytics:price_momentum' - { itemId, priceChange, percentIncrease }
'analytics:auction_heat' - { itemId, competitionLevel, activeRivalries }

// System events
'bidder:joined' - { bidderId, name, budget }
'bidder:left' - { bidderId, reason }
'system:stats' - { totalBids, activeAuctions, connectedBidders }
'system:performance' - { cpuUsage, memoryUsage, networkLatency }
```

### 5. Functional Requirements

#### 5.1 Auction Management
- **FR-001:** System must support multiple concurrent auctions
- **FR-002:** Each auction must have a configurable duration (30-120 seconds)
- **FR-003:** Auctions must progress automatically through predefined items
- **FR-004:** System must handle auction countdown synchronization across all processes
- **FR-005:** Winner determination must be immediate and conflict-free

#### 5.2 Bidding Logic
- **FR-006:** Minimum bid increment of $50 (configurable)
- **FR-007:** Bids must be validated against current highest bid
- **FR-008:** Duplicate/invalid bids must be rejected with clear messaging
- **FR-009:** Bidders must have configurable budgets and strategies
- **FR-010:** Last-second bidding must extend auction by 15 seconds

#### 5.3 Real-time Communication
- **FR-011:** Bid updates must propagate to all processes within 50ms
- **FR-012:** Auction state changes must be synchronized across all terminals
- **FR-013:** System must handle process disconnection/reconnection gracefully
- **FR-014:** Message delivery must be guaranteed for critical events

#### 5.4 Terminal Interface
- **FR-015:** Each terminal must show current auction status prominently
- **FR-016:** Bid history must be displayed in real-time
- **FR-017:** Countdown timer must be visually prominent and synchronized
- **FR-018:** Winner announcements must be celebrated visually
- **FR-020:** System must provide rich analytics for spectators (bid trends, competition heat maps)
- **FR-021:** Spectator dashboard must display multiple concurrent auctions simultaneously
- **FR-022:** Historical auction data must be tracked and visualized in real-time
- **FR-023:** Bidder rivalry tracking and relationship mapping for entertainment value

### 6. Non-Functional Requirements

#### 6.1 Performance
- **NFR-001:** Support minimum 50 bids per second across all processes
- **NFR-002:** Memory usage must remain under 100MB per process
- **NFR-003:** CPU usage must not exceed 20% during peak activity

#### 6.2 Reliability
- **NFR-004:** System must handle network partitions gracefully
- **NFR-005:** No data loss during process restart/reconnection
- **NFR-006:** 99.9% uptime during demo periods

#### 6.3 Scalability
- **NFR-007:** Support 5-20 concurrent bidder processes
- **NFR-008:** Support 3-10 simultaneous auctions
- **NFR-009:** Linear performance scaling with additional processes

### 7. User Interface Design

#### 7.1 Auction Controller Terminal
```
╔══════════════════════════════════════════════════════════════╗
║                    🏛️  LIVE AUCTION HOUSE                    ║
╠══════════════════════════════════════════════════════════════╣
║  Current Item: 1967 Fender Stratocaster                     ║
║  Starting Bid: $1,500                                       ║
║  Current Bid:  $2,750 by @guitar_hero                       ║
║  ⏰ Time Left: 00:47                                        ║
╠══════════════════════════════════════════════════════════════╣
║  📊 AUCTION STATS                                           ║
║  Total Bids: 23        Active Bidders: 7                    ║
║  Bid Rate: 15/min      Network Latency: 12ms               ║
╠══════════════════════════════════════════════════════════════╣
║  📢 RECENT ACTIVITY                                         ║
║  🔥 @vintage_seeker bid $2,750 (+$200)                     ║
║  💰 @alice_collector bid $2,550 (+$150)                    ║
║  ⚡ @guitar_hero bid $2,400 (+$100)                        ║
╚══════════════════════════════════════════════════════════════╝
```

#### 7.2 Bidder Process Terminal
```
╔══════════════════════════════════════════════════════════════╗
║           🤖 BIDDER: @vintage_seeker ($8,500 budget)        ║
╠══════════════════════════════════════════════════════════════╣
║  Target: 1967 Fender Stratocaster                           ║
║  My Max Bid: $3,200    Current: $2,750                      ║
║  Status: 🟢 WINNING    Strategy: Aggressive                  ║
║  ⏰ Time Left: 00:47                                        ║
╠══════════════════════════════════════════════════════════════╣
║  🎯 BIDDING HISTORY                                         ║
║  ✅ $2,750 - ACCEPTED (Current Winner!)                     ║
║  ✅ $2,200 - ACCEPTED (Outbid by @alice_collector)          ║
║  ✅ $1,800 - ACCEPTED (Outbid by @guitar_hero)              ║
║  ✅ $1,500 - ACCEPTED (Opening bid)                         ║
╠══════════════════════════════════════════════════════════════╣
║  🔊 Next Action: Wait for counter-bid (Strategy: Snipe)     ║
╚══════════════════════════════════════════════════════════════╝
```

#### 7.3 Spectator Dashboard (blessed-contrib)
```
╔══════════════════════════════════════════════════════════════╗
║               🎭 AUCTION SPECTATOR DASHBOARD                 ║
╠═══════════════════════════════════╤══════════════════════════╣
║  📈 BID PRICE TRENDS              │  🔥 AUCTION HEAT MAP     ║
║  $3000┤                           │                          ║
║       │     ╭─╮                   │  🌶️🌶️🌶️ Guitar (HOT)    ║
║  $2500┤   ╭─╯ ╰╮                  │  🌶️🌶️   Violin (WARM)   ║
║       │ ╭─╯    ╰─╮                │  🌶️     Drums (MILD)    ║
║  $2000┤╭╯       ╰╮               │                          ║
║       └┴─────────┴─────────────   │  Most Competitive:       ║
║         0  10  20  30  40 (sec)   │  @vintage_seeker vs      ║
║                                   │  @guitar_hero            ║
╠═══════════════════════════════════╪══════════════════════════╣
║  👥 ACTIVE BIDDERS (Live)         │  📊 AUCTION STATISTICS   ║
║                                   │                          ║
║  @vintage_seeker  ████████ $8.5k  │  🏆 Auctions Today: 12   ║
║  @guitar_hero     ██████   $6.2k  │  💰 Total Volume: $847k  ║
║  @alice_collector █████    $4.8k  │  🎯 Success Rate: 89%    ║
║  @drum_master     ███      $3.1k  │  ⚡ Avg Duration: 73s    ║
║  @music_lover     ██       $2.4k  │  🔥 Peak Bidders: 15     ║
║                                   │                          ║
╠═══════════════════════════════════╧══════════════════════════╣
║  📺 LIVE AUCTION FEED                                        ║
║  🔥 INTENSE BIDDING WAR: Guitar jumps $200 in 10 seconds!   ║
║  ⚡ @vintage_seeker strikes back with $3,000 power bid!     ║
║  🎯 @guitar_hero activates SNIPER MODE - danger zone!       ║
║  💎 NEW HIGH: $3,150 - auction extended +15 seconds!        ║
╚══════════════════════════════════════════════════════════════╝
```

#### 7.4 Admin Monitor Terminal
```
╔══════════════════════════════════════════════════════════════╗
║             🔧 SYSTEM ADMINISTRATION MONITOR                 ║
╠══════════════════════════════════════════════════════════════╣
║  🖥️  PROCESS HEALTH                                         ║
║  auction-controller: 🟢 CPU: 12%  Memory: 45MB             ║
║  bidder-vintage:     🟢 CPU: 8%   Memory: 32MB             ║
║  bidder-guitar:      🟢 CPU: 9%   Memory: 28MB             ║
║  spectator-dash:     🟢 CPU: 15%  Memory: 67MB             ║
║  demitter-forwarder:      🟢 CPU: 3%   Memory: 18MB        ║
╠══════════════════════════════════════════════════════════════╣
║  📡 NETWORK STATISTICS                                      ║
║  Messages Routed: 1,847    Queue Depth: 2                  ║
║  Throughput: 23 msg/sec    Error Rate: 0.0%                ║
║  Avg Latency: 8ms          Peak Latency: 24ms              ║
╠══════════════════════════════════════════════════════════════╣
║  🚨 SYSTEM ALERTS                                           ║
║  ✅ All processes healthy and responsive                    ║
║  ✅ Network performance within normal parameters            ║
║  ⚠️  High bid frequency detected - monitoring closely       ║
╚══════════════════════════════════════════════════════════════╝
```

### 8. Technical Implementation

#### 8.1 Project Structure
```
auction-demo/
├── src/
│   ├── auction-controller.js    # Main auction management
│   ├── bidder-process.js        # Individual bidder logic
│   ├── spectator-dashboard.js   # blessed-contrib spectator UI
│   ├── admin-monitor.js         # Technical system monitoring
│   ├── auction-items.js         # Item catalog and data
│   └── ui/
│       ├── terminal-ui.js       # Terminal rendering utilities
│       ├── spectator-widgets.js # blessed-contrib chart configs
│       └── color-schemes.js     # Visual styling
├── config/
│   ├── auction-config.js        # Auction parameters
│   └── bidder-strategies.js     # Bidding algorithms
└── scripts/
    ├── start-demo.sh           # Launch all processes
    ├── start-spectator.sh      # Launch spectator dashboard
    └── cleanup.sh              # Cleanup processes
```

#### 8.2 Key Technologies
- **Distributed Event Emitter:** Core messaging system
- **blessed-contrib:** Rich terminal dashboards with charts and graphs
- **blessed:** Advanced terminal UI components
- **chalk:** Terminal colors and styling
- **cli-table3:** Formatted data tables
- **figures:** Cross-platform terminal symbols

#### 8.3 Configuration
```javascript
// auction-config.js
module.exports = {
  auctionDuration: 60000,        // 60 seconds default
  bidIncrement: 50,              // Minimum $50 increase
  extensionTime: 15000,          // 15 second extension
  maxConcurrentAuctions: 3,

  // Distributed emitter settings
  forwarder: {
    xsubPort: 5555,
    xpubPort: 5556
  },

  // Bidder behavior
  bidders: {
    count: 8,
    strategies: ['conservative', 'aggressive', 'sniper'],
    budgetRange: [2000, 10000]
  }
}
```

### 9. Demo Script & Scenarios

#### 9.1 Setup Sequence
1. Start ZeroMQ forwarder with logging
2. Launch auction controller
3. Start 6-8 bidder processes with different strategies
4. Launch spectator dashboard (blessed-contrib UI)
5. Launch admin monitor for technical oversight
6. Begin first auction automatically

#### 9.2 Demo Scenarios

**Scenario 1: Normal Auction Flow**
- Single item auction with moderate competition
- 4-6 bidders with varying strategies
- Clear winner after 60 seconds

**Scenario 2: Bidding War**
- High-value item triggering aggressive bidding
- Multiple bid extensions from last-second activity
- Budget constraints forcing bidders to drop out

**Scenario 3: System Resilience**
- Kill and restart bidder process mid-auction
- Demonstrate seamless reconnection and state sync
- Show continued auction operation

**Scenario 4: High-Frequency Stress Test**
- Multiple concurrent auctions
- All bidders active simultaneously
- Demonstrate system performance under load

### 10. Success Criteria

**Technical Success:**
- ✅ Zero bid conflicts or synchronization issues
- ✅ Sub-50ms average event propagation
- ✅ Stable operation with 10+ concurrent processes
- ✅ Graceful handling of process failures

**Demo Success:**
- ✅ Immediate audience engagement and understanding
- ✅ Clear demonstration of distributed emitter value
- ✅ Memorable "wow moments" during presentation
- ✅ Technical audience asking detailed follow-up questions

### 11. Future Enhancements

- **Web Dashboard:** Real-time web interface for auction monitoring
- **Bid Analytics:** Historical bidding pattern analysis
- **Multi-Currency:** Support for different currency types
- **Auction Scheduling:** Automated auction calendar system
- **Mobile Bidding:** Mobile app integration via Socket.IO
