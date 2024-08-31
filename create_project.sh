#!/bin/bash

# Create main project directory
mkdir -p my-massage-app

# Change to project directory
cd my-massage-app

# Create directories
mkdir -p public src/components server/config server/models server/routes

# Create files
touch public/index.html public/manifest.json
touch src/components/App.js src/index.js src/App.css
touch server/config/passport.js server/models/User.js server/routes/auth.js server/server.js
touch .gitignore package.json README.md

# Output success message
echo "Project structure for my-massage-app has been created successfully!"

# List the created structure
tree
