#version 300 es

in vec3 a_Pos;

void main() { gl_Position = vec4(a_Pos, 1.0); }