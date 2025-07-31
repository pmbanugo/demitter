// Bidder Process
import chalk from "chalk";
import { createDistributedEmitter } from "demitter";
import auctionConfig from "../config/auction-config.js";
import strategies from "../config/bidder-strategies.js";
import hyperid from "hyperid";

const emitter = await createDistributedEmitter({
  xsubAddress:
    auctionConfig.forwarder.xsubAddress ||
    `tcp://localhost:${auctionConfig.forwarder.xsubPort}`,
  xpubAddress:
    auctionConfig.forwarder.xpubAddress ||
    `tcp://localhost:${auctionConfig.forwarder.xpubPort}`,
});

// Handle distributed emitter errors
emitter.on("distributed:error", (error) => {
  console.error(chalk.red("Distributed emitter error:"), error);
});

const idGen = hyperid();
const bidderId = idGen();
const bidderNames = [
  "vintage_seeker",
  "guitar_hero",
  "alice_collector",
  "drum_master",
  "music_lover",
  "sniper_bidder",
  "art_fanatic",
  "mustang_racer",
  "watch_enthusiast",
];
const name = bidderNames[Math.floor(Math.random() * bidderNames.length)];
const budget =
  Math.floor(
    Math.random() *
      (auctionConfig.bidders.budgetRange[1] -
        auctionConfig.bidders.budgetRange[0])
  ) + auctionConfig.bidders.budgetRange[0];
const strategyName =
  auctionConfig.bidders.strategies[
    Math.floor(Math.random() * auctionConfig.bidders.strategies.length)
  ];
const strategy = strategies[strategyName];
const maxBid = Math.floor(budget * (0.7 + Math.random() * 0.3));

let currentAuction = null;
let bidHistory = [];
let status = "IDLE";

emitter.emit("bidder:joined", { bidderId, name, budget });
setInterval(() => {
  emitter.emit("bidder:joined", { bidderId, name, budget });
}, 5000);

function printStatus() {
  console.clear();
  console.log(chalk.cyan.bold(`🤖 BIDDER: @${name} ($${budget} budget)`));
  if (!currentAuction) {
    console.log(chalk.yellow("Waiting for auction to start..."));
    return;
  }
  console.log(chalk.bold(`Target: ${currentAuction.itemName}`));
  console.log(
    `My Max Bid: $${maxBid}    Current: $${
      currentAuction.highestBid || currentAuction.startingBid
    }`
  );
  console.log(`Status: ${status}    Strategy: ${strategyName}`);
  console.log(
    `⏰ Time Left: ${
      currentAuction.timeRemaining
        ? Math.ceil(currentAuction.timeRemaining / 1000)
        : "--"
    }s`
  );
  console.log(chalk.bold("\n🎯 BIDDING HISTORY"));
  bidHistory
    .slice(-6)
    .reverse()
    .forEach((b) => {
      const accepted = b.accepted ? "✅" : "❌";
      const msg = b.accepted
        ? `ACCEPTED${b.winner ? " (Current Winner!)" : ""}`
        : `REJECTED (${b.reason})`;
      const displayName = b.name || b.bidderId;
      console.log(
        `${accepted} $${b.amount} by @${displayName} (id: ${b.bidderId}) - ${msg}`
      );
    });
}

emitter.on("auction:started", (data) => {
  currentAuction = {
    ...data,
    highestBid: data.startingBid,
    highestBidder: null,
    timeRemaining: data.duration,
  };
  bidHistory = [];
  status = "READY";
  printStatus();
});

emitter.on("auction:countdown", ({ itemId, timeRemaining }) => {
  if (!currentAuction || itemId !== currentAuction.itemId) return;
  currentAuction.timeRemaining = timeRemaining;
  printStatus();
});

emitter.on(
  "bid:accepted",
  ({ itemId, bidderId: winningBidderId, name: winningName, amount }) => {
    if (!currentAuction || itemId !== currentAuction.itemId) return;
    currentAuction.highestBid = amount;
    currentAuction.highestBidder = winningBidderId;
    currentAuction.highestBidderName = winningName || winningBidderId;
    // Track all accepted bids, not just own
    bidHistory.push({
      bidderId: winningBidderId,
      name: winningName || winningBidderId,
      amount,
      accepted: true,
      winner: winningBidderId === bidderId,
    });
    if (winningBidderId === bidderId) {
      status = "WINNING";
    } else {
      if (status === "WINNING" || status === "BIDDING") status = "OUTBID";
    }
    printStatus();
  }
);

emitter.on(
  "bid:rejected",
  ({ itemId, bidderId, name: rejectedName, amount, reason }) => {
    if (!currentAuction || itemId !== currentAuction.itemId) return;
    // Use event name, or local name if this is our own rejection
    const displayName =
      rejectedName || (bidderId === bidderId ? name : bidderId);
    bidHistory.push({
      bidderId,
      name: displayName,
      amount,
      accepted: false,
      reason,
    });
    status = "REJECTED";
    printStatus();
  }
);

emitter.on(
  "bid:outbid",
  ({ itemId, bidderId: outbidderId, newAmount, newBidderId }) => {
    if (
      !currentAuction ||
      itemId !== currentAuction.itemId ||
      outbidderId !== bidderId
    )
      return;
    status = "OUTBID";
    printStatus();
  }
);

emitter.on("auction:ended", ({ itemId, winnerId, finalBid }) => {
  if (!currentAuction || itemId !== currentAuction.itemId) return;
  status = winnerId === bidderId ? "WON" : "LOST";
  printStatus();
});

// Automated bidding logic
setInterval(() => {
  if (
    !currentAuction ||
    !currentAuction.timeRemaining ||
    status === "WON" ||
    status === "LOST"
  )
    return;
  const bid = strategy({
    currentBid: currentAuction.highestBid,
    maxBid,
    budget,
    timeRemaining: currentAuction.timeRemaining,
  });
  if (
    bid &&
    bid <= budget &&
    (!currentAuction.highestBidder || currentAuction.highestBidder !== bidderId)
  ) {
    emitter.emit("bid:placed", {
      itemId: currentAuction.itemId,
      bidderId,
      name,
      amount: bid,
      timestamp: Date.now(),
    });
    status = "BIDDING";
    printStatus();
  }
}, 1500);

process.on("SIGINT", async () => {
  console.log(chalk.yellow("\n🛑 Shutting down bidder..."));
  emitter.emit("bidder:left", { bidderId, name, reason: "SIGINT" });
  await emitter.close();
  process.exit(0);
});

console.log(
  chalk.green.bold(`🤖 Bidder process started: @${name} (${strategyName})`)
);
