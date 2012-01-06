#!/usr/bin/env sh

mkdir -p logs

if [ "$(pidof node)" ]; then
	echo "Node already running..."
else
	/home/rraawwrr/bin/node /home/rraawwrr/webapps/node/index.js & 
fi

if [ "$(pidof memcached)" ]; then
	echo "Memcached already running..."
else 
	memcached -m -d 10 -s /home/rraawwrr/memcached.sock &
fi
