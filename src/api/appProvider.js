import uuid from "uuid";
import HttpClient from "./httpClient";
import { readJSON, convertTilePointToName, readImage, makeid } from "../utils/utils";
import { createCanvas } from "../utils/canvasutils";
import { MD5 } from "../utils/md5";
// import { decode } from "base64-arraybuffer"
// import pako from "pako";

// export const domain = "http://localhost:61960";
let build = "v3";
export const domain = `https://${build}.explorug.com`;
export const assetsDomain = build === "v3" ? "https://d1tvaiszosdaib.cloudfront.net" : `${domain}/Assets`;
const myroomServerUrl = "https://www.myownrug.com/segment_image";

let provider = "appproviderv3.aspx";
const API_KEY = "apikey";
let cacheLocation = "";
const getCacheLocationFromUrl = url => url.split("/")[2];
const processPath = path => {
  const s = path.split("/");
  if (s[1] === "Assets") {
    const ss = s.slice(2);
    return `${assetsDomain}/${ss.join("/")}`;
  } else {
    return `${domain}${path}`;
  }
};
function getJsonFromUrl(url) {
  if (!url) url = window.location.search;
  var query = url.substr(1);
  var result = {};
  query.split("&").forEach(function (part) {
    var item = part.split("=");
    result[item[0]] = decodeURIComponent(item[1]);
  });
  return result;
}
const postHttpClient = (data, config) => {
  const domain = `https://${build}.explorug.com`;
  return HttpClient.post(`${domain}/${provider}`, data, config).then(response => response.data);
}

const getPageName = () => {
  let page;
  let relogin = true;
  page = getJsonFromUrl().page;
  if (!page) {
    page = sessionStorage.getItem("page");
    relogin = sessionStorage.getItem("relogin");
  }
  return { page, relogin };
};

const postWithRetry = data => {
  return new Promise((resolve, reject) => {
    let numtries = 0;
    const fetchData = () => {
      postHttpClient(data)
        .then(resolve)
        .catch(err => {
          numtries++;
          if (numtries <= 5) fetchData();
          else reject(err);
        });
    };
    fetchData();
  });
};
const getApiKey = () => sessionStorage.getItem(API_KEY);

const fetchApiKey = ({ username, password }) => {
  let data = new FormData();
  data.append("action", "login");
  data.append("username", username);
  data.append("password", password);
  return new Promise((resolve, reject) => {
    postWithRetry(data)
      .then(res => {
        const key = res.Key;
        if (!key) reject("INVALUD CREDENTIALS");
        else {
          sessionStorage.setItem(API_KEY, key);
          sessionStorage.setItem("relogin", false);
          sessionStorage.setItem("page", username);
          resolve(key);
        }
      })
      .catch(reject);
  });
};
const autoLogin = params => {
  const { page, relogin } = getPageName();
  return new Promise((resolve, reject) => {
    if (!page) {
      reject("could not find login page");
      return;
    }
    if (JSON.parse(relogin)) {
      HttpClient.post(`${domain}/login/app${page}.aspx`).then(response => {
        if (!response.data) {
          reject("INVALID_CREDENTIALS");
          return;
        }
        sessionStorage.setItem("relogin", false);
        sessionStorage.setItem(API_KEY, response.data.Key);
        resolve(response.data);
      });
    } else resolve(sessionStorage.getItem(API_KEY));
  });
};
const fetchInterfaceElements = params => {
  let data = new FormData();
  data.append("action", "interfaceelements");
  data.append("key", getApiKey());
  return postHttpClient(data).then(interfaceElements => {
    const { InterfaceElements, TextureOptions } = interfaceElements;

    window.InterfaceElements = InterfaceElements;
    window.TextureOptions = TextureOptions;

    const { LogoUrl } = InterfaceElements
    cacheLocation = getCacheLocationFromUrl(LogoUrl);
    if (InterfaceElements.CustomizeCssUrl && InterfaceElements.CustomizeCssUrl !== "") {
      var link = document.createElement("link");
      link.setAttribute("rel", "stylesheet");
      link.setAttribute("type", "text/css");
      link.setAttribute("href", `${domain}${InterfaceElements.CustomizeCssUrl}`);
      document.getElementsByTagName("head")[0].appendChild(link);
    }
    if (!InterfaceElements.CustomizeJsUrl || InterfaceElements.CustomizeJsUrl === "") {
      return { ...interfaceElements, flags: {} };
    }
    return HttpClient.get(`${domain}${InterfaceElements.CustomizeJsUrl}?t=${makeid(8)}`)
      .then(flags => { return { ...interfaceElements, flags: flags.data } })
      .catch(err => {
        return { ...interfaceElements, flags: {} };
      });
  });
  // return postHttpClient(data)
};
const isAuthenticated = () => {
  if (sessionStorage.getItem(API_KEY)) return true;
  else return false;
};
const fetchDesignList = params => {
  let data = new FormData();
  data.append("action", "designlist");
  data.append("key", getApiKey());
  return new Promise((resolve, reject) => {
    let numtries = 0;
    post();
    function post() {
      postHttpClient(data)
        .then(resolve)
        .catch(err => {
          if (err.code === "ECONNABORTED" && numtries < 5) {
            numtries++;
            post();
          } else {
            reject(err);
          }
        });
    }
  });
};
const fetchColorList = params => {
  let data = new FormData();
  data.append("action", "colorlist");
  data.append("key", getApiKey());
  return postHttpClient(data);
};
const fetchRoomList = params => {
  let data = new FormData();
  data.append("action", "roomlist");
  data.append("key", getApiKey());
  return postHttpClient(data);
};
const fetchDesignTiles = ({ file, zoom = 2, tiles, props, hash }) => {
  let data = new FormData();
  data.append("action", "designtiles");
  data.append("key", getApiKey());
  data.append("file", file);
  data.append("zoom", zoom);
  data.append("tiles", JSON.stringify(tiles));
  if (props) data.append("props", JSON.stringify(props));

  return postHttpClient(data).then(processPath);
};

const fetchPileTiles = ({ file, zoom = 2, tiles, props, hash }) => {
  let data = new FormData();
  data.append("action", "piletiles");
  data.append("key", getApiKey());
  data.append("file", file);
  data.append("zoom", zoom);
  data.append("tiles", JSON.stringify(tiles));
  if (props) data.append("props", JSON.stringify(props));
  return postHttpClient(data).then(processPath);
};
const fetchVisualizationTiles = ({ file, zoom, tiles, props }) => {
  let data = new FormData();
  data.append("action", "visualizationtiles");
  data.append("key", getApiKey());
  data.append("file", file);
  data.append("zoom", zoom);
  data.append("tiles", JSON.stringify(tiles));
  if (props) data.append("props", JSON.stringify(props));
  return postHttpClient(data).then(processPath);
};
const fetchTileDetails = ({ file, backColor = "" }) => {
  let data = new FormData();
  data.append("action", "tiledetails");
  data.append("key", getApiKey());
  data.append("file", file);
  data.append("backcolor", backColor);
  if (window.InterfaceElements.IsJpeg) {
    return Promise.resolve({
      tileTransparency1: [],
      tileTransparency2: [],
      tileTransparency4: [],
      colorTileData1: [],
      colorTileData2: [],
      colorTileData4: [],
    })
  }
  return postHttpClient(data).then(tilePaths => {
    const {
      ColorTiles1X,
      ColorTiles2X,
      ColorTiles4X,
      TileTransparency1X,
      TileTransparency2X,
      TileTransparency4X
    } = tilePaths;
    // const arr = decode("H4sIAAAAAAAEAO3RsXEFIQxFUUpXaSpFJRASMNiBx/67QuiyQ+h96Ung6uvr3bt37969+3cb4A3cwAW85NzBK7iCS+6j5N7ADVzBS+4dvIEbuIKX3Dt4AzdwBS+5D/AGbuAKLrn/PG/tHbyCG7iCl9wHeAOv4AYu4CX3Ad7AK7iBK3jJfYB38Apu4AouuX+eH3sHb+AV3MAFvOQ+wDt4A6/gBi7gJfcB3sEbeAU3cAUX8JJ7B2/gFdzAFVzAS+4DvIM38Apu4Aou4CX3Ad7BG3gFN3A9dAEvufs83n0e7z6Pd5/Hu8/j3X/fu/++d88PfcrjfMrjfMrjfMrj3MAVXA594rvPee4+57n7nOfuc55nbuAKLuAzP/Ig382DfDcP8j3yIN/NDVzB5dADvnqU7+pRvice5bt6lO/qdugKLoce8cXDvBcP8z3wMO/Fw7wP3MAVXA495H2P8388zrvvcf6Px3n33cD10OXQY/7zRf5tX+T/80X+bV/k33YD10OXQ1/wrq/O8+ur8+z66jy7vjrPrhu4Hroc+oo3fXm+8g1Ue2ogACAAAA==")
    // const arr1 = new Uint8Array(arr)
    // console.log(arr1)
    // console.log(arr)
    // var output = pako.inflate(arr1);
    // console.log(output)
    // const op = toBits(output)
    // console.log(op)
    let promises = [
      readJSON(`${domain}${ColorTiles1X}`),
      readJSON(`${domain}${ColorTiles2X}`),
      readJSON(`${domain}${ColorTiles4X}`)
    ];
    const isIrregular = TileTransparency1X && TileTransparency1X !== "";
    if (isIrregular) {
      promises.push(
        readJSON(`${domain}${TileTransparency1X}`),
        readJSON(`${domain}${TileTransparency2X}`),
        readJSON(`${domain}${TileTransparency4X}`)
      );
    }
    return Promise.all(promises).then(tileDataArray => {
      let transparencyData = {
        tileTransparency1: [],
        tileTransparency2: [],
        tileTransparency4: []
      };
      if (isIrregular) {
        transparencyData = {
          tileTransparency1: tileDataArray[3],
          tileTransparency2: tileDataArray[4],
          tileTransparency4: tileDataArray[5]
        };
      }
      return {
        colorTileData1: tileDataArray[0],
        colorTileData2: tileDataArray[1],
        colorTileData4: tileDataArray[2],
        ...transparencyData
      };
    });
  });
};
const fetchRoomDetails = ({ file }) => {
  let data = new FormData();
  data.append("action", "3droomdetails");
  data.append("key", getApiKey());
  data.append("file", file);
  return postHttpClient(data);
};
const fetchRenderedDesignOrRoom = ({ backColor = "#00000000", file, props, view = "", at }) => {
  let data = new FormData();
  data.append("action", "rendering");
  data.append("key", getApiKey());
  data.append("file", file);
  data.append("view", view);
  data.append("backcolor", backColor);
  data.append("props", JSON.stringify(props));
  if (at) data.append("at", at);
  return postWithRetry(data).then(data => {
    return { ...data, Design: `${domain}${data.Design}`, View: `${domain}${data.View}` };
  });
};

const changeColorCombination = ({ numColors, colorTab }) => {
  let data = new FormData();
  data.append("action", "colorcombination");
  data.append("key", getApiKey());
  data.append("numcolors", numColors);
  data.append("tab", colorTab);
  return postHttpClient(data);
};
const publishDesign = ({ file, props, view = "" }) => {
  var data = new FormData();
  data.append("action", "publishdesign");
  data.append("key", getApiKey());
  data.append("file", file);
  data.append("view", view);
  data.append("props", JSON.stringify(props));
  return postHttpClient(data).then(data => {
    return { ...data, CatalogCache: `${domain}/${data.CatalogCache}` };
  });
};
const eCatalogDetails = ({ catalogId }) => {
  var data = new FormData();
  data.append("action", "ecatalogdetails");
  data.append("catalogid", catalogId);
  data.append("key", getApiKey());
  return postHttpClient(data).then(data => {
    const d = { ...data };
    let InitDesign;
    const { InitDesign: designPath } = d;
    const extArr = designPath.split(".");
    const ext = extArr[extArr.length - 1];
    if (ext !== "ctf") InitDesign = designPath + ".ctf";
    else InitDesign = designPath;

    return { ...data, InitDesign: "Designs/" + InitDesign };
  });
};
const calculatePriceOfRug = ({ props, file }) => {
  var data = new FormData();
  data.append("action", "price");
  data.append("key", getApiKey());
  data.append("file", file);
  data.append("props", JSON.stringify(props));
  return postHttpClient(data);
};
const fetchCustomFieldOrdersheet = () => {
  var data = new FormData();
  data.append("action", "customfields");
  data.append("key", getApiKey());
  return postHttpClient(data);
};
const fetchOrderSheet = ({ file, props, customFields, materialNames = "" }) => {
  const data = new FormData();
  data.append("action", "ordersheet");
  data.append("key", getApiKey());
  data.append("file", file);
  data.append("props", JSON.stringify(props));
  data.append("view", "");
  data.append("customfields", customFieldsToString(customFields));
  data.append("materialnames", JSON.stringify(materialNames));
  data.append("materialsilk", "");
  return postHttpClient(data);
};
const downloadCatalog = ({ file }) => {
  const url = `${domain}/${provider}?action=downloadfile&key=${getApiKey()}&file=${file}`;
  const link = document.createElement("a");
  link.href = url;
  link.click();
};
const sendOrdersheetEmail = ({
  file,
  props,
  name,
  email,
  phone,
  note,
  customFields = [],
  view = ""
}) => {
  const data = new FormData();
  data.append("action", "ordersheet");
  data.append("key", getApiKey());
  data.append("file", file);
  data.append("props", JSON.stringify(props));
  data.append("view", view);
  data.append("customfields", customFieldsToString(customFields));

  data.append("mode", "email");
  data.append("name", name);
  data.append("email", email);
  data.append("phone", phone);
  data.append("note", note);
  return postHttpClient(data);
};
const getColorAt = ({ file, x, y, Width, Height }) => {
  const data = new FormData();
  data.append("action", "colorat");
  data.append("key", getApiKey());
  data.append("file", file);
  data.append("x", x);
  data.append("y", y);
  data.append("width", Width);
  data.append("height", Height);
  return postHttpClient(data);
};
const getCatalogThumb = id => {
  return `${domain}/templates/catalogtemplates/${id}.thumb.jpg`;
};
const getColorTexturePreviewImage = ({ color, colorIndex = 0, collectionName = "" }) => {
  // return value in css background format
  if (colorIndex > 3) colorIndex = 0;
  const colorCode = color.substring(1);
  const url = `${domain}/Assets/${cacheLocation}/colors/${colorCode}-${collectionName}-${colorIndex}.jpg`;
  if (cacheLocation !== "") return `url(${url})`;
  else return color;
};
const fetchCatalog = ({ file, props, catalogName, view = "" }) => {
  const data = new FormData();
  data.append("action", "ordersheet");
  data.append("key", getApiKey());
  data.append("file", file);
  data.append("props", JSON.stringify(props));
  data.append("catalogname", catalogName);
  data.append("view", view);
  return postHttpClient(data).then(data => data.Value);
};
const DESIGN = "design";
const ROOM = "room";
const fetchList = (listType = DESIGN) => {
  if (listType === DESIGN) return AppProvider.fetchDesignList({});
  else if (listType === ROOM) return AppProvider.fetchRoomList({});
};
const getCustomConstructions = () => {
  const data = new FormData();
  data.append("key", getApiKey());
  data.append("action", "customconstructions");
  return postHttpClient(data).then(data => {
    if (data) return data.map(item => ({ ...item, Num: parseInt(item.Num) }));
    else return [];
  });

  // data ? data.map(item => ({ ...item, Num: parseInt(item.Num) })) : [])
};

const uploadMyRoom = roomImage => {
  const data = new FormData();
  data.append("key", getApiKey());
  data.append("action", "uploadmyroom");
  data.append("myroom", roomImage);
  return postHttpClient(data);
};
const uploadMyRoomMask = ({ maskUrl, roomId }) => {
  const data = new FormData();
  data.append("key", getApiKey());
  data.append("action", "uploadmyroommask");
  data.append("myroommask", maskUrl);
  data.append("roomid", roomId);
  return postHttpClient(data);
};
const getRoomMask = image => {
  const data = new FormData();
  data.append("image", image);
  return new Promise((resolve, reject) => {
    return HttpClient.post(myroomServerUrl, data)
      .then(response => {
        if (response.status === 201) resolve(response.data);
        else reject(response.data);
      })
      .catch(reject);
  });
};

const getProcessedRoomMask = ({
  roomId,
  file,
  props,
  floorpoints,
  notfloorpoints,
  carpetpoints
}) => {
  const data = new FormData();
  data.append("key", getApiKey());
  data.append("action", "processmyroom");
  data.append("mode", "mask");
  data.append("roomid", roomId);
  data.append("file", file);
  data.append("props", JSON.stringify(props));

  data.append("floorpoints", JSON.stringify(floorpoints));
  data.append("notfloorpoints", JSON.stringify(notfloorpoints));
  data.append("carpetpoints", JSON.stringify(carpetpoints));

  return postHttpClient(data, { responseType: "blob" });
};

const saveAsRoom = ({ mode, roomId, file, props, floorpoints, notfloorpoints, carpetpoints }) => {
  const data = new FormData();
  data.append("key", getApiKey());
  data.append("action", "processmyroom");
  data.append("mode", mode);
  data.append("roomid", roomId);
  data.append("file", file);
  data.append("props", JSON.stringify(props));

  data.append("floorpoints", JSON.stringify(floorpoints));
  data.append("notfloorpoints", JSON.stringify(notfloorpoints));
  data.append("carpetpoints", JSON.stringify(carpetpoints));

  return postHttpClient(data);
};

const getDesignThumbnails = ({ designs,renderTexturedThumbs = false}) => {
  const fullpaths = designs.map(item => item.fullpath);


  let data = new FormData();
  data.append("action", "designthumbs");
  data.append("key", getApiKey());
  data.append("files", JSON.stringify(fullpaths));
  if (renderTexturedThumbs) data.append("texture", 1);
  
  return postHttpClient(data).then(thumbList => {
    return designs.map(childFile => {
      const item = thumbList.find(item => item.Name === childFile.fullpath);
      let add = {};
      if (item) {
        const hash = MD5(JSON.stringify(item.Props));
        const path = processPath(item.Thumb);
        add = { Thumb: `${path}?t=${hash}`, Props: item.Props };
        cacheLocation = getCacheLocationFromUrl(item.Thumb);
      }
      return { ...childFile, ...add };
    });
  });
};
const getRoomThumbnails = ({ rooms }) => {
  const fullpaths = rooms.map(item => item.FullPath);
  let data = new FormData();
  data.append("action", "roomthumbs");
  data.append("key", getApiKey());
  data.append("files", JSON.stringify(fullpaths));
  return postWithRetry(data).then(thumbList => {
    return rooms.map(room => {
      //console.log(thumbList.map(item => item.Name), childFile.FullPath)
      const item = thumbList.find(item => item.Name === room.FullPath);
      let add = { label: room.Name };
      if (item) add = { ...add, Thumb: `${AppProvider.domain}${item.Thumb}`, id: uuid.v4() };
      return { ...room, ...add };
    });
  });
};
const getRenderedDesign = async ({ designDetails, fullpath, hash, zoom = 1 }) => {
  const tileSize = 256;
  return new Promise((resolve, reject) => {
    const { Width, Height } = designDetails;
    const ratio = Width / Height;
    const canvasWidth = Width * zoom - 2;
    const canvasHeight = canvasWidth / ratio - 2;
    const canvas = createCanvas(canvasWidth, canvasHeight);

    let xTotal = Math.floor((canvasWidth - 1) / 256) + 1;
    let yTotal = Math.floor((canvasHeight - 1) / 256) + 1;
    let tilepoints2X = [];
    for (let x = 0; x < xTotal; x++) {
      for (let y = 0; y < yTotal; y++) {
        tilepoints2X.push({ x, y, z: zoom, name: convertTilePointToName(x, y) });
      }
    }
    const context = canvas.getContext("2d");
    fetchVisualizationTiles({
      file: fullpath,
      zoom,
      props: designDetails,
      tiles: tilepoints2X.map(item => item.name)
    }).then(basePath => {
      let tileImagesLoaded = 0;
      tilepoints2X.forEach((tilePoint, index) => {
        const img = document.createElement("img");
        img.setAttribute("crossOrigin", "Anonymous");
        const { name } = tilePoint;
        let filename = `${basePath}/${name}.rendered.jpg`;
        if (hash && hash !== "") {
          filename = `${filename}?t=${hash}`;
        }
        img.src = filename;
        tilePoint.image = img;
        img.onload = () => {
          if (tileImagesLoaded + 1 === tilepoints2X.length) {
            drawInCanvas();
          }
          tileImagesLoaded++;
        };
      });
    });
    let index = 0;
    const drawInCanvas = () => {
      if (index < tilepoints2X.length) {
        const tilepoint = tilepoints2X[index];
        context.drawImage(tilepoint.image, tilepoint.x * tileSize, tilepoint.y * tileSize);
        requestAnimationFrame(drawInCanvas);
      }
      if (index === tilepoints2X.length) {
        //design has been drawn in canvas
        setTimeout(() => {
          resolve(canvas);
        }, 500);
      }
      index++;
    };
  });
};
const readTextureImages = textures => {
  // const url = `${domain}/Assets/${cacheLocation}/colors/${colorCode}-${collectionName}-${colorIndex}.jpg`;
  const textureImages = textures.map(
    item => `${domain}/Assets/${cacheLocation}/textures/${item}.jpg`
  );
  let promises = [];
  textureImages.forEach((textureUrl, index) => {
    promises.push(readImage(textureUrl).then(image => ({ image, index: textures[index] })));
  });
  return Promise.all(promises);
};
const getStripedDesign = () => {
  let data = new FormData();
  data.append("action", "getstripedesign");
  data.append("key", getApiKey());
  return postHttpClient(data).then(data => `Designs/${data}`);
};
const saveOnServer = ({ file, name, props }) => {
  let data = new FormData();
  data.append("action", "saveonserver");
  data.append("key", getApiKey());
  data.append("file", file);
  if (name) {
    data.append("name", name);
    data.append("copy", true);
  }
  data.append("props", JSON.stringify(props))
  return postHttpClient(data).then(data => `Designs/${data}`)
}
const clearCache = ({ mode, files }) => {
  if (!mode) console.warn("CLEAR CACHE MODE NOT SPECIFIED")
  let data = new FormData();
  data.append("action", "clearcache");
  data.append("key", getApiKey());
  data.append("mode", mode)
  if (files)
    data.append("files", JSON.stringify(files))
  return postHttpClient(data)
}
const isStripedDesignMode = sessionStorage.getItem("mode") === "stripedesign";
const isEcatMode = sessionStorage.getItem("mode") === "ecat";
const getx = (param) => {
  console.log(param)
}
const setBuild = val => {
  build = val;
}
const AppProvider = {
  fetchApiKey,
  fetchDesignList,
  fetchColorList,
  fetchRoomList,
  fetchRoomDetails,
  fetchRenderedDesignOrRoom,
  publishDesign,
  isAuthenticated,
  fetchInterfaceElements,
  domain,
  assetsDomain,
  autoLogin,
  changeColorCombination,
  calculatePriceOfRug,
  fetchCustomFieldOrdersheet,
  fetchOrderSheet,
  downloadCatalog,
  sendOrdersheetEmail,
  getColorAt,
  eCatalogDetails,
  getCatalogThumb,
  fetchCatalog,
  getColorTexturePreviewImage,
  fetchList,
  getCustomConstructions,
  uploadMyRoom,
  uploadMyRoomMask,
  getRoomMask,
  getProcessedRoomMask,
  saveAsRoom,
  fetchTileDetails,
  fetchDesignTiles,
  fetchPileTiles,
  getDesignThumbnails,
  getRoomThumbnails,
  fetchVisualizationTiles,
  getStripedDesign,
  getRenderedDesign,
  saveOnServer,
  isStripedDesignMode,
  readTextureImages,
  isEcatMode,
  clearCache,
  getx,
  setBuild
};
export default AppProvider;
const customFieldsToString = fields => {
  let customFieldsString = "";
  fields.forEach(field => {
    customFieldsString = customFieldsString.concat(`${field.fieldName}|${field.fieldValue}|`);
  });
  return customFieldsString;
};
// const partial = function (len, x, _end) {
//   if (len === 32) { return x; }
//   return (_end ? x | 0 : x << (32 - len)) + len * 0x10000000000;
// }
// const toBits = function (bytes) {
//   var out = [], i, tmp = 0;
//   for (i = 0; i < bytes.length; i++) {
//     tmp = tmp << 8 | bytes[i];
//     if ((i & 3) === 3) {
//       out.push(tmp);
//       tmp = 0;
//     }
//   }
//   if (i & 3) {
//     out.push(partial(8 * (i & 3), tmp));
//   }
//   return out;
// }

//colorhex-tabName-materialIndex
//tabname==null?""
