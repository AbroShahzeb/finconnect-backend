#!/bin/bash
set -e

echo "Deployment started ..."


# Make sure NVM is available
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Pull the latest version of the app
git pull origin master
echo "New changes copied to server !"

# Installing Dependencies
echo "Installing Dependencies..."
npm install --yes

# Creating a build 
echo "Building application"
npm run build


# Restarting server
echo "Restarting server"
pm2 restart finconnect-backend

echo "Deployment Finished!"
