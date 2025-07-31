// Spectator Dashboard Process
import blessed from "blessed";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const contrib = require("blessed-contrib");
import chalk from "chalk";
import { createDistributedEmitter } from "demitter";
import auctionConfig from "../config/auction-config.js";

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
  feedBox.log(chalk.red(`Network error: ${error.error || "Connection issue"}`));
});

// Setup blessed-contrib dashboard
const screen = blessed.screen();
const grid = new contrib.grid({ rows: 12, cols: 12, screen });

const priceLine = grid.set(0, 0, 4, 8, contrib.line, {
  label: "📈 BID PRICE TRENDS",
  showLegend: true,
  minY: 0,
});
const biddersBar = grid.set(4, 0, 4, 6, contrib.bar, {
  label: "👥 ACTIVE BIDDERS (Live)",
  barWidth: 6,
  barSpacing: 4,
  xOffset: 0,
  maxHeight: 10,
});
const statsTable = grid.set(4, 6, 4, 6, contrib.table, {
  label: "📊 AUCTION STATISTICS",
  columnWidth: [18, 12],
});
const feedBox = grid.set(8, 0, 4, 12, contrib.log, {
  label: "📺 LIVE AUCTION FEED",
  fg: "green",
  selectedFg: "white",
});

let priceData = { x: [], y: [] };
let bidders = {};
let bidderNames = {};
let bidderHeartbeats = {};

// Real-time statistics tracking
let auctionStats = {
  auctionsToday: 0,
  totalVolume: 0,
  successfulAuctions: 0,
  totalDuration: 0,
  peakBidders: 0,
  currentAuctionStart: 0,
};

let stats = [
  ["Auctions Today", "0"],
  ["Total Volume", "$0"],
  ["Success Rate", "0%"],
  ["Avg Duration", "0s"],
  ["Peak Bidders", "0"],
];

function getBidderLabel(bidderId) {
  if (!bidderId || bidderId === "null" || bidderId === null) return "-";
  return bidderNames[bidderId] ? `@${bidderNames[bidderId]}` : `@${bidderId}`;
}

function updateStats() {
  const currentBidderCount = Object.keys(bidders).length;
  if (currentBidderCount > auctionStats.peakBidders) {
    auctionStats.peakBidders = currentBidderCount;
  }

  const successRate =
    auctionStats.auctionsToday > 0
      ? Math.round(
          (auctionStats.successfulAuctions / auctionStats.auctionsToday) * 100
        )
      : 0;

  const avgDuration =
    auctionStats.auctionsToday > 0
      ? Math.round(auctionStats.totalDuration / auctionStats.auctionsToday)
      : 0;

  stats = [
    ["Auctions Today", auctionStats.auctionsToday.toString()],
    ["Total Volume", `$${auctionStats.totalVolume.toLocaleString()}`],
    ["Success Rate", `${successRate}%`],
    ["Avg Duration", `${avgDuration}s`],
    ["Peak Bidders", auctionStats.peakBidders.toString()],
  ];
}

function updateDashboard() {
  updateStats();
  priceLine.setData([{ title: "Current", x: priceData.x, y: priceData.y }]);
  biddersBar.setData({
    titles: Object.keys(bidders).map(getBidderLabel),
    data: Object.values(bidders),
  });
  statsTable.setData({ headers: ["Metric", "Value"], data: stats });
  screen.render();
}

emitter.on("bidder:joined", ({ bidderId, name }) => {
  bidderNames[bidderId] = name;
  bidderHeartbeats[bidderId] = Date.now();
  updateDashboard();
});

emitter.on("auction:started", ({ itemId, itemName, startingBid }) => {
  priceData = { x: ["0"], y: [startingBid] };
  auctionStats.currentAuctionStart = Date.now();
  feedBox.log(chalk.blue(`Auction started: ${itemName}`));
  updateDashboard();
});

emitter.on("bid:accepted", ({ itemId, bidderId, amount }) => {
  priceData.x.push((priceData.x.length * 2).toString());
  priceData.y.push(amount);
  bidders[bidderId] = (bidders[bidderId] || 0) + 1;
  feedBox.log(chalk.green(`Bid: $${amount} by ${getBidderLabel(bidderId)}`));
  updateDashboard();
});
emitter.on("bid:rejected", ({ bidderId, amount, reason }) => {
  feedBox.log(
    chalk.red(
      `Bid rejected: $${amount} by ${getBidderLabel(bidderId)} (${reason})`
    )
  );
  updateDashboard();
});
emitter.on("bid:outbid", ({ bidderId, newAmount, newBidderId }) => {
  feedBox.log(
    chalk.yellow(
      `Outbid: ${getBidderLabel(bidderId)} was outbid by ${getBidderLabel(
        newBidderId
      )} ($${newAmount})`
    )
  );
  updateDashboard();
});
emitter.on("auction:ended", ({ itemId, winnerId, finalBid }) => {
  auctionStats.auctionsToday++;

  if (winnerId && finalBid) {
    auctionStats.successfulAuctions++;
    auctionStats.totalVolume += finalBid;
  }

  if (auctionStats.currentAuctionStart > 0) {
    const duration = Math.round(
      (Date.now() - auctionStats.currentAuctionStart) / 1000
    );
    auctionStats.totalDuration += duration;
  }

  const winnerLabel = winnerId ? getBidderLabel(winnerId) : "No winner";
  feedBox.log(
    chalk.yellow(
      `Auction ended. Winner: ${winnerLabel}${
        winnerId ? ` ($${finalBid})` : ""
      }`
    )
  );
  updateDashboard();
});

emitter.on("bidders:sync", ({ bidderNames: names }) => {
  bidderNames = names || {};
  updateDashboard();
});

setInterval(() => {
  const now = Date.now();
  for (const bidderId of Object.keys(bidderHeartbeats)) {
    if (now - bidderHeartbeats[bidderId] > 15000) {
      delete bidders[bidderId];
      delete bidderNames[bidderId];
      delete bidderHeartbeats[bidderId];
    }
  }
  updateDashboard();
}, 10000);

screen.key(["escape", "q", "C-c"], async () => {
  console.log(chalk.yellow("\n🛑 Shutting down spectator dashboard..."));
  await emitter.close();
  process.exit(0);
});

screen.render();
console.log(
  chalk.magenta.bold("🎭 Spectator dashboard started. Press q to quit.")
);
