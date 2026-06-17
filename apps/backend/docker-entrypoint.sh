#!/bin/sh
set -e

echo "Waiting for MongoDB..."
until node -e "
const net = require('net');
const uri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/avitus-anketa';
const host = uri.includes('@') ? uri.split('@')[1].split('/')[0].split(':')[0] : uri.replace('mongodb://','').split('/')[0].split(':')[0];
const port = parseInt((uri.match(/:(\d+)/) || [, '27017'])[1], 10);
const s = net.createConnection({ host, port }, () => { s.end(); process.exit(0); });
s.on('error', () => process.exit(1));
s.setTimeout(3000, () => { s.destroy(); process.exit(1); });
"; do
  echo "MongoDB is unavailable - sleeping 2s"
  sleep 2
done

echo "MongoDB is up"
exec "$@"
