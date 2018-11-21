# Uploads a folder to google cloud storage

## Install

```
npm install gcloud-storage-upload
```

It's not meant to be installed globally at the moment.

A `.gcloud.json` must be present in the root folder of the project. This is basically the file you get when you create your credentials in the console of google cloud storage. Plus some extra content for convenience.

```
{
  "private_key_id": "PRIVTAE KEY ID",
  "private_key": "PRIVATE KEY",
  "client_email": "ID@developer.gserviceaccount.com",
  "client_id": "ID.apps.googleusercontent.com",
  "type": "service_account",
  "projectId": "PROJECT ID",
  "bucket": "BUCKET NAME",
  "remotePath": "PATH INSIDE THE BUCKET",
  "versionNumber": "ADDITIONAL SUBPATH INSIDE THE BUCKET (optional)^"
  "slackWebHook": "SLACK WEB HOOK (optional)",
  "slackChannel": "SLACK CHANNEL TO POST TO (optional, can be set/overwritten by commandline)",
  "metadata": "METADATA FOR UPLOADED FILES (optional, default is {cacheControl: 'no-cache'})",
  "gzipExtensions": "OPTIONAL ARRAY OF FILE EXTENSIONS WHICH SHOULD BE UPLOADED WITH GZIP CONTENT ENCODING: ['js', 'css', 'html', 'csv'] "
}
```

## Usage

Just run `gcloud-storage-upload` inside your npm scripts as applicable.

The options available:

* `-s, --slack-channel <slack-channel>`
* `-p, --path <local-path>`
* `-r, --remotePath <remote-path>`
* `-c, --configFile <path-to-config>`

All files in `path` directory will be uploaded to `remotePath` given in `.gcloud.json` or via the options.
The slack channel is optional.

The options overwrite the `.gcloud.json` settings.
