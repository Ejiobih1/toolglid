"""
PDF to Word API - Isolated endpoint for PDF to Word conversion
This API handles ONLY PDF to Word (DOCX) conversions
"""

import os
import uuid
import asyncio
import tempfile
from pathlib import Path
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
import aiofiles


# ============== Configuration ==============
class PDFToWordConfig:
    UPLOAD_DIR = Path(tempfile.gettempdir()) / "pdf_to_word_uploads"
    OUTPUT_DIR = Path(tempfile.gettempdir()) / "pdf_to_word_outputs"
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    CONVERSION_TIMEOUT = 300  # 5 minutes for complex PDFs

    @classmethod
    def ensure_dirs(cls):
        cls.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        cls.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# Initialize directories
PDFToWordConfig.ensure_dirs()


# ============== Router ==============
router = APIRouter(prefix="/pdf-to-word", tags=["PDF to Word"])


# ============== Converter ==============
async def convert_pdf_to_word(input_path: Path, output_path: Path) -> Path:
    """
    Convert PDF to Word document using our custom high-quality converter.
    Uses PyMuPDF + python-docx for accurate conversion.
    """

    # Get the directory where this script is located
    api_dir = str(Path(__file__).parent.absolute())

    script = f'''
import sys
sys.path.insert(0, "{api_dir}")

try:
    from pdf_to_word import PDFToWordConverter

    converter = PDFToWordConverter("{input_path}")
    converter.convert("{output_path}")
    print("SUCCESS")
except ImportError as e:
    # Fallback to pdf2docx if custom converter not available
    print(f"FALLBACK: {{e}}")
    from pdf2docx import Converter
    cv = Converter("{input_path}")
    cv.convert("{output_path}")
    cv.close()
    print("SUCCESS")
except Exception as e:
    import traceback
    print(f"ERROR: {{e}}")
    traceback.print_exc()
    raise
'''

    process = await asyncio.create_subprocess_exec(
        "python3", "-c", script,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )

    try:
        stdout, stderr = await asyncio.wait_for(
            process.communicate(),
            timeout=PDFToWordConfig.CONVERSION_TIMEOUT
        )
        stdout_str = stdout.decode()
        stderr_str = stderr.decode()
    except asyncio.TimeoutError:
        process.kill()
        raise RuntimeError("PDF to Word conversion timed out")

    # Log for debugging
    if stdout_str:
        print(f"[PDF→Word] stdout: {stdout_str}")
    if stderr_str:
        print(f"[PDF→Word] stderr: {stderr_str}")

    if "SUCCESS" in stdout_str and output_path.exists():
        return output_path

    error_msg = stderr_str if stderr_str else stdout_str
    raise RuntimeError(f"PDF to Word conversion failed: {error_msg}")


# ============== API Endpoints ==============
@router.get("/health")
async def health_check():
    """Health check for PDF to Word service"""
    return {
        "service": "pdf-to-word",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/convert")
async def convert_pdf(
    file: UploadFile = File(...),
):
    """
    Convert PDF to Word document (DOCX).

    - Accepts: .pdf files
    - Returns: DOCX file directly
    - Preserves text formatting, images, tables, and layout
    """

    # Validate file extension
    filename = file.filename or "document.pdf"
    ext = filename.lower().split('.')[-1]

    if ext != 'pdf':
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{ext}'. Only .pdf files are accepted."
        )

    # Validate file size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > PDFToWordConfig.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {PDFToWordConfig.MAX_FILE_SIZE / (1024*1024):.0f}MB"
        )

    # Generate unique job ID
    job_id = str(uuid.uuid4())
    upload_dir = PDFToWordConfig.UPLOAD_DIR / job_id
    output_dir = PDFToWordConfig.OUTPUT_DIR / job_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Save uploaded file
    input_path = upload_dir / filename
    output_filename = filename.rsplit('.', 1)[0] + '.docx'
    output_path = output_dir / output_filename

    try:
        async with aiofiles.open(input_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)

        print(f"[PDF→Word] Converting: {filename} (job: {job_id})")

        # Convert
        result_path = await convert_pdf_to_word(input_path, output_path)

        print(f"[PDF→Word] Success: {result_path.name}")

        return FileResponse(
            result_path,
            filename=output_filename,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )

    except Exception as e:
        print(f"[PDF→Word] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")


@router.get("/info")
async def get_info():
    """Get information about this conversion service"""
    return {
        "service": "PDF to Word Converter",
        "version": "1.0.0",
        "description": "Converts PDF documents to Microsoft Word format (DOCX) with high quality",
        "features": [
            "Preserves text formatting (fonts, sizes, colors)",
            "Extracts and embeds images",
            "Detects and recreates tables",
            "Maintains paragraph structure",
            "Heading detection"
        ],
        "accepted_formats": ["pdf"],
        "output_format": "docx",
        "max_file_size_mb": PDFToWordConfig.MAX_FILE_SIZE / (1024 * 1024),
        "timeout_seconds": PDFToWordConfig.CONVERSION_TIMEOUT
    }
