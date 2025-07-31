// Auction Controller Process
import chalk from "chalk";
// import process from "node:process";
import { createDistributedEmitter } from "demitter";
import auctionConfig from "../config/auction-config.js";
import items from "./auction-items.js";

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

let currentAuction = null;
let auctionTimer = null;
let bidHistory = [];
let activeBidders = new Set();
let bidderNames = {};
let bidderHeartbeats = {};

function startAuction(item) {
  currentAuction = {
    ...item,
    highestBid: item.startingBid,
    highestBidder: null,
    endTime: Date.now() + auctionConfig.auctionDuration,
    totalBids: 0,
  };
  bidHistory = [];
  emitter.emit("auction:started", {
    itemId: item.itemId,
    itemName: item.itemName,
    startingBid: item.startingBid,
    duration: auctionConfig.auctionDuration,
  });
  scheduleCountdown();
  scheduleAuctionEnd();
}

function scheduleCountdown() {
  if (auctionTimer) clearInterval(auctionTimer);
  auctionTimer = setInterval(() => {
    const timeRemaining = Math.max(0, currentAuction.endTime - Date.now());
    emitter.emit("auction:countdown", {
      itemId: currentAuction.itemId,
      timeRemaining,
    });
    if (timeRemaining <= 0) {
      clearInterval(auctionTimer);
    }
  }, 1000);
}

function scheduleAuctionEnd() {
  setTimeout(() => {
    endAuction();
  }, currentAuction.endTime - Date.now());
}

function endAuction() {
  emitter.emit("auction:ended", {
    itemId: currentAuction.itemId,
    winnerId: currentAuction.highestBidder,
    finalBid: currentAuction.highestBid,
    totalBids: currentAuction.totalBids,
  });
  // Next auction after short delay
  setTimeout(() => {
    nextAuction();
  }, 5000);
}

function nextAuction() {
  const nextItem = items[Math.floor(Math.random() * items.length)];
  startAuction(nextItem);
}

emitter.on("bid:placed", ({ itemId, bidderId, name, amount, timestamp }) => {
  if (!currentAuction || itemId !== currentAuction.itemId) return;
  if (amount < currentAuction.highestBid + auctionConfig.bidIncrement) {
    emitter.emit("bid:rejected", {
      itemId,
      bidderId,
      name: name || bidderNames[bidderId] || bidderId,
      amount,
      reason: "Bid too low",
    });
    return;
  }
  // Accept bid
  const previousBid = currentAuction.highestBid;
  const previousBidder = currentAuction.highestBidder;
  currentAuction.highestBid = amount;
  currentAuction.highestBidder = bidderId;
  currentAuction.highestBidderName = name || bidderNames[bidderId] || bidderId;
  currentAuction.totalBids++;
  bidHistory.push({
    bidderId,
    name: name || bidderNames[bidderId] || bidderId,
    amount,
    timestamp,
  });
  emitter.emit("bid:accepted", {
    itemId,
    bidderId,
    name: name || bidderNames[bidderId] || bidderId,
    amount,
    previousBid,
  });
  if (previousBidder && previousBidder !== bidderId) {
    emitter.emit("bid:outbid", {
      itemId,
      bidderId: previousBidder,
      name: bidderNames[previousBidder] || previousBidder,
      newAmount: amount,
      newBidderId: bidderId,
      newBidderName: name || bidderNames[bidderId] || bidderId,
    });
  }
  // Last-second bid extension
  const timeLeft = currentAuction.endTime - Date.now();
  if (timeLeft <= 5000) {
    currentAuction.endTime += auctionConfig.extensionTime;
    emitter.emit("auction:countdown", {
      itemId: currentAuction.itemId,
      timeRemaining: currentAuction.endTime - Date.now(),
    });
  }
});

// Track bidders
emitter.on("bidder:joined", ({ bidderId, name }) => {
  activeBidders.add(bidderId);
  bidderHeartbeats[bidderId] = Date.now();
  if (name) {
    bidderNames[bidderId] = name;
    emitter.emit("bidders:sync", { bidderNames });
  }
});
emitter.on("bidder:left", ({ bidderId }) => {
  activeBidders.delete(bidderId);
  delete bidderNames[bidderId];
  emitter.emit("bidders:sync", { bidderNames });
});

// Cleanup inactive bidders every 10 seconds
setInterval(() => {
  const now = Date.now();
  const inactiveBidders = [];

  for (const bidderId of Array.from(activeBidders)) {
    if (
      !bidderHeartbeats[bidderId] ||
      now - bidderHeartbeats[bidderId] > 15000
    ) {
      inactiveBidders.push(bidderId);
    }
  }

  // Remove inactive bidders
  for (const bidderId of inactiveBidders) {
    activeBidders.delete(bidderId);
    delete bidderNames[bidderId];
    delete bidderHeartbeats[bidderId];
  }
}, 10000);

function printControllerStatus(activity = "") {
  console.clear();
  if (!currentAuction) {
    console.log(chalk.yellow("No auction in progress."));
    return;
  }
  console.log(chalk.green.bold("🏛️  LIVE AUCTION CONTROLLER"));
  console.log(chalk.bold(`Current Item: ${currentAuction.itemName}`));
  console.log(`Starting Bid: $${currentAuction.startingBid}`);
  const highestName =
    currentAuction.highestBidderName ||
    bidderNames[currentAuction.highestBidder] ||
    currentAuction.highestBidder ||
    "-";
  const highestId = currentAuction.highestBidder || "-";
  console.log(
    `Current Bid:  $${currentAuction.highestBid} by @${highestName} (id: ${highestId})`
  );
  const timeLeft = Math.max(0, currentAuction.endTime - Date.now());
  console.log(`⏰ Time Left: ${Math.ceil(timeLeft / 1000)}s`);
  console.log(chalk.bold("\n📊 AUCTION STATS"));
  console.log(
    `Total Bids: ${currentAuction.totalBids}    Active Bidders: ${activeBidders.size}`
  );
  console.log(chalk.bold("\n📢 RECENT ACTIVITY"));
  bidHistory
    .slice(-5)
    .reverse()
    .forEach((b) => {
      const displayName = b.name || bidderNames[b.bidderId] || b.bidderId;
      console.log(
        `@${displayName} (id: ${b.bidderId}) bid $${b.amount} (${new Date(
          b.timestamp
        ).toLocaleTimeString()})`
      );
    });
  if (activity) {
    console.log(chalk.magenta(`\n${activity}`));
  }
}

emitter.on("auction:started", () => {
  printControllerStatus("Auction started!");
});
emitter.on("auction:countdown", ({ timeRemaining }) => {
  printControllerStatus();
});
emitter.on("bid:accepted", ({ bidderId, name, amount }) => {
  printControllerStatus(
    `Bid accepted: $${amount} by @${
      name || bidderNames[bidderId] || bidderId
    } (id: ${bidderId})`
  );
});
emitter.on("bid:rejected", ({ bidderId, name, amount, reason }) => {
  printControllerStatus(
    `Bid rejected: $${amount} by @${
      name || bidderNames[bidderId] || bidderId
    } (id: ${bidderId}) (${reason})`
  );
});
emitter.on("auction:ended", ({ winnerId, finalBid }) => {
  const winnerName = bidderNames[winnerId] || winnerId;
  printControllerStatus(
    winnerId
      ? `Auction ended! Winner: @${winnerName} (id: ${winnerId}) ($${finalBid})`
      : "Auction ended! No winner."
  );
});

// Start the first auction
console.log(chalk.green.bold("🏛️  LIVE AUCTION CONTROLLER STARTED"));

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log(chalk.yellow("\n🛑 Shutting down auction controller..."));
  if (auctionTimer) clearInterval(auctionTimer);
  await emitter.close();
  process.exit(0);
});

nextAuction();
