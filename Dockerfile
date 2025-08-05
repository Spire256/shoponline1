# Use Python 3.9 slim image as base
FROM python:3.9-slim

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

# Create non-root user
RUN groupadd -r django && useradd -r -g django django

# Copy requirements first (for better Docker layer caching)
COPY requirements.txt /app/
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# Copy project files
COPY . /app/

# Create necessary directories
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

# Set proper permissions
RUN chown -R django:django /app \
    && chmod -R 755 /app/media \
    && chmod -R 755 /app/static \
    && chmod -R 755 /app/staticfiles \
    && chmod -R 755 /app/logs

# Copy and set permissions for scripts
COPY scripts/ /app/scripts/
RUN chmod +x /app/scripts/*.sh \
    && chmod +x /app/scripts/*.py

# Create entrypoint script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Wait for database to be ready\n\
echo "Waiting for database..."\n\
python manage.py wait_for_db\n\
\n\
# Run migrations\n\
echo "Running migrations..."\n\
python manage.py migrate --noinput\n\
\n\
# Collect static files\n\
echo "Collecting static files..."\n\
python manage.py collectstatic --noinput --clear\n\
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
"\n\
\n\
# Start the application\n\
echo "Starting application..."\n\
exec "$@"' > /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

# Switch to non-root user
USER django

# Expose port
EXPOSE 8000

# Set entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

# Default command
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120", "--keep-alive", "5", "--max-requests", "1000", "--max-requests-jitter", "50", "shoponline_project.wsgi:application"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

# Labels for better organization
LABEL maintainer="ShopOnline Uganda Team" \
      version="1.0" \
      description="ShopOnline Uganda E-commerce Backend" \
      org.opencontainers.image.source="https://github.com/yourusername/shoponline-uganda"