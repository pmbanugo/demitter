const forwarder = {
  xsubPort: 5555,
  xpubPort: 5556,
  get xsubAddress() {
    return this._xsubAddress || `tcp://localhost:${this.xsubPort}`;
  },
  set xsubAddress(val) {
    this._xsubAddress = val;
  },
  get xpubAddress() {
    return this._xpubAddress || `tcp://localhost:${this.xpubPort}`;
  },
  set xpubAddress(val) {
    this._xpubAddress = val;
  },
};

const auctionConfig = {
  auctionDuration: 15000, // 15 seconds default
  bidIncrement: 50, // Minimum $50 increase
  extensionTime: 15000, // 15 second extension
  maxConcurrentAuctions: 3,
  forwarder,
  bidders: {
    count: 8,
    strategies: ["conservative", "aggressive", "sniper"],
    budgetRange: [2000, 10000],
  },
};
export default auctionConfig;
