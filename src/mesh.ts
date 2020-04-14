import Shader from './shader';

class Mesh {
  private vertices: number[];
  private attributes: Attribute[];
  private indices?: number[];
  private gl: WebGL2RenderingContext;

  constructor(
    gl: WebGL2RenderingContext,
    vertices: number[],
    attributes: Attribute[],
    indices?: number[]
  ) {
    this.vertices = vertices;
    this.attributes = attributes;
    this.indices = indices;
    this.gl = gl;
  }

  public setup(shader: Shader) {
    const gl = this.gl;
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

    if (this.indices) {
      const indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
    }

    for (let attr of this.attributes) {
      const attrLoc = gl.getAttribLocation(shader.program, attr.name);
      gl.vertexAttribPointer(attrLoc, attr.size, gl.FLOAT, false, 4 * attr.stride, 4 * attr.offset);
      gl.enableVertexAttribArray(attrLoc);
    }
  }

  public draw() {
    const gl = this.gl;
    if (this.indices) {
      gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    }
  }

  public drawWithIndices(indices: number[]) {
    const gl = this.gl;
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  }
}

export default Mesh;
