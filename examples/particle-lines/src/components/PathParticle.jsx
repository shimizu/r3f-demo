import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

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
`;

const fragmentShader = `
    varying vec3 vColor;
    void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        gl_FragColor = vec4(vColor, 1.0);
    }
`;

const PathParticle = ({ pathPointList, count }) => {
    const points = useRef();

    // シェーダーマテリアル
    const particleShader = {
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
            startColor: { value: new THREE.Color(0x00ff00) }, // 開始色
            endColor: { value: new THREE.Color(0xff0000) },   // 終了色
        },
    };

    // パスセグメントを準備
    const segments = pathPointList.map((point, index, arr) => {
        if (index === arr.length - 1) return null;
        return {
            start: new THREE.Vector3(...arr[index]),
            end: new THREE.Vector3(...arr[index + 1]),
            length: new THREE.Vector3(...arr[index]).distanceTo(new THREE.Vector3(...arr[index + 1]))
        };
    }).filter(Boolean); // 最後のnullを除去

    const totalLength = segments.reduce((acc, seg) => acc + seg.length, 0);

    // ランダムな初期位置を生成
    const generateRandomPoints = (numPoints) => {
        const initialProgress = [];
        const offsets = [];
        const speeds = []; // パーティクルごとの速度を保持

        for (let i = 0; i < numPoints; i++) {
            const t = Math.random(); // 初期進行度をランダムに設定
            initialProgress.push(t);
            offsets.push(new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            ));
            speeds.push(0.05 + Math.random() * 0.2);
        }
        return { initialProgress, offsets, speeds };
    };

    // ランダムポイントと進行度を生成
    const { initialProgress, offsets, speeds } = generateRandomPoints(count);

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
            let t = (initialProgress[i] + time * speeds[i]) % 1; // 時間に基づく進行度
            let distance = t * totalLength;

            // 現在のセグメントを計算
            let segmentIndex = 0;
            while (distance > segments[segmentIndex].length) {
                distance -= segments[segmentIndex].length;
                segmentIndex++;
            }

            const segment = segments[segmentIndex];
            const segmentProgress = distance / segment.length;

            // セグメント上の位置を計算
            const pointOnSegment = segment.start.clone().lerp(segment.end, segmentProgress);

            // オフセットを加える
            const positionWithOffset = pointOnSegment.clone().add(offsets[i]);

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
                    array={new Float32Array(count * 3).fill(0)}
                    count={count}
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

export default PathParticle;
