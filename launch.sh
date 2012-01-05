#!/usr/bin/env sh

mkdir -p logs

if [ "$(pidof node)" ]; then
	echo "Already exists..."
else
	/home/rraawwrr/bin/node /home/rraawwrr/webapps/node/index.js & 
fi
