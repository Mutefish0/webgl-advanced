#version 300 es

in vec3 a_Pos;
in vec3 a_Norm;
in vec2 a_TexCoord;

uniform mat4 projection;
uniform mat4 model;
uniform mat4 view;

uniform lowp int mapFlags;
uniform sampler2D map_Bump;

out highp vec3 f_Pos;
out highp vec3 f_Norm;
out highp vec2 f_TexCoord;

bool test_bit(int src, int pos) { return (src & (1 << pos)) != 0; }

void main() {
  highp vec3 norm = a_Norm;
  if (test_bit(mapFlags, 4)) {
    norm = texture(map_Bump, a_TexCoord).rgb * 2.0 - 1.0;
  }
  f_TexCoord = a_TexCoord;
  f_Pos = vec3(model * vec4(a_Pos, 1.0));
  f_Norm = mat3(transpose(inverse(model))) * norm;
  gl_Position = projection * view * model * vec4(a_Pos, 1.0);
}