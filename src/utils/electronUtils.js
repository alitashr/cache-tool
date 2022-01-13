const { remote, shell } = window.require("electron");
const path = window.require("path");
const { dialog } = remote;
const log = remote.require("electron-log");
const fs = window.require("fs");
const fileRegex = /file:\/\/\//;
// const { app } = require("electron").remote;
// var userDataPath = app.getPath("userData");
// console.log(app);
const desktopPath = remote.getGlobal("desktopPath");

export function toggleFullscreen(enable) {
  let window = remote.getCurrentWindow();

  window.setFullScreen(enable);
}
export function isFullScreen() {
  let window = remote.getCurrentWindow();
  return window.isFullScreen();
}
export function closeWindow() {
  let window = remote.getCurrentWindow();
  window.close();
}
export const openLinkInBrowser = link => {
  shell.openExternal(link);
};
export const saveImageWithDialog = async (fileToSave, saveName, title, callback, ispdf = false) => {
  const filter = !ispdf ? [{ name: "Image", extensions: ["jpg"] }] : [{ name: "Pdf Document", extensions: ["pdf"] }];
  const options = {
    defaultPath: saveName,
    title: title,
    filters: filter,
  };
  dialog.showSaveDialog(null, options, async fileName => {
    if (!fileName) {
      callback(false);
      return;
    }
    let file;

    if (fileToSave instanceof Blob) {
      //console.log("this is a blob");
      const result = await addFileProcess(fileToSave);
      fs.writeFileSync(fileName, Buffer.from(new Uint8Array(result)));
      callback(true);
    } else {
      if (fileToSave.match(fileRegex)) {
        file = fileToSave.replace(fileRegex, "");
        fs.copyFile(file, fileName, err => {
          if (err) throw err;
          callback(true);
        });
      } else {
        callback(false);
      }
    }
  });
};
export const saveTemporaryImage = async (imageData, filename, callback) => {
  const result = await addFileProcess(imageData);
  fs.writeFile(filename, Buffer.from(new Uint8Array(result)), callback);
};
function addFileProcess(imageData) {
  return new Promise((resolve, reject) => {
    let fileReader = new FileReader();
    fileReader.onload = function () {
      resolve(this.result);
    };
    fileReader.onerror = reject;
    fileReader.readAsArrayBuffer(imageData);
  });
}
export const showErrAndQuit = err => {
  //console.log(err);
  log.warn(err);
  const options = {
    type: "error",
    message: "Something went wrong",
    title: "Error",
  };
  dialog.showMessageBox(null, options, (response, checkboxChecked) => {
    //console.log(response);
    //console.log(checkboxChecked);
    if (response === 0) {
      // window.close();
    }
  });
};
export const copyFile = (src, path, dst) => {
  //console.log(src, path, dst);
  createDirIfNeeded(path);
  return new Promise((resolve, reject) => {
    fs.copyFile(src, path + "/" + dst, err => {
      if (err) reject(err);
      else resolve("success");
    });
  });
};
export const saveJSON = (dir, filename, data) => {
  createDirIfNeeded(dir);

  return new Promise((resolve, reject) => {
    fs.writeFile(`${dir}/${filename}`, data, "utf8", (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
};
//TODO:make this function globaly true
export const createDirIfNeeded = dir => {
  if (!fs.existsSync(dir)) {
    const parPath = path.dirname(dir);
    if (!fs.existsSync(parPath)) {
      return new Promise((resolve, reject) => {
        fs.mkdir(parPath, { recursive: true }, err => {
          if (err) reject(err);
          else {
            fs.mkdir(dir, { recursive: true }, err => {
              if (err) reject(err);
              else {
                resolve();
              }
            });
          }
        });
      });
    } else {
      return new Promise((resolve, reject) => {
        fs.mkdir(dir, { recursive: true }, err => {
          if (err) reject(err);
          else {
            resolve();
          }
        });
      });
    }
  }
};
export const getSpecialDirectory = () => {
  return desktopPath;
};
export const openFolder = (splitToBase = true) => {
  return new Promise((resolve, reject) => {
    dialog.showOpenDialog(
      null,
      {
        properties: ["openDirectory"],
      },
      response => {
        if (!response) {
          reject("error");
          return;
        }
        if (!splitToBase) {
          resolve(response[0]);
        } else {
          const sep = response[0].split(path.sep);
          const name = sep.pop();
          const base = sep.join("/");
          resolve({ base, name });
        }
        return;
      }
    );
  });
};
export const writeBlobIntoFile = (fileName, blob) => {
  return new Promise((resolve, reject) => {
    addFileProcess(blob).then(result => {
      fs.writeFile(fileName, Buffer.from(new Uint8Array(result)), undefined, err => {
        if (err) {
          reject(err);
          return;
        } else {
          resolve();
        }
      });
    });
  });
};
