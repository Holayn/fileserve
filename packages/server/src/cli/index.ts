import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { basename, resolve } from 'path';
import {
  createShare,
  addFileToShare,
  getShareByReference,
  getShareById,
  updateSharePassword,
  getShareFiles,
} from '../repositories/share-repository.js';
import { isFileNeedsPreview, getFilePreviewPath } from '../util/file.js';
import { generatePreview } from '../services/preview-generator.js';
import fs from 'fs-extra';
import ora from 'ora';
import boxen from 'boxen';

await yargs(hideBin(process.argv))
  .command(
    'create-share',
    'Create a new share',
    (yargs) => {
      return yargs
        .option('name', {
          alias: 'n',
          describe: 'Name of the share',
          type: 'string',
          demandOption: true,
        })
        .option('password', {
          alias: 'p',
          describe: 'Password for the share',
          type: 'string',
        });
    },
    (argv) => {
      try {
        if (!argv.name) {
          console.error('Error: Share name is required');
          process.exit(1);
        }

        const share = createShare(argv.name, argv.password || null);
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

        const filePath = resolve(argv['file-path']);

        // Use custom name or default to original filename
        const fileName = argv.name || basename(filePath);

        // Add file to share
        const { record, needsPreview } = await addFileToShare(share.id, filePath, fileName);

        console.log(`File added successfully!`);
        console.log(`Share: ${share.name} (${share.reference})`);
        console.log(`File: ${fileName}`);
        console.log(`File Reference: ${record.reference}`);

        if (needsPreview) {
          console.log(boxen('Warning: file needs preview generation! Run the `generate-previews` command to generate previews.', { padding: 1, borderColor: 'yellow' }));
        }
      } catch (error: any) {
        if (error instanceof Error) {
          console.error(error);
        } else {
          console.error('Error adding file to share:', error.message);
        }
        process.exit(1);
      }
    },
  )
  .command(
    'update-password',
    'Update password for an existing share',
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
        .option('password', {
          alias: 'p',
          describe: 'New password for the share (omit to remove password)',
          type: 'string',
        });
    },
    (argv) => {
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
          console.error('Error: Share not found');
          process.exit(1);
        }

        // Update password
        const success = updateSharePassword(share.id, argv.password || null);

        if (!success) {
          console.error('Error: Failed to update password');
          process.exit(1);
        }

        if (argv.password) {
          console.log(`Password updated successfully for share: ${share.name} (${share.reference})`);
        } else {
          console.log(`Password removed successfully for share: ${share.name} (${share.reference})`);
        }
      } catch (error) {
        console.error('Error updating password:', error);
        process.exit(1);
      }
    },
  )
  .command(
    'generate-previews',
    'Generate previews for files that need them',
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
          console.error('Error: Share not found');
          process.exit(1);
        }

        console.log(`Generating previews for share: ${share.name} (${share.reference})`);

        const files = await getShareFiles(share.id);

        const spinner = ora().start();

        for (const file of files) {
          const needsPreview = await isFileNeedsPreview(file.filePath);
          if (needsPreview) {
            const previewPath = getFilePreviewPath(file.filePath);
            if (fs.existsSync(previewPath)) {
              continue;
            }
            spinner.text = `Generating preview for ${file.fileName}`;
            try {
              await generatePreview(file.filePath);
            } catch (error) {
              console.error(`Error generating preview for ${file.fileName}:`, error);
              fs.unlinkSync(getFilePreviewPath(file.filePath));
              process.exit(1);
            }
          }
        }
        
        spinner.succeed('Previews generated successfully');
      } catch (error) {
        console.error('Error generating previews:', error);
        process.exit(1);
      }
    },
  )
  .demandCommand(1, 'You need to specify a command')
  .strict()
  .help()
  .alias('help', 'h')
  .parse();
