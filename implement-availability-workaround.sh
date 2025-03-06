#!/bin/bash

# implement-availability-workaround.sh
# This script implements the availability workaround

echo "Implementing availability workaround..."

# 1. Create a backup of the original ProviderAvailability.js
if [ ! -f src/components/ProviderAvailability.js.backup ]; then
  echo "Creating backup of ProviderAvailability.js..."
  cp src/components/ProviderAvailability.js src/components/ProviderAvailability.js.backup
  echo "Backup created successfully."
else
  echo "Backup already exists, skipping backup creation."
fi

# 2. Replace the original file with the workaround
echo "Replacing ProviderAvailability.js with workaround version..."
cp src/components/ProviderAvailability.workaround.js src/components/ProviderAvailability.js

echo "Workaround implemented successfully!"
echo ""
echo "To revert the changes, run:"
echo "  cp src/components/ProviderAvailability.js.backup src/components/ProviderAvailability.js"
echo ""
echo "To test the workaround, start the server and navigate to:"
echo "  http://localhost:3000/direct-access-test.html"