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

export class RippleMaterial extends THREE.ShaderMaterial {
  constructor({ uniforms, ...params}) {
    super();

    //this.isMeshStandardMaterial = true;
    //this.type = 'MeshStandardMaterial';
    this.defines = {
      STANDARD: '',
      USE_COLOR: '',
    };

    this.color = new THREE.Color(0xffffff);
    this.uniforms = THREE.UniformsUtils.merge([RippleShader.uniforms, uniforms]);
    this.vertexShader = RippleShader.vertex;
    this.fragmentShader = THREE.ShaderLib['standard'].fragmentShader,

    this.setValues(params);
  }
}
