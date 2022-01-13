/* eslint-disable no-useless-escape */
import axios from "axios";
import convert from "convert-units";
import { WebpMachine } from "webp-hero"
const webpMachine = new WebpMachine()

export function convertArrIntoRad(arrDeg) {
  return arrDeg.map(angle => (angle * Math.PI) / 180);
}
export const convertArrintoDeg = arrRad => {
  return arrRad.map(angle => (angle * 180) / Math.PI);
};

export function fitImageToContainer(image, container) {
  let { width: containerwidth, height: containerheight } = container
  let { width: imagewidth, height: imageheight } = image
  let width = imagewidth,
    height = imageheight;
  if (imagewidth > imageheight) {
    if (width > containerwidth) {
      height = (imageheight * containerwidth) / imagewidth;
      width = containerwidth;
    }
    if (height > containerheight) {
      width = (imagewidth * containerheight) / imageheight;
      height = containerheight;
    }
  } else {
    if (height > containerheight) {
      width = (imagewidth * containerheight) / imageheight;
      height = containerheight;
    }
    if (width > containerwidth) {
      height = (imageheight * containerwidth) / imageheight;
      width = containerwidth;
    }
  }
  return { width, height };
}

export const downloadAsJSON = (object, name) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(object));
  const dlAnchorElem = document.createElement("a");
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `${name}.json`);
  dlAnchorElem.click();
};
export const readImage = (url, i) => {
  let imageUrl = url;
  if (url instanceof Blob) {
    imageUrl = URL.createObjectURL(url);
  }
  return new Promise((resolve, reject) => {
    let image = new Image();
    image.crossOrigin = "Anonymous";
    image.src = imageUrl;
    webpMachine.polyfillImage(image)
    image.onload = () => {
      if (i)
        resolve({ image, ...i });
      else
        resolve(image);
    };
    image.onerror = reject;
  });
};

export const readJSON = url => {
  return axios.get(url).then(response => response.data);
};

export function fitIntoContainer(image, container) {
  let { offsetWidth: containerwidth, offsetHeight: containerheight } = container;
  let imagewidth = image.width,
    imageheight = image.height;
  if (!image.width || !image.height) return { width: containerwidth, height: containerheight };
  let width = imagewidth,
    height = imageheight;
  const wdif = width - containerwidth;
  const hdif = height - containerheight;
  if (imagewidth > imageheight) {
    if (wdif > hdif) {
      height = containerheight;
      width = (imagewidth * containerheight) / imageheight;
    } else {
      width = containerwidth;
      height = (imageheight * containerwidth) / imagewidth;
    }
    // if (width > containerwidth) {
    //   }
  } else {
    // if (height > containerheight) {
    //   width = (imagewidth * containerheight) / imageheight;
    //   height = containerheight;
    // }
    // if (width > containerwidth) {
    //   height = (imageheight * containerwidth) / imageheight;
    //   width = containerwidth;
    // }
  }
  return { width, height };
}

export function resizeKeepingAspect(image, container, fitType = "fit_inside", resolution = 1) {
  let { width: containerwidth, height: containerheight } = container;
  let { width: imagewidth, height: imageheight } = image;
  if (!imagewidth || !imageheight) return { width: containerwidth, height: containerheight };
  if (containerheight === 0 || containerwidth === 0) return { width: imagewidth, height: imageheight };
  let width = imagewidth,
    height = imageheight;
  //console.log("container: ", containerwidth, containerheight);
  //console.log("image", imagewidth, imageheight);

  switch (fitType) {
    case "fit_inside":
      if (imagewidth > imageheight) {
        if (width > containerwidth) {
          height = (imageheight * containerwidth) / imagewidth;
          width = containerwidth;
        }
        if (height > containerheight) {
          width = (imagewidth * containerheight) / imageheight;
          height = containerheight;
        }
      } else {
        if (height > containerheight) {
          width = (imagewidth * containerheight) / imageheight;
          height = containerheight;
        }
        if (width > containerwidth) {
          height = (imageheight * containerwidth) / imagewidth;
          width = containerwidth;
        }
      }
      break;
    case "crop":
      const wdif = width - containerwidth;
      const hdif = height - containerheight;
      if (wdif > hdif) {
        height = containerheight;
        width = (imagewidth * containerheight) / imageheight;
      } else {
        width = containerwidth;
        height = (imageheight * containerwidth) / imagewidth;
      }
      break;

    default:
      break;
  }
  width = width * resolution;
  height = height * resolution;
  return { width, height };
}
export const convertUnit = (from, to, value, fixed) => {
  const converted =
    convert(value)
      .from(from)
      .to(to);
  if (fixed)
    return Number(converted.toFixed(fixed))
  else return converted
};
// export const safeInvoke = (func)=>{
// if(func) func
// }
export const getExtension = path => {
  const fp = path.split(".");
  return fp[fp.length - 1];
};
export function isiPhone() {
  return (
    //Detect iPhone
    (navigator.platform.indexOf("iPhone") !== -1) ||
    //Detect iPad
    (navigator.platform.indexOf("iPad") !== -1) ||
    //Detect iPod
    (navigator.platform.indexOf("iPod") !== -1)
  );
}
export function scrollIntoViewIfNeeded(target) {
  var rect = target.getBoundingClientRect();
  if (rect.bottom > window.innerHeight) {
    target.scrollIntoView(false);
  }
  if (rect.top < 0) {
    target.scrollIntoView();
  }
}

export const isIE = () => window.navigator.userAgent.indexOf("MSIE ") > 0 ||
  // eslint-disable-next-line no-useless-escape
  !!navigator.userAgent.match(/Trident.*rv\:11\./)

export function convertNumberToFeetInch(f, unit) {
  if (unit !== "ft") return f;
  var ft = Math.floor(f);
  var inch = Math.round(12 * (f - ft));
  if (inch === 12) {
    ft++;
    inch = 0;
  }
  return ft + "′" + (inch > 0 ? inch + "″" : "");
}
export function convertFeetInchToNumber(f, unit) {
  if (unit !== "ft") return f;
  var rex = /[-+]?[0-9]*\.?[0-9]+/g;
  var match = f.match(rex);
  var feet, inch;
  if (match) {
    feet = parseFloat(match[0]);
    inch = match.length > 1 ? parseFloat(match[1]) : 0;
    if (feet > 0 && inch >= 0 && inch < 12) {
      return feet + inch / 12;
    }
  }
  return null;
}
export function makeid(length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
export const leftFillNum = (num, targetLength) =>
  num.toString().padStart(targetLength, 0);
export const convertTilePointToName = (i, j) => `${leftFillNum(i, 2)}_${leftFillNum(j, 2)}`
export const convertNameToTilePoint = name => {
  const x = parseInt(name.trim().substring(0, 2))
  const y = parseInt(name.trim().substring(3, 5))
  return { x, y }
}

export const getPathFromString = string => {
  const x = string.split("/");
  x.pop();
  return x.join("/")
}
export const createAsyncQueue = (tasks, maxNumOfWorkers = 5) => {
  var numOfWorkers = 0;
  var taskIndex = 0;

  return new Promise(done => {
    const handleResult = index => result => {
      tasks[index] = result;
      numOfWorkers--;
      getNextTask();
    };
    const getNextTask = () => {
      if (numOfWorkers < maxNumOfWorkers && taskIndex < tasks.length) {
        tasks[taskIndex].then(handleResult(taskIndex)).catch(handleResult(taskIndex));
        taskIndex++;
        numOfWorkers++;
        getNextTask();
      } else if (numOfWorkers === 0 && taskIndex === tasks.length) {
        done(tasks);
      }
    };
    getNextTask();
  });
}
export const mergeArraysWithoutDuplicate = (...arrays) => {
  let jointArray = []

  arrays.forEach(array => {
    jointArray = [...jointArray, ...array]
  })
  const uniqueArray = jointArray.filter((item, index) => jointArray.indexOf(item) === index)
  return uniqueArray
}
export const areaOfellipse = (x, y) => Math.PI * x * y


export const createVector = (p, camera, width, height) => {
  var vector = p.project(camera);

  vector.x = ((vector.x + 1) / 2) * width;
  vector.y = (-(vector.y - 1) / 2) * height;

  return vector;
};

export const getDesignPathInTitle = designPath => {
  if (!designPath) return "";
  const dotPos = designPath.lastIndexOf(".");
  designPath = designPath.substring(0, dotPos);

  let title = designPath.replace(/\/\./g, '/')
    .split("/")
    .slice(1)
    .join("/");
  return title;
};
export const isMobileDevice =
  /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
    navigator.userAgent
  ) ||
  /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
    navigator.userAgent.substr(0, 4)
  );

export const shuffle =(arra1)=> {
  var ctr = arra1.length, temp, index;
  // While there are elements in the array
  while (ctr > 0) {
  // Pick a random index
      index = Math.floor(Math.random() * ctr);
  // Decrease ctr by 1
      ctr--;
  // And swap the last element with it
      temp = arra1[ctr];
      arra1[ctr] = arra1[index];
      arra1[index] = temp;
  }
  return arra1;
};

export const getPalette =(arra1)=> {
  var ctr = arra1.length;
  let newColorPalette= new Array(ctr);
  while (ctr > 0) {
      ctr--;
      newColorPalette[ctr]={
        'Name': arra1[ctr].ColorName,
        'Value':  arra1[ctr].Color
      }
  }
  return newColorPalette;
};