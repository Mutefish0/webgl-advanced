import { mat4, quat, vec3 } from 'gl-matrix';

import Model from './model';
import Shader from './shader';
import { getWebGLContext } from './util';

const gl = getWebGLContext('#canv');

const tutorial = location.search.slice(-1) || 1;

const shader = new Shader(gl, `/shaders/${tutorial}/index.vs`, `/shaders/${tutorial}/index.fs`);
const model = new Model(gl, `/models/${tutorial}/index.obj`);

Promise.all([shader.load(), model.load()]).then(() => {
  shader.compile();
  shader.link();
  shader.useProgram();

  shader.projection(0.1, 50.0, 45, 0.75);

  const modelMatrix = mat4.create();

  const qMatrix = mat4.create();
  const finalModelMatrix = mat4.create();

  const q = quat.create();
  quat.rotateX(q, q, Math.PI / 3);
  const tempqm = mat4.create();
  mat4.fromQuat(tempqm, q);
  mat4.multiply(qMatrix, qMatrix, tempqm);

  shader.model(mat4.multiply(finalModelMatrix, modelMatrix, qMatrix));

  const viewMatrix = mat4.create();
  mat4.translate(viewMatrix, viewMatrix, [0, 0, -4]);
  shader.view(viewMatrix);

  model.setup(shader);

  let frameCount = 0;
  const fpsEl = document.getElementById('fps') as HTMLElement;
  const canvasEl = document.getElementById('canv');

  setInterval(function() {
    fpsEl.innerText = 'FPS: ' + frameCount;
    frameCount = 0;
  }, 1000);

  function frameStep() {
    // 先填充背景
    gl.clearColor(0.2745, 0.2745, 0.2745, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    model.draw();
    frameCount += 1;
    window.requestAnimationFrame(frameStep);
  }

  let isControlled = false;
  let isShifted = false;
  let pBuffer: [number, number][] = [];
  const bufferSize = 4;

  window.addEventListener('keydown', (e) => {
    if (e.which === 17) {
      isControlled = true;
    } else if (e.which === 16) {
      isShifted = true;
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.which === 17) {
      isControlled = false;
      pBuffer = [];
    } else if (e.which == 16) {
      isShifted = false;
      pBuffer = [];
    }
  });

  canvasEl?.addEventListener('mousemove', (e) => {
    if (isControlled) {
      pBuffer.push([e.offsetX, e.offsetY]);

      if (pBuffer.length >= bufferSize) {
        let dx = pBuffer[pBuffer.length - 1][0] - pBuffer[0][0];
        let dy = pBuffer[pBuffer.length - 1][1] - pBuffer[0][1];

        const v = vec3.fromValues(dx, -dy, 0);
        const norm = vec3.fromValues(dy, dx, 0);
        const rqMatrix = mat4.create();

        vec3.transformMat4(norm, norm, mat4.invert(rqMatrix, qMatrix));
        vec3.normalize(norm, norm);

        const signVec = vec3.create();
        vec3.cross(signVec, v, norm);

        const sign = signVec[2] > 0 ? 1 : -1;

        const distance = vec3.len(v);
        const tempq = quat.create();
        const tempMat = mat4.create();

        quat.setAxisAngle(tempq, norm, sign * (distance / 400) * 2 * Math.PI);
        mat4.fromQuat(tempMat, tempq);

        mat4.multiply(qMatrix, qMatrix, tempMat);

        shader.model(mat4.multiply(finalModelMatrix, modelMatrix, qMatrix));

        pBuffer = [];
      }
    } else if (isShifted) {
      pBuffer.push([e.offsetX, e.offsetY]);
      if (pBuffer.length >= bufferSize) {
        let dx = pBuffer[pBuffer.length - 1][0] - pBuffer[0][0];
        let dy = pBuffer[pBuffer.length - 1][1] - pBuffer[0][1];

        if (Math.abs(dx) < Math.abs(dy)) {
          dx = dy;
        }

        mat4.translate(viewMatrix, viewMatrix, [0, 0, dx / 30]);
        shader.view(viewMatrix);

        pBuffer = [];
      }
    }
  });

  frameStep();
});
