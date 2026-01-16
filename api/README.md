# ConvertX - High-Performance File Conversion API

A production-grade file conversion API similar to ConvertAPI, built with Python and FastAPI. Convert documents, images, spreadsheets, and presentations between multiple formats with a simple REST API.

## 🚀 Features

- **500+ Conversion Combinations** - Support for documents, images, spreadsheets, presentations
- **Async & Sync Modes** - Choose between async jobs or immediate sync conversion
- **High Performance** - Built on FastAPI with async processing and worker pools
- **Production Ready** - Docker support, health checks, configurable limits
- **SDKs Included** - Python and JavaScript/Node.js client libraries
- **Enterprise Features** - Rate limiting, authentication ready, auto-cleanup

## 📋 Supported Formats

### Documents
| From | To |
|------|-----|
| DOCX, DOC | PDF |
| PDF | DOCX, TXT, PNG |
| HTML | PDF |
| Markdown | PDF, HTML, DOCX |
| ODT, RTF | PDF |

### Images
| From | To |
|------|-----|
| PNG | JPG, WebP |
| JPG | PNG, WebP |
| WebP | PNG, JPG |
| BMP, TIFF, GIF | PNG |

### Spreadsheets
| From | To |
|------|-----|
| XLSX | PDF, CSV |
| CSV | XLSX |

### Presentations
| From | To |
|------|-----|
| PPTX | PDF |

## 🛠️ How It Works

ConvertX uses industry-standard tools under the hood:

- **LibreOffice** - Office document conversions (headless mode)
- **Pillow** - Image processing and format conversion
- **Pandoc** - Markdown and document conversions
- **Poppler** - PDF text extraction and rendering
- **wkhtmltopdf** - HTML to PDF conversion
- **pdf2docx** - PDF to Word conversion

### Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Client     │────▶│  FastAPI     │────▶│  Worker Pool     │
│   (REST)     │◀────│  Gateway     │◀────│  (Async)         │
└──────────────┘     └──────────────┘     └──────────────────┘
                            │                      │
                            ▼                      ▼
                     ┌──────────────┐     ┌──────────────────┐
                     │ File Storage │     │ Conversion       │
                     │ (Temporary)  │     │ Engines          │
                     └──────────────┘     │ - LibreOffice    │
                                          │ - Pillow         │
                                          │ - Pandoc         │
                                          │ - Poppler        │
                                          └──────────────────┘
```

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone and build
git clone <repo>
cd convert-api
docker-compose up -d

# API is now available at http://localhost:8000
```

### Manual Installation

```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y \
    python3.11 python3-pip \
    libreoffice \
    poppler-utils \
    wkhtmltopdf \
    pandoc \
    imagemagick

# Install Python dependencies
pip install -r requirements.txt

# Run the server
python -m uvicorn src.app:app --host 0.0.0.0 --port 8000
```

## 📖 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information |
| GET | `/formats` | List supported formats |
| GET | `/conversions` | List supported conversions |
| POST | `/convert/{from}/to/{to}` | Async conversion (returns job ID) |
| POST | `/convert/sync/{from}/to/{to}` | Sync conversion (returns file) |
| GET | `/status/{job_id}` | Get job status |
| GET | `/download/{job_id}` | Download converted file |
| GET | `/health` | Health check |

### Example: Convert DOCX to PDF

```bash
# Async conversion
curl -X POST "http://localhost:8000/convert/docx/to/pdf" \
  -F "file=@document.docx"

# Response:
{
  "job_id": "abc123",
  "status": "pending",
  "download_url": "/download/abc123"
}

# Check status
curl "http://localhost:8000/status/abc123"

# Download result
curl "http://localhost:8000/download/abc123" -o document.pdf
```

```bash
# Sync conversion (immediate result)
curl -X POST "http://localhost:8000/convert/sync/docx/to/pdf" \
  -F "file=@document.docx" \
  -o document.pdf
```

### Conversion Options

Pass options as query parameters:

```bash
# Image conversion with resize
curl -X POST "http://localhost:8000/convert/png/to/jpg?width=800&quality=90" \
  -F "file=@image.png"

# PDF to images with custom DPI
curl -X POST "http://localhost:8000/convert/pdf/to/png?dpi=300" \
  -F "file=@document.pdf"

# HTML to PDF with page settings
curl -X POST "http://localhost:8000/convert/html/to/pdf?page_size=Letter&margin_top=20mm" \
  -F "file=@page.html"
```

## 🐍 Python SDK

```python
from sdk.convertx import ConvertX

# Initialize client
client = ConvertX("http://localhost:8000")

# Quick sync conversion
result = client.convert_sync("document.docx", "pdf")
print(f"Converted: {result}")

# Async conversion with status polling
job = client.convert("large-document.docx", "pdf")
print(f"Job started: {job.job_id}")

# Wait for completion
result = client.wait_for_completion(job.job_id)
print(f"Completed in {result.conversion_time_ms}ms")

# Download result
client.download(job.job_id, "output.pdf")

# Image conversion with options
client.convert_sync(
    "image.png", 
    "jpg",
    width=800,
    height=600,
    quality=85
)
```

## 📦 JavaScript/Node.js SDK

```javascript
const ConvertX = require('./sdk/convertx');

const client = new ConvertX('http://localhost:8000');

// Sync conversion
const buffer = await client.convertSync('./document.docx', 'pdf');
fs.writeFileSync('output.pdf', buffer);

// Or convert directly to file
await client.convertToFile('./document.docx', './output.pdf');

// Async conversion
const job = await client.convert('./document.docx', 'pdf');
console.log(`Job ID: ${job.jobId}`);

// Wait and download
const completed = await client.waitForCompletion(job.jobId);
await client.downloadToFile(job.jobId, './output.pdf');

// Browser usage
const file = document.querySelector('input[type="file"]').files[0];
const blob = await client.convertSync(file, 'pdf');
const url = URL.createObjectURL(blob);
```

## ⚙️ Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_FILE_SIZE_MB` | 100 | Maximum upload file size |
| `MAX_CONCURRENT_CONVERSIONS` | 10 | Parallel conversion limit |
| `FILE_RETENTION_HOURS` | 24 | How long to keep files |

## 🏗️ Extending with New Converters

Add a new conversion by registering a converter function:

```python
from src.app import ConverterRegistry, ConversionFormat

@ConverterRegistry.register(ConversionFormat.SVG, ConversionFormat.PNG)
async def svg_to_png(input_path: Path, output_dir: Path, options: Dict) -> Path:
    """Convert SVG to PNG using ImageMagick"""
    output_path = output_dir / f"{input_path.stem}.png"
    
    cmd = [
        "convert",
        "-density", str(options.get("dpi", 150)),
        str(input_path),
        str(output_path)
    ]
    
    returncode, stdout, stderr = await run_command(cmd)
    
    if returncode == 0 and output_path.exists():
        return output_path
    
    raise RuntimeError(f"SVG to PNG conversion failed: {stderr}")
```

## 🔒 Security Considerations

- Files are stored temporarily and auto-deleted after 24 hours
- Maximum file size limits prevent DoS
- Worker pool limits concurrent resource usage
- Run as non-root user in Docker
- Support for authentication tokens (implement as needed)

## 📊 Performance Tips

1. **Use sync endpoint for small files** (< 10MB) - faster, no polling
2. **Use async for large files** - prevents timeouts
3. **Adjust worker count** based on CPU cores
4. **Use Redis** for production job queue
5. **Deploy behind Nginx** for SSL and load balancing

## 🐳 Production Deployment

```bash
# Build production image
docker build -t convertx-api:prod .

# Run with docker-compose
docker-compose --profile production up -d

# Or deploy to Kubernetes
kubectl apply -f k8s/
```

## 📄 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

---

Built with ❤️ using FastAPI, LibreOffice, and Python
