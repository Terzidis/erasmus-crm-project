#!/bin/bash

# Set environment variables
export NODE_ENV=production
export DATABASE_URL="mysql://erasmus:erasmuspassword@localhost:3306/erasmus_crm"
export JWT_SECRET="erasmus-crm-jwt-secret-key-2026"
export VITE_APP_ID="erasmus-crm-app"
export OAUTH_SERVER_URL="https://oauth.manus.im"
export VITE_OAUTH_PORTAL_URL="https://oauth.manus.im/portal"

# Start the production server
cd /home/ubuntu
node dist/index.js
