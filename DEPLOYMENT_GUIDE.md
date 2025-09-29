# Supply Chain AI - Containerized Deployment Guide (External Database)

## Overview
This guide walks you through deploying the Supply Chain AI application to a Linode Nanode VPS using Docker containers with an external hosted database.

## Prerequisites

### VPS Requirements
- **Linode Nanode VPS** (1GB RAM, 1 vCPU, 25GB SSD)
- **Operating System**: Ubuntu 20.04+ or similar Linux distribution
- **Docker and Docker Compose** installed
- **Git** installed
- **At least 10GB free disk space** (for containers and builds - less needed without local database)

### External Database Requirements
- **PostgreSQL database** (hosted service like AWS RDS, DigitalOcean Managed Database, etc.)
- **Database version**: PostgreSQL 12+ recommended
- **Network access**: Database must be accessible from your VPS IP address
- **Database user**: With full privileges to create/modify tables

### Network Requirements
- Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (Frontend), 3004 (Backend), 3005 (MCP Server)
- Domain name (optional, but recommended for production)

## Setup Instructions

### 1. Initial VPS Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose (Method 1: Compose V2 Plugin - Recommended)
sudo apt update
sudo apt install -y docker-compose-plugin

# Alternative Method 2: Standalone Docker Compose (if plugin doesn't work)
# sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
# sudo chmod +x /usr/local/bin/docker-compose

# Alternative Method 3: Via package manager (older version)
# sudo apt install -y docker-compose

# Install Git and other utilities
sudo apt install -y git htop curl wget

# Reboot to apply docker group changes
sudo reboot
```

### 2. Clone and Setup Project

#### Option A: Using Personal Access Token (Recommended for Private Repos)

```bash
# Generate a Personal Access Token from GitHub:
# 1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
# 2. Generate new token with 'repo' scope
# 3. Copy the token

# Clone using token authentication
git clone https://your-token@github.com/your-username/supply-sense-ai.git
cd supply-sense-ai
```

#### Option B: Using SSH Key

```bash
# Generate SSH key on your VPS (if not already done)
ssh-keygen -t ed25519 -C "your-email@example.com"

# Add the public key to your GitHub account:
# Copy the content of ~/.ssh/id_ed25519.pub to GitHub Settings > SSH and GPG keys

# Clone using SSH
git clone git@github.com:your-username/supply-sense-ai.git
cd supply-sense-ai
```

#### Option C: Using GitHub CLI (Alternative)

```bash
# Install GitHub CLI
sudo apt install gh

# Authenticate with GitHub
gh auth login

# Clone the repository
gh repo clone your-username/supply-sense-ai
cd supply-sense-ai
```

### 3. Configure Environment Variables

#### Option A: Automated Setup (Recommended)

Use the interactive setup script to automatically configure all environment files:

```bash
# Run the automated environment setup script
bash setup-env.sh
```

This script will:
- Prompt you for database credentials, VPS IP, and API keys
- Generate secure encryption keys automatically
- Create all required `.env` files with proper formatting
- Provide a configuration summary

#### Option B: Manual Setup

If you prefer manual configuration, create and edit each service's environment file:

```bash
# Create environment files from templates for each service
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp mastra-mcp-server/.env.example mastra-mcp-server/.env
```

Then configure each service's environment file with your specific settings:

#### Backend Configuration (`backend/.env`)
```bash
# Edit backend environment file
nano backend/.env
```

**Required Configuration:**
```env
DATABASE_URL="postgresql://your_db_user:your_db_password@your-db-host:5432/your_database_name"
NODE_ENV=production
PORT=3004
FRONTEND_URLS="http://your-vps-ip:3000,http://localhost:3000"

# Optional configurations
OPENROUTER_API_KEY=your-openrouter-api-key  # For AI features
DB_ENCRYPTION_KEY="your-32-character-secret-key-here"  # Exactly 32 characters
MCP_SERVER_URL=http://mcp-server:3005  # Internal Docker network URL
MCP_SERVER_TIMEOUT=120000
```

#### Frontend Configuration (`frontend/.env.local`)
```bash
# Edit frontend environment file
nano frontend/.env.local
```

**Required Configuration:**
```env
NEXT_PUBLIC_API_URL="http://your-vps-ip:3004"  # Replace with your VPS IP
```

#### MCP Server Configuration (`mastra-mcp-server/.env`)
```bash
# Edit MCP server environment file
nano mastra-mcp-server/.env
```

**Required Configuration:**
```env
DATABASE_URL="postgresql://your_db_user:your_db_password@your-db-host:5432/your_database_name"
NODE_ENV=production
MCP_PORT=3005
MCP_HOST=0.0.0.0

# Optional configurations
OPENROUTER_API_KEY=your-openrouter-api-key  # For LLM access
DB_ENCRYPTION_KEY="your-32-character-secret-key-here"  # Exactly 32 characters, same as backend
```

**Important Notes:**
- Replace `your-db-host`, `your_db_user`, `your_db_password`, and `your_database_name` with your actual hosted database details
- Replace `your-vps-ip` with your actual VPS IP address
- Use the same `DATABASE_URL` for both backend and MCP server
- Use the same `DB_ENCRYPTION_KEY` for both backend and MCP server (exactly 32 characters)
- Ensure your hosted database allows connections from your VPS IP address

### 4. Verify Database Connectivity

Before deploying, test the database connection:

```bash
# Install PostgreSQL client tools to test connection
sudo apt install -y postgresql-client

# Test database connection (replace with your actual details)
psql "postgresql://your_db_user:your_db_password@your-db-host:5432/your_database_name" -c "SELECT version();"
```

## Deployment Steps

### 1. Build and Start Services

```bash
# Build all containers (this will take some time on first run)
docker-compose build

# Start all services
docker-compose up -d

# Check service status
docker-compose ps
```

### 2. Initialize Database

```bash
# Wait for database to be ready (about 30 seconds)
sleep 30

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database with initial data
docker-compose exec backend npx prisma db seed
```

### 3. Verify Deployment

```bash
# Check all containers are running
docker-compose ps

# Check logs if needed
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mcp-server

# Test API endpoint
curl http://localhost:3004/health

# Test database connectivity from backend
docker-compose exec backend npx prisma db pull --print

# Access the application
# Frontend: http://your-vps-ip:3000
# Backend API: http://your-vps-ip:3004
# MCP Server: http://your-vps-ip:3005
```

## Resource Management for Nanode

### Memory Optimization (External Database Setup)

The Docker Compose file includes resource limits optimized for Nanode's 1GB RAM without local database:
- **MCP Server**: 384MB limit, 192MB reservation (increased from 256MB)
- **Backend**: 512MB limit, 256MB reservation  
- **Frontend**: 384MB limit, 192MB reservation (increased from 256MB)

**Total Container Memory**: ~1.28GB limit (with host OS overhead, fits within 1GB effective usage)

**Benefits of External Database:**
- **More memory available**: ~256MB additional memory for applications
- **Better performance**: Hosted databases typically offer better performance
- **Automatic backups**: Most hosted services provide automatic backups
- **High availability**: Managed database services offer better uptime

### Monitor Resource Usage

```bash
# Check overall system resources
htop

# Check Docker container resources
docker stats

# Check disk usage
df -h
du -sh /var/lib/docker/
```

### Cleanup Commands

```bash
# Remove unused Docker images and containers
docker system prune -f

# Remove unused volumes (BE CAREFUL - this removes data)
docker volume prune -f
```

## Production Optimizations

### 1. Enable Firewall

```bash
# Install and configure UFW
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Frontend (temporary)
sudo ufw allow 3004/tcp  # Backend API (temporary)
```

### 2. Setup Reverse Proxy (Optional but Recommended)

Install Nginx for reverse proxy and SSL:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/supply-chain-ai
```

Example Nginx config:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3004/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable and test:
```bash
sudo ln -s /etc/nginx/sites-available/supply-chain-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL with Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

### 3. Setup Monitoring

```bash
# Install monitoring script
cat > ~/monitor.sh << 'EOF'
#!/bin/bash
echo "=== $(date) ==="
echo "Memory Usage:"
free -h
echo ""
echo "Disk Usage:"
df -h
echo ""
echo "Docker Containers:"
docker-compose ps
echo ""
echo "Docker Resources:"
docker stats --no-stream
echo "===================="
EOF

chmod +x ~/monitor.sh

# Add to crontab for regular monitoring
(crontab -l 2>/dev/null; echo "*/15 * * * * ~/monitor.sh >> ~/system_monitor.log") | crontab -
```

## Troubleshooting

### Common Issues

1. **Docker Compose Command Not Found**
   ```bash
   # Error: Command 'docker-compose' not found
   
   # Solution 1: Install Docker Compose Plugin (Recommended)
   sudo apt update
   sudo apt install -y docker-compose-plugin
   
   # Then use: docker compose (note the space, not hyphen)
   docker compose up -d
   docker compose build
   
   # Solution 2: Install standalone Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   
   # Verify installation
   docker-compose --version
   # or
   docker compose version
   
   # Solution 3: Use package manager (older version)
   sudo apt install -y docker-compose
   ```

2. **Out of Memory Errors**
   ```bash
   # Check memory usage
   free -h
   
   # Stop non-essential services temporarily
   docker-compose stop frontend
   
   # Add swap space
   sudo fallocate -l 1G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

2. **Container Build Failures**
   ```bash
   # Clear Docker cache
   docker builder prune -f
   
   # Rebuild specific service
   docker-compose build --no-cache backend
   ```

3. **Database Connection Issues**
   ```bash
   # Test database connectivity from VPS
   psql "$DATABASE_URL" -c "SELECT version();"
   
   # Check backend logs for database errors
   docker-compose logs backend
   
   # Verify environment variables are loaded
   docker-compose exec backend printenv | grep DATABASE_URL
   
   # Test connection from backend container
   docker-compose exec backend npx prisma db pull --print
   ```

4. **External Database Connectivity Issues**
   ```bash
   # Check if your VPS IP is whitelisted in your database host
   # Check firewall rules on the database server
   # Verify SSL requirements (add ?sslmode=require if needed)
   
   # Test with telnet to check network connectivity
   telnet your-db-host 5432
   ```

5. **Port Conflicts**
   ```bash
   # Check what's using ports
   sudo netstat -tulpn | grep :3000
   sudo netstat -tulpn | grep :3004
   sudo netstat -tulpn | grep :3005
   
   # Kill processes if needed
   sudo fuser -k 3000/tcp
   sudo fuser -k 3004/tcp
   sudo fuser -k 3005/tcp
   ```

### Performance Tuning

```bash
# Limit log sizes to prevent disk filling
echo '{"log-driver": "json-file", "log-opts": {"max-size": "10m", "max-file": "3"}}' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker
```

## Maintenance Commands

### Regular Maintenance

```bash
# Update application
git pull origin main
docker-compose build
docker-compose up -d

# Database backup
docker-compose exec postgres pg_dump -U admin supply_chain_ai > backup_$(date +%Y%m%d).sql

# View logs
docker-compose logs -f --tail=50

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Start all services
docker-compose up -d
```

### Emergency Recovery

```bash
# Stop all containers
docker-compose down

# Remove all containers and volumes (DESTRUCTIVE)
docker-compose down -v

# Rebuild everything from scratch
docker-compose build --no-cache
docker-compose up -d

# Restore database from backup
docker-compose exec -T postgres psql -U admin supply_chain_ai < backup_20240101.sql
```

## Security Considerations

1. **Change Default Passwords**: Update all default passwords in environment files
2. **Use HTTPS**: Setup SSL certificates for production
3. **Firewall**: Only open necessary ports
4. **Regular Updates**: Keep system and Docker images updated
5. **Backup Strategy**: Regular database and file backups
6. **Monitoring**: Setup monitoring and alerting

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs [service-name]`
2. Verify resource usage: `docker stats`
3. Check system resources: `htop` and `df -h`
4. Review the troubleshooting section above

Remember: Nanode VPS has limited resources, so monitor memory and disk usage regularly!
