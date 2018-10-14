#!/usr/bin/env node

import path from 'path';
import urljoin from 'url-join';
import readDir from 'fs-readdir-recursive';
import mime from 'mime';
import async from 'async';
import {Storage} from '@google-cloud/storage';
import Slack from 'node-slack';
import commander from 'commander';

commander
  .option(
    '-s, --slack-channel <slack-channel>',
    'The slack channel to post to.'
  )
  .option(
    '-r, --remotePath <remote-path>',
    'The path on gcloud storage'
  )
  .option(
    '-p, --path <local-path>',
    'The local path (defaults to current path).'
  )
  .option(
    '-c, --configFile <path-to-config>',
    'The local config file.'
  )
  .parse(process.argv);

const keyFilePath = path.resolve(commander.configFile || '.gcloud.json'),
  gcloudConfig = require(keyFilePath),
  packageJson = require(path.resolve('package.json')),
  sourcePath = commander.path ? path.resolve(commander.path) : process.cwd(),
  remotePath = commander.remotePath || gcloudConfig.remotePath || '',
  webRoot = urljoin(
    gcloudConfig.bucket,
    remotePath
  ),
  consoleRoot = urljoin(
    'https://console.cloud.google.com/storage/browser/',
    gcloudConfig.bucket,
    remotePath
  ),
  slack = new Slack(gcloudConfig.slackWebHook),
  metadata = gcloudConfig.metadata || {
    cacheControl: 'no-cache'
  };

const asyncTasks = [];

const storageApi = new Storage({
  projectId: gcloudConfig.projectId,
  bucket: gcloudConfig.bucket,
  keyFilename: keyFilePath
});

const bucket = storageApi.bucket(gcloudConfig.bucket);

const files = readDir(sourcePath, file => !/(^\.)/.test(file[0]));

console.info(`Will upload ${files.length} files to:` +
  `\nConsole-root: ${consoleRoot}\nWeb-root: ${webRoot}\n`);

files.forEach(file => {
  const {gzipExtensions} = gcloudConfig;
  const extension = path.extname(file).replace('.', '');
  const shouldGzip = gzipExtensions ?
    gzipExtensions.includes(extension) :
    false;

  const fileOptions = {
    gzip: shouldGzip,
    validation: 'crc32c',
    metadata: Object.assign(
      {},
      {contentType: mime.lookup(file)},
      metadata
    ),
    destination: /^\/$/.test(remotePath) ? file : urljoin(remotePath, file)
  };

  asyncTasks.push(done => {
    bucket.upload(
      path.resolve(sourcePath, file),
      fileOptions,
      (error, remoteFile) => {
        if (error) {
          throw new Error(error);
        }
        console.info(`${file} uploaded to ${remoteFile.name}.`);
        done();
      });
  });
});

async.parallelLimit(asyncTasks, 10, () => {
  console.info('\nUpload done!');

  const slackChannel = commander.slackChannel || gcloudConfig.slackWebHook;

  if (gcloudConfig.slackWebHook && slackChannel) {
    slack.send({
      text: `Howdy!\n${packageJson.name} is deployed to:\n\n${webRoot}`,
      channel: `#${slackChannel}`,
      username: 'Bot'
    });
  }
});
