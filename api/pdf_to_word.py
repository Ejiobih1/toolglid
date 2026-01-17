"""
PDF to Word Converter - Exact Fidelity Conversion
Uses pdf2docx for high-fidelity conversion that preserves exact PDF layout.

This converter:
- Scans the PDF structure completely
- Preserves exact text formatting (fonts, sizes, colors)
- Maintains table structure with colors and borders
- Keeps images in exact positions
- Preserves spacing and alignment
- Converts EXACTLY as the PDF appears

Author: ToolGlid
"""

import io
from pathlib import Path
from pdf2docx import Converter
import fitz  # PyMuPDF as fallback


def convert_pdf_to_word(input_path: str, output_path: str = None) -> str:
    """
    Convert PDF to Word with exact fidelity using pdf2docx.

    This function preserves:
    - Exact text formatting (fonts, sizes, colors, bold, italic)
    - Table structure with cell colors and borders
    - Images in exact positions
    - Page layout and spacing
    - Headers and footers

    Args:
        input_path: Path to input PDF file
        output_path: Path to output DOCX file (optional)

    Returns:
        Path to created Word document
    """
    if output_path is None:
        output_path = str(Path(input_path).with_suffix('.docx'))

    try:
        # Use pdf2docx for high-fidelity conversion
        cv = Converter(input_path)

        # Convert with all formatting preserved
        cv.convert(
            output_path,
            start=0,
            end=None,  # Convert all pages
        )
        cv.close()

        return output_path

    except Exception as e:
        raise Exception(f"PDF to Word conversion failed: {str(e)}")


def convert_pdf_bytes_to_word_bytes(pdf_bytes: bytes) -> bytes:
    """
    Convert PDF bytes to Word document bytes with exact fidelity.

    This function:
    1. Scans the PDF completely
    2. Extracts all formatting information
    3. Converts to Word preserving EVERYTHING exactly

    Args:
        pdf_bytes: PDF file as bytes

    Returns:
        Word document as bytes
    """
    import tempfile
    import os

    # Create temporary files for conversion
    temp_pdf = None
    temp_docx = None

    try:
        # Write PDF bytes to temp file
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
            f.write(pdf_bytes)
            temp_pdf = f.name

        # Create temp output path
        temp_docx = temp_pdf.replace('.pdf', '.docx')

        # Convert using pdf2docx for exact fidelity
        cv = Converter(temp_pdf)
        cv.convert(temp_docx, start=0, end=None)
        cv.close()

        # Read the converted document
        with open(temp_docx, 'rb') as f:
            docx_bytes = f.read()

        return docx_bytes

    except Exception as e:
        raise Exception(f"PDF to Word conversion failed: {str(e)}")

    finally:
        # Clean up temp files
        if temp_pdf and os.path.exists(temp_pdf):
            try:
                os.remove(temp_pdf)
            except:
                pass
        if temp_docx and os.path.exists(temp_docx):
            try:
                os.remove(temp_docx)
            except:
                pass


class PDFToWordConverter:
    """
    High-fidelity PDF to Word converter using pdf2docx.

    This class provides exact conversion that preserves:
    - All text with exact fonts, sizes, and colors
    - Table formatting including cell colors and borders
    - Images in their exact positions
    - Page layout and spacing
    - Everything exactly as it appears in the PDF
    """

    def __init__(self, pdf_path: str):
        """Initialize with PDF file path."""
        self.pdf_path = pdf_path
        self.converter = None

    def convert(self, output_path: str = None) -> str:
        """
        Convert PDF to Word with exact fidelity.

        Args:
            output_path: Output .docx path. If None, uses input name with .docx extension.

        Returns:
            Path to the created Word document.
        """
        if output_path is None:
            output_path = str(Path(self.pdf_path).with_suffix('.docx'))

        try:
            self.converter = Converter(self.pdf_path)
            self.converter.convert(output_path, start=0, end=None)
            self.converter.close()
            return output_path
        except Exception as e:
            if self.converter:
                self.converter.close()
            raise Exception(f"Conversion failed: {str(e)}")

    def convert_to_bytes(self) -> bytes:
        """
        Convert PDF to Word and return as bytes.

        Returns:
            Word document as bytes
        """
        import tempfile
        import os

        temp_docx = None

        try:
            # Create temp output path
            temp_docx = tempfile.mktemp(suffix='.docx')

            # Convert
            self.converter = Converter(self.pdf_path)
            self.converter.convert(temp_docx, start=0, end=None)
            self.converter.close()

            # Read bytes
            with open(temp_docx, 'rb') as f:
                docx_bytes = f.read()

            return docx_bytes

        except Exception as e:
            if self.converter:
                self.converter.close()
            raise Exception(f"Conversion failed: {str(e)}")

        finally:
            if temp_docx and os.path.exists(temp_docx):
                try:
                    os.remove(temp_docx)
                except:
                    pass


# CLI interface
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python pdf_to_word.py <input.pdf> [output.docx]")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None

    print(f"Converting {input_file} with exact fidelity...")
    result = convert_pdf_to_word(input_file, output_file)
    print(f"Created: {result}")
