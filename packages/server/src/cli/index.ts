import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs-extra';
import { basename, resolve } from 'path';
import {
  createShare,
  addFileToShare,
  getShareByReference,
  getShareById,
} from '../repositories/share-repository.js';

await yargs(hideBin(process.argv))
  .command(
    'create-share',
    'Create a new share',
    (yargs) => {
      return yargs.option('name', {
        alias: 'n',
        describe: 'Name of the share',
        type: 'string',
        demandOption: true,
      });
    },
    (argv) => {
      try {
        if (!argv.name) {
          console.error('Error: Share name is required');
          process.exit(1);
        }

        const share = createShare(argv.name);
        console.log(`Share created successfully!`);
        console.log(`Name: ${argv.name}`);
        console.log(`Reference: ${share.reference}`);
        console.log(`Share ID: ${share.id}`);
      } catch (error) {
        console.error('Error creating share:', error);
        process.exit(1);
      }
    },
  )
  .command(
    'add-file',
    'Add a file to a share',
    (yargs) => {
      return yargs
        .option('share-reference', {
          alias: 'r',
          describe: 'Reference of the share',
          type: 'string',
        })
        .option('share-id', {
          alias: 'i',
          describe: 'ID of the share',
          type: 'string',
        })
        .option('file-path', {
          alias: 'f',
          describe: 'Path to the file to add',
          type: 'string',
          demandOption: true,
        })
        .option('name', {
          alias: 'n',
          describe: 'Custom name for the file (defaults to original filename)',
          type: 'string',
        });
    },
    async (argv) => {
      try {
        if (!argv['share-reference'] && !argv['share-id']) {
          console.error(
            'Error: Either share reference (--share-reference/-r) or share ID (--share-id/-i) is required',
          );
          process.exit(1);
        }

        if (argv['share-reference'] && argv['share-id']) {
          console.error(
            'Error: Provide either share reference or share ID, not both',
          );
          process.exit(1);
        }

        // Check if share exists
        const share = argv['share-reference']
          ? getShareByReference(argv['share-reference'])
          : getShareById(parseInt(argv['share-id']!));

        if (!share) {
          console.error(
            'Error: Share not found with the given reference or ID',
          );
          process.exit(1);
        }

        // Resolve file path and check if file exists
        const filePath = resolve(argv['file-path']);
        try {
          await fs.lstat(filePath);
        } catch (error) {
          console.error(
            'Error: File not accessible or does not exist:',
            filePath,
          );
          process.exit(1);
        }

        // Use custom name or default to original filename
        const fileName = argv.name || basename(filePath);

        // Add file to share
        const fileRecord = addFileToShare(share.id, filePath, fileName);

        console.log(`File added successfully!`);
        console.log(`Share: ${share.name} (${share.reference})`);
        console.log(`File: ${fileName}`);
        console.log(`File Reference: ${fileRecord.reference}`);
      } catch (error) {
        console.error('Error adding file to share:', error);
        process.exit(1);
      }
    },
  )
  .demandCommand(1, 'You need to specify a command')
  .help()
  .alias('help', 'h')
  .parse();
