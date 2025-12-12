import { PDFDocument, degrees, StandardFonts, rgb } from 'pdf-lib';
import jsPDF from 'jspdf';

// API URL configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Merge multiple PDFs into one
export async function mergePDFs(files) {
  try {
    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    return new Blob([mergedPdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Failed to merge PDFs: ${error.message}`);
  }
}

// Split PDF into individual pages
export async function splitPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();
    const splitPdfs = [];

    // Get original filename without extension
    const originalName = file.name.replace(/\.pdf$/i, '');

    for (let i = 0; i < pageCount; i++) {
      const newPdf = await PDFDocument.create();
      const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
      newPdf.addPage(copiedPage);

      // Add metadata
      newPdf.setTitle(`${originalName} - Page ${i + 1}`);
      newPdf.setCreator('PDF Tools Pro');

      const pdfBytes = await newPdf.save();
      splitPdfs.push({
        blob: new Blob([pdfBytes], { type: 'application/pdf' }),
        name: `${originalName}_page_${i + 1}.pdf`
      });
    }

    return splitPdfs;
  } catch (error) {
    throw new Error(`Failed to split PDF: ${error.message}`);
  }
}

// Compress PDF by removing unnecessary data and optimizing
export async function compressPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    // Remove unused objects and compress
    const compressedPdfBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
    });

    const originalSize = file.size;
    const compressedSize = compressedPdfBytes.length;
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

    console.log(`Compression: ${originalSize} → ${compressedSize} bytes (${compressionRatio}% reduction)`);

    return new Blob([compressedPdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Failed to compress PDF: ${error.message}`);
  }
}

// Convert PDF to JPG images
export async function pdfToJPG(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // Use pdfjs to render PDF pages
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    if (!pdfjsLib) {
      throw new Error('PDF.js library not loaded');
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const images = [];
    const originalName = file.name.replace(/\.pdf$/i, '');

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const scale = 2.5; // Higher quality
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // White background
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.92);
      });

      images.push({
        blob,
        name: `${originalName}_page_${pageNum}.jpg`
      });
    }

    return images;
  } catch (error) {
    throw new Error(`Failed to convert PDF to JPG: ${error.message}`);
  }
}

// Convert images (JPG/PNG) to PDF
export async function jpgToPDF(files) {
  try {
    const pdfDoc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    let firstPage = true;

    for (const file of files) {
      const imageData = await readFileAsDataURL(file);
      const img = await loadImage(imageData);

      // Determine image type
      const imgType = file.type.includes('png') ? 'PNG' : 'JPEG';

      // Calculate dimensions to fit page while maintaining aspect ratio
      const pageWidth = pdfDoc.internal.pageSize.getWidth();
      const pageHeight = pdfDoc.internal.pageSize.getHeight();
      const margin = 10;
      const maxWidth = pageWidth - (margin * 2);
      const maxHeight = pageHeight - (margin * 2);

      let imgWidth = maxWidth;
      let imgHeight = (img.height * maxWidth) / img.width;

      // If image is too tall, scale by height instead
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = (img.width * maxHeight) / img.height;
      }

      // Center the image
      const xPos = (pageWidth - imgWidth) / 2;
      const yPos = (pageHeight - imgHeight) / 2;

      if (!firstPage) {
        pdfDoc.addPage();
      }
      firstPage = false;

      pdfDoc.addImage(imageData, imgType, xPos, yPos, imgWidth, imgHeight);
    }

    const pdfBlob = pdfDoc.output('blob');
    return pdfBlob;
  } catch (error) {
    throw new Error(`Failed to convert images to PDF: ${error.message}`);
  }
}

// Convert PDF to Word - Creating real DOCX using JSZip
export async function pdfToWord(file) {
  try {
    console.log('Starting PDF to Word conversion...');

    // Check for JSZip library
    if (!window.JSZip) {
      throw new Error('JSZip library not loaded. Please refresh the page.');
    }

    // Load PDF with PDF.js
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    if (!pdfjsLib) {
      throw new Error('PDF.js library not loaded. Please refresh the page.');
    }

    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    // Load the PDF file
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;

    console.log(`PDF loaded successfully. Total pages: ${pdfDocument.numPages}`);

    // Extract text from all pages and build paragraphs
    let paragraphsXml = '';

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
      console.log(`Processing page ${pageNumber}/${pdfDocument.numPages}...`);

      const page = await pdfDocument.getPage(pageNumber);
      const textContent = await page.getTextContent();

      // Add page heading
      paragraphsXml += `
        <w:p>
          <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
          <w:r>
            <w:rPr><w:b/></w:rPr>
            <w:t>Page ${pageNumber}</w:t>
          </w:r>
        </w:p>`;

      // Extract and organize text items by vertical position
      const textItems = textContent.items;
      const lineMap = new Map();

      textItems.forEach(item => {
        const yPosition = Math.round(item.transform[5]);
        const text = item.str;

        if (!lineMap.has(yPosition)) {
          lineMap.set(yPosition, []);
        }
        lineMap.get(yPosition).push(text);
      });

      // Sort by Y position (top to bottom)
      const sortedLines = Array.from(lineMap.entries())
        .sort((a, b) => b[0] - a[0]);

      // Add each line as a paragraph
      sortedLines.forEach(([, texts]) => {
        const lineText = texts.join(' ').trim();
        if (lineText.length > 0) {
          // Escape XML special characters
          const escapedText = lineText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');

          paragraphsXml += `
            <w:p>
              <w:r>
                <w:t xml:space="preserve">${escapedText}</w:t>
              </w:r>
            </w:p>`;
        }
      });

      // Add spacing between pages
      if (pageNumber < pdfDocument.numPages) {
        paragraphsXml += '<w:p><w:r><w:t></w:t></w:r></w:p>';
      }
    }

    console.log('Creating DOCX structure...');

    // Create DOCX structure using JSZip
    const zip = new window.JSZip();

    // Add [Content_Types].xml
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

    // Add _rels/.rels
    zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

    // Add word/_rels/document.xml.rels
    zip.folder('word').folder('_rels').file('document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`);

    // Add word/document.xml
    zip.folder('word').file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphsXml}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`);

    console.log('Generating DOCX file...');

    // Generate the DOCX file
    const docxBlob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    console.log('PDF to Word conversion completed successfully!');

    return docxBlob;

  } catch (error) {
    console.error('PDF to Word conversion failed:', error);
    throw new Error(`Conversion failed: ${error.message}`);
  }
}

// Convert Word to PDF (with better formatting)
export async function wordToPDF(file) {
  try {
    // Check if mammoth is loaded
    const mammoth = window.mammoth;
    if (!mammoth) {
      throw new Error('Mammoth library not loaded. Please refresh the page and try again.');
    }

    const arrayBuffer = await file.arrayBuffer();

    // Check file type
    const fileName = file.name.toLowerCase();

    // Handle .docx files (modern Word format)
    if (fileName.endsWith('.docx')) {
      try {
        console.log('Converting .docx file to PDF...');

        // Convert to HTML first to preserve some formatting
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;

        // Log any messages from mammoth
        if (result.messages && result.messages.length > 0) {
          console.log('Mammoth conversion messages:', result.messages);
        }

        // Check if we got any content
        if (!html || html.trim().length === 0) {
          throw new Error('No content could be extracted from the Word document. The file may be empty or corrupted.');
        }

        // Extract text with basic formatting preserved
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Process HTML to extract structured text
        const processNode = (node) => {
          let text = '';

          if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent;
          }

          if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();

            // Handle headings
            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
              text += '\n\n### ' + node.textContent + ' ###\n\n';
            }
            // Handle paragraphs
            else if (tagName === 'p') {
              text += '\n' + node.textContent + '\n';
            }
            // Handle lists
            else if (tagName === 'li') {
              text += '\n• ' + node.textContent;
            }
            // Handle line breaks
            else if (tagName === 'br') {
              text += '\n';
            }
            // Handle other elements
            else {
              for (let child of node.childNodes) {
                text += processNode(child);
              }
            }
          }

          return text;
        };

        const text = processNode(tempDiv);

        // Check if we extracted any text
        if (!text || text.trim().length === 0) {
          throw new Error('No text could be extracted from the Word document. The document may be empty or contain only images.');
        }

        console.log('Successfully converted Word to text, creating PDF...');
        return createPDFFromText(text, file.name);

      } catch (docxError) {
        console.error('.docx conversion error:', docxError);
        throw new Error(`Failed to read .docx file: ${docxError.message}. Make sure the file is a valid Word document.`);
      }
    }

    // Handle .doc files (old Word format)
    else if (fileName.endsWith('.doc')) {
      throw new Error('Old .doc format is not supported. Please save your document as .docx (modern Word format) and try again.');
    }

    // Handle plain text files as fallback
    else if (fileName.endsWith('.txt')) {
      console.log('Converting plain text file to PDF...');
      const text = await file.text();
      if (!text || text.trim().length === 0) {
        throw new Error('The text file is empty.');
      }
      return createPDFFromText(text, file.name);
    }

    // Unsupported format
    else {
      throw new Error(`Unsupported file format: ${fileName}. Only .docx and .txt files are supported.`);
    }

  } catch (error) {
    console.error('Word to PDF conversion error:', error);
    throw new Error(`Failed to convert to PDF: ${error.message}`);
  }
}

// Helper function to create PDF from text with better formatting
function createPDFFromText(text, originalFilename = 'document') {
  const pdfDoc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  // Add metadata
  pdfDoc.setProperties({
    title: originalFilename.replace(/\.(docx?|txt)$/i, ''),
    author: 'PDF Tools Pro',
    creator: 'PDF Tools Pro'
  });

  // Set font
  pdfDoc.setFont('helvetica');
  pdfDoc.setFontSize(11);

  const pageWidth = pdfDoc.internal.pageSize.getWidth();
  const pageHeight = pdfDoc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);

  let y = margin;
  const lineHeight = 7;
  const paragraphSpacing = 3;

  // Split text into paragraphs
  const paragraphs = text.split(/\n\n+/);

  paragraphs.forEach((paragraph) => {
    // Skip empty paragraphs
    if (!paragraph.trim()) return;

    // Detect heading styles
    const isHeading = paragraph.length < 60 &&
                     (paragraph === paragraph.toUpperCase() ||
                      paragraph.startsWith('#') ||
                      /^(\d+\.|\*|-)\s/.test(paragraph));

    if (isHeading) {
      pdfDoc.setFontSize(14);
      pdfDoc.setFont('helvetica', 'bold');
    } else {
      pdfDoc.setFontSize(11);
      pdfDoc.setFont('helvetica', 'normal');
    }

    // Clean the paragraph
    const cleanParagraph = paragraph.replace(/^#+\s*/, '').trim();

    // Split paragraph into lines that fit the page width
    const lines = pdfDoc.splitTextToSize(cleanParagraph, maxWidth);

    lines.forEach((line) => {
      // Check if we need a new page
      if (y + lineHeight > pageHeight - margin) {
        pdfDoc.addPage();
        y = margin;
      }

      pdfDoc.text(line, margin, y);
      y += lineHeight;
    });

    // Add extra space after paragraph
    y += paragraphSpacing;
  });

  const pdfBlob = pdfDoc.output('blob');
  return pdfBlob;
}

// Rotate PDF pages
export async function rotatePDF(file, rotation = 90) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();

    pages.forEach(page => {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees(currentRotation + rotation));
    });

    const rotatedPdfBytes = await pdfDoc.save();
    return new Blob([rotatedPdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Failed to rotate PDF: ${error.message}`);
  }
}

// Add custom watermark to PDF
export async function protectPDF(file, watermarkText, style = '1') {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const angle = 45; // Diagonal angle

    pages.forEach(page => {
      const { width, height } = page.getSize();

      if (style === '1') {
        // Single large centered watermark
        const fontSize = 80;
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
        const radians = (angle * Math.PI) / 180;
        const centerX = width / 2 - (textWidth * Math.cos(radians)) / 2;
        const centerY = height / 2;

        page.drawText(watermarkText, {
          x: centerX,
          y: centerY,
          size: fontSize,
          font: font,
          color: rgb(0.6, 0.6, 0.6),
          opacity: 0.15,
          rotate: degrees(angle),
        });
      } else {
        // Multiple small tiled watermarks
        const fontSize = 40;
        const spacingX = 250;
        const spacingY = 150;

        for (let x = -width; x < width * 2; x += spacingX) {
          for (let y = -height; y < height * 2; y += spacingY) {
            page.drawText(watermarkText, {
              x: x,
              y: y,
              size: fontSize,
              font: font,
              color: rgb(0.7, 0.7, 0.7),
              opacity: 0.12,
              rotate: degrees(angle),
            });
          }
        }
      }
    });

    // Add metadata
    pdfDoc.setTitle(`Watermarked: ${watermarkText}`);
    pdfDoc.setAuthor('PDF Tools Pro');
    pdfDoc.setSubject(`Watermarked with: ${watermarkText}`);

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Failed to add watermark: ${error.message}`);
  }
}

// Encrypt PDF with real password (using backend API)
export async function encryptPDF(file, password) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/encrypt-pdf`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to encrypt PDF');
    }

    const encryptedBlob = await response.blob();
    return encryptedBlob;
  } catch (error) {
    throw new Error(`Failed to encrypt PDF: ${error.message}`);
  }
}

// Remove PDF password protection (using backend API)
export async function unlockPDF(file, password) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password || '');

    const response = await fetch(`${API_BASE_URL}/decrypt-pdf`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to decrypt PDF');
    }

    const decryptedBlob = await response.blob();
    return decryptedBlob;
  } catch (error) {
    throw new Error(`Failed to unlock PDF: ${error.message}`);
  }
}

// Helper function to read file as Data URL
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper function to load image
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// PDF to PNG (same as JPG but PNG format)
export async function pdfToPNG(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    if (!pdfjsLib) {
      throw new Error('PDF.js library not loaded');
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const images = [];
    const originalName = file.name.replace(/\.pdf$/i, '');

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const scale = 2.5;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png');
      });

      images.push({
        blob,
        name: `${originalName}_page_${pageNum}.png`
      });
    }

    return images;
  } catch (error) {
    throw new Error(`Failed to convert PDF to PNG: ${error.message}`);
  }
}

// Add page numbers to PDF
export async function addPageNumbers(file, position = 'bottom-center', startNumber = 1) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      const pageNumber = startNumber + index;
      const text = `${pageNumber}`;
      const fontSize = 12;
      const textWidth = font.widthOfTextAtSize(text, fontSize);

      let x, y;
      const margin = 30;

      // Determine position
      if (position.includes('bottom')) {
        y = margin;
      } else if (position.includes('top')) {
        y = height - margin;
      } else {
        y = height / 2;
      }

      if (position.includes('center')) {
        x = (width - textWidth) / 2;
      } else if (position.includes('right')) {
        x = width - textWidth - margin;
      } else {
        x = margin;
      }

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
    });

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Failed to add page numbers: ${error.message}`);
  }
}

// Extract specific pages from PDF
export async function extractPages(file, pageNumbers) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const newPdf = await PDFDocument.create();

    // Convert page numbers to zero-indexed
    const pageIndices = pageNumbers.map(num => num - 1);

    const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Failed to extract pages: ${error.message}`);
  }
}

// Delete specific pages from PDF
export async function deletePages(file, pageNumbers) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const totalPages = pdfDoc.getPageCount();

    // Create array of pages to keep
    const pagesToKeep = [];
    for (let i = 1; i <= totalPages; i++) {
      if (!pageNumbers.includes(i)) {
        pagesToKeep.push(i - 1); // Convert to zero-indexed
      }
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdfDoc, pagesToKeep);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Failed to delete pages: ${error.message}`);
  }
}

// Extract text from PDF (standalone tool)
export async function extractText(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = window['pdfjs-dist/build/pdf'];

    if (pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += `\n\n--- Page ${pageNum} ---\n\n${pageText}`;
      }

      const textBlob = new Blob([fullText], { type: 'text/plain' });
      return textBlob;
    }

    throw new Error('PDF.js library not loaded');
  } catch (error) {
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

// Add signature to PDF (image-based)
export async function addSignature(file, signatureImageFile, position = 'bottom-right') {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    // Load signature image
    const signatureBytes = await signatureImageFile.arrayBuffer();
    let signatureImage;

    if (signatureImageFile.type === 'image/png') {
      signatureImage = await pdfDoc.embedPng(signatureBytes);
    } else {
      signatureImage = await pdfDoc.embedJpg(signatureBytes);
    }

    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    const { width, height } = lastPage.getSize();

    const signatureWidth = 150;
    const signatureHeight = 50;
    const margin = 50;

    let x, y;
    if (position === 'bottom-right') {
      x = width - signatureWidth - margin;
      y = margin;
    } else if (position === 'bottom-left') {
      x = margin;
      y = margin;
    } else if (position === 'top-right') {
      x = width - signatureWidth - margin;
      y = height - signatureHeight - margin;
    } else {
      x = margin;
      y = height - signatureHeight - margin;
    }

    lastPage.drawImage(signatureImage, {
      x,
      y,
      width: signatureWidth,
      height: signatureHeight,
    });

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Failed to add signature: ${error.message}`);
  }
}

// Edit PDF Metadata
export async function editMetadata(file, metadata) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    if (metadata.title) pdfDoc.setTitle(metadata.title);
    if (metadata.author) pdfDoc.setAuthor(metadata.author);
    if (metadata.subject) pdfDoc.setSubject(metadata.subject);
    if (metadata.keywords) pdfDoc.setKeywords(metadata.keywords.split(',').map(k => k.trim()));
    if (metadata.creator) pdfDoc.setCreator(metadata.creator);
    if (metadata.producer) pdfDoc.setProducer(metadata.producer);

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Failed to edit metadata: ${error.message}`);
  }
}

// Extract images from PDF
export async function extractImages(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    // Note: pdf-lib doesn't have direct image extraction
    // We'll convert pages to images as a workaround
    return await pdfToJPG(file);
  } catch (error) {
    throw new Error(`Failed to extract images: ${error.message}`);
  }
}

// Crop PDF pages
export async function cropPDF(file, margins = { top: 50, bottom: 50, left: 50, right: 50 }) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();

    pages.forEach(page => {
      const { width, height } = page.getSize();

      page.setCropBox(
        margins.left,
        margins.bottom,
        width - margins.left - margins.right,
        height - margins.top - margins.bottom
      );
    });

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Failed to crop PDF: ${error.message}`);
  }
}

// Resize PDF pages
export async function resizePDF(file, pageSize = 'A4') {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const newPdf = await PDFDocument.create();

    // Page size dimensions in points (1 inch = 72 points)
    const pageSizes = {
      'A4': { width: 595, height: 842 },
      'Letter': { width: 612, height: 792 },
      'Legal': { width: 612, height: 1008 },
      'A3': { width: 842, height: 1191 },
      'A5': { width: 420, height: 595 },
    };

    const targetSize = pageSizes[pageSize] || pageSizes['A4'];
    const pages = pdfDoc.getPages();

    for (let i = 0; i < pages.length; i++) {
      const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
      copiedPage.setSize(targetSize.width, targetSize.height);
      newPdf.addPage(copiedPage);
    }

    const pdfBytes = await newPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Failed to resize PDF: ${error.message}`);
  }
}

// Flatten PDF (make form fields non-editable)
export async function flattenPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    const form = pdfDoc.getForm();
    const fields = form.getFields();

    // Flatten all form fields
    fields.forEach(field => {
      try {
        form.flatten();
      } catch (e) {
        console.warn('Could not flatten field:', field.getName());
      }
    });

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Failed to flatten PDF: ${error.message}`);
  }
}

// Add header and footer to PDF
export async function addHeaderFooter(file, headerText = '', footerText = '') {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;

    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      const margin = 30;

      // Add header
      if (headerText) {
        const processedHeader = headerText.replace('{page}', index + 1).replace('{total}', pages.length);
        const headerWidth = font.widthOfTextAtSize(processedHeader, fontSize);
        page.drawText(processedHeader, {
          x: (width - headerWidth) / 2,
          y: height - margin,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0),
        });
      }

      // Add footer
      if (footerText) {
        const processedFooter = footerText.replace('{page}', index + 1).replace('{total}', pages.length);
        const footerWidth = font.widthOfTextAtSize(processedFooter, fontSize);
        page.drawText(processedFooter, {
          x: (width - footerWidth) / 2,
          y: margin,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0),
        });
      }
    });

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Failed to add header/footer: ${error.message}`);
  }
}

// Organize Pages - Reorder pages based on custom order
export async function organizePages(file, pageOrder) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    const newDoc = await PDFDocument.create();

    // Copy pages in the specified order
    for (const pageNum of pageOrder) {
      const [copiedPage] = await newDoc.copyPages(pdfDoc, [pageNum - 1]); // pageNum is 1-indexed
      newDoc.addPage(copiedPage);
    }

    const pdfBytes = await newDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Failed to organize pages: ${error.message}`);
  }
}

// Get file size in MB
export function getFileSizeMB(blob) {
  return (blob.size / (1024 * 1024)).toFixed(2);
}
