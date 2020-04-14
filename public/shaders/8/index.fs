#version 300 es

uniform lowp int illum;
uniform lowp int mapStatus;
uniform lowp vec3 Ka;
uniform lowp vec3 Kd;
uniform lowp vec3 Ks;
uniform lowp float Ns;

uniform sampler2D diffuseColor;
uniform sampler2D specularColor;

in mediump vec2 f_tex_Coord;
in highp vec3 f_a_Norm;
in highp vec3 f_Pos;

out mediump vec4 fragColor;

void main() {
  lowp vec3 lightColor = vec3(1, 1, 1);
  mediump vec3 lightPos = vec3(0, 0.5, 100);
  mediump vec3 f_View_Pos = vec3(0, -0.5, 2);

  lowp vec3 f_diffuseColor = (mapStatus & (1 << 2)) != 0
                                 ? vec3(texture(diffuseColor, f_tex_Coord))
                                 : vec3(1, 1, 1);
  lowp vec3 f_specularColor = (mapStatus & (1 << 3)) != 0
                                  ? vec3(texture(specularColor, f_tex_Coord))
                                  : vec3(1, 1, 1);

  lowp float ambientStrength = 0.1;
  lowp vec3 ambientColor = vec3(1, 1, 1);

  // diffuse
  mediump vec3 norm = normalize(f_a_Norm);
  mediump vec3 lightDir = normalize(lightPos - f_Pos);
  mediump float diff = max(dot(norm, lightDir), 0.0);
  mediump vec3 diffuse = diff * lightColor;

  // specular
  highp vec3 viewDir = normalize(f_View_Pos - f_Pos);
  highp vec3 reflectDir = reflect(-lightDir, f_a_Norm);
  mediump float spec = pow(max(dot(viewDir, reflectDir), 0.0), Ns);
  mediump vec3 specular = spec * lightColor;

  if (0 == illum) {
    fragColor = vec4(Kd, 1.0);
  } else if (1 == illum) {
    fragColor = vec4(
        Ka * ambientStrength * lightColor + Kd * f_diffuseColor * diffuse, 1.0);
  } else {
    fragColor =
        vec4((Ka * ambientStrength * lightColor +
              Kd * f_diffuseColor * diffuse + Ks * f_specularColor * specular),
             1.0);
  }
}