#version 300 es

out mediump vec4 fragColor;

void main() {
  mediump vec3 lightColor = vec3(1, 1, 1);
  mediump vec3 ambient = lightColor * 0.1; // 取白光强度的0.1为环境光照
  mediump vec3 object = vec3(0, 1, 0);
  fragColor = vec4(ambient * object, 1);
}