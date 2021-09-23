import * as THREE from 'three';
import vert from './ripple.vert';

export const RippleShader = {
  get uniforms() {
    return THREE.UniformsUtils.merge([
      THREE.UniformsUtils.clone(THREE.ShaderLib['standard'].uniforms),
      {
        ripples: {
          properties: {
            center: {},
            magnitude: {},
            decay: {},
            speed: {},
            radius: {},
            start: {},
          },
          value: [],
        },
        rippleLength: {
          value: 0,
        },
        time: {
          value: 0,
        },
      },
    ]);
  },

  vertex: vert,
  fragment: THREE.ShaderLib['standard'].fragmentShader,
};
