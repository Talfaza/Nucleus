#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Nucleus Server Management System${NC}"
echo -e "${BLUE}===========================================${NC}"

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}❌ Port $port is already in use${NC}"
        echo -e "${YELLOW}💡 Run: lsof -ti:$port | xargs kill${NC}"
        return 1
    fi
    return 0
}

# Function to check if .env file exists
check_env() {
    local service_path=$1
    local service_name=$2
    if [ ! -f "$service_path/.env" ]; then
        echo -e "${RED}❌ Missing .env file for $service_name${NC}"
        echo -e "${YELLOW}💡 Create $service_path/.env with required variables${NC}"
        return 1
    fi
    return 0
}

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

# Check ports
check_port 3000 || exit 1
check_port 9872 || exit 1
check_port 7790 || exit 1

# Check .env files
check_env "auth-service" "Auth Service" || exit 1
check_env "prox-service" "Prox Service" || exit 1

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo -e "${RED}❌ Go is not installed${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# Start services
echo -e "${YELLOW}🔧 Starting services...${NC}"

# Start Auth Service
echo -e "${BLUE}📡 Starting Auth Service (port 9872)...${NC}"
cd auth-service
go run main.go &
AUTH_PID=$!
cd ..

# Wait a moment for auth service to start
sleep 2

# Start Prox Service
echo -e "${BLUE}🔧 Starting Prox Service (port 7790)...${NC}"
cd prox-service
go run main.go &
PROX_PID=$!
cd ..

# Wait a moment for prox service to start
sleep 2

# Start Frontend
echo -e "${BLUE}🌐 Starting Frontend (port 3000)...${NC}"
npm run dev &
FRONTEND_PID=$!

# Wait for services to fully start
sleep 3

echo ""
echo -e "${GREEN}🎉 All services started successfully!${NC}"
echo -e "${GREEN}=================================${NC}"
echo -e "${BLUE}🌐 Frontend:    ${NC}http://localhost:3000"
echo -e "${BLUE}🔐 Auth API:    ${NC}http://localhost:9872"
echo -e "${BLUE}⚙️  Prox API:    ${NC}http://localhost:7790"
echo ""
echo -e "${YELLOW}📝 Service PIDs:${NC}"
echo -e "   Auth Service: $AUTH_PID"
echo -e "   Prox Service: $PROX_PID"
echo -e "   Frontend: $FRONTEND_PID"
echo ""
echo -e "${YELLOW}⚠️  To stop all services, run:${NC}"
echo -e "   kill $AUTH_PID $PROX_PID $FRONTEND_PID"
echo ""
echo -e "${GREEN}🚀 Open http://localhost:3000 to get started!${NC}"

# Keep script running to show logs
wait
