#!/bin/bash

# Script to start 5 worker instances with 1 API instance
# All logs will appear in the same stdout with color coding

# Colors for different instances
API_COLOR='\033[0;32m'      # Green for API
WORKER1_COLOR='\033[0;34m'  # Blue for Worker 1
WORKER2_COLOR='\033[0;35m'  # Magenta for Worker 2
WORKER3_COLOR='\033[0;36m'  # Cyan for Worker 3
WORKER4_COLOR='\033[0;33m'  # Yellow for Worker 4
WORKER5_COLOR='\033[0;31m'  # Red for Worker 5
NC='\033[0m'                # No Color

# Function to add colored prefix to logs
prefix_logs() {
    local color=$1
    local prefix=$2
    while IFS= read -r line; do
        echo -e "${color}[${prefix}]${NC} $line"
    done
}

# Function to start API instance
start_api() {
    echo -e "${API_COLOR}Starting API instance on port 3001...${NC}"
    PORT=3000 npm run start-api 2>&1 | prefix_logs "$API_COLOR" "API" &
    API_PID=$!
    echo -e "${API_COLOR}API instance started with PID $API_PID${NC}"
}

# Function to start worker instance
start_worker() {
    local worker_num=$1
    local color=$2
    echo -e "${color}Starting Worker $worker_num...${NC}"
    npm run start-worker 2>&1 | prefix_logs "$color" "WORKER$worker_num" &
    local worker_pid=$!
    echo -e "${color}Worker $worker_num started with PID $worker_pid${NC}"
    eval "WORKER${worker_num}_PID=$worker_pid"
}

# Cleanup function
cleanup() {
    echo ""
    echo -e "\033[1;33mShutting down all instances...${NC}"
    
    # Kill all background processes
    jobs -p | xargs -r kill
    
    echo -e "\033[1;32mAll instances stopped.${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo -e "\033[1;36m============================================${NC}"
echo -e "\033[1;36m  Starting StarPets Distributed Workers   ${NC}"
echo -e "\033[1;36m============================================${NC}"
echo ""

# Start all instances
start_api
sleep 2

start_worker 1 "$WORKER1_COLOR"
sleep 1

start_worker 2 "$WORKER2_COLOR"
sleep 1

start_worker 3 "$WORKER3_COLOR"
sleep 1

start_worker 4 "$WORKER4_COLOR"
sleep 1

start_worker 5 "$WORKER5_COLOR"

echo ""
echo -e "\033[1;32m✓ All instances started successfully!${NC}"
echo ""
echo -e "\033[1;33mAPI Available at: http://localhost:3001${NC}"
echo -e "\033[1;33mColor Legend:${NC}"
echo -e "  ${API_COLOR}■${NC} API Instance"
echo -e "  ${WORKER1_COLOR}■${NC} Worker 1"
echo -e "  ${WORKER2_COLOR}■${NC} Worker 2"
echo -e "  ${WORKER3_COLOR}■${NC} Worker 3"
echo -e "  ${WORKER4_COLOR}■${NC} Worker 4"
echo -e "  ${WORKER5_COLOR}■${NC} Worker 5"
echo ""
echo -e "\033[1;33mPress Ctrl+C to stop all instances${NC}"
echo ""

# Wait for all background processes
wait 