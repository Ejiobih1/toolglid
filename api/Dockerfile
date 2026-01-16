# ConvertX API - Production Dockerfile
# Multi-stage build for optimal image size

FROM ubuntu:22.04 AS base

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Python
    python3.11 \
    python3.11-venv \
    python3-pip \
    # LibreOffice for document conversions
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    # PDF tools
    poppler-utils \
    qpdf \
    ghostscript \
    # Image processing
    imagemagick \
    # HTML to PDF
    wkhtmltopdf \
    # Pandoc for markdown
    pandoc \
    # Fonts
    fonts-liberation \
    fonts-dejavu \
    fonts-freefont-ttf \
    # LaTeX for pandoc PDF
    texlive-xetex \
    texlive-fonts-recommended \
    # Utilities
    curl \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create app user
RUN useradd -m -s /bin/bash appuser

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .
COPY pdf_to_word.py .
COPY pdf_to_excel.py .
COPY convertx.py .
COPY convertx.js .

# Create directories for file storage
RUN mkdir -p /tmp/convertx_uploads /tmp/convertx_outputs \
    && chown -R appuser:appuser /tmp/convertx_uploads /tmp/convertx_outputs \
    && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["python3", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
