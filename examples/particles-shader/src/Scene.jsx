import { useEffect, useRef, useMemo } from "react"
import { OrbitControls, RandomizedLight } from "@react-three/drei"
import { Color, Vector3, Quaternion } from "three";
import * as THREE from "three"
import { useControls } from "leva"
import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import chroma from 'chroma-js';


const vertexShader = `
uniform float uTime; // 時間の経過を表すユニフォーム変数
uniform float uRadius; // エフェクトに影響を与える半径のユニフォーム変数

varying float vDistance;

// Y軸周りの3D回転行列を生成する関数
// 出典: https://github.com/dmnsgn/glsl-rotate/blob/main/rotation-3d-y.glsl.js
mat3 rotation3dY(float angle) {
  float s = sin(angle); // 角度のサイン値を計算
  float c = cos(angle); // 角度のコサイン値を計算
  return mat3(
    c, 0.0, -s,  // 第1行: X, Z成分の回転を表す
    0.0, 1.0, 0.0, // 第2行: Y軸（固定軸）
    s, 0.0, c    // 第3行: Z, X成分の回転を表す
  );
}

void main() {
    // 頂点の位置と中心点の距離からエフェクトの強度を計算
    float distanceFactor = pow(uRadius - distance(position, vec3(0.0)), 1.5);
    //フラグメントシェーダーにわたす
    vDistance = distanceFactor;

    //パーティクルのサイズ
    float size = distanceFactor * 10.0 + 10.0;


    // 頂点位置に回転を適用。時間と距離に応じた回転速度を設定
    vec3 particlePosition = position * rotation3dY(uTime * 0.3 * distanceFactor);

    // モデル座標系からワールド座標系への変換
    vec4 modelPosition = modelMatrix * vec4(particlePosition, 1.0);

    // ワールド座標系からビュー座標系への変換
    vec4 viewPosition = viewMatrix * modelPosition;

    // ビュー座標系からクリップ座標系への変換（最終的な頂点位置）
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition; // 頂点位置をシェーダーに出力

     gl_PointSize = size;
    gl_PointSize = size * (1.0 / - viewPosition.z);
}


`;
const fragmentShader =`
varying float vDistance;

void main() {
    vec3 color = vec3(0.34, 0.53, 0.96);
    // ピクセルの位置がパーティクルの中心に近いほど大きくなる強度変数を作成する。
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = 1.0 - strength;
    // 3の累乗を使うことで、中心から離れるほど強さが*速く*減少するようにする。
    strength = pow(strength, 3.0);


    color = mix(color, vec3(0.97, 0.70, 0.45), vDistance * 0.5);

    // パーティクルの中心付近でのみ色が見えるようにする。
    color = mix(vec3(0.0), color, strength);

    gl_FragColor = vec4(color, strength);
}
`;

const CustomGeometryParticles = (props) => {
    const { count } = props; // 粒子の数と形状（box または sphere）を取得
    const radius = 1; //パーティクルの半径

    // この参照により points に直接アクセス可能
    const points = useRef();

    // 粒子の位置を生成する配列を作成
    const particlesPosition = useMemo(() => {
        const positions = new Float32Array(count * 3); // 各粒子の x, y, z 座標を保持


        // sphere の場合、ランダムな球面上の位置を生成
        //const distance = 1; // 球の半径

        for (let i = 0; i < count; i++) {
            const distance = Math.sqrt(Math.random()) * radius;
            const theta = THREE.MathUtils.randFloatSpread(360); // ランダムな緯度角度（度単位）
            const phi = THREE.MathUtils.randFloatSpread(360); // ランダムな経度角度（度単位）

            let x = distance * Math.sin(theta) * Math.cos(phi); // 球面上の x 座標
            let y = distance * Math.sin(theta) * Math.sin(phi); // 球面上の y 座標
            let z = distance * Math.cos(theta); // 球面上の z 座標

            positions.set([x, y, z], i * 3); // 配列に位置をセット
        }
        

        return positions; // 生成された位置配列を返す
    }, [count]); // count または shape が変更されたときに再計算


    const uniforms = useMemo(() => ({
        uTime: {
            value: 0.0
        },
        uRadius: {
            value: radius
        }        
        // その他の属性をここに追加する
    }), [])


    useFrame((state) => {
        const { clock } = state;

        points.current.material.uniforms.uTime.value = clock.elapsedTime;
    });

    return (
        <points ref={points}>
            {/* ジオメトリをバッファとして設定 */}
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position" // Three.js の position 属性に関連付け
                    count={particlesPosition.length / 3} // 粒子の数
                    array={particlesPosition} // 粒子の位置データ
                    itemSize={3} // 各粒子のデータ数（x, y, z）
                />
            </bufferGeometry>
            {/* 粒子の外観を設定 */}
            <shaderMaterial
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                fragmentShader={fragmentShader}
                vertexShader={vertexShader}
                uniforms={uniforms}
            />
        </points>
    );
};



function Scene(){


    return (
        <>

            <OrbitControls />


            <ambientLight intensity={0.5} />
            <directionalLight position={[-1, 2, 2]} intensity={4} />

            <CustomGeometryParticles count={4000} />


        </>
    )
}

export default Scene