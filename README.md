# FileServe

A very simple and modern file sharing application, built with Node.js, Express, Vue.js, and TypeScript. FileServe allows users to create secure shares with unique references and download files through an elegant web interface.

## Features

- Create secure shares with unique references
- Resumable file downloads from shares
- Viewable files are displayed inline

## Motivation

Wanted to build an extremely simple and secure file sharing application myself.

## Quick Start

### Prerequisites

- Node.js >= 22.12.0
- npm or yarn

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

## CLI Commands

The server package includes a CLI tool for managing shares:

```bash
cd packages/server
npm run cli -- --help
```

## Development

1. Start the server in development mode:
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

3. Start the production server:
```bash
cd packages/server
npm start
```
