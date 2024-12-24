import * as THREE from "three";


// 頂点シェーダー: ジオメトリの座標変換を処理
const simulationVertexShader = `
  varying vec2 vUv;

  void main() {
      vUv = uv;

      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectedPosition = projectionMatrix * viewPosition;

      gl_Position = projectedPosition;
  }
`;


const simulationFragmentShader = `
uniform sampler2D positionsA;
uniform float uTime;
uniform vec3 uPointA;
uniform vec3 uPointB;
uniform float uSpeed;
uniform float uCylinderRadius;

varying vec2 vUv;

void main() {
    vec3 currentPosition = texture2D(positionsA, vUv).rgb;

    // A地点からB地点への方向ベクトル
    vec3 direction = normalize(uPointB - uPointA);

    // 新しい位置を計算 (移動距離 = 速度 * 時間)
    vec3 newPosition = currentPosition + direction * uSpeed;

    // B地点を超えたらA地点に戻す
    if (dot(normalize(newPosition - uPointA), direction) > dot(normalize(uPointB - uPointA), direction)) {
        newPosition = uPointA;
    }

    // 円筒の内側に留める処理 (簡易的な実装)
    vec2 toCenter = vec2(newPosition.x, newPosition.z);
    if (length(toCenter) > uCylinderRadius) {
        newPosition.x = currentPosition.x;
        newPosition.z = currentPosition.z;
    }

    gl_FragColor = vec4(newPosition, 1.0);
}
`;


const getRandomDataCylinder = (width, height, pointA, pointB) => {
  const length = width * height * 4;
  const data = new Float32Array(length);
  const abVector = new THREE.Vector3().subVectors(pointB, pointA);

  for (let i = 0; i < length; i++) {
    const stride = i * 4;
    const t = Math.random(); // 0から1のランダムな値
    const randomPos = new THREE.Vector3().copy(pointA).add(abVector.clone().multiplyScalar(t));
    data[stride] = randomPos.x;
    data[stride + 1] = randomPos.y;
    data[stride + 2] = randomPos.z;
    data[stride + 3] = 1.0;
  }
  return data;
};

class SimulationMaterial extends THREE.ShaderMaterial {
  constructor(size) {
    const aPoint = new THREE.Vector3(10, 0, 0); // A地点
    const bPoint = new THREE.Vector3(-10, 0, 0); // B地点
    const length = bPoint.clone().sub(aPoint).length();

    const positionsTextureA = new THREE.DataTexture(
      getRandomDataCylinder(size, size, aPoint, bPoint), // 新しい関数
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    positionsTextureA.needsUpdate = true;


    const simulationUniforms = {
      positionsA: { value: positionsTextureA },
      uA: { value: aPoint },
      uB: { value: bPoint },
      uSpeed: { value: 0.5 }, // 速度を調整
      uLength: { value: length },
      uTime: { value: 0 },
    };

    super({
      uniforms: simulationUniforms,
      vertexShader: simulationVertexShader,
      fragmentShader: simulationFragmentShader,
    });
  }
}

export default SimulationMaterial;