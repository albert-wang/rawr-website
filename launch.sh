#!/usr/bin/env sh

mkdir -p logs

#Used only for tweet caches.
mkdir -p cache 

if [ "$(ps -ef | grep -v grep | grep rraawwrr | grep forever)" ]; then 
	echo "Forever running..."
else
	/home/rraawwrr/bin/forever -c "/home/rraawwrr/bin/node-harmony" -ao logs/console.log -ae logs/error.log start index.js 
fi

if [ "$(ps -ef | grep -v grep | grep rraawwrr | grep memcached)" ]; then
	echo "Memcached already running..."
else 
	memcached -m -d 10 -s /home/rraawwrr/memcached.sock &
fi
