#!/bin/bash

# Load Balancer Management Script
# Manages server nodes in load balancer configurations

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load balancer types
LB_TYPE="${LB_TYPE:-nginx}"  # nginx, apache, haproxy, cloudflare, aws
LB_CONFIG_FILE="${LB_CONFIG_FILE:-/etc/nginx/sites-available/brahim-elhouss.me}"
LB_SERVICE_NAME="${LB_SERVICE_NAME:-nginx}"

# Server configuration
SERVER_IP="${SERVER_IP:-127.0.0.1}"
SERVER_PORT="${SERVER_PORT:-80}"
SERVER_WEIGHT="${SERVER_WEIGHT:-1}"
SERVER_BACKUP="${SERVER_BACKUP:-false}"

# Health check settings
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://$SERVER_IP:$SERVER_PORT/health}"
HEALTH_CHECK_TIMEOUT=10
HEALTH_CHECK_RETRIES=3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if server is healthy
check_server_health() {
    local url="${1:-$HEALTH_CHECK_URL}"
    local retries="${2:-$HEALTH_CHECK_RETRIES}"
    
    log_info "Checking server health at $url..."
    
    for ((i=1; i<=retries; i++)); do
        if curl -s -f -m "$HEALTH_CHECK_TIMEOUT" "$url" > /dev/null 2>&1; then
            log_success "Server health check passed (attempt $i)"
            return 0
        fi
        
        if [[ $i -lt $retries ]]; then
            log_warning "Health check failed (attempt $i/$retries), retrying..."
            sleep 2
        fi
    done
    
    log_error "Server health check failed after $retries attempts"
    return 1
}

# Nginx load balancer management
manage_nginx_lb() {
    local action="$1"
    
    case "$action" in
        add)
            log_info "Adding server to Nginx load balancer..."
            
            # Check if upstream block exists
            if ! grep -q "upstream backend" "$LB_CONFIG_FILE" 2>/dev/null; then
                log_error "Nginx upstream block not found in $LB_CONFIG_FILE"
                return 1
            fi
            
            # Check if server already exists
            if grep -q "server $SERVER_IP:$SERVER_PORT" "$LB_CONFIG_FILE" 2>/dev/null; then
                log_info "Server already exists in load balancer, updating..."
                
                # Remove existing entry
                sed -i "/server $SERVER_IP:$SERVER_PORT/d" "$LB_CONFIG_FILE"
            fi
            
            # Add server to upstream block
            local server_line="        server $SERVER_IP:$SERVER_PORT weight=$SERVER_WEIGHT"
            
            if [[ "$SERVER_BACKUP" = "true" ]]; then
                server_line="$server_line backup"
            fi
            
            server_line="$server_line;"
            
            # Insert before the closing brace of upstream block
            sed -i "/upstream backend/,/}/ s/}/    $server_line\n}/" "$LB_CONFIG_FILE"
            
            log_success "Server added to Nginx load balancer"
            ;;
            
        remove)
            log_info "Removing server from Nginx load balancer..."
            
            if grep -q "server $SERVER_IP:$SERVER_PORT" "$LB_CONFIG_FILE" 2>/dev/null; then
                sed -i "/server $SERVER_IP:$SERVER_PORT/d" "$LB_CONFIG_FILE"
                log_success "Server removed from Nginx load balancer"
            else
                log_warning "Server not found in load balancer configuration"
            fi
            ;;
            
        drain)
            log_info "Draining server in Nginx load balancer..."
            
            # Mark server as down but keep in config
            sed -i "s/server $SERVER_IP:$SERVER_PORT[^;]*/server $SERVER_IP:$SERVER_PORT weight=0 down/" "$LB_CONFIG_FILE"
            
            log_success "Server marked as draining"
            ;;
            
        status)
            log_info "Nginx load balancer status:"
            
            if [[ -f "$LB_CONFIG_FILE" ]]; then
                grep -A 20 "upstream backend" "$LB_CONFIG_FILE" | grep -E "server|upstream|}"
            else
                log_error "Configuration file not found: $LB_CONFIG_FILE"
                return 1
            fi
            ;;
            
        *)
            log_error "Unknown action: $action"
            return 1
            ;;
    esac
}

# HAProxy load balancer management
manage_haproxy_lb() {
    local action="$1"
    local haproxy_config="${LB_CONFIG_FILE:-/etc/haproxy/haproxy.cfg}"
    
    case "$action" in
        add)
            log_info "Adding server to HAProxy load balancer..."
            
            # Check if backend section exists
            if ! grep -q "backend web_servers" "$haproxy_config" 2>/dev/null; then
                log_error "HAProxy backend section not found"
                return 1
            fi
            
            # Add server to backend
            local server_line="    server web$(date +%s) $SERVER_IP:$SERVER_PORT check weight $SERVER_WEIGHT"
            
            if [[ "$SERVER_BACKUP" = "true" ]]; then
                server_line="$server_line backup"
            fi
            
            # Add after backend line
            sed -i "/backend web_servers/a\\$server_line" "$haproxy_config"
            
            log_success "Server added to HAProxy load balancer"
            ;;
            
        remove)
            log_info "Removing server from HAProxy load balancer..."
            
            sed -i "/server.*$SERVER_IP:$SERVER_PORT/d" "$haproxy_config"
            
            log_success "Server removed from HAProxy load balancer"
            ;;
            
        drain)
            log_info "Draining server in HAProxy load balancer..."
            
            # Use HAProxy stats socket if available
            if [[ -S "/var/run/haproxy.sock" ]]; then
                echo "disable server web_servers/$(grep "$SERVER_IP:$SERVER_PORT" "$haproxy_config" | awk '{print $2}')" | \
                    socat stdio /var/run/haproxy.sock
            else
                log_warning "HAProxy stats socket not available, marking server as disabled in config"
                sed -i "s/server.*$SERVER_IP:$SERVER_PORT.*/& disabled/" "$haproxy_config"
            fi
            
            log_success "Server marked as draining"
            ;;
            
        status)
            log_info "HAProxy load balancer status:"
            
            if [[ -f "$haproxy_config" ]]; then
                grep -A 10 "backend web_servers" "$haproxy_config"
            else
                log_error "Configuration file not found: $haproxy_config"
                return 1
            fi
            ;;
            
        *)
            log_error "Unknown action: $action"
            return 1
            ;;
    esac
}

# Apache load balancer management (mod_proxy_balancer)
manage_apache_lb() {
    local action="$1"
    local apache_config="${LB_CONFIG_FILE:-/etc/apache2/sites-available/brahim-elhouss.me.conf}"
    
    case "$action" in
        add)
            log_info "Adding server to Apache load balancer..."
            
            # Check if ProxyPass balancer exists
            if ! grep -q "ProxyPass.*balancer:" "$apache_config" 2>/dev/null; then
                log_error "Apache balancer configuration not found"
                return 1
            fi
            
            # Add BalancerMember
            local member_line="    BalancerMember http://$SERVER_IP:$SERVER_PORT"
            
            if [[ "$SERVER_BACKUP" = "true" ]]; then
                member_line="$member_line status=+H"
            fi
            
            # Add after ProxyPass line
            sed -i "/ProxyPass.*balancer:/a\\$member_line" "$apache_config"
            
            log_success "Server added to Apache load balancer"
            ;;
            
        remove)
            log_info "Removing server from Apache load balancer..."
            
            sed -i "/BalancerMember.*$SERVER_IP:$SERVER_PORT/d" "$apache_config"
            
            log_success "Server removed from Apache load balancer"
            ;;
            
        drain)
            log_info "Draining server in Apache load balancer..."
            
            # Mark as disabled
            sed -i "s/BalancerMember.*$SERVER_IP:$SERVER_PORT.*/& status=+D/" "$apache_config"
            
            log_success "Server marked as draining"
            ;;
            
        status)
            log_info "Apache load balancer status:"
            
            if [[ -f "$apache_config" ]]; then
                grep -E "ProxyPass.*balancer|BalancerMember" "$apache_config"
            else
                log_error "Configuration file not found: $apache_config"
                return 1
            fi
            ;;
            
        *)
            log_error "Unknown action: $action"
            return 1
            ;;
    esac
}

# Cloudflare load balancer management (via API)
manage_cloudflare_lb() {
    local action="$1"
    
    # Cloudflare API credentials
    local cf_email="${CLOUDFLARE_EMAIL:-}"
    local cf_api_key="${CLOUDFLARE_API_KEY:-}"
    local cf_zone_id="${CLOUDFLARE_ZONE_ID:-}"
    local cf_pool_id="${CLOUDFLARE_POOL_ID:-}"
    
    if [[ -z "$cf_email" ]] || [[ -z "$cf_api_key" ]] || [[ -z "$cf_zone_id" ]]; then
        log_error "Cloudflare API credentials not configured"
        return 1
    fi
    
    case "$action" in
        add)
            log_info "Adding server to Cloudflare load balancer..."
            
            local origin_data="{\"name\":\"server-$SERVER_IP\",\"address\":\"$SERVER_IP\",\"enabled\":true,\"weight\":$SERVER_WEIGHT}"
            
            curl -X POST "https://api.cloudflare.com/client/v4/zones/$cf_zone_id/load_balancers/pools/$cf_pool_id/origins" \
                -H "X-Auth-Email: $cf_email" \
                -H "X-Auth-Key: $cf_api_key" \
                -H "Content-Type: application/json" \
                --data "$origin_data" &> /dev/null
            
            log_success "Server added to Cloudflare load balancer"
            ;;
            
        remove)
            log_info "Removing server from Cloudflare load balancer..."
            
            # This would require getting the origin ID first
            log_warning "Cloudflare origin removal requires manual configuration"
            ;;
            
        status)
            log_info "Cloudflare load balancer status:"
            
            curl -X GET "https://api.cloudflare.com/client/v4/zones/$cf_zone_id/load_balancers/pools/$cf_pool_id" \
                -H "X-Auth-Email: $cf_email" \
                -H "X-Auth-Key: $cf_api_key" | \
                jq '.result.origins[] | {name, address, enabled, weight}' 2>/dev/null || \
                log_warning "Could not parse Cloudflare API response"
            ;;
            
        *)
            log_error "Unknown action: $action"
            return 1
            ;;
    esac
}

# AWS Application Load Balancer management
manage_aws_lb() {
    local action="$1"
    
    # AWS CLI must be configured
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found"
        return 1
    fi
    
    local target_group_arn="${AWS_TARGET_GROUP_ARN:-}"
    
    if [[ -z "$target_group_arn" ]]; then
        log_error "AWS_TARGET_GROUP_ARN not configured"
        return 1
    fi
    
    case "$action" in
        add)
            log_info "Adding server to AWS load balancer..."
            
            aws elbv2 register-targets \
                --target-group-arn "$target_group_arn" \
                --targets "Id=$SERVER_IP,Port=$SERVER_PORT" &> /dev/null
            
            log_success "Server added to AWS load balancer"
            ;;
            
        remove)
            log_info "Removing server from AWS load balancer..."
            
            aws elbv2 deregister-targets \
                --target-group-arn "$target_group_arn" \
                --targets "Id=$SERVER_IP,Port=$SERVER_PORT" &> /dev/null
            
            log_success "Server removed from AWS load balancer"
            ;;
            
        status)
            log_info "AWS load balancer status:"
            
            aws elbv2 describe-target-health \
                --target-group-arn "$target_group_arn" \
                --query 'TargetHealthDescriptions[*].[Target.Id,Target.Port,TargetHealth.State]' \
                --output table
            ;;
            
        *)
            log_error "Unknown action: $action"
            return 1
            ;;
    esac
}

# Reload load balancer configuration
reload_load_balancer() {
    log_info "Reloading load balancer configuration..."
    
    case "$LB_TYPE" in
        nginx)
            if systemctl reload nginx 2>/dev/null; then
                log_success "Nginx configuration reloaded"
            else
                log_error "Failed to reload Nginx configuration"
                return 1
            fi
            ;;
            
        apache)
            if systemctl reload apache2 2>/dev/null || systemctl reload httpd 2>/dev/null; then
                log_success "Apache configuration reloaded"
            else
                log_error "Failed to reload Apache configuration"
                return 1
            fi
            ;;
            
        haproxy)
            if systemctl reload haproxy 2>/dev/null; then
                log_success "HAProxy configuration reloaded"
            else
                log_error "Failed to reload HAProxy configuration"
                return 1
            fi
            ;;
            
        cloudflare|aws)
            log_info "Cloud load balancer - no reload needed"
            ;;
            
        *)
            log_warning "Unknown load balancer type: $LB_TYPE"
            ;;
    esac
}

# Wait for connections to drain
wait_for_drain() {
    local wait_time="${1:-30}"
    
    log_info "Waiting $wait_time seconds for connections to drain..."
    
    for ((i=wait_time; i>0; i--)); do
        echo -ne "\rWaiting... $i seconds remaining"
        sleep 1
    done
    
    echo
    log_success "Drain period completed"
}

# Main load balancer management function
manage_load_balancer() {
    local action="$1"
    
    case "$LB_TYPE" in
        nginx)
            manage_nginx_lb "$action"
            ;;
        apache)
            manage_apache_lb "$action"
            ;;
        haproxy)
            manage_haproxy_lb "$action"
            ;;
        cloudflare)
            manage_cloudflare_lb "$action"
            ;;
        aws)
            manage_aws_lb "$action"
            ;;
        *)
            log_error "Unsupported load balancer type: $LB_TYPE"
            return 1
            ;;
    esac
    
    # Reload configuration for local load balancers
    if [[ "$action" != "status" ]] && [[ "$LB_TYPE" =~ ^(nginx|apache|haproxy)$ ]]; then
        reload_load_balancer
    fi
}

# Show help
show_help() {
    cat << EOF
Load Balancer Management Tool

Usage: $0 [ACTION] [OPTIONS]

Actions:
    add         Add server to load balancer
    remove      Remove server from load balancer
    drain       Drain connections from server
    status      Show load balancer status
    health      Check server health

Options:
    --type TYPE         Load balancer type (nginx, apache, haproxy, cloudflare, aws)
    --server IP:PORT    Server address (default: 127.0.0.1:80)
    --weight N          Server weight (default: 1)
    --backup            Mark server as backup
    --config FILE       Load balancer configuration file
    --wait-time N       Connection drain wait time in seconds (default: 30)
    --help              Show this help

Environment Variables:
    LB_TYPE                 Load balancer type
    LB_CONFIG_FILE         Configuration file path
    SERVER_IP              Server IP address
    SERVER_PORT            Server port
    HEALTH_CHECK_URL       Health check URL
    CLOUDFLARE_EMAIL       Cloudflare API email
    CLOUDFLARE_API_KEY     Cloudflare API key
    CLOUDFLARE_ZONE_ID     Cloudflare zone ID
    AWS_TARGET_GROUP_ARN   AWS target group ARN

Examples:
    $0 add --server 192.168.1.10:80 --weight 2
    $0 remove --server 192.168.1.10:80
    $0 drain --server 192.168.1.10:80 --wait-time 60
    $0 status
    $0 health --server 192.168.1.10:80

Supported Load Balancers:
- Nginx (upstream blocks)
- Apache (mod_proxy_balancer)
- HAProxy
- Cloudflare Load Balancing
- AWS Application Load Balancer
EOF
}

# Parse command line arguments
ACTION="${1:-status}"
shift 2>/dev/null || true

while [[ $# -gt 0 ]]; do
    case $1 in
        --type)
            LB_TYPE="$2"
            shift 2
            ;;
        --server)
            IFS=':' read -r SERVER_IP SERVER_PORT <<< "$2"
            SERVER_PORT="${SERVER_PORT:-80}"
            shift 2
            ;;
        --weight)
            SERVER_WEIGHT="$2"
            shift 2
            ;;
        --backup)
            SERVER_BACKUP=true
            shift
            ;;
        --config)
            LB_CONFIG_FILE="$2"
            shift 2
            ;;
        --wait-time)
            DRAIN_WAIT_TIME="$2"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
case "$ACTION" in
    add|remove|drain|status)
        manage_load_balancer "$ACTION"
        
        if [[ "$ACTION" = "drain" ]]; then
            wait_for_drain "${DRAIN_WAIT_TIME:-30}"
        fi
        ;;
        
    health)
        check_server_health
        ;;
        
    help|--help)
        show_help
        ;;
        
    *)
        echo "Unknown action: $ACTION"
        show_help
        exit 1
        ;;
esac