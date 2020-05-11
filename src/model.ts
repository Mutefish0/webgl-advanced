import getObjLoader from 'src/lib/objloader';

import Shader from './shader';
import Texture from './texture';

interface Material {
  name: string;

  illum: number;

  opaque: number;

  Ka: Vec3;
  Kd: Vec3;
  Ks: Vec3;
  Ns: number;

  map_Kd_URI?: string;
  map_Kd?: Texture;
  map_Ks_URI?: string;
  map_Ks?: Texture;
  map_Bump_URI?: string;
  map_Bump?: Texture;
}

function parseMTL(mltSource: string) {
  const materials: Material[] = [];
  let lines = mltSource.split(/\r?\n/);
  // 去掉注释和空行
  lines = lines.filter((line) => line && !/^\s*#/.test(line));
  lines.forEach((line) => {
    const [cmd, ...elements] = line.split(/\s+/);
    const currentMaterial = materials[materials.length - 1];
    switch (cmd) {
      case 'newmtl':
        materials.push({
          name: elements[0],
          illum: 0,
          opaque: 1.0,
          Ka: [1, 1, 1],
          Kd: [1, 1, 1],
          Ks: [1, 1, 1],
          Ns: 32,
        });
        break;
      case 'Ka':
        currentMaterial.Ka =
            [Number(elements[0]), Number(elements[1]), Number(elements[2])];
        break;
      case 'Kd':
        currentMaterial.Kd =
            [Number(elements[0]), Number(elements[1]), Number(elements[2])];
        break;
      case 'Ks':
        currentMaterial.Ks =
            [Number(elements[0]), Number(elements[1]), Number(elements[2])];
        break;
      case 'Ns':
        currentMaterial.Ns = Number(elements[0]);
        break;
      case 'map_Kd':
        currentMaterial.map_Kd_URI = elements[0];
        break;
      case 'map_Ks':
        currentMaterial.map_Ks_URI = elements[0];
        break;
      case 'map_Bump':
        currentMaterial.map_Bump_URI = elements[0];
        break;
      case 'd':
        currentMaterial.opaque = Number(elements[0]);
        break;
      case 'Tr':
        currentMaterial.opaque = 1 - Number(elements[0]);
        break;
      case 'illum':
        currentMaterial.illum = parseInt(elements[0]);
        break;
    }
  });
  return materials;
}

interface Mesh {
  startIndex: number;
  endIndex: number;
  materialIndex: number;
}

class Model {
  private gl: WebGL2RenderingContext;
  private modelUrl: string;
  private materials: Material[];
  private meshs: Mesh[];
  private vertices: Float32Array;

  private kaLoc: number = 0;
  private kdLoc: number = 0;
  private ksLoc: number = 0;
  private nsLoc: number = 0;
  private illumLoc: number = 0;
  private mapKdLoc: number = 0;
  private mapKsLoc: number = 0;
  private mapBumpLoc: number = 0;
  private mapFlagsLoc: number = 0;

  constructor(gl: WebGL2RenderingContext, modelUrl: string) {
    this.gl = gl;
    this.modelUrl = modelUrl;
    this.materials = [];
    this.meshs = [];
    this.vertices = new Float32Array();
  }

  public async load() {
    console.log('load model begin...');
    console.time('cost');

    const baseURL = this.modelUrl.replace(/[^/]+$/, '');
    const res = await fetch(this.modelUrl);
    const text = await res.text();
    const loader = await getObjLoader();
    const {vertices, mtllibs, mtlstops} = loader.parseOBJ(text);

    const numVertices = vertices.length / 8;

    for (let mtllib of mtllibs) {
      const res = await fetch(`${baseURL}${mtllib}`);
      const text = await res.text();
      this.materials = this.materials.concat(parseMTL(text));
    }

    const textureLoadPromises = [];
    for (let material of this.materials) {
      if (material.map_Kd_URI) {
        material.map_Kd =
            new Texture(this.gl, `${baseURL}${material.map_Kd_URI}`);
        textureLoadPromises.push(material.map_Kd.load());
      }
      if (material.map_Ks_URI) {
        material.map_Ks =
            new Texture(this.gl, `${baseURL}${material.map_Ks_URI}`);
        textureLoadPromises.push(material.map_Ks.load());
      }
      if (material.map_Bump_URI) {
        material.map_Bump =
            new Texture(this.gl, `${baseURL}${material.map_Bump_URI}`);
        textureLoadPromises.push(material.map_Bump.load());
      }
    }
    // 等待纹理加载完成
    await Promise.all(textureLoadPromises);

    this.vertices = vertices;
    this.meshs = [{startIndex: 0, endIndex: numVertices, materialIndex: -1}];
    for (let stop of mtlstops) {
      const lastMesh = this.meshs[this.meshs.length - 1];
      const mIndex = this.materials.findIndex((m) => m.name === stop.material);

      if (stop.index === lastMesh.startIndex) {
        lastMesh.materialIndex = mIndex;
      } else if (
          stop.index > lastMesh.startIndex && stop.index < lastMesh.endIndex) {
        this.meshs.pop();
        this.meshs.push({
          startIndex: lastMesh.startIndex,
          endIndex: stop.index,
          materialIndex: lastMesh.materialIndex,
        });
        this.meshs.push({
          startIndex: stop.index,
          endIndex: lastMesh.endIndex,
          materialIndex: mIndex,
        });
      }
    }

    console.log('load model finished...');
    console.log('vertex count: ', vertices.length);
    console.timeEnd('cost');
  }

  public setup(shader: Shader) {
    const gl = shader.gl;

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

    const attributes = [
      {name: 'a_Pos', size: 3, stride: 8, offset: 0},
      {name: 'a_TexCoord', size: 2, stride: 8, offset: 3},
      {name: 'a_Norm', size: 3, stride: 8, offset: 5},
    ];

    for (let attr of attributes) {
      const attrLoc = gl.getAttribLocation(shader.program, attr.name);
      gl.vertexAttribPointer(
          attrLoc, attr.size, gl.FLOAT, false, 4 * attr.stride,
          4 * attr.offset);
      gl.enableVertexAttribArray(attrLoc);
    }

    this.kaLoc = gl.getUniformLocation(shader.program, 'Ka') as number;
    this.kdLoc = gl.getUniformLocation(shader.program, 'Kd') as number;
    this.ksLoc = gl.getUniformLocation(shader.program, 'Ks') as number;
    this.nsLoc = gl.getUniformLocation(shader.program, 'Ns') as number;
    this.illumLoc = gl.getUniformLocation(shader.program, 'illum') as number;
    this.mapKdLoc = gl.getUniformLocation(shader.program, 'map_Kd') as number;
    this.mapKsLoc = gl.getUniformLocation(shader.program, 'map_Ks') as number;
    this.mapBumpLoc =
        gl.getUniformLocation(shader.program, 'map_Bump') as number;
    this.mapFlagsLoc =
        gl.getUniformLocation(shader.program, 'mapFlags') as number;
  }

  // Apply materials
  applyMaterial(mIndex: number) {
    if (mIndex < 0) {
      return;
    }

    const gl = this.gl;
    const material = this.materials[mIndex];

    let mapFlags = 0;

    gl.uniform3fv(this.kaLoc, material.Ka);
    gl.uniform3fv(this.kdLoc, material.Kd);
    gl.uniform3fv(this.ksLoc, material.Ks);
    gl.uniform1f(this.nsLoc, material.Ns);
    gl.uniform1i(this.illumLoc, material.illum);

    if (material.map_Kd) {
      material.map_Kd.setup(this.mapKdLoc);
      mapFlags = mapFlags | (1 << 2);
    } else {
      mapFlags = mapFlags & ~(1 << 2);
    }
    if (material.map_Ks) {
      material.map_Ks.setup(this.mapKsLoc);
      mapFlags = mapFlags | (1 << 3);
    } else {
      mapFlags = mapFlags & ~(1 << 3);
    }
    if (material.map_Bump) {
      material.map_Bump.setup(this.mapBumpLoc);
      mapFlags = mapFlags | (1 << 4);
    } else {
      mapFlags = mapFlags & ~(1 << 4);
    }

    gl.uniform1i(this.mapFlagsLoc, mapFlags);
  }

  public draw() {
    const gl = this.gl;
    for (let mesh of this.meshs) {
      this.applyMaterial(mesh.materialIndex);
      gl.drawArrays(
          gl.TRIANGLES, mesh.startIndex, mesh.endIndex - mesh.startIndex);
    }
  }
}

export default Model;
