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

void main() {
	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>

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
      }
    }
  }
  vColor.xyz += (rColor.xyz * 0.5);

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
#endif
	#include <begin_vertex>

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