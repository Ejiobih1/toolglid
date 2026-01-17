"""
PDF to Excel API - Isolated endpoint for PDF to Excel conversion
This API handles ONLY PDF to Excel (XLSX) conversions (table extraction)
"""

import os
import uuid
import asyncio
import tempfile
from pathlib import Path
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from fastapi.responses import FileResponse
import aiofiles


# ============== Configuration ==============
class PDFToExcelConfig:
    UPLOAD_DIR = Path(tempfile.gettempdir()) / "pdf_to_excel_uploads"
    OUTPUT_DIR = Path(tempfile.gettempdir()) / "pdf_to_excel_outputs"
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    CONVERSION_TIMEOUT = 300  # 5 minutes for complex PDFs with many tables

    @classmethod
    def ensure_dirs(cls):
        cls.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        cls.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# Initialize directories
PDFToExcelConfig.ensure_dirs()


# ============== Router ==============
router = APIRouter(prefix="/pdf-to-excel", tags=["PDF to Excel"])


# ============== Converter ==============
async def convert_pdf_to_excel(input_path: Path, output_path: Path,
                               separate_sheets: bool = True,
                               flavor: str = "auto") -> Path:
    """
    Convert PDF tables to Excel using Camelot.
    Extracts tables from PDF and creates a structured Excel file.
    """

    # Get the directory where this script is located
    api_dir = str(Path(__file__).parent.absolute())

    script = f'''
import sys
sys.path.insert(0, "{api_dir}")

try:
    from pdf_to_excel import PDFToExcelConverter

    converter = PDFToExcelConverter("{input_path}")
    converter.convert("{output_path}", separate_sheets={separate_sheets}, flavor="{flavor}")
    print("SUCCESS")
except ImportError as e:
    print(f"ERROR: {{e}}")
    raise
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
            timeout=PDFToExcelConfig.CONVERSION_TIMEOUT
        )
        stdout_str = stdout.decode()
        stderr_str = stderr.decode()
    except asyncio.TimeoutError:
        process.kill()
        raise RuntimeError("PDF to Excel conversion timed out")

    # Log for debugging
    if stdout_str:
        print(f"[PDF→Excel] stdout: {stdout_str}")
    if stderr_str:
        print(f"[PDF→Excel] stderr: {stderr_str}")

    if "SUCCESS" in stdout_str and output_path.exists():
        return output_path

    error_msg = stderr_str if stderr_str else stdout_str
    raise RuntimeError(f"PDF to Excel conversion failed: {error_msg}")


# ============== API Endpoints ==============
@router.get("/health")
async def health_check():
    """Health check for PDF to Excel service"""
    return {
        "service": "pdf-to-excel",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/convert")
async def convert_pdf(
    file: UploadFile = File(...),
    separate_sheets: bool = Query(True, description="Put each table in a separate sheet"),
    flavor: str = Query("auto", description="Table detection: 'auto', 'lattice' (bordered), or 'stream' (borderless)")
):
    """
    Extract tables from PDF and convert to Excel (XLSX).

    - Accepts: .pdf files
    - Returns: XLSX file directly
    - Automatically detects bordered and borderless tables
    - Each table can be placed in a separate sheet or combined

    Options:
    - separate_sheets: If true, each table goes to its own sheet
    - flavor: 'auto' (tries both), 'lattice' (for bordered tables), 'stream' (for borderless)
    """

    # Validate file extension
    filename = file.filename or "document.pdf"
    ext = filename.lower().split('.')[-1]

    if ext != 'pdf':
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{ext}'. Only .pdf files are accepted."
        )

    # Validate flavor parameter
    if flavor not in ['auto', 'lattice', 'stream']:
        raise HTTPException(
            status_code=400,
            detail="Invalid flavor. Use 'auto', 'lattice', or 'stream'."
        )

    # Validate file size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > PDFToExcelConfig.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {PDFToExcelConfig.MAX_FILE_SIZE / (1024*1024):.0f}MB"
        )

    # Generate unique job ID
    job_id = str(uuid.uuid4())
    upload_dir = PDFToExcelConfig.UPLOAD_DIR / job_id
    output_dir = PDFToExcelConfig.OUTPUT_DIR / job_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Save uploaded file
    input_path = upload_dir / filename
    output_filename = filename.rsplit('.', 1)[0] + '.xlsx'
    output_path = output_dir / output_filename

    try:
        async with aiofiles.open(input_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)

        print(f"[PDF→Excel] Converting: {filename} (job: {job_id}, flavor: {flavor})")

        # Convert
        result_path = await convert_pdf_to_excel(
            input_path, output_path,
            separate_sheets=separate_sheets,
            flavor=flavor
        )

        print(f"[PDF→Excel] Success: {result_path.name}")

        return FileResponse(
            result_path,
            filename=output_filename,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

    except Exception as e:
        print(f"[PDF→Excel] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")


@router.get("/info")
async def get_info():
    """Get information about this conversion service"""
    return {
        "service": "PDF to Excel Converter",
        "version": "1.0.0",
        "description": "Extracts tables from PDF documents and converts to Excel format (XLSX)",
        "features": [
            "Automatic table detection",
            "Supports bordered (lattice) and borderless (stream) tables",
            "Multi-page PDF support",
            "Separate sheets per table or combined",
            "Auto-adjusts column widths",
            "Preserves cell structure"
        ],
        "accepted_formats": ["pdf"],
        "output_format": "xlsx",
        "max_file_size_mb": PDFToExcelConfig.MAX_FILE_SIZE / (1024 * 1024),
        "timeout_seconds": PDFToExcelConfig.CONVERSION_TIMEOUT,
        "options": {
            "separate_sheets": "Put each table in its own sheet (default: true)",
            "flavor": "Table detection mode: 'auto', 'lattice', or 'stream' (default: 'auto')"
        }
    }
