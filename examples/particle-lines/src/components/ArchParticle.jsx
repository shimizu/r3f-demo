
import { useEffect, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three"


const vertexShader = `
    uniform vec3 startColor;
    uniform vec3 endColor;

    varying vec3 vColor;
    attribute float progress;
    varying float vProgress;

    void main() {
        vProgress = progress; // 進行度をフラグメントシェーダーに渡す
        vColor = mix(startColor, endColor, vProgress); // 色を補間
        gl_PointSize = 5.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

const fragmentShader = `
    varying vec3 vColor;
    void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        gl_FragColor = vec4(vColor, 1.0);
    }

`


const ArchParicle = ({ count, start, end, height }) => {
    const points = useRef();
    const particleLayer = 1; // レイヤ番号

    // シェーダーマテリアル
    const particleShader = {
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
            startColor: { value: new THREE.Color(0xfafaccc) }, // A地点の色: 青
            endColor: { value: new THREE.Color(0xff0000) },   // B地点の色: 赤
        },
    };


    // A地点とB地点を結ぶ曲線を定義
    class ArchCurve extends THREE.Curve {
        constructor(start, end, height) {
            super();
            this.start = new THREE.Vector3(start[0], 0, start[1]);
            this.end = new THREE.Vector3(end[0], 0, end[1]);
            this.height = height;
        }

        getPoint(t) {
            // 線形補間でXとZを計算
            const x = THREE.MathUtils.lerp(this.start.x, this.end.x, t);
            const z = THREE.MathUtils.lerp(this.start.z, this.end.z, t);

            // 放物線の形状でYを計算
            const y = this.height * 4 * t * (1 - t); // 簡単なアーチ形状

            return new THREE.Vector3(x, y, z);
        }
    }

    // 曲線インスタンスを作成
    const path = new ArchCurve(start, end, height);

    // ランダムな初期位置を生成
    const generateRandomPoints = (curve, numPoints) => {
        const randomPoints = [];
        const initialProgress = [];
        const offsets = [];
        const speeds = []; // パーティクルごとの速度を保持
        for (let i = 0; i < numPoints; i++) {
            const t = Math.random(); // 初期進行度をランダムに設定
            const pointOnCurve = curve.getPoint(t);

            // チューブの半径範囲内でランダムなオフセットを生成
            const randomOffset = new THREE.Vector3(
                (Math.random() - 0.5) * 0.4, // X方向
                (Math.random() - 0.5) * 0.4, // Y方向
                (Math.random() - 0.5) * 0.4  // Z方向
            );

            randomPoints.push(pointOnCurve.clone().add(randomOffset));
            initialProgress.push(t);
            offsets.push(randomOffset);

            // 移動速度をランダムに設定 (0.05 ~ 0.15)
            speeds.push(0.05 + Math.random() * 0.2);
        }
        return { randomPoints, initialProgress, offsets, speeds };
    };

    // ランダムポイントと進行度を生成
    const { randomPoints, initialProgress, offsets, speeds } = generateRandomPoints(path, count);


    // バッファジオメトリ初期化
    useEffect(() => {
        const geometry = points.current.geometry;
        geometry.setAttribute(
            "progress",
            new THREE.BufferAttribute(new Float32Array(new Array(count).fill(0)), 1)
        );

    }, [count]);


    // アニメーション
    useFrame((state) => {
        const { clock } = state;

        const positions = points.current.geometry.attributes.position.array;
        const progress = points.current.geometry.attributes.progress.array;
        const time = clock.elapsedTime; // 経過時間を取得

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const t = (initialProgress[i] + time * speeds[i]) % 1; // 時間に基づく進行度
            const pointOnCurve = path.getPoint(t)

            // 初期のオフセットを加える
            const positionWithOffset = pointOnCurve.clone().add(offsets[i]);

            positions[i3] = positionWithOffset.x;
            positions[i3 + 1] = positionWithOffset.y;
            positions[i3 + 2] = positionWithOffset.z;
            progress[i] = t; // 進行度を格納
        }

        points.current.geometry.attributes.position.needsUpdate = true; // 更新を通知
        points.current.geometry.attributes.progress.needsUpdate = true;
    });

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    array={new Float32Array(
                        randomPoints.flatMap((p) => [p.x, p.y, p.z])
                    )}
                    count={randomPoints.length}
                    itemSize={3}
                />
            </bufferGeometry>
            <shaderMaterial
                args={[particleShader]}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                vertexColors
                transparent
            />
        </points>
    );
};

export default ArchParicle