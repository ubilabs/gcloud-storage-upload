# Uploads a folder to google cloud storage

## Install

```
npm install
```

It's not meant to be installed globally.

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
  "slackWebHook": "SLACK WEB HOOK (optional)",
  "slackChannel": "SLACK CHANNEL TO POST TO (optional, can be set/overwritten by commandline)"
}
```

## Usage

Just run `ubilabs-gcloud` inside your npm scripts as applicable. All files in `build` directory will be uploaded to `remotePath` given in `.gcloud.json`
