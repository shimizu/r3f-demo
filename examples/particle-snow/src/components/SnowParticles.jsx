import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const SnowParticles = ({
    count = 2000,
    sizeRange = { min: 0, max: 0.2 },
    opacity = 0.8,
    baseFallSpeed = 0.005,
    maxFallSpeed = 0.015,
    position = { minZ: 0, maxZ: 1 },
    snowData,
    snowDataDimensions,
    densityControl = {
        min: 0.2,  // 最小密度（snowAmountが最小の時）
        max: 4.0   // 最大密度（snowAmountが最大の時）
    }
}) => {
    const pointsRef = useRef()
    const geometryRef = useRef()

    // 降雪量から密度を計算する関数
    const calculateDensity = (snowAmount) => {
        if (snowAmount === -1) return 0;

        const normalizedValue = (snowAmount - snowDataDimensions.amaunt.min) /
            (snowDataDimensions.amaunt.max - snowDataDimensions.amaunt.min);

        // 密度を設定された範囲内に収める
        return densityControl.min +
            (densityControl.max - densityControl.min) * normalizedValue;
    }

    const [particleSpeeds] = useState(() => {
        const speeds = new Float32Array(count)
        for (let i = 0; i < count; i++) {
            speeds[i] = baseFallSpeed * (0.8 + Math.random() * 0.4)
        }
        return speeds
    })

    const getSnowAmount = (x, y) => {
        if (!snowData) return 0;

        const px = Math.floor((x + 1) * 0.5 * snowDataDimensions.width);
        const py = Math.floor((-y + 1) * 0.5 * snowDataDimensions.height);

        const wrappedPx = ((px % snowDataDimensions.width) + snowDataDimensions.width) % snowDataDimensions.width;
        const wrappedPy = ((py % snowDataDimensions.height) + snowDataDimensions.height) % snowDataDimensions.height;

        const index = (wrappedPy * snowDataDimensions.width + wrappedPx) * 4;
        const rawValue = snowData.data[index];

        if (rawValue <= 0) return -1;

        const snowRange = snowDataDimensions.amaunt.max - snowDataDimensions.amaunt.min;
        const snowValue = (rawValue / 255) * snowRange + snowDataDimensions.amaunt.min;

        return snowValue;
    }

    const calculateParticleSpeed = (snowAmount) => {
        if (snowAmount === -1) return baseFallSpeed;

        const normalizedValue = (snowAmount - snowDataDimensions.amaunt.min) /
            (snowDataDimensions.amaunt.max - snowDataDimensions.amaunt.min);

        return baseFallSpeed + (maxFallSpeed - baseFallSpeed) * normalizedValue;
    }

    const calculateParticleSize = (snowAmount) => {
        const normalizedValue = (snowAmount - snowDataDimensions.amaunt.min) /
            (snowDataDimensions.amaunt.max - snowDataDimensions.amaunt.min);
        return sizeRange.min + normalizedValue * (sizeRange.max - sizeRange.min);
    }

    const particles = useMemo(() => {
        const points = new Float32Array(count * 3)
        const colors = new Float32Array(count * 4)
        const sizes = new Float32Array(count)
        const speeds = new Float32Array(count)

        const aspectRatio = snowDataDimensions?.width / snowDataDimensions?.height || 2
        const xRange = aspectRatio
        const yRange = 1

        let validParticleCount = 0;
        let attempts = 0;
        const maxAttempts = count * 10; // 無限ループ防止

        while (validParticleCount < count && attempts < maxAttempts) {
            const x = (Math.random() * 2 - 1) * xRange
            const y = (Math.random() * 2 - 1) * yRange
            const snowAmount = getSnowAmount(x, y)

            // 密度に基づいてパーティクルを配置するかどうかを決定
            const density = calculateDensity(snowAmount);
            if (snowAmount !== -1 && Math.random() < density) {
                points[validParticleCount * 3] = x
                points[validParticleCount * 3 + 1] = y
                points[validParticleCount * 3 + 2] = Math.random() * (position.maxZ - position.minZ) + position.minZ

                colors[validParticleCount * 4] = 1
                colors[validParticleCount * 4 + 1] = 1
                colors[validParticleCount * 4 + 2] = 1
                colors[validParticleCount * 4 + 3] = opacity

                sizes[validParticleCount] = calculateParticleSize(snowAmount)
                speeds[validParticleCount] = calculateParticleSpeed(snowAmount)

                validParticleCount++;
            }
            attempts++;
        }

        // もし十分なパーティクルを配置できなかった場合、残りを均等に配置
        while (validParticleCount < count) {
            const x = (Math.random() * 2 - 1) * xRange
            const y = (Math.random() * 2 - 1) * yRange

            points[validParticleCount * 3] = x
            points[validParticleCount * 3 + 1] = y
            points[validParticleCount * 3 + 2] = Math.random() * (position.maxZ - position.minZ) + position.minZ

            colors[validParticleCount * 4] = 1
            colors[validParticleCount * 4 + 1] = 1
            colors[validParticleCount * 4 + 2] = 1
            colors[validParticleCount * 4 + 3] = opacity * 0.5 // 低い透明度で表示

            sizes[validParticleCount] = sizeRange.min
            speeds[validParticleCount] = baseFallSpeed

            validParticleCount++;
        }

        return { points, colors, sizes, speeds }
    }, [count, position.maxZ, position.minZ, opacity, snowDataDimensions, sizeRange, snowData, densityControl])

    const resetParticle = (positions, index, sizes, colors, speeds) => {
        if (!snowDataDimensions) return

        const aspectRatio = snowDataDimensions.width / snowDataDimensions.height
        const xRange = aspectRatio
        const yRange = 1

        let x, y, snowAmount;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            x = (Math.random() * 2 - 1) * xRange
            y = (Math.random() * 2 - 1) * yRange
            snowAmount = getSnowAmount(x, y)
            attempts++;
        } while (
            attempts < maxAttempts &&
            (snowAmount === -1 || Math.random() > calculateDensity(snowAmount))
        )

        // maxAttempts回試行しても適切な位置が見つからなかった場合のフォールバック
        if (attempts >= maxAttempts) {
            snowAmount = snowDataDimensions.amaunt.min;
        }

        positions[index * 3] = x
        positions[index * 3 + 1] = y
        positions[index * 3 + 2] = position.maxZ

        colors[index * 4] = 1
        colors[index * 4 + 1] = 1
        colors[index * 4 + 2] = 1
        colors[index * 4 + 3] = attempts >= maxAttempts ? opacity * 0.5 : opacity

        sizes[index] = attempts >= maxAttempts ? sizeRange.min : calculateParticleSize(snowAmount)
        speeds[index] = attempts >= maxAttempts ? baseFallSpeed : calculateParticleSpeed(snowAmount)
    }

    useFrame(() => {
        if (!geometryRef.current) return

        const geometry = geometryRef.current
        const positions = geometry.attributes.position.array
        const sizes = geometry.attributes.size.array
        const colors = geometry.attributes.color.array

        for (let i = 0; i < count; i++) {
            positions[i * 3 + 2] -= particles.speeds[i]

            if (positions[i * 3 + 2] < position.minZ) {
                resetParticle(positions, i, sizes, colors, particles.speeds)
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
                // アルファ値が0の場合はサイズを0にする
                float finalSize = vColor.a <= 0.0 ? 0.0 : size;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = finalSize * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
            fragmentShader: `
            varying vec4 vColor;
            void main() {
                // アルファ値が0の場合は完全に破棄
                if (vColor.a <= 0.4) {
                    discard;
                }

                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);
                float alpha = smoothstep(0.5, 0.35, dist);
                float brightness = 1.0 - smoothstep(0.0, 0.4, dist);
                vec3 color = vColor.rgb * (1.0 + brightness * 0.5);
                
                // 最終的なアルファ値が0になる場合も破棄
                float finalAlpha = vColor.a * alpha;
                if (finalAlpha <= 0.4) {
                    discard;
                }
                
                gl_FragColor = vec4(color, finalAlpha);
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