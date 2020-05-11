
#include <emscripten.h>

#include "tinyobj_loader_c.h"

#define TINYOBJ_LOADER_C_IMPLEMENTATION

EMSCRIPTEN_KEEPALIVE
int tinyobj_parse_obj(tinyobj_attrib_t* attrib, const char* buf, size_t len);

EMSCRIPTEN_KEEPALIVE
void tinyobj_attrib_free(tinyobj_attrib_t* attrib);

EMSCRIPTEN_KEEPALIVE
int get_attr_size() { return sizeof(tinyobj_attrib_t); }

EMSCRIPTEN_KEEPALIVE
unsigned long* get_vertices_slice(tinyobj_attrib_t* attrib) {
  unsigned long arr[2] = {};
  arr[0] = attrib->vertices;
  arr[1] = arr[0] + attrib->num_vertices * 3 * sizeof(float);
  return arr;
}

EMSCRIPTEN_KEEPALIVE
unsigned long* get_texcoords_slice(tinyobj_attrib_t* attrib) {
  unsigned long arr[2] = {};
  arr[0] = attrib->texcoords;
  arr[1] = arr[0] + attrib->num_texcoords * 2 * sizeof(float);
  return arr;
}

EMSCRIPTEN_KEEPALIVE
unsigned long* get_normals_slice(tinyobj_attrib_t* attrib) {
  unsigned long arr[2] = {};
  arr[0] = attrib->normals;
  arr[1] = arr[0] + attrib->num_normals * 3 * sizeof(float);
  return arr;
}

EMSCRIPTEN_KEEPALIVE
char* get_material_lib(tinyobj_attrib_t* attrib) {
  return attrib->material_lib;
}

EMSCRIPTEN_KEEPALIVE
unsigned long* get_material_stops_slice(tinyobj_attrib_t* attrib) {
  unsigned long arr[2] = {};
  arr[0] = attrib->material_stops;
  arr[1] = arr[0] + attrib->num_material_stops * (80 + sizeof(unsigned long));
  return arr;
}

EMSCRIPTEN_KEEPALIVE
unsigned long* get_combined_vertices_slice(tinyobj_attrib_t* attrib) {
  unsigned int num_faces = attrib->num_faces;
  unsigned long arr[2] = {};
  arr[0] = attrib->combined_vertices;
  arr[1] = arr[0] + 32 * num_faces;
  return arr;
}

// int main() {
//   int fd =
//   open("/Users/yifan/study/webgl-advanced/public/models/9/index.obj",
//                 O_RDONLY);
//   struct stat sbuf;
//   fstat(fd, &sbuf);
//   printf("file size: %d\n", sbuf.st_size);

//   char* src = malloc(sbuf.st_size);

//   read(fd, src, sbuf.st_size);

//   tinyobj_attrib_t attrib;

//   tinyobj_parse_obj(&attrib, src, sbuf.st_size);

//   get_combined_vertices_slice(&attrib);

//   get_material_stops_slice(&attrib);

//   get_material_lib(&attrib);

//   printf("num_vertex: %u\n", attrib.num_vertices);

//   tinyobj_attrib_free(&attrib);

//   close(fd);
// }