#version 300 es

in vec3 a_Pos;
in vec2 tex_Coord;
in vec3 a_Norm;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;

uniform sampler2D bump;
uniform lowp int mapStatus;

out vec2 f_tex_Coord;
out highp vec3 f_a_Norm;
out vec3 f_Pos;
out vec3 f_View_Pos;

void main() {
  f_tex_Coord = tex_Coord;
  gl_Position = projection * view * model * vec4(a_Pos, 1.0);
  f_Pos = vec3(model * vec4(a_Pos, 1.0));
  f_View_Pos = vec3(view * vec4(0, 0, 0, 1));

  highp vec3 norm = a_Norm;

  if ((mapStatus & (1 << 4)) != 0) {
    norm = texture(bump, f_tex_Coord).rgb;
    norm = normalize(norm * 2.0 - 1.0);
  }

  f_a_Norm = mat3(transpose(inverse(model))) * norm;
}