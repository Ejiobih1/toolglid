/**
 * ConvertX JavaScript/Node.js SDK
 * Easy-to-use client for the ConvertX file conversion API
 *
 * Usage (Node.js):
 *   const ConvertX = require('./convertx');
 *   const client = new ConvertX('http://localhost:8000');
 *   const result = await client.convertSync('./document.docx', 'pdf');
 *
 * Usage (Browser with fetch):
 *   const client = new ConvertX('http://localhost:8000');
 *   const result = await client.convert(file, 'pdf', 'docx');
 */

class ConvertXError extends Error {
  constructor(message, statusCode = null) {
    super(message);
    this.name = 'ConvertXError';
    this.statusCode = statusCode;
  }
}

class ConversionError extends ConvertXError {
  constructor(message) {
    super(message);
    this.name = 'ConversionError';
  }
}

class TimeoutError extends ConvertXError {
  constructor(message) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * ConversionJob represents the status of a conversion task
 */
class ConversionJob {
  constructor(data) {
    this.jobId = data.job_id;
    this.status = data.status;
    this.sourceFormat = data.source_format;
    this.targetFormat = data.target_format;
    this.createdAt = data.created_at;
    this.completedAt = data.completed_at || null;
    this.downloadUrl = data.download_url || null;
    this.error = data.error || null;
    this.fileSize = data.file_size || null;
    this.conversionTimeMs = data.conversion_time_ms || null;
  }

  isComplete() {
    return this.status === 'completed';
  }

  isFailed() {
    return this.status === 'failed';
  }

  isPending() {
    return this.status === 'pending' || this.status === 'processing';
  }
}

/**
 * ConvertX API Client
 */
class ConvertX {
  /**
   * Create a new ConvertX client
   * @param {string} baseUrl - API base URL (default: http://localhost:8000)
   * @param {Object} options - Configuration options
   * @param {string} options.apiKey - API key for authentication
   * @param {number} options.timeout - Request timeout in ms (default: 300000)
   */
  constructor(baseUrl = 'http://localhost:8000', options = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey || null;
    this.timeout = options.timeout || 300000;

    // Detect environment
    this.isNode = typeof window === 'undefined';
    
    if (this.isNode) {
      this.fs = require('fs');
      this.path = require('path');
      this.FormData = require('form-data');
    }
  }

  /**
   * Build headers for requests
   */
  _getHeaders(additionalHeaders = {}) {
    const headers = { ...additionalHeaders };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  /**
   * Make HTTP request
   */
  async _fetch(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: this._getHeaders(options.headers)
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new TimeoutError('Request timed out');
      }
      throw error;
    }
  }

  /**
   * Get file extension from path
   */
  _getExtension(filePath) {
    if (this.isNode) {
      return this.path.extname(filePath).slice(1).toLowerCase();
    }
    return filePath.split('.').pop().toLowerCase();
  }

  /**
   * Convert a file asynchronously
   * @param {File|string|Buffer} file - File to convert (File object, path, or Buffer)
   * @param {string} targetFormat - Target format (e.g., 'pdf', 'docx')
   * @param {string} sourceFormat - Source format (optional, auto-detected)
   * @param {Object} options - Conversion options
   * @returns {Promise<ConversionJob>}
   */
  async convert(file, targetFormat, sourceFormat = null, options = {}) {
    const formData = this.isNode ? new this.FormData() : new FormData();
    let filename = 'file';

    if (this.isNode) {
      if (typeof file === 'string') {
        // File path
        filename = this.path.basename(file);
        sourceFormat = sourceFormat || this._getExtension(file);
        formData.append('file', this.fs.createReadStream(file), filename);
      } else if (Buffer.isBuffer(file)) {
        // Buffer
        if (!sourceFormat) throw new Error('sourceFormat required for Buffer input');
        filename = `file.${sourceFormat}`;
        formData.append('file', file, { filename });
      } else {
        throw new Error('Invalid file input for Node.js');
      }
    } else {
      // Browser File object
      if (file instanceof File) {
        filename = file.name;
        sourceFormat = sourceFormat || this._getExtension(filename);
        formData.append('file', file);
      } else if (file instanceof Blob) {
        if (!sourceFormat) throw new Error('sourceFormat required for Blob input');
        filename = `file.${sourceFormat}`;
        formData.append('file', file, filename);
      } else {
        throw new Error('Invalid file input for browser');
      }
    }

    // Build URL with query params
    const url = new URL(`${this.baseUrl}/convert/${sourceFormat}/to/${targetFormat}`);
    Object.entries(options).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, value);
      }
    });

    const response = await this._fetch(url.toString(), {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new ConversionError(`Conversion failed: ${error}`);
    }

    const data = await response.json();
    return new ConversionJob(data);
  }

  /**
   * Convert a file synchronously and get the result
   * @param {File|string|Buffer} file - File to convert
   * @param {string} targetFormat - Target format
   * @param {string} sourceFormat - Source format (optional)
   * @param {Object} options - Conversion options
   * @returns {Promise<Blob|Buffer>} - Converted file as Blob (browser) or Buffer (Node)
   */
  async convertSync(file, targetFormat, sourceFormat = null, options = {}) {
    const formData = this.isNode ? new this.FormData() : new FormData();
    let filename = 'file';

    if (this.isNode) {
      if (typeof file === 'string') {
        filename = this.path.basename(file);
        sourceFormat = sourceFormat || this._getExtension(file);
        formData.append('file', this.fs.createReadStream(file), filename);
      } else if (Buffer.isBuffer(file)) {
        if (!sourceFormat) throw new Error('sourceFormat required for Buffer input');
        filename = `file.${sourceFormat}`;
        formData.append('file', file, { filename });
      }
    } else {
      if (file instanceof File) {
        filename = file.name;
        sourceFormat = sourceFormat || this._getExtension(filename);
        formData.append('file', file);
      } else if (file instanceof Blob) {
        if (!sourceFormat) throw new Error('sourceFormat required for Blob input');
        formData.append('file', file, `file.${sourceFormat}`);
      }
    }

    const url = new URL(`${this.baseUrl}/convert/sync/${sourceFormat}/to/${targetFormat}`);
    Object.entries(options).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, value);
      }
    });

    const response = await this._fetch(url.toString(), {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new ConversionError(`Conversion failed: ${error}`);
    }

    if (this.isNode) {
      return Buffer.from(await response.arrayBuffer());
    }
    return await response.blob();
  }

  /**
   * Convert and save to file (Node.js only)
   * @param {string} inputPath - Input file path
   * @param {string} outputPath - Output file path
   * @param {Object} options - Conversion options
   * @returns {Promise<string>} - Output file path
   */
  async convertToFile(inputPath, outputPath, options = {}) {
    if (!this.isNode) {
      throw new Error('convertToFile is only available in Node.js');
    }

    const targetFormat = this._getExtension(outputPath);
    const buffer = await this.convertSync(inputPath, targetFormat, null, options);
    this.fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }

  /**
   * Get job status
   * @param {string} jobId - Job ID
   * @returns {Promise<ConversionJob>}
   */
  async getStatus(jobId) {
    const response = await this._fetch(`${this.baseUrl}/status/${jobId}`);

    if (response.status === 404) {
      throw new ConvertXError(`Job not found: ${jobId}`, 404);
    }

    if (!response.ok) {
      const error = await response.text();
      throw new ConvertXError(`Failed to get status: ${error}`, response.status);
    }

    const data = await response.json();
    return new ConversionJob(data);
  }

  /**
   * Wait for job completion
   * @param {string} jobId - Job ID
   * @param {Object} options - Wait options
   * @param {number} options.pollInterval - Polling interval in ms (default: 1000)
   * @param {number} options.timeout - Timeout in ms (default: this.timeout)
   * @returns {Promise<ConversionJob>}
   */
  async waitForCompletion(jobId, options = {}) {
    const pollInterval = options.pollInterval || 1000;
    const timeout = options.timeout || this.timeout;
    const startTime = Date.now();

    while (true) {
      const job = await this.getStatus(jobId);

      if (job.isComplete()) {
        return job;
      }

      if (job.isFailed()) {
        throw new ConversionError(`Conversion failed: ${job.error}`);
      }

      if (Date.now() - startTime > timeout) {
        throw new TimeoutError(`Conversion timed out after ${timeout}ms`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  /**
   * Download converted file
   * @param {string} jobId - Job ID
   * @returns {Promise<Blob|Buffer>}
   */
  async download(jobId) {
    const response = await this._fetch(`${this.baseUrl}/download/${jobId}`);

    if (response.status === 400) {
      throw new ConvertXError('Job is not complete yet', 400);
    }

    if (!response.ok) {
      const error = await response.text();
      throw new ConvertXError(`Download failed: ${error}`, response.status);
    }

    if (this.isNode) {
      return Buffer.from(await response.arrayBuffer());
    }
    return await response.blob();
  }

  /**
   * Download and save to file (Node.js only)
   * @param {string} jobId - Job ID
   * @param {string} outputPath - Output file path
   * @returns {Promise<string>}
   */
  async downloadToFile(jobId, outputPath) {
    if (!this.isNode) {
      throw new Error('downloadToFile is only available in Node.js');
    }

    const buffer = await this.download(jobId);
    this.fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }

  /**
   * Get supported conversions
   * @returns {Promise<Array>}
   */
  async getSupportedConversions() {
    const response = await this._fetch(`${this.baseUrl}/conversions`);
    const data = await response.json();
    return data.supported_conversions;
  }

  /**
   * Get supported formats by category
   * @returns {Promise<Object>}
   */
  async getSupportedFormats() {
    const response = await this._fetch(`${this.baseUrl}/formats`);
    return await response.json();
  }

  /**
   * Health check
   * @returns {Promise<Object>}
   */
  async healthCheck() {
    const response = await this._fetch(`${this.baseUrl}/health`);
    return await response.json();
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConvertX;
  module.exports.ConversionJob = ConversionJob;
  module.exports.ConvertXError = ConvertXError;
  module.exports.ConversionError = ConversionError;
  module.exports.TimeoutError = TimeoutError;
} else if (typeof window !== 'undefined') {
  window.ConvertX = ConvertX;
}
