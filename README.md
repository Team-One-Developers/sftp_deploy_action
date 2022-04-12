# sftp_deploy_action

This action is based on https://github.com/Creepios/sftp-action.

This action extends the above GitHub action by the parameter `cleanBefore` with which you can clean your remote directory before deploying the files. It also removes the ssh-key authentication to keep it simple.

## Inputs

### `host`

**Required** The hostname under which you can reach the server. Default `"localhost"`.

### `port`

**Required** The port under which you can reach the server. Default `22`.

### `username`

**Required** The login name. Default `"root"`.

### `password`

**Required** The login password. Default `"password"`.

### `localPath`

**Required** Path to a local file or directory.

### `remotePath`

**Required** Path to a remote file or directory (Any non existing directory or file will be created).

### `cleanBefore`

**Optional** Determines if the remotePath on the SFTP-Server should be deleted before copying the files. Default `false`.

## Example usage

```
name: Deploy Static Files on SFTP Server
on:
  push:
    branches: [main]
  workflow_dispatch:
jobs:
  deploy-via-sftp:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Branch
        uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: "16"
      - name: Install dependencies
        run: yarn run ci
      - name: Upload Files
        uses: Team-One-Developers/sftp_deploy_action@0.0.2
        with:
          host: "ssh.strato.de"
          username: "${{ secrets.FTP_USERNAME }}"
          password: ${{ secrets.MASTER_PASSWORD }}
          localPath: "./public/"
          remotePath: "./website/"
          cleanBefore: true

```
