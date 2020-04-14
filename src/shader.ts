import { mat4 } from 'gl-matrix';

class Shader {
  private vertexShaderUrl: string;
  private fragShaderUrl: string;
  private shaderVs: WebGLShader;
  private shaderFs: WebGLShader;
  public gl: WebGL2RenderingContext;
  public program: WebGLProgram;

  constructor(gl: WebGL2RenderingContext, vertexShaderUrl: string, fragShaderUrl: string) {
    this.gl = gl;
    this.vertexShaderUrl = vertexShaderUrl;
    this.fragShaderUrl = fragShaderUrl;
    this.shaderVs = this.gl.createShader(this.gl.VERTEX_SHADER) as WebGLShader;
    this.shaderFs = gl.createShader(this.gl.FRAGMENT_SHADER) as WebGLShader;
    this.program = gl.createProgram() as WebGLProgram;
  }

  public async load() {
    const gl = this.gl;
    const [vRes, fRes] = await Promise.all([
      fetch(this.vertexShaderUrl),
      fetch(this.fragShaderUrl),
    ]);
    const [vSource, fSource] = await Promise.all([vRes.text(), fRes.text()]);

    gl.shaderSource(this.shaderVs, vSource);
    gl.shaderSource(this.shaderFs, fSource);
  }

  public compile() {
    const gl = this.gl;
    gl.compileShader(this.shaderVs);
    gl.compileShader(this.shaderFs);
    // 检查编译错误
    if (!gl.getShaderParameter(this.shaderVs, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(this.shaderVs) || '顶点着色器编译出错');
    }
    if (!gl.getShaderParameter(this.shaderFs, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(this.shaderFs) || '片段着色器编译出错');
    }
  }

  public link() {
    const gl = this.gl;
    gl.attachShader(this.program, this.shaderVs);
    gl.attachShader(this.program, this.shaderFs);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(this.program) || '链接出错');
    }
  }

  public useProgram() {
    const gl = this.gl;
    gl.useProgram(this.program);
    // 开启Z缓冲
    gl.enable(this.gl.DEPTH_TEST);
  }

  public projection(near: number, far: number, fov: number, aspectRatio: number) {
    const gl = this.gl;
    const projectionLoc = gl.getUniformLocation(this.program, 'projection');
    const f = 1.0 / Math.tan(((fov / 180) * Math.PI) / 2);
    const rangeInv = 1 / (near - far);
    // prettier-ignore
    gl.uniformMatrix4fv(projectionLoc, false, [
      f / aspectRatio, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ]);
  }

  public view(viewMatrix: mat4) {
    const gl = this.gl;
    const viewLoc = gl.getUniformLocation(this.program, 'view');
    gl.uniformMatrix4fv(viewLoc, false, viewMatrix);
  }

  public model(modelMatrix: mat4) {
    const gl = this.gl;
    const modelLoc = gl.getUniformLocation(this.program, 'model');
    gl.uniformMatrix4fv(modelLoc, false, modelMatrix);
  }
}

export default Shader;
