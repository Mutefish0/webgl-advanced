export function getWebGLContext(selector: string) {
  const canvas = document.querySelector(selector) as HTMLCanvasElement;
  let gl;

  if (canvas && window.WebGL2RenderingContext) {
    gl = canvas.getContext('webgl2');
    if (gl) {
      //glExtensions = gl.getSupportedExtensions();
    } else {
      alert('WebGL功能被关闭');
      throw new Error('WebGL功能被关闭');
    }
  } else {
    alert('当前浏览器不支持WebGL');
    throw new Error('当前浏览器不支持WebGL');
  }

  return gl;
}
