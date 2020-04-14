#version 300 es

in highp vec3 f_Pos;
in highp vec3 f_Norm;

out mediump vec4 fragColor;

void main() {
  mediump vec3 lightColor = vec3(1, 1, 1);
  highp vec3 lightPos = vec3(0, 0.5, 100);

  mediump vec3 ambient = lightColor * 0.1; // 取白光强度的0.1为环境光照
  mediump vec3 object = vec3(0, 1, 0);

  mediump vec3 n = normalize(f_Norm);
  mediump vec3 l = normalize(lightPos - f_Pos);
  mediump float cosTheta = max(dot(n, l), 0.0);
  mediump vec3 diffuse = cosTheta * lightColor * object;

  fragColor = vec4(ambient * object + diffuse, 1);
}