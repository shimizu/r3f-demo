import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

const OffScreenMaterial = shaderMaterial(
    {
        bufferTexture: { value: null },
        res: { value: new THREE.Vector2(0, 0) },
        smokeSource: { value: new THREE.Vector3(0, 0, 0) }
    },
  // vertex shader
  /*glsl*/ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // fragment shader
  /*glsl*/ `
    uniform vec2 res;
    uniform sampler2D bufferTexture;
    uniform vec3 smokeSource;
    varying vec2 vUv;

    void main() {
      vec2 pixel = vUv;
      gl_FragColor = texture2D(bufferTexture, gl_FragCoord.xy / res.xy);

      // 現在のピクセルと煙のソースとの距離を計算
      float dist = distance(pixel * res.xy, smokeSource.xy * res.xy);
      gl_FragColor.rgb += smokeSource.z * max(10.0 - dist, 0.0);

      // 煙の拡散計算
      vec4 rightColor = texture2D(bufferTexture, vec2(pixel.x + 1.0/res.x, pixel.y));
      vec4 leftColor = texture2D(bufferTexture, vec2(pixel.x - 1.0/res.x, pixel.y));
      vec4 upColor = texture2D(bufferTexture, vec2(pixel.x, pixel.y + 1.0/res.y));
      vec4 downColor = texture2D(bufferTexture, vec2(pixel.x, pixel.y - 1.0/res.y));

      // 拡散方程式
      float factor = 8.0 * 0.016 * (
        leftColor.r + 
        rightColor.r + 
        downColor.r * 3.0 + 
        upColor.r - 
        6.0 * gl_FragColor.r
      );

      // テクセルの低精度を考慮
      float minimum = 0.000003;
      if (factor >= -minimum && factor < -0.10) factor = -minimum;

      gl_FragColor.rgb += factor;
    }
  `
)

extend({ OffScreenMaterial })

export { OffScreenMaterial }