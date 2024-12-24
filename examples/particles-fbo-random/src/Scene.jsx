import { useEffect, useRef, useMemo } from "react"
import { OrbitControls, useFBO } from "@react-three/drei"
import { Color, Vector3, Quaternion } from "three";
import * as THREE from "three"
import { useControls } from "leva"
import { useFrame, extend, createPortal } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import chroma from 'chroma-js';

import SimulationMaterial from './SimulationMaterial';
extend({ SimulationMaterial: SimulationMaterial });



const vertexShader = `
    uniform sampler2D uPositions;
    uniform float uTime;

    void main() {
    vec3 pos = texture2D(uPositions, position.xy).xyz;

    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    gl_PointSize = 3.0;
    // Size attenuation;
    gl_PointSize *= step(1.0 - (1.0/64.0), position.x) + 0.5;
}


`;
const fragmentShader =`
    void main() {
    vec3 color = vec3(0.34, 0.53, 0.96);
    gl_FragColor = vec4(color, 1.0);
    }
`;


const FBOParticles = () => {
    const size = 128; // FBO のサイズを定義（128x128）

    const points = useRef(); // パーティクルシステム（<points>）への参照
    const simulationMaterialRef = useRef(); // シミュレーション用マテリアルへの参照

    // シミュレーション用のシーンとカメラを作成
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1); // 正投影カメラを設定

    // 平面の頂点位置を定義（2つの三角形で構成）
    const positions = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]);

    // UV 座標（テクスチャマッピング用）を定義
    const uvs = new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]);

    // FBO (Frame Buffer Object) を初期化
    const renderTarget = useFBO(size, size, {
        minFilter: THREE.NearestFilter, // テクスチャの最小化フィルタ
        magFilter: THREE.NearestFilter, // テクスチャの拡大フィルタ
        format: THREE.RGBAFormat, // テクスチャのフォーマット
        stencilBuffer: false, // ステンシルバッファを無効化
        type: THREE.FloatType, // 浮動小数点数型データを使用
    });

    // パーティクルの初期位置を計算
    const particlesPosition = useMemo(() => {
        const length = size * size; // パーティクルの総数
        const particles = new Float32Array(length * 3); // 各パーティクルの x, y, z を格納
        for (let i = 0; i < length; i++) {
            let i3 = i * 3;
            particles[i3 + 0] = (i % size) / size; // x 座標を正規化
            particles[i3 + 1] = i / size / size; // y 座標を正規化
        }
        return particles;
    }, [size]);

    // Uniform を初期化
    const uniforms = useMemo(() => ({
        uPositions: {
            value: null, // パーティクル位置のテクスチャ
        }
    }), [])

    // 毎フレーム実行する処理
    useFrame((state) => {
        const { gl, clock } = state; // WebGL コンテキストと時間情報を取得

        // FBO に描画
        gl.setRenderTarget(renderTarget); // 現在の描画ターゲットを FBO に設定
        gl.clear(); // FBO をクリア
        gl.render(scene, camera); // シミュレーションシーンを描画
        gl.setRenderTarget(null); // 描画ターゲットをデフォルトに戻す

        // FBO のテクスチャをパーティクルのマテリアルに渡す
        points.current.material.uniforms.uPositions.value = renderTarget.texture;

        // シミュレーションマテリアルの時間を更新
        simulationMaterialRef.current.uniforms.uTime.value = clock.elapsedTime;
    });

    return (
        <>
            {/* シミュレーションパス用のシーンをポータルで作成 */}
            {createPortal(
                <mesh>
                    <simulationMaterial ref={simulationMaterialRef} args={[size]} />
                    <bufferGeometry>
                        {/* 平面の頂点位置をバッファ属性として設定 */}
                        <bufferAttribute
                            attach="attributes-position"
                            count={positions.length / 3}
                            array={positions}
                            itemSize={3}
                        />
                        {/* UV 座標をバッファ属性として設定 */}
                        <bufferAttribute
                            attach="attributes-uv"
                            count={uvs.length / 2}
                            array={uvs}
                            itemSize={2}
                        />
                    </bufferGeometry>
                </mesh>,
                scene // シミュレーションシーンに追加
            )}
            {/* パーティクルシステム */}
            <points ref={points}>
                <bufferGeometry>
                    {/* パーティクルの位置をバッファ属性として設定 */}
                    <bufferAttribute
                        attach="attributes-position"
                        count={particlesPosition.length / 3}
                        array={particlesPosition}
                        itemSize={3}
                    />
                </bufferGeometry>
                <shaderMaterial
                    blending={THREE.AdditiveBlending} // 加算合成を使用
                    depthWrite={false} // 深度バッファへの書き込みを無効化
                    fragmentShader={fragmentShader} // フラグメントシェーダーを設定
                    vertexShader={vertexShader} // バーテックスシェーダーを設定
                    uniforms={uniforms} // Uniform を渡す
                />
            </points>
        </>
    );
};



function Scene(){


    return (
        <>

            <OrbitControls />


            <ambientLight intensity={0.5} />
            <directionalLight position={[-1, 2, 2]} intensity={4} />

            <FBOParticles />


        </>
    )
}

export default Scene