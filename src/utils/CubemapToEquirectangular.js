const THREE = window.THREE;
// var THREE = THREE
if (!THREE) throw new Error("CubemapToEquirectangular requires three.js");
/* eslint-disable */
var vertexShader = `
attribute vec3 position;
attribute vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

varying vec2 vUv;

void main()  {

	vUv = vec2( 1.- uv.x, uv.y );
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
`;

var fragmentShader = `
precision mediump float;

uniform samplerCube map;

varying vec2 vUv;

#define M_PI 3.1415926535897932384626433832795

void main()  {

	vec2 uv = vUv;

	float longitude = uv.x * 2. * M_PI - M_PI + M_PI / 2.;
	float latitude = uv.y * M_PI;

	vec3 dir = vec3(
		- sin( longitude ) * sin( latitude ),
		cos( latitude ),
		- cos( longitude ) * sin( latitude )
	);
	normalize( dir );

	gl_FragColor = textureCube( map, dir );

}
`;
/* eslint-disable */
function CubemapToEquirectangular(renderer, provideCubeCamera) {
  this.width = 1;
  this.height = 1;

  this.renderer = renderer;
  //console.log("after", this.renderer.info.programs.length);

  this.material = new THREE.RawShaderMaterial({
    precision: "mediump",
    uniforms: {
      map: { type: "t", value: null }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: THREE.DoubleSide,
    transparent: true
  });

  this.scene = new THREE.Scene();
  this.geom = new THREE.PlaneGeometry(1, 1);
  this.quad = new THREE.Mesh(this.geom, this.material);
  this.scene.add(this.quad);
  this.camera = new THREE.OrthographicCamera(
    1 / -2,
    1 / 2,
    1 / 2,
    1 / -2,
    -10000,
    10000
  );

  this.canvas = document.createElement("canvas");
  this.ctx = this.canvas.getContext("2d");

  this.cubeCamera = null;
  this.attachedCamera = null;

  this.setSize(5000, 2500);
  window.cubecamera = this.cubeCamera;
  var gl = this.renderer.getContext();
  this.cubeMapSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);

  if (provideCubeCamera) {
    this.getCubeCamera(2500);
  }
}

CubemapToEquirectangular.prototype.setSize = function (width, height) {
  this.width = width;
  this.height = height;

  this.quad.scale.set(this.width, this.height, 1);

  this.camera.left = this.width / -2;
  this.camera.right = this.width / 2;
  this.camera.top = this.height / 2;
  this.camera.bottom = this.height / -2;

  this.camera.updateProjectionMatrix();

  this.output = new THREE.WebGLRenderTarget(this.width, this.height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType
  });

  this.canvas.width = this.width;
  this.canvas.height = this.height;
};

CubemapToEquirectangular.prototype.getCubeCamera = function (size) {
  var cubeMapSize = Math.min(this.cubeMapSize, size);
  this.cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeMapSize);

  var options = {
    format: THREE.RGBAFormat,
    magFilter: THREE.LinearFilter,
    minFilter: THREE.LinearFilter
  };
  this.cubeCamera.renderTarget = new THREE.WebGLRenderTargetCube(
    cubeMapSize,
    cubeMapSize,
    options
  );

  return this.cubeCamera;
};
CubemapToEquirectangular.prototype.attachCubeCamera = function (camera) {
  this.getCubeCamera();
  this.attachedCamera = camera;
};

CubemapToEquirectangular.prototype.convert = function (
  cubeCamera,
  download,
  callback
) {
  this.quad.material.uniforms.map.value = cubeCamera.renderTarget.texture;
  this.renderer.render(this.scene, this.camera, this.output, true);
  sleep(500).then(() => {
    var pixels = new Uint8Array(4 * this.width * this.height);
    this.renderer.readRenderTargetPixels(
      this.output,
      0,
      0,
      this.width,
      this.height,
      pixels
    );
    var imageData = new ImageData(
      new Uint8ClampedArray(pixels),
      this.width,
      this.height
    );
    if (download !== false) {
      this.download(imageData);
    }

    // geometry.dispose();
    // 			material.dispose();
    // 			texture.dispose();
    callback(imageData);
  });
};
// sleep time expects milliseconds
function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

CubemapToEquirectangular.prototype.getBase64 = function (imageData) {
  this.ctx.putImageData(imageData, 0, 0);

  return this.canvas.toDataURL("image/png");
};
CubemapToEquirectangular.prototype.download = function (imageData, callback) {
  this.ctx.putImageData(imageData, 0, 0);

  this.canvas.toBlob(function (blob) {
    var url = URL.createObjectURL(blob);
    var fileName = "pano.png";
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.setAttribute("download", fileName);
    anchor.className = "download-js-link";
    anchor.innerHTML = "downloading...";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    setTimeout(function () {
      anchor.click();
      document.body.removeChild(anchor);
    }, 1);
  }, "image/png");
};

CubemapToEquirectangular.prototype.update = function (camera, scene, callback) {
  var autoClear = this.renderer.autoClear;
  this.renderer.autoClear = false;
  this.cubeCamera.position.copy(camera.position);
  this.cubeCamera.updateCubeMap(this.renderer, scene);
  this.renderer.autoClear = autoClear;

  return this.convert(this.cubeCamera, false, callback);
};
module.exports = CubemapToEquirectangular;
