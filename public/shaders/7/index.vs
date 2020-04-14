#version 300 es

in vec3 a_Pos;
in vec3 a_Norm;

uniform mat4 projection;
uniform mat4 model;
uniform mat4 view;

out highp vec3 f_Pos;
out highp vec3 f_Norm;

void main() {
  f_Pos = vec3(model * vec4(a_Pos, 1.0));
  f_Norm = mat3(transpose(inverse(model))) * a_Norm;
  gl_Position = projection * view * model * vec4(a_Pos, 1.0);
}