# Use Python 3.11 slim image as base (updated from 3.9 for better performance)
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        postgresql-client \
        curl \
        gettext \
        git \
        libffi-dev \
        libssl-dev \
        libjpeg-dev \
        libpng-dev \
        libwebp-dev \
        zlib1g-dev \
        pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user (using adduser for consistency)
RUN adduser --disabled-password --gecos '' appuser \
    && groupadd -r django || true \
    && usermod -a -G django appuser || true

# Copy requirements first (for better Docker layer caching)
COPY requirements.txt /app/
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . /app/

# Create necessary directories for media and static files
RUN mkdir -p /app/logs \
    && mkdir -p /app/media/products/images \
    && mkdir -p /app/media/products/thumbnails \
    && mkdir -p /app/media/categories \
    && mkdir -p /app/media/banners \
    && mkdir -p /app/media/users \
    && mkdir -p /app/media/flash_sales \
    && mkdir -p /app/static \
    && mkdir -p /app/staticfiles

# Create .gitkeep files for media directories
RUN touch /app/media/products/images/.gitkeep \
    && touch /app/media/products/thumbnails/.gitkeep \
    && touch /app/media/categories/.gitkeep \
    && touch /app/media/banners/.gitkeep \
    && touch /app/media/users/.gitkeep \
    && touch /app/media/flash_sales/.gitkeep

# Copy and set permissions for scripts (if they exist)
COPY scripts/ /app/scripts/ 2>/dev/null || true
RUN if [ -d "/app/scripts" ]; then \
        chmod +x /app/scripts/*.sh 2>/dev/null || true; \
        chmod +x /app/scripts/*.py 2>/dev/null || true; \
    fi

# Create entrypoint script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Wait for database to be ready\n\
echo "Waiting for database..."\n\
python manage.py wait_for_db || echo "wait_for_db command not found, continuing..."\n\
\n\
# Run migrations\n\
echo "Running migrations..."\n\
python manage.py migrate --noinput\n\
\n\
# Collect static files\n\
echo "Collecting static files..."\n\
python manage.py collectstatic --noinput --clear || \\\n\
python manage.py collectstatic --noinput --settings=shoponline.settings.production || \\\n\
echo "Static files collection failed, continuing..."\n\
\n\
# Create superuser if it doesn'\''t exist\n\
echo "Creating superuser if needed..."\n\
python manage.py shell -c "\n\
from django.contrib.auth import get_user_model;\n\
User = get_user_model();\n\
if not User.objects.filter(email='\''admin@shoponline.com'\'').exists():\n\
    User.objects.create_superuser('\''admin@shoponline.com'\'', '\''admin123'\'');\n\
    print('\''Superuser created'\'');\n\
else:\n\
    print('\''Superuser already exists'\'');\n\
" || echo "Superuser creation failed, continuing..."\n\
\n\
# Start the application\n\
echo "Starting application..."\n\
exec "$@"' > /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

# Set proper permissions for all directories and files
RUN chown -R appuser:appuser /app \
    && chmod -R 755 /app/media \
    && chmod -R 755 /app/static \
    && chmod -R 755 /app/staticfiles \
    && chmod -R 755 /app/logs

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Set entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

# Default command with both Gunicorn and Daphne options
# For HTTP-only applications, use Gunicorn (better performance)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120", "--keep-alive", "5", "--max-requests", "1000", "--max-requests-jitter", "50", "shoponline_project.wsgi:application"]

# Alternative command for WebSocket support (uncomment to use Daphne instead)
# CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "shoponline.asgi:application"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

# Labels for better organization
LABEL maintainer="ShopOnline Uganda Team" \
      version="1.0" \
      description="ShopOnline Uganda E-commerce Backend" \
      org.opencontainers.image.source="https://github.com/yourusername/shoponline-uganda"