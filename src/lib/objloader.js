/**
 * compile args
 * emcc tinyobj_loader.c -s EXTRA_EXPORTED_RUNTIME_METHODS="['cwrap', 'stringToUTF8', 'UTF8ToString']" -s EXPORTED_FUNCTIONS="['_get_attr_size', '_tinyobj_attrib_free', '_tinyobj_parse_obj', '_get_material_lib', '_get_material_stops_slice', '_get_combined_vertices_slice']" -s MODULARIZE=1 -s ENVIRONMENT=web -s INITIAL_MEMORY=33554432 -o wamod.js
 */
import WAModule from './wamod';

const wamodule = WAModule();

const getAttrSize = wamodule.cwrap('get_attr_size', 'number', []);
const tinyobjAttribFree = wamodule.cwrap('tinyobj_attrib_free', null, ['number']);
const tinyobjParseObj = wamodule.cwrap('tinyobj_parse_obj', null, ['number', 'number', 'number']);
const getCombinedVerticesSlice = wamodule.cwrap('get_combined_vertices_slice', 'number', [
  'number',
]);
const getMaterialStopsSlice = wamodule.cwrap('get_material_stops_slice', 'number', ['number']);
const getMaterialLib = wamodule.cwrap('get_material_lib', 'string', ['number']);

const initializedPromise = new Promise((resolve) => {
  wamodule['onRuntimeInitialized'] = function() {
    resolve();
  };
});

function parse(src) {
  const srcLen = src.length;
  const attrSize = getAttrSize();
  const attrBuf = wamodule._malloc(attrSize);

  const srcBuf = wamodule._malloc(srcLen + 1);
  wamodule.stringToUTF8(src, srcBuf, srcLen);

  tinyobjParseObj(attrBuf, srcBuf, srcLen);

  wamodule._free(srcBuf);
  tinyobjAttribFree(attrBuf);

  return attrBuf;
}

function free(attrBuf) {
  wamodule._free(attrBuf);
}

function getCombinedVerticesBufferSlice(attrBuf) {
  const p = getCombinedVerticesSlice(attrBuf);
  const view = new DataView(wamodule.HEAP8.buffer);
  return [view.getUint32(p, true), view.getUint32(p + 4, true)];
}

function getMaterialStops(attrBuf) {
  const p = getMaterialStopsSlice(attrBuf);
  const view = new DataView(wamodule.HEAP8.buffer);
  const slice = [view.getUint32(p, true), view.getUint32(p + 4, true)];

  const total = (slice[1] - slice[0]) / 84;
  const result = [];
  for (let i = 0; i < total; i++) {
    result.push({
      index: view.getUint32(slice[0] + i * 84, true),
      material: wamodule.UTF8ToString(slice[0] + i * 84 + 4, 80),
    });
  }
  return result;
}

function parseOBJ(src) {
  const ptr = parse(src);
  const combinedVerticesSlice = getCombinedVerticesBufferSlice(ptr);

  const mtlstops = getMaterialStops(ptr);
  const mtllibs = [getMaterialLib(ptr)];

  const vertices = new Float32Array(
    wamodule.HEAP8.buffer.slice(combinedVerticesSlice[0], combinedVerticesSlice[1])
  );

  free(ptr);

  return { vertices, mtllibs, mtlstops };
}

export default function getObjLoader() {
  return initializedPromise.then(() => ({
    parseOBJ,
  }));
}
