#version 300 es

in vec3 a_Pos;

uniform mat4 projection;
uniform mat4 view;

void main() { gl_Position = projection * view * vec4(a_Pos, 1.0); }