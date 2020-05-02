#version 300 es

in highp vec3 f_Pos;
in highp vec3 f_Norm;
in highp vec2 f_TexCoord;

out mediump vec4 fragColor;

uniform lowp int illum;
uniform lowp int mapFlags;
uniform lowp vec3 Ka;
uniform lowp vec3 Kd;
uniform lowp vec3 Ks;
uniform lowp float Ns;
uniform sampler2D map_Kd;
uniform sampler2D map_Ks;

bool test_bit(int src, int pos) { return (src & (1 << pos)) != 0; }

void main() {
  mediump vec3 lightColor = vec3(1, 1, 1);
  highp vec3 lightPos = vec3(0, 0.5, 100);
  highp vec3 viewPos = vec3(0, -0.5, 2);

  mediump vec3 ambient = Ka * lightColor * 0.1;

  mediump vec3 objectColor = vec3(0.2, 0.8, 0.2);
  mediump vec3 specularColor = vec3(1.0, 1.0, 1.0);

  if (test_bit(mapFlags, 2)) {
    objectColor = texture(map_Kd, f_TexCoord).rgb;
  }
  if (test_bit(mapFlags, 3)) {
    specularColor = texture(map_Ks, f_TexCoord).rgb;
  }

  mediump vec3 n = normalize(f_Norm);
  mediump vec3 l = normalize(lightPos - f_Pos);

  mediump float cosTheta = max(dot(n, l), 0.0);
  mediump vec3 diffuse = Kd * cosTheta * lightColor * objectColor;

  // specular
  highp vec3 v = normalize(viewPos - f_Pos);
  highp vec3 r = reflect(-l, f_Norm);
  mediump float spec = pow(max(dot(v, r), 0.0), Ns);
  mediump vec3 specular = Ks * spec * specularColor * lightColor * objectColor;

  if (illum == 0) {
    fragColor = vec4(Kd, 1.0);
  } else if (illum == 1) {
    fragColor = vec4(ambient * objectColor + diffuse, 1.0);
  } else if (illum == 2) {
    fragColor = vec4(ambient * objectColor + diffuse + specular, 1.0);
  }
}