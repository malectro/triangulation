#define PHYSICAL
varying vec3 vViewPosition;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

#define M_2_PI 6.283185307179586
#define MAX_RIPPLES 20
#define SECONDS_PER_CYCLE 2000.0;

struct Ripple {
  vec3 center;
  float magnitude;
  float decay;
  float speed;
  float radius;
  float start;
};

uniform float time;
uniform Ripple ripples[MAX_RIPPLES];
uniform int rippleLength;

vec3 GerstnerWave(vec4 wave, vec3 p) {
  float steepness = wave.z;
  float wavelength = wave.w;
  float k = 2.0 * PI / wavelength;
  float c = sqrt(9.8 / k);
  vec2 d = normalize(wave.xy);
  float f = k * (dot(d, p.xy) - c * time);
  float a = steepness / k;

  return vec3(
    d.x * (a * cos(f)),
    d.y * (a * cos(f)),
    a * sin(f)
  );
}

float rippleAttack = 20.0;

void main() {
	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>

#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
#endif

	#include <begin_vertex>

  Ripple ripple;
  vec3 rColor = vec3(0.0, 0.0, 0.0);
  for (int i = 0; i < MAX_RIPPLES; i++) {
    if (i < rippleLength) {
      ripple = ripples[i];
      float dist = distance(ripple.center, position);
      if (dist < ripple.radius) {
        float rippleTime = time - ripple.start;
        float radiansPerDistance = (rippleTime - dist / ripple.speed) / SECONDS_PER_CYCLE;
        rColor.x += sin(radiansPerDistance * PI) * ripple.magnitude;
        rColor.y += sin(radiansPerDistance * M_2_PI) * ripple.magnitude;
        rColor.z += cos(radiansPerDistance * M_2_PI) * ripple.magnitude;
        vec2 dir = normalize(ripple.center.xy - position.xy);
        /*
        transformed += GerstnerWave(
          //vec4(dir.x, dir.y, ripple.magnitude, ripple.speed),
          vec4(1, 1, 20, 5),
          position.xyz
        );
        */
        /*
        transformed.z +=
          sin(radiansPerDistance * M_2_PI) *
          20.0 *
          ripple.magnitude;
          */
        float amplitude = 20.0 * ripple.magnitude;
        float wavelength = radiansPerDistance * M_2_PI;

        float rampUp =  min((ripple.radius - dist) / rippleAttack, 1.0);

        transformed.xyz += vec3(
          rampUp * dir.x * amplitude * cos(wavelength),
          rampUp * dir.y * amplitude * cos(wavelength),
          amplitude * sin(wavelength)
        );
      }
    }
  }
  /*
  transformed += GerstnerWave(
    //vec4(dir.x, dir.y, ripple.magnitude, ripple.speed),
    vec4(1, 1, 0.4, 10),
    position.xyz
  );
  */
  //vColor.xyz += (rColor.xyz * 0.5);
  vColor.xyz = color.xyz + (transformed.z / 20.0);

  #include <displacementmap_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

  vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>
	#include <shadowmap_vertex>
}
