#!/usr/bin/env node

import path from 'path';
import urljoin from 'url-join';
import readDir from 'fs-readdir-recursive';
import mime from 'mime';
import async from 'async';
import gcloud from 'gcloud';
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
    '-v, --versionNumber <version-number>',
    'The version number is added as additional subfolder to the local path.'
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
  remotePath = urljoin(
    commander.remotePath || gcloudConfig.remotePath,
    commander.versionNumber || gcloudConfig.versionNumber || null
  ),
  webRoot = urljoin(
    'https://storage.googleapis.com/',
    gcloudConfig.bucket,
    remotePath
  ),
  slack = new Slack(gcloudConfig.slackWebHook);

let storage, bucket, files,
  asyncTasks = [];

storage = gcloud({
  projectId: gcloudConfig.projectId,
  bucket: gcloudConfig.bucket,
  keyFilename: keyFilePath,
  metadata: {
    cacheControl: 'no-cache'
  }
}).storage();

bucket = storage.bucket(gcloudConfig.bucket);

files = readDir(sourcePath, (file) => {
  return !/(^\.)/.test(file[0]);
});

console.info(`Will upload ${files.length} files to:\n${webRoot}\n`);

files.forEach(file => {
  let fileOptions = {
    validation: 'crc32c',
    metadata: {
      cacheControl: 'no-cache',
      contentType: mime.lookup(file)
    },
    destination: urljoin(remotePath, file)
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

async.parallelLimit(asyncTasks, 10, function() {
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
