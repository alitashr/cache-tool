import { readImage } from "./utils";

export const createCanvas = (w, h) => {
  var canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return canvas;
};

export function applyEdgeFilter(canvas, image) {
  const pix = 4;
  const blur = "2px";
  const brightness = "50%";

  const w = canvas.width,
    h = canvas.height;

  var designCtx = canvas.getContext("2d");

  var filterCanvas = createCanvas(w, h);
  var designfilterCtx = filterCanvas.getContext("2d");
  designfilterCtx.filter = `blur(${blur}) brightness(${brightness})`;
  designfilterCtx.drawImage(image, 0, 0, w, h);

  const designfilterData = designfilterCtx.getImageData(0, 0, pix, h);
  designCtx.putImageData(designfilterData, 0, 0);

  const designfilterData2 = designfilterCtx.getImageData(0, 0, w, pix);
  designCtx.putImageData(designfilterData2, 0, 0);

  const designfilterData3 = designfilterCtx.getImageData(0, h - pix, w, pix);
  designCtx.putImageData(designfilterData3, 0, h - pix);

  const designfilterData4 = designfilterCtx.getImageData(w - pix, 0, pix, h);
  designCtx.putImageData(designfilterData4, w - pix, 0);
  return canvas;
}
export function applyBWMask(maskCanvas, imageUrl, maskUrl, callback) {
  //console.log(imageUrl, maskUrl);
  const { width, height } = maskCanvas;
  const tempCanvas = createCanvas(width, height);
  const maskCtx = maskCanvas.getContext("2d");
  const tempCtx = tempCanvas.getContext("2d");

  const img = new Image();
  img.src = imageUrl;
  img.crossOrigin = "Anonymous";
  img.onload = () => {
    maskCanvas.width = width;
    maskCanvas.height = height;
    maskCtx.drawImage(img, 0, 0, width, height);
    const maskImg = new Image();
    maskImg.src = maskUrl;
    maskImg.crossOrigin = "Anonymous";
    maskImg.onload = () => {
      tempCanvas.width = width;
      tempCanvas.height = height;
      tempCtx.drawImage(maskImg, 0, 0, width, height);

      let imgData = maskCtx.getImageData(0, 0, width, height);
      let maskData = tempCtx.getImageData(0, 0, width, height);

      for (var i = 0; i < maskData.data.length; i += 4) {
        imgData.data[i + 3] = 255 - maskData.data[i];
      }
      maskCtx.putImageData(imgData, 0, 0);
      callback(maskCanvas);
    };
  };
}
export const applyMask = (canvas, imgUrl, maskUrl) => {
  const { width, height } = canvas;
  const tempCanvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const tempCtx = tempCanvas.getContext("2d");

  const readUrls = [readImage(imgUrl), readImage(maskUrl)];
  return Promise.all(readUrls).then(images => {
    const image = images[0];
    const mask = images[1];

    ctx.drawImage(image, 0, 0, width, height);
    tempCtx.drawImage(mask, 0, 0, width, height);

    let imgData = ctx.getImageData(0, 0, width, height);
    let maskData = tempCtx.getImageData(0, 0, width, height);

    for (let i = 0; i < maskData.data.length; i += 4) {
      imgData.data[i + 3] = 255 - maskData.data[i];
    }
    ctx.putImageData(imgData, 0, 0);
  });
};

export const bnwToTransparency = (canvas, bnwUrl, amount) => {
  const { width, height } = canvas;
  const ctx = canvas.getContext("2d");

  const image = new Image();
  image.src = bnwUrl;
  image.crossOrigin = "Anonymous";
  image.onload = function () {
    ctx.drawImage(image, 0, 0, width, height);

    let imageData = ctx.getImageData(0, 0, width, height);
    for (var i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i + 3] = (255 - imageData.data[i]) * amount;
      imageData.data[i] = 0;
      imageData.data[i + 1] = 0;
      imageData.data[i + 2] = 0;
    }
    ctx.putImageData(imageData, 0, 0);
  };
};

export const resizeCanvas = (canvas, width, height) => {
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
};
export const clearCanvas = (canvas, w, h) => {
  canvas.getContext("2d").clearRect(0, 0, w, h);
};
export const imagetoBlob = (canvas, image, mime, callback) => {
  const { width, height } = canvas;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, width, height);
  canvas.toBlob(callback, mime, 0.8);
};
export const downloadImageData = (canvas, name, mime) => {
  const mimetype = mime === "jpg" ? "jpeg" : mime;
  canvas.toBlob(
    function (blob) {
      var url = URL.createObjectURL(blob);
      var anchor = document.createElement("a");
      anchor.href = url;
      anchor.setAttribute("download", name);

      setTimeout(function () {
        if (navigator.msSaveOrOpenBlob) {
          navigator.msSaveOrOpenBlob(blob, name);
        } else {
          anchor.click();
        }
        // anchor.click();
      }, 100);
    },

    `image/${mimetype}`,
    0.95
  );
};

export const canvasToBlobPromise = canvas =>
  new Promise((resolve, reject) => {
    canvas.toBlob(resolve);
  });