#!/usr/bin/env node

import path from 'path';
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
    '-p, --path <local-path>',
    'The local path'
  )
  .parse(process.argv);

const gcloudConfig = require(process.cwd() + '/.gcloud.json');
const packageJson = require(process.cwd() + '/package.json');

const buildPath = path.resolve(commander.path),
  keyFilename = path.resolve('.gcloud.json'),
  webRoot = `https://storage.googleapis.com/` +
    `${gcloudConfig.bucket}/` +
    `${gcloudConfig.remotePath}index.html`,
  slack = new Slack(gcloudConfig.slackWebHook);

let storage, bucket, files,
  asyncTasks = [],
  fileOptions = {
    validation: 'crc32c',
    metadata: {
      cacheControl: 'no-cache'
    }
  };

storage = gcloud({
  projectId: gcloudConfig.projectId,
  bucket: gcloudConfig.bucket,
  keyFilename: keyFilename,
  metadata: {
    cacheControl: 'no-cache'
  }
}).storage();

bucket = storage.bucket(gcloudConfig.bucket);

files = readDir(buildPath, (file) => {
  return !/(^\.)/.test(file[0]);
});

console.log(`Will upload ${files.length} files to:\n${webRoot}\n`);

files.forEach(file => {
  asyncTasks.push((done) => {
    fileOptions.metadata.contentType = mime.lookup(file);
    fileOptions.destination = gcloudConfig.remotePath + file;

    bucket.upload(
      path.resolve(buildPath, file),
      fileOptions, (error, remoteFile) => {
        if (error) {
          throw new Error(error);
        }

        console.log(`${file} uploaded to ${remoteFile.name}.`);
        done();
      });
  });
});

async.parallelLimit(asyncTasks, 10, function() {
  console.log('\nUpload done!');

  const slackChannel = commander.slackChannel || gcloudConfig.slackWebHook;

  if (gcloudConfig.slackWebHook && slackChannel) {
    slack.send({
      text: `Howdy!\n${packageJson.name} is deployed to:\n\n${webRoot}`,
      channel: `#${slackChannel}`,
      username: 'Bot'
    });
  }
});
