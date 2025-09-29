#!/bin/bash

# Supply Chain AI - Environment Setup Script
# This script helps you quickly set up environment files for deployment

echo "🚀 Supply Chain AI - Environment Setup"
echo "======================================"

# Function to prompt for input with default value
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local varname="$3"
    
    echo -n "$prompt [$default]: "
    read input
    if [ -z "$input" ]; then
        declare -g "$varname=$default"
    else
        declare -g "$varname=$input"
    fi
}

# Function to generate random 32-character key
generate_key() {
    openssl rand -base64 24 | tr -d "=+/" | cut -c1-32
}

echo ""
echo "📋 Please provide the following information:"
echo ""

# Database Configuration
prompt_with_default "Database Host" "your-db-host.com" "DB_HOST"
prompt_with_default "Database Name" "supply_chain_ai" "DB_NAME"
prompt_with_default "Database User" "your-db-user" "DB_USER"
echo -n "Database Password: "
read -s DB_PASSWORD
echo ""

# VPS Configuration
prompt_with_default "VPS IP Address" "localhost" "VPS_IP"

# Generate secure keys
echo ""
echo "🔐 Generating secure encryption key..."
DB_ENCRYPTION_KEY=$(generate_key)

# Optional API Key
prompt_with_default "OpenRouter API Key (optional, press enter to skip)" "" "OPENROUTER_KEY"

# Build connection strings
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:5432/$DB_NAME"
FRONTEND_URLS="http://$VPS_IP:3000,http://localhost:3000"
NEXT_PUBLIC_API_URL="http://$VPS_IP:3004"

echo ""
echo "📝 Creating environment files..."

# Create backend .env
cat > backend/.env << EOF
DATABASE_URL="$DATABASE_URL"
NODE_ENV=production
PORT=3004
FRONTEND_URLS="$FRONTEND_URLS"

OPENROUTER_API_KEY=$OPENROUTER_KEY
DB_ENCRYPTION_KEY="$DB_ENCRYPTION_KEY"

# MCP Server settings
MCP_SERVER_URL=http://mcp-server:3005
MCP_SERVER_TIMEOUT=120000
EOF

# Create frontend .env.local
cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL"
EOF

# Create MCP server .env
cat > mastra-mcp-server/.env << EOF
OPENROUTER_API_KEY=$OPENROUTER_KEY

# Server Configuration
NODE_ENV=production
MCP_PORT=3005
MCP_HOST=0.0.0.0

DATABASE_URL="$DATABASE_URL"
DB_ENCRYPTION_KEY="$DB_ENCRYPTION_KEY"
EOF

echo ""
echo "✅ Environment files created successfully!"
echo ""
echo "📁 Created files:"
echo "  - backend/.env"
echo "  - frontend/.env.local"
echo "  - mastra-mcp-server/.env"
echo ""
echo "🔧 Configuration Summary:"
echo "  Database: $DB_HOST/$DB_NAME"
echo "  VPS IP: $VPS_IP"
echo "  Frontend URL: $NEXT_PUBLIC_API_URL"
echo "  Backend URL: http://$VPS_IP:3004"
echo "  MCP Server URL: http://$VPS_IP:3005"
echo ""
echo "🚀 Next steps:"
echo "  1. Test database connectivity:"
echo "     psql \"$DATABASE_URL\" -c \"SELECT version();\""
echo ""
echo "  2. Build and start containers:"
echo "     docker-compose build"
echo "     docker-compose up -d"
echo ""
echo "  3. Initialize database:"
echo "     docker-compose exec backend npx prisma migrate deploy"
echo "     docker-compose exec backend npx prisma db seed"
echo ""
echo "✨ Happy deploying!"
