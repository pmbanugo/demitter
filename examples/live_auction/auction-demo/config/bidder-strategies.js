const strategies = {
  conservative: function ({ currentBid, maxBid, budget }) {
    // Only bid if well below max and budget
    if (currentBid + 50 < maxBid && currentBid + 50 < budget) {
      return currentBid + 50;
    }
    return null;
  },
  aggressive: function ({ currentBid, maxBid, budget }) {
    // Bid up to max or budget, in larger increments
    let nextBid = currentBid + 200;
    if (nextBid > maxBid) nextBid = maxBid;
    if (nextBid > budget) nextBid = budget;
    return nextBid > currentBid ? nextBid : null;
  },
  sniper: function ({ currentBid, maxBid, budget, timeRemaining }) {
    // Wait until last 5 seconds, then bid max
    if (timeRemaining <= 5000 && currentBid < maxBid && maxBid <= budget) {
      return maxBid;
    }
    return null;
  },
};
export default strategies;
