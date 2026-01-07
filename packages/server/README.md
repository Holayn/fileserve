# Fileserve

## Getting Started

Create a `.env` file from the `sample.env` file and fill in the required environment variables.

Build the server:
```bash
npm run build
```

Start the server:
```bash
npm run start
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
Add a file to a share using either the share reference or ID:
Files must be inside the `<DATA_PATH>/files` directory.

```bash
npm run cli add-file -- --share-id 1 --file-path path/to/file.txt
```

#### Webify
Prepare web versions for files that need them in a share:
```bash
npm run cli webify -- --share-id 1
```

#### Update Share Password
Update or remove the password for a share:

**Set a new password:**
```bash
npm run cli update-password -- --share-reference abc123 --password "newpassword"
```

**Remove password (make share public):**
```bash
npm run cli update-password -- --share-reference abc123
```

**Using share ID instead of reference:**
```bash
npm run cli update-password -- --share-id 1 --password "newpassword"
```

### CLI Options

| Command | Option | Alias | Description | Required |
|---------|--------|-------|-------------|---------|
| `create-share` | `--name` | `-n` | Name of the share | Yes |
| `create-share` | `--password` | `-p` | Password for the share | No |
| `add-file` | `--share-reference` | `-r` | Reference of the share | Either this or `--share-id` |
| `add-file` | `--share-id` | `-i` | ID of the share | Either this or `--share-reference` |
| `add-file` | `--file-path` | `-f` | Path to the file to add to the share (must be inside `<DATA_PATH>/files`) | Yes |
| `add-file` | `--name` | `-n` | Custom name for the file | No |
| `webify` | `--share-reference` | `-r` | Reference of the share | Either this or `--share-id` |
| `webify` | `--share-id` | `-i` | ID of the share | Either this or `--share-reference` |
| `update-password` | `--share-reference` | `-r` | Reference of the share | Either this or `--share-id` |
| `update-password` | `--share-id` | `-i` | ID of the share | Either this or `--share-reference` |
| `update-password` | `--password` | `-p` | New password for the share | No |

### Examples

1. **Create a share and add file(s):**
   ```bash
   # Create share
   npm run cli create-share -- -n "Pictures"
   
   # Add file
   npm run cli add-file -- -r abc123 -f my-cool-pic.jpg
   ```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATA_PATH` | Absolute path to where the app data will be stored (database, files, etc) | Required |
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
