"""
Word to PDF API - Standalone endpoint for Word to PDF conversion
Completely isolated - does not share code with other converters
"""

import os
import uuid
import asyncio
import tempfile
import shutil
from pathlib import Path
from datetime import datetime

from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
import aiofiles


# ============== Configuration ==============
UPLOAD_DIR = Path(tempfile.gettempdir()) / "word_to_pdf_uploads"
OUTPUT_DIR = Path(tempfile.gettempdir()) / "word_to_pdf_outputs"
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
TIMEOUT = 180  # 3 minutes

# Create directories
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ============== Router ==============
router = APIRouter(prefix="/word-to-pdf", tags=["Word to PDF"])


# ============== Conversion Function ==============
async def convert_with_libreoffice(input_file: Path, output_dir: Path) -> Path:
    """
    Convert Word document to PDF using LibreOffice.
    Simple, standalone implementation.
    """

    # Build command
    cmd = [
        "soffice",
        "--headless",
        "--nofirststartwizard",
        "--norestore",
        "--nologo",
        "--convert-to", "pdf",
        "--outdir", str(output_dir),
        str(input_file)
    ]

    # Environment setup
    env = os.environ.copy()
    env["HOME"] = "/tmp"

    # Run conversion
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env=env
    )

    try:
        stdout, stderr = await asyncio.wait_for(
            process.communicate(),
            timeout=TIMEOUT
        )
    except asyncio.TimeoutError:
        process.kill()
        raise RuntimeError("Conversion timed out after 3 minutes")

    # Log output
    stdout_text = stdout.decode() if stdout else ""
    stderr_text = stderr.decode() if stderr else ""

    print(f"[Word→PDF] stdout: {stdout_text}")
    print(f"[Word→PDF] stderr: {stderr_text}")
    print(f"[Word→PDF] return code: {process.returncode}")

    # Find output PDF
    pdf_name = input_file.stem + ".pdf"
    output_file = output_dir / pdf_name

    if output_file.exists():
        print(f"[Word→PDF] Success: {output_file}")
        return output_file

    # Check for any PDF in output directory
    pdf_files = list(output_dir.glob("*.pdf"))
    if pdf_files:
        print(f"[Word→PDF] Found PDF: {pdf_files[0]}")
        return pdf_files[0]

    # List what's in the directory for debugging
    all_files = list(output_dir.glob("*"))
    raise RuntimeError(f"No PDF created. Files in output: {all_files}. Stderr: {stderr_text}")


# ============== Endpoints ==============
@router.get("/health")
async def health():
    """Health check"""
    return {"service": "word-to-pdf", "status": "ok"}


@router.get("/info")
async def info():
    """Service info"""
    return {
        "service": "Word to PDF",
        "accepts": [".docx", ".doc"],
        "returns": ".pdf"
    }


@router.post("/convert")
async def convert(file: UploadFile = File(...)):
    """
    Convert Word document to PDF.

    Accepts: .docx, .doc files
    Returns: PDF file
    """

    # Get filename
    filename = file.filename or "document.docx"
    ext = filename.lower().split(".")[-1]

    # Validate extension
    if ext not in ["docx", "doc"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: .{ext}. Only .docx and .doc are accepted."
        )

    # Check file size
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)

    if size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )

    if size == 0:
        raise HTTPException(
            status_code=400,
            detail="File is empty"
        )

    # Create job directories
    job_id = str(uuid.uuid4())
    job_upload_dir = UPLOAD_DIR / job_id
    job_output_dir = OUTPUT_DIR / job_id

    job_upload_dir.mkdir(parents=True, exist_ok=True)
    job_output_dir.mkdir(parents=True, exist_ok=True)

    input_path = job_upload_dir / filename

    try:
        # Save uploaded file
        async with aiofiles.open(input_path, "wb") as f:
            content = await file.read()
            await f.write(content)

        print(f"[Word→PDF] Processing: {filename} ({size} bytes)")

        # Convert
        output_path = await convert_with_libreoffice(input_path, job_output_dir)

        # Return the PDF
        return FileResponse(
            path=str(output_path),
            filename=output_path.name,
            media_type="application/pdf"
        )

    except Exception as e:
        print(f"[Word→PDF] ERROR: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Conversion failed: {str(e)}"
        )

    finally:
        # Cleanup upload directory (keep output for download)
        try:
            if job_upload_dir.exists():
                shutil.rmtree(job_upload_dir)
        except:
            pass
