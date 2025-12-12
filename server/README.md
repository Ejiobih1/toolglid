# PDF Encryption Server

Backend server for real PDF password encryption.

## Features

- **Real PDF Encryption**: Uses pdf-lib to apply AES encryption
- **Password Protection**: PDFs require password to open
- **Unlock/Decrypt**: Remove password protection from encrypted PDFs

## How to Use

### 1. Start the Server

```bash
cd server
npm install
npm start
```

Server runs on `http://localhost:5000`

### 2. Use from React App

The React app automatically connects to the server when you use the "Encrypt PDF" tool.

### 3. Endpoints

#### Encrypt PDF
- **POST** `/api/encrypt-pdf`
- Upload PDF file + password
- Returns encrypted PDF

#### Decrypt PDF
- **POST** `/api/decrypt-pdf`
- Upload encrypted PDF + password
- Returns decrypted PDF

## Important Notes

- Server must be running for encryption to work
- Keep both React app (port 3000) and server (port 5000) running
- Encryption is done server-side for security and compatibility
