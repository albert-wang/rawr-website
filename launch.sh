#!/usr/bin/env sh

mkdir -p logs

#Used only for tweet caches.
mkdir -p cache 

if [ "$(ps -ef | grep -v grep | grep rraawwrr | grep node)" ]; then
	echo "Node already running..."
else
	/home/rraawwrr/bin/node /home/rraawwrr/webapps/node/index.js &> log.txt
fi

if [ "$(ps -ef | grep -v grep | grep rraawwrr | grep memcached)" ]; then
	echo "Memcached already running..."
else 
	memcached -m -d 10 -s /home/rraawwrr/memcached.sock &
fi
