
//SnowParticles.jsx
import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const SnowParticles = ({
    count = 2000,
    sizeRange = { min: 0, max: 0.2 },
    opacity = 0.8,
    fallSpeed = 0.005,
    position = { minZ: 0, maxZ: 1 },
    snowData, //imagedata化したsnowデータred値に0~255に正規化された雪の降雪量が入っている
    snowDataDimensions,
}) => {
    const pointsRef = useRef()
    const geometryRef = useRef()

    // particleSpeeds の初期化を useState callback で行う
    const [particleSpeeds] = useState(() => {
        const speeds = new Float32Array(count)
        for (let i = 0; i < count; i++) {
            speeds[i] = fallSpeed * (0.8 + Math.random() * 0.4)
        }
        return speeds
    })

    // snowDataから降雪量を取得する関数
    const getSnowAmount = (x, y) => {
        if (!snowData) return 0;

        // 座標をデータの配列インデックスに変換
        const px = Math.floor((x + 1) * 0.5 * snowDataDimensions.width);
        const py = Math.floor((-y + 1) * 0.5 * snowDataDimensions.height);

        // 座標が範囲外の場合、適切にラップアラウンド
        const wrappedPx = ((px % snowDataDimensions.width) + snowDataDimensions.width) % snowDataDimensions.width;
        const wrappedPy = ((py % snowDataDimensions.height) + snowDataDimensions.height) % snowDataDimensions.height;

        // データから値を取得
        const index = (wrappedPy * snowDataDimensions.width + wrappedPx) * 4;

        // 生のr値（0-255）を取得
        const rawValue = snowData.data[index];

        // r値が0の場合は-1を返す（特別な値として使用）
        if (rawValue < 10) return -1;

        // 降雪量の範囲を正規化
        const snowRange = snowDataDimensions.amaunt.max - snowDataDimensions.amaunt.min;
        const snowValue = (snowData.data[index] / 255) * snowRange + snowDataDimensions.amaunt.min;

        return snowValue;
    }

    // パーティクルサイズの計算も修正
    const calculateParticleSize = (snowAmount) => {
        // 降雪量をパーティクルサイズの範囲に正規化
        const normalizedValue = (snowAmount - snowDataDimensions.amaunt.min) / (snowDataDimensions.amaunt.max - snowDataDimensions.amaunt.min);
        return sizeRange.min + normalizedValue * (sizeRange.max - sizeRange.min);
    }


    const particles = useMemo(() => {
        const points = new Float32Array(count * 3)
        const colors = new Float32Array(count * 4)
        const sizes = new Float32Array(count)

        const aspectRatio = snowDataDimensions?.width / snowDataDimensions?.height || 2
        const xRange = aspectRatio
        const yRange = 1

        for (let i = 0; i < count; i++) {
            const x = (Math.random() * 2 - 1) * xRange
            const y = (Math.random() * 2 - 1) * yRange

            points[i * 3] = x
            points[i * 3 + 1] = y
            points[i * 3 + 2] = Math.random() * (position.maxZ - position.minZ) + position.minZ

            const snowAmount = getSnowAmount(x, y)

            colors[i * 4] = 1
            colors[i * 4 + 1] = 1
            colors[i * 4 + 2] = 1
            colors[i * 4 + 3] = snowAmount === -1 ? 0 : opacity

            sizes[i] = snowAmount === -1 ? 0 : calculateParticleSize(snowAmount)
        }

        return { points, colors, sizes }
    }, [count, position.maxZ, position.minZ, opacity, snowDataDimensions, sizeRange, snowData])


    const resetParticle = (positions, index, sizes, colors) => {
        if (!snowDataDimensions) return

        const aspectRatio = snowDataDimensions.width / snowDataDimensions.height
        const xRange = aspectRatio
        const yRange = 1

        const x = (Math.random() * 2 - 1) * xRange
        const y = (Math.random() * 2 - 1) * yRange

        positions[index * 3] = x
        positions[index * 3 + 1] = y
        positions[index * 3 + 2] = position.maxZ

        const snowAmount = getSnowAmount(x, y)

        if (colors) {  // colorsが存在することを確認
            colors[index * 4] = 1
            colors[index * 4 + 1] = 1
            colors[index * 4 + 2] = 1
            colors[index * 4 + 3] = snowAmount === -1 ? 0 : opacity
        }

        sizes[index] = snowAmount === -1 ? 0 : calculateParticleSize(snowAmount)
    }

    // デバッグ用のeffect
    useEffect(() => {
        if (geometryRef.current) {
            console.log("Geometry initialized:", {
                geometry: geometryRef.current,
                position: geometryRef.current.attributes.position,
                size: geometryRef.current.attributes.size
            });
        }
    }, [geometryRef.current]);

    useFrame(() => {
        if (!geometryRef.current) return

        const geometry = geometryRef.current
        const positions = geometry.attributes.position.array
        const sizes = geometry.attributes.size.array
        const colors = geometry.attributes.color.array  // color属性の配列を取得

        for (let i = 0; i < count; i++) {
            positions[i * 3 + 2] -= particleSpeeds[i]

            if (positions[i * 3 + 2] < position.minZ) {
                resetParticle(positions, i, sizes, colors)  // colorsを渡す
            }
        }

        geometry.attributes.position.needsUpdate = true
        geometry.attributes.size.needsUpdate = true
        geometry.attributes.color.needsUpdate = true
    })

    const shaderMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                pointTexture: { value: null },
            },
            vertexShader: `
                attribute float size;
                varying vec4 vColor;
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec4 vColor;
                void main() {
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    
                    // よりソフトなフェードアウト
                    float alpha = smoothstep(0.5, 0.35, dist);
                    
                    // 中心部分を明るく
                    float brightness = 1.0 - smoothstep(0.0, 0.4, dist);
                    vec3 color = vColor.rgb * (1.0 + brightness * 0.5);
                    
                    gl_FragColor = vec4(color, vColor.a * alpha);
                }
            `,
            transparent: true,
            depthTest: false,
            vertexColors: true,
        })
    }, [])

    return (
        <points ref={pointsRef}>
            <bufferGeometry ref={geometryRef}>
                <bufferAttribute
                    attach="attributes-position"
                    count={particles.points.length / 3}
                    array={particles.points}
                    itemSize={3}
                    usage={THREE.DynamicDrawUsage}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={particles.colors.length / 4}
                    array={particles.colors}
                    itemSize={4}
                />
                <bufferAttribute
                    attach="attributes-size"
                    count={particles.sizes.length}
                    array={particles.sizes}
                    itemSize={1}
                    usage={THREE.DynamicDrawUsage}
                />
            </bufferGeometry>
            <primitive object={shaderMaterial} />
        </points>
    )
}

export default SnowParticles