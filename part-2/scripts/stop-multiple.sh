#!/bin/bash

# Script to stop all running instances of the application

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Stopping all instances of the StarPets application...${NC}"
echo ""

# Function to stop an instance
stop_instance() {
    local port=$1
    local instance_name="instance-$port"
    local pid_file="logs/$instance_name.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        echo -e "${YELLOW}Stopping $instance_name (PID: $pid)...${NC}"
        
        # Check if process is still running
        if ps -p $pid > /dev/null 2>&1; then
            # Send SIGTERM first for graceful shutdown
            kill -TERM $pid
            
            # Wait up to 10 seconds for graceful shutdown
            local count=0
            while ps -p $pid > /dev/null 2>&1 && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
            done
            
            # If still running, force kill
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "${RED}Force killing $instance_name...${NC}"
                kill -KILL $pid
            fi
            
            echo -e "${GREEN}$instance_name stopped${NC}"
        else
            echo -e "${YELLOW}$instance_name was not running${NC}"
        fi
        
        # Remove PID file
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}No PID file found for $instance_name${NC}"
    fi
}

# Stop all instances
stop_instance 3001
stop_instance 3002
stop_instance 3003
stop_instance 3004
stop_instance 3005

# Also kill any remaining node processes running our app
echo ""
echo -e "${YELLOW}Checking for any remaining processes...${NC}"
pkill -f "node.*src/index.ts" && echo -e "${GREEN}Cleaned up remaining processes${NC}" || echo -e "${YELLOW}No remaining processes found${NC}"

echo ""
echo -e "${BLUE}All instances stopped!${NC}"
echo "" 