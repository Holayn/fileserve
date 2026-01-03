# Fileserve

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Create a `.env` file from the `sample.env` file and fill in the required environment variables.
3.  Start the server:
    ```bash
    npm run dev
    ```

## CLI Usage

This project includes a command-line interface for managing shares and files.

### Available Commands

#### Create a Share
Create a new share with a specified name:
```bash
npm run cli create-share -- --name "My Share"
```

#### Add a File to a Share
Add a file to an existing share using either the share reference or ID:

**Using share reference:**
```bash
npm run cli add-file -- --share-reference abc123 --file-path ./path/to/file.txt
```

**Using share ID:**
```bash
npm run cli add-file -- --share-id 1 --file-path ./path/to/file.txt
```

**With custom filename:**
```bash
npm run cli add-file -- --share-reference abc123 --file-path ./path/to/file.txt --name "Custom Name"
```

### CLI Options

| Command | Option | Alias | Description | Required |
|---------|--------|-------|-------------|---------|
| `create-share` | `--name` | `-n` | Name of the share | Yes |
| `add-file` | `--share-reference` | `-r` | Reference of the share | Either this or `--share-id` |
| `add-file` | `--share-id` | `-i` | ID of the share | Either this or `--share-reference` |
| `add-file` | `--file-path` | `-f` | Path to the file to add | Yes |
| `add-file` | `--name` | `-n` | Custom name for the file | No |

### Examples

1. **Create a share and add a file:**
   ```bash
   # Create share
   npm run cli create-share -- -n "Documents"
   
   # Add file (using the reference from the output)
   npm run cli add-file -- -r abc123 -f ./document.pdf
   ```

2. **Add multiple files with custom names:**
   ```bash
   npm run cli add-file -- -r abc123 -f ./report.pdf -n "Annual Report 2024"
   npm run cli add-file -- -i 1 -f ./data.csv -n "Sales Data"
   ```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_PATH` | Path to where the database file will be stored | Required |
| `PORT` | Server port | 3000 |


## Linting

This project uses ESLint and Prettier for linting and formatting.

-   To run the linter, use:
    ```bash
    npm run lint
    ```
-   To fix linting errors, use:
    ```bash
    npm run lint:fix
    ```
