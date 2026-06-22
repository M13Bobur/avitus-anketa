#!/bin/sh
set -e

export MONGODB_URI="${MONGODB_URI:-mongodb://mongodb:27017/avitus-anketa}"
MAX_ATTEMPTS=60
ATTEMPT=0

echo ">>> MongoDB kutilyapti: ${MONGODB_URI}"

while [ "$ATTEMPT" -lt "$MAX_ATTEMPTS" ]; do
  ATTEMPT=$((ATTEMPT + 1))

  if node -e "
    const mongoose = require('mongoose');
    mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    })
      .then(() => mongoose.disconnect())
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  "; then
    echo ">>> MongoDB tayyor (${ATTEMPT} urinish)"
    exec "$@"
  fi

  echo ">>> MongoDB hali tayyor emas (${ATTEMPT}/${MAX_ATTEMPTS}) — 3s kutilmoqda..."
  sleep 3
done

echo ">>> XATO: MongoDB ${MAX_ATTEMPTS} urinishdan keyin ham javob bermadi"
exit 1
