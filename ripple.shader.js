import vert from './ripple.vert';

THREE.RippleShader = {
  get uniforms() {
    return Object.assign(
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
          values: 0,
        },
        time: {
          value: 0,
        },
      },
    );
  },

  vertex: vert,
  fragment: THREE.ShaderLib['standard'].fragmentShader,
};
