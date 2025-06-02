#!/bin/bash

# Script to start multiple instances of the application for testing distributed cron functionality

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting multiple instances of the StarPets application...${NC}"
echo ""

# Create logs directory if it doesn't exist
mkdir -p logs

# Function to start an instance
start_instance() {
    local port=$1
    local instance_name="instance-$port"
    
    echo -e "${GREEN}Starting $instance_name on port $port...${NC}"
    
    # Set environment variables for this instance
    export PORT=$port
    
    # Start the instance in the background and redirect output to log file
    npm start > "logs/$instance_name.log" 2>&1 &
    local pid=$!
    
    echo -e "${YELLOW}$instance_name started with PID $pid${NC}"
    echo $pid > "logs/$instance_name.pid"
    
    # Wait a moment between starts
    sleep 2
}

# Start 5 instances on different ports
start_instance 3001
start_instance 3002
start_instance 3003
start_instance 3004
start_instance 3005

echo ""
echo -e "${BLUE}All instances started!${NC}"
echo ""
echo -e "${YELLOW}Instance logs are available in the logs/ directory:${NC}"
echo "  - logs/instance-3001.log (PID: $(cat logs/instance-3001.pid))"
echo "  - logs/instance-3002.log (PID: $(cat logs/instance-3002.pid))"
echo "  - logs/instance-3003.log (PID: $(cat logs/instance-3003.pid))"
echo "  - logs/instance-3004.log (PID: $(cat logs/instance-3004.pid))"
echo "  - logs/instance-3005.log (PID: $(cat logs/instance-3005.pid))"
echo ""
echo -e "${YELLOW}API endpoints:${NC}"
echo "  - http://localhost:3001/api/tasks (Instance 1)"
echo "  - http://localhost:3002/api/tasks (Instance 2)"
echo "  - http://localhost:3003/api/tasks (Instance 3)"
echo "  - http://localhost:3004/api/tasks (Instance 4)"
echo "  - http://localhost:3005/api/tasks (Instance 5)"
echo ""
echo -e "${GREEN}To stop all instances, run: ./scripts/stop-multiple.sh${NC}"
echo "" 