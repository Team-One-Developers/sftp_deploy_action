const core = require("@actions/core");
const fs = require("fs");
const path = require("path");

let Client = require("ssh2-sftp-client");
let sftp = new Client();

let host = core.getInput("host");
let port = parseInt(core.getInput("port"));
let username = core.getInput("username");
let password = core.getInput("password");
let localPath = core.getInput("localPath");
let remotePath = core.getInput("remotePath");
let cleanBefore = core.getInput("cleanBefore");

core.setSecret(username);
core.setSecret(password);

const sftpConfig = {
  host: host,
  port: port,
  username: username,
  password: password,
};

const downloadHtAccessFile = async () => {
  let htAccessFilePath = `${remotePath}.htaccess`;
  if (await sftp.exists(htAccessFilePath)) {
    console.log("Copying .htaccess");
    return sftp.get(htAccessFilePath, __dirname + "/.htaccess");
  }
  return null;
};

const cleanRemoteDirectory = async () => {
  if (cleanBefore) {
    if (await sftp.exists(remotePath)) {
      console.log(`Deleting directory ${remotePath}`);
      await sftp.rmdir(remotePath, true);
    }
    console.log(`Creating new directory ${remotePath}`);
    return sftp.mkdir(remotePath, true);
  }
};

const putCopiedHtAccess = async () => {
  let remoteHtAccessFilePath = `${remotePath}.htaccess`;
  let localHtAccessFilePath = `${__dirname}/.htaccess`;
  if (await fs.existsSync(localHtAccessFilePath)) {
    console.log("Inserting .htaccess");
    return sftp.put(localHtAccessFilePath, remoteHtAccessFilePath, {
      writeStreamOptions: {
        flags: "w", // w - write and a - append
        encoding: null, // use null for binary files
        mode: 0o666, // mode to use for created file (rwx)
      },
    });
  }
  return null;
};

const cleanLocalHtAccessFile = async () => {
  let localHtAccessFilePath = `${__dirname}/.htaccess`;
  if (await fs.existsSync(localHtAccessFilePath)) {
    console.log("Deleting local .htaccess");
    fs.unlinkSync(localHtAccessFilePath);
    console.log("Deleted local .htaccess");
  }
  return;
};

const uploadFiles = async () => {
  console.log(`Connection to SFTP Server established: \n
        host: ${host}            
        port: ${port}          
        username: ${username}         
        password: ${password}        
    `);

  if (fs.lstatSync(localPath).isDirectory()) {
    console.log(`Local directory ${localPath} exists`);
    return sftp.uploadDir(localPath, remotePath);
  } else {
    var directory = await sftp.realPath(path.dirname(remotePath));
    if (!(await sftp.exists(directory))) {
      await sftp.mkdir(directory, true);
      console.log("Created directories.");
    }

    var modifiedPath = remotePath;
    if (await sftp.exists(remotePath)) {
      if ((await sftp.stat(remotePath)).isDirectory) {
        var modifiedPath = modifiedPath + path.basename(localPath);
      }
    }

    return sftp.put(fs.createReadStream(localPath), modifiedPath);
  }
};

sftp
  .connect(sftpConfig)
  .then(downloadHtAccessFile)
  .then(cleanRemoteDirectory)
  .then(putCopiedHtAccess)
  .then(cleanLocalHtAccessFile)
  .then(uploadFiles)
  .then(() => {
    console.log("Upload finished.");
    return sftp.end();
  })
  .catch((err) => {
    core.setFailed(`Action failed with error ${err}`);
    process.exit(1);
  });
