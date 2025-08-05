#!/bin/bash

# ShopOnline Uganda Deployment Script
# Handles deployment to production, staging, and development environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="production"
BRANCH="main"
BACKUP_DB=true
RUN_MIGRATIONS=true
COLLECT_STATIC=true
RESTART_SERVICES=true
SEND_NOTIFICATION=true

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Functions
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

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

ShopOnline Uganda Deployment Script

OPTIONS:
    -e, --environment    Environment to deploy to (production|staging|development)
    -b, --branch         Git branch to deploy (default: main)
    --no-backup         Skip database backup
    --no-migrations     Skip running migrations
    --no-static         Skip collecting static files
    --no-restart        Skip restarting services
    --no-notification   Skip sending deployment notifications
    -h, --help          Show this help message

EXAMPLES:
    $0                              # Deploy main branch to production
    $0 -e staging -b develop        # Deploy develop branch to staging
    $0 --no-backup --no-restart     # Deploy without backup and restart

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -b|--branch)
                BRANCH="$2"
                shift 2
                ;;
            --no-backup)
                BACKUP_DB=false
                shift
                ;;
            --no-migrations)
                RUN_MIGRATIONS=false
                shift
                ;;
            --no-static)
                COLLECT_STATIC=false
                shift
                ;;
            --no-restart)
                RESTART_SERVICES=false
                shift
                ;;
            --no-notification)
                SEND_NOTIFICATION=false
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

validate_environment() {
    case $ENVIRONMENT in
        production|staging|development)
            log_info "Deploying to $ENVIRONMENT environment"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            log_error "Valid environments: production, staging, development"
            exit 1
            ;;
    esac
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [ ! -f "$PROJECT_ROOT/manage.py" ]; then
        log_error "manage.py not found. Please run this script from the project root."
        exit 1
    fi
    
    # Check if git is available
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed or not in PATH"
        exit 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    # Check if python is available
    if ! command -v python &> /dev/null; then
        log_error "Python is not installed or not in PATH"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

backup_database() {
    if [ "$BACKUP_DB" = false ]; then
        log_warning "Skipping database backup"
        return 0
    fi
    
    log_info "Creating database backup..."
    
    if [ -f "$PROJECT_ROOT/scripts/backup_db.py" ]; then
        cd "$PROJECT_ROOT"
        python scripts/backup_db.py
        if [ $? -eq 0 ]; then
            log_success "Database backup completed"
        else
            log_error "Database backup failed"
            exit 1
        fi
    else
        log_warning "Backup script not found, skipping backup"
    fi
}

update_code() {
    log_info "Updating code from branch: $BRANCH"
    
    cd "$PROJECT_ROOT"
    
    # Fetch latest changes
    git fetch origin
    
    # Check if branch exists
    if ! git show-ref --verify --quiet refs/remotes/origin/$BRANCH; then
        log_error "Branch $BRANCH does not exist on remote"
        exit 1
    fi
    
    # Stash any local changes
    if ! git diff-index --quiet HEAD --; then
        log_warning "Stashing local changes"
        git stash push -m "Deployment stash - $(date)"
    fi
    
    # Switch to branch and pull
    git checkout $BRANCH
    git pull origin $BRANCH
    
    log_success "Code updated successfully"
}

build_application() {
    log_info "Building application..."
    
    cd "$PROJECT_ROOT"
    
    # Set environment variables based on deployment environment
    if [ "$ENVIRONMENT" = "production" ]; then
        export DJANGO_SETTINGS_MODULE="shoponline_project.settings.production"
        COMPOSE_FILE="docker-compose.prod.yml"
    elif [ "$ENVIRONMENT" = "staging" ]; then
        export DJANGO_SETTINGS_MODULE="shoponline_project.settings.staging"
        COMPOSE_FILE="docker-compose.staging.yml"
    else
        export DJANGO_SETTINGS_MODULE="shoponline_project.settings.development"
        COMPOSE_FILE="docker-compose.yml"
    fi
    
    # Build Docker images
    if [ -f "$COMPOSE_FILE" ]; then
        log_info "Building Docker images..."
        docker-compose -f "$COMPOSE_FILE" build --no-cache
        log_success "Docker images built successfully"
    else
        log_warning "Docker compose file $COMPOSE_FILE not found"
    fi
}

run_migrations() {
    if [ "$RUN_MIGRATIONS" = false ]; then
        log_warning "Skipping migrations"
        return 0
    fi
    
    log_info "Running database migrations..."
    
    cd "$PROJECT_ROOT"
    
    # Check for pending migrations
    if docker-compose exec -T backend python manage.py showmigrations --plan | grep -q "\[ \]"; then
        log_info "Pending migrations found, applying..."
        docker-compose exec -T backend python manage.py migrate --noinput
        log_success "Migrations completed successfully"
    else
        log_info "No pending migrations"
    fi
}

collect_static_files() {
    if [ "$COLLECT_STATIC" = false ]; then
        log_warning "Skipping static files collection"
        return 0
    fi
    
    log_info "Collecting static files..."
    
    cd "$PROJECT_ROOT"
    docker-compose exec -T backend python manage.py collectstatic --noinput --clear
    
    log_success "Static files collected successfully"
}

restart_services() {
    if [ "$RESTART_SERVICES" = false ]; then
        log_warning "Skipping service restart"
        return 0
    fi
    
    log_info "Restarting services..."
    
    cd "$PROJECT_ROOT"
    
    # Restart services gracefully
    docker-compose restart backend celery celery-beat
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        log_success "Services restarted successfully"
    else
        log_error "Some services failed to start"
        docker-compose ps
        exit 1
    fi
}

run_health_checks() {
    log_info "Running health checks..."
    
    cd "$PROJECT_ROOT"
    
    # Check backend health
    if docker-compose exec -T backend python manage.py check; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        exit 1
    fi
    
    # Check database connectivity
    if docker-compose exec -T backend python manage.py dbshell --command="SELECT 1;" > /dev/null 2>&1; then
        log_success "Database connectivity check passed"
    else
        log_error "Database connectivity check failed"
        exit 1
    fi
    
    # Check Redis connectivity
    if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
        log_success "Redis connectivity check passed"
    else
        log_error "Redis connectivity check failed"
        exit 1
    fi
    
    # Check Celery workers
    if docker-compose exec -T celery celery -A shoponline_project inspect ping > /dev/null 2>&1; then
        log_success "Celery workers check passed"
    else
        log_warning "Celery workers check failed or no workers running"
    fi
}

cleanup_old_files() {
    log_info "Cleaning up old files..."
    
    cd "$PROJECT_ROOT"
    
    # Clean up old Docker images
    docker image prune -f
    
    # Clean up old backup files (keep last 10)
    if [ -d "backups" ]; then
        find backups -name "*.sql.gz" -type f -mtime +7 -delete 2>/dev/null || true
        log_info "Cleaned up old backup files"
    fi
    
    # Clean up old log files (keep last 30 days)
    if [ -d "logs" ]; then
        find logs -name "*.log" -type f -mtime +30 -delete 2>/dev/null || true
        log_info "Cleaned up old log files"
    fi
    
    log_success "Cleanup completed"
}

send_deployment_notification() {
    if [ "$SEND_NOTIFICATION" = false ]; then
        log_warning "Skipping deployment notification"
        return 0
    fi
    
    log_info "Sending deployment notification..."
    
    cd "$PROJECT_ROOT"
    
    # Create deployment notification
    DEPLOYMENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')
    COMMIT_HASH=$(git rev-parse --short HEAD)
    COMMIT_MESSAGE=$(git log -1 --pretty=%B)
    
    # Send notification via Django management command
    cat << EOF | docker-compose exec -T backend python manage.py shell
from django.core.mail import send_mail
from django.conf import settings
import os

subject = "🚀 Deployment Completed - ShopOnline Uganda"
message = f"""
Deployment completed successfully!

Environment: $ENVIRONMENT
Branch: $BRANCH
Commit: $COMMIT_HASH
Time: $DEPLOYMENT_TIME

Commit Message:
$COMMIT_MESSAGE

Deployment performed by: {os.getenv('USER', 'System')}

Services Status:
✅ Backend API
✅ Database
✅ Redis Cache
✅ Celery Workers

The application is now live and ready to serve customers.
"""

admin_emails = [admin[1] for admin in settings.ADMINS]
if admin_emails:
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        admin_emails,
        fail_silently=True
    )
    print("Deployment notification sent successfully")
else:
    print("No admin emails configured for notifications")
EOF
    
    log_success "Deployment notification sent"
}

create_deployment_log() {
    log_info "Creating deployment log..."
    
    DEPLOYMENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')
    COMMIT_HASH=$(git rev-parse --short HEAD)
    LOG_FILE="logs/deployments.log"
    
    mkdir -p "$(dirname "$LOG_FILE")"
    
    echo "[$DEPLOYMENT_TIME] Deployed $BRANCH ($COMMIT_HASH) to $ENVIRONMENT by $(whoami)" >> "$LOG_FILE"
    
    log_success "Deployment log created"
}

rollback_deployment() {
    log_error "Deployment failed, initiating rollback..."
    
    # Get the previous commit
    PREVIOUS_COMMIT=$(git rev-parse HEAD~1)
    
    log_info "Rolling back to previous commit: $PREVIOUS_COMMIT"
    
    # Rollback code
    git reset --hard $PREVIOUS_COMMIT
    
    # Rebuild and restart
    build_application
    restart_services
    
    log_warning "Rollback completed. Please investigate the deployment issue."
}

main() {
    echo "=================================="
    echo "ShopOnline Uganda Deployment"
    echo "=================================="
    
    parse_arguments "$@"
    validate_environment
    check_prerequisites
    
    # Trap errors for rollback
    trap 'rollback_deployment' ERR
    
    # Main deployment steps
    backup_database
    update_code
    build_application
    run_migrations
    collect_static_files
    restart_services
    run_health_checks
    cleanup_old_files
    send_deployment_notification
    create_deployment_log
    
    # Disable error trap after successful deployment
    trap - ERR
    
    echo "=================================="
    log_success "Deployment completed successfully!"
    echo "=================================="
    echo "Environment: $ENVIRONMENT"
    echo "Branch: $BRANCH"
    echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "=================================="
}

# Run main function with all arguments
main "$@"