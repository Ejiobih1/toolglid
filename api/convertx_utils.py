"""
ConvertX Python SDK
Easy-to-use client for the ConvertX file conversion API

Usage:
    from convertx import ConvertX
    
    client = ConvertX(base_url="http://localhost:8000")
    
    # Synchronous conversion
    result = client.convert_sync("document.docx", "pdf")
    
    # Asynchronous conversion
    job = client.convert("document.docx", "pdf")
    result = client.wait_for_completion(job.job_id)
    client.download(job.job_id, "output.pdf")
"""

import os
import time
import requests
from pathlib import Path
from typing import Optional, Dict, Any, Union, BinaryIO
from dataclasses import dataclass
from enum import Enum


class ConversionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class ConversionJob:
    job_id: str
    status: ConversionStatus
    source_format: str
    target_format: str
    created_at: str
    completed_at: Optional[str] = None
    download_url: Optional[str] = None
    error: Optional[str] = None
    file_size: Optional[int] = None
    conversion_time_ms: Optional[int] = None


class ConvertXError(Exception):
    """Base exception for ConvertX errors"""
    pass


class ConversionError(ConvertXError):
    """Error during file conversion"""
    pass


class TimeoutError(ConvertXError):
    """Conversion timed out"""
    pass


class ConvertX:
    """
    ConvertX API Client
    
    Attributes:
        base_url: The base URL of the ConvertX API
        timeout: Request timeout in seconds
    """
    
    def __init__(
        self,
        base_url: str = "http://localhost:8000",
        api_key: Optional[str] = None,
        timeout: int = 300
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self._session = requests.Session()
        
        if api_key:
            self._session.headers["Authorization"] = f"Bearer {api_key}"
    
    def _get_format(self, file_path: Union[str, Path]) -> str:
        """Extract format from file extension"""
        return Path(file_path).suffix.lstrip(".").lower()
    
    def convert(
        self,
        file: Union[str, Path, BinaryIO],
        target_format: str,
        source_format: Optional[str] = None,
        **options
    ) -> ConversionJob:
        """
        Start an asynchronous file conversion.
        
        Args:
            file: Path to file or file-like object
            target_format: Target format (e.g., "pdf", "docx")
            source_format: Source format (auto-detected if not provided)
            **options: Conversion options (width, height, quality, dpi, etc.)
        
        Returns:
            ConversionJob with job_id for tracking
        
        Example:
            job = client.convert("document.docx", "pdf")
            print(f"Job ID: {job.job_id}")
        """
        # Handle file path or file object
        if isinstance(file, (str, Path)):
            file_path = Path(file)
            if not source_format:
                source_format = self._get_format(file_path)
            with open(file_path, "rb") as f:
                files = {"file": (file_path.name, f)}
                return self._do_convert(files, source_format, target_format, options)
        else:
            if not source_format:
                raise ValueError("source_format is required when using file objects")
            files = {"file": ("file", file)}
            return self._do_convert(files, source_format, target_format, options)
    
    def _do_convert(
        self,
        files: Dict,
        source_format: str,
        target_format: str,
        options: Dict
    ) -> ConversionJob:
        """Execute conversion request"""
        url = f"{self.base_url}/convert/{source_format}/to/{target_format}"
        
        # Build query parameters from options
        params = {k: v for k, v in options.items() if v is not None}
        
        response = self._session.post(
            url,
            files=files,
            params=params,
            timeout=self.timeout
        )
        
        if response.status_code != 200:
            raise ConversionError(f"Conversion failed: {response.text}")
        
        data = response.json()
        return ConversionJob(
            job_id=data["job_id"],
            status=ConversionStatus(data["status"]),
            source_format=data["source_format"],
            target_format=data["target_format"],
            created_at=data["created_at"],
            download_url=data.get("download_url")
        )
    
    def convert_sync(
        self,
        file: Union[str, Path, BinaryIO],
        target_format: str,
        source_format: Optional[str] = None,
        output_path: Optional[Union[str, Path]] = None,
        **options
    ) -> Path:
        """
        Convert a file synchronously and save the result.
        
        Args:
            file: Path to file or file-like object
            target_format: Target format
            source_format: Source format (auto-detected if not provided)
            output_path: Where to save the result (auto-generated if not provided)
            **options: Conversion options
        
        Returns:
            Path to the converted file
        
        Example:
            result = client.convert_sync("document.docx", "pdf")
            print(f"Saved to: {result}")
        """
        # Handle file path or file object
        if isinstance(file, (str, Path)):
            file_path = Path(file)
            if not source_format:
                source_format = self._get_format(file_path)
            
            if not output_path:
                output_path = file_path.with_suffix(f".{target_format}")
            
            with open(file_path, "rb") as f:
                files = {"file": (file_path.name, f)}
                return self._do_convert_sync(files, source_format, target_format, output_path, options)
        else:
            if not source_format:
                raise ValueError("source_format is required when using file objects")
            if not output_path:
                output_path = Path(f"output.{target_format}")
            
            files = {"file": ("file", file)}
            return self._do_convert_sync(files, source_format, target_format, output_path, options)
    
    def _do_convert_sync(
        self,
        files: Dict,
        source_format: str,
        target_format: str,
        output_path: Path,
        options: Dict
    ) -> Path:
        """Execute synchronous conversion"""
        url = f"{self.base_url}/convert/sync/{source_format}/to/{target_format}"
        
        params = {k: v for k, v in options.items() if v is not None}
        
        response = self._session.post(
            url,
            files=files,
            params=params,
            timeout=self.timeout,
            stream=True
        )
        
        if response.status_code != 200:
            raise ConversionError(f"Conversion failed: {response.text}")
        
        output_path = Path(output_path)
        with open(output_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return output_path
    
    def get_status(self, job_id: str) -> ConversionJob:
        """
        Get the status of a conversion job.
        
        Args:
            job_id: The job ID returned from convert()
        
        Returns:
            ConversionJob with current status
        """
        url = f"{self.base_url}/status/{job_id}"
        response = self._session.get(url, timeout=30)
        
        if response.status_code == 404:
            raise ConvertXError(f"Job not found: {job_id}")
        
        if response.status_code != 200:
            raise ConvertXError(f"Failed to get status: {response.text}")
        
        data = response.json()
        return ConversionJob(
            job_id=data["job_id"],
            status=ConversionStatus(data["status"]),
            source_format=data["source_format"],
            target_format=data["target_format"],
            created_at=data["created_at"],
            completed_at=data.get("completed_at"),
            download_url=data.get("download_url"),
            error=data.get("error"),
            file_size=data.get("file_size"),
            conversion_time_ms=data.get("conversion_time_ms")
        )
    
    def wait_for_completion(
        self,
        job_id: str,
        poll_interval: float = 1.0,
        timeout: Optional[int] = None
    ) -> ConversionJob:
        """
        Wait for a conversion job to complete.
        
        Args:
            job_id: The job ID to wait for
            poll_interval: Seconds between status checks
            timeout: Maximum seconds to wait (None for no timeout)
        
        Returns:
            ConversionJob with final status
        
        Raises:
            TimeoutError: If timeout is reached
            ConversionError: If conversion fails
        """
        start_time = time.time()
        timeout = timeout or self.timeout
        
        while True:
            job = self.get_status(job_id)
            
            if job.status == ConversionStatus.COMPLETED:
                return job
            
            if job.status == ConversionStatus.FAILED:
                raise ConversionError(f"Conversion failed: {job.error}")
            
            if timeout and (time.time() - start_time) > timeout:
                raise TimeoutError(f"Conversion timed out after {timeout} seconds")
            
            time.sleep(poll_interval)
    
    def download(
        self,
        job_id: str,
        output_path: Union[str, Path]
    ) -> Path:
        """
        Download the converted file.
        
        Args:
            job_id: The job ID of a completed conversion
            output_path: Where to save the file
        
        Returns:
            Path to the downloaded file
        """
        url = f"{self.base_url}/download/{job_id}"
        response = self._session.get(url, timeout=self.timeout, stream=True)
        
        if response.status_code == 400:
            raise ConvertXError("Job is not complete yet")
        
        if response.status_code != 200:
            raise ConvertXError(f"Download failed: {response.text}")
        
        output_path = Path(output_path)
        with open(output_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return output_path
    
    def get_supported_conversions(self) -> list:
        """Get list of supported format conversions"""
        url = f"{self.base_url}/conversions"
        response = self._session.get(url, timeout=30)
        
        if response.status_code != 200:
            raise ConvertXError(f"Failed to get conversions: {response.text}")
        
        return response.json()["supported_conversions"]
    
    def get_supported_formats(self) -> dict:
        """Get list of supported file formats by category"""
        url = f"{self.base_url}/formats"
        response = self._session.get(url, timeout=30)
        
        if response.status_code != 200:
            raise ConvertXError(f"Failed to get formats: {response.text}")
        
        return response.json()
    
    def health_check(self) -> dict:
        """Check if the API is healthy"""
        url = f"{self.base_url}/health"
        response = self._session.get(url, timeout=10)
        return response.json()


# Convenience functions
def convert(
    file: Union[str, Path],
    target_format: str,
    base_url: str = "http://localhost:8000",
    **options
) -> Path:
    """
    Quick convert a file (synchronous).
    
    Args:
        file: Path to the file to convert
        target_format: Target format
        base_url: API base URL
        **options: Conversion options
    
    Returns:
        Path to converted file
    
    Example:
        from convertx import convert
        result = convert("document.docx", "pdf")
    """
    client = ConvertX(base_url=base_url)
    return client.convert_sync(file, target_format, **options)


# Example usage and testing
if __name__ == "__main__":
    # Example usage
    client = ConvertX()
    
    print("ConvertX SDK Example")
    print("=" * 40)
    
    # Check health
    try:
        health = client.health_check()
        print(f"API Status: {health['status']}")
    except Exception as e:
        print(f"API not available: {e}")
        exit(1)
    
    # List supported formats
    formats = client.get_supported_formats()
    print("\nSupported Formats:")
    for category, fmts in formats.items():
        print(f"  {category}: {', '.join(fmts)}")
    
    # List supported conversions
    conversions = client.get_supported_conversions()
    print(f"\nTotal Conversions Supported: {len(conversions)}")
    
    print("\nSDK ready for use!")
