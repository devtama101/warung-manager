#!/bin/bash

# set-anthropic-env.sh
# Sets Anthropic API environment variables for current shell session

$Env:ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"
$Env:ANTHROPIC_AUTH_TOKEN=0054a7987523439897fd329d9798926e.fYVfNTrqUvzr4J9w

echo "✅ Environment variables set:"
echo "   ANTHROPIC_BASE_URL = $ANTHROPIC_BASE_URL"
echo "   ANTHROPIC_AUTH_TOKEN = [HIDDEN FOR SECURITY]"  # Avoid exposing in logs

# Optional: Verify they're set
# echo "ANTHROPIC_AUTH_TOKEN = $ANTHROPIC_AUTH_TOKEN"  # Uncomment only for deb$

