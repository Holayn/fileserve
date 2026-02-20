# FileServe

A simple and modern file sharing application built with Node.js, Express, Vue.js, and TypeScript. FileServe lets you create secure shares with unique references and serve files through a clean web interface.

## Features

- Create named shares with unique references
- Optional password protection per share
- Resumable file downloads
- Inline viewing for supported file types
- Video streaming and optimized playback via ffmpeg
- CLI tool for managing shares and files
- Optional notification webhook integration

## Motivation

Wanted to build an extremely simple and secure file sharing application myself.

## Quick Start

### Prerequisites

- Node.js >= 22.12.0
- npm
- nginx or other reverse proxy
- ffmpeg (required for video webifying)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fileserve
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp packages/server/sample.env packages/server/.env
```

4. Edit `packages/server/.env` and set the required variables (see [server README](packages/server/README.md) for details).

## Usage

- Place files to share inside the `<DATA_PATH>/files` directory
- Use the CLI to create shares and add files to them
- Configure nginx (or another reverse proxy) to serve files at the `/files` path from `<DATA_PATH>/files`

## CLI

The server package includes a CLI for managing shares:

```bash
cd packages/server
npm run cli -- --help
```

See the [server README](packages/server/README.md) for full CLI documentation.

## Development

1. Start the server:
```bash
cd packages/server
npm run dev
```

2. In another terminal, start the web frontend:
```bash
cd packages/web
npm run dev
```

## Production Build

1. Build the web frontend:
```bash
cd packages/web
npm run build
```

2. Build the server:
```bash
cd packages/server
npm run build
```

3. Start the server:
```bash
cd packages/server
npm start
```
