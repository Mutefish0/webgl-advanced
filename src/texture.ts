let currentTexId = 0;

class Texture {
  private id: number;
  private url: string;
  private gl: WebGL2RenderingContext;
  constructor(gl: WebGL2RenderingContext, url: string) {
    const maxTexNum = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
    if (currentTexId > maxTexNum - 1) {
      throw new Error('纹理数量超出最大范围');
    }

    this.gl = gl;
    this.id = currentTexId;
    this.url = url;

    gl.activeTexture(gl.TEXTURE0 + this.id);
    const texture = gl.createTexture() as WebGLTexture;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // 图片不重复，采取编译拉伸的方式
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // 图片缩放采用线性过滤
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    currentTexId++;
  }

  public load() {
    const gl = this.gl;
    const image = new Image();
    return new Promise((resolve, reject) => {
      image.onload = () => {
        gl.activeTexture(gl.TEXTURE0 + this.id);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        resolve();
      };
      image.onerror = () => {
        reject(`failed to load texture ${this.url}`);
      };
      image.src = this.url;
    });
  }

  public setup(location: number) {
    // 设置采样器地址
    this.gl.uniform1i(location, this.id);
  }
}

export default Texture;
