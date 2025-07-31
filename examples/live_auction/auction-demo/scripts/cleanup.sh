#!/bin/zsh
# Kill all demo processes
pkill -f auction-controller.js
pkill -f bidder-process.js
pkill -f spectator-dashboard.js
pkill -f cli.js
