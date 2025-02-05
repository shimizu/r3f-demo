import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const ParticleTrail = ({
    count = 2000,
    size = 4,
    opacity = 0.8,
    velocityScale = 0.001,
    position = {
        min: -1,
        max: 1,
        minZ: 0,
        maxZ: 1
    },
    lifetime = { min: 100, max: 200 },
    trailLength = 20,  // 軌跡の長さ
    trailDelay = 1,    // 軌跡の更新頻度
    windData,
    windDataDimensions
}) => {
    const pointsRef = useRef()
    const [lifetimes, setLifetimes] = useState(null)
    const [trails, setTrails] = useState(null)
    const [trailCounter, setTrailCounter] = useState(0)

    useEffect(() => {
        // 初期の寿命を設定
        const initialLifetimes = new Float32Array(count)
        // 軌跡データの初期化
        const initialTrails = new Array(count).fill(null).map(() => [])

        for (let i = 0; i < count; i++) {
            initialLifetimes[i] = Math.random() *
                (lifetime.max - lifetime.min) +
                lifetime.min
        }

        setLifetimes(initialLifetimes)
        setTrails(initialTrails)
    }, [count, lifetime.max, lifetime.min])

    // パーティクルとその軌跡の位置と色を生成
    const particles = useMemo(() => {
        const totalPoints = count * (trailLength + 1) // メインパーティクル + 軌跡
        const points = new Float32Array(totalPoints * 3)
        const colors = new Float32Array(totalPoints * 4)

        for (let i = 0; i < count; i++) {
            const baseIndex = i * (trailLength + 1)

            // メインパーティクルの初期化
            points[baseIndex * 3] = Math.random() *
                (position.max - position.min) +
                position.min
            points[baseIndex * 3 + 1] = Math.random() *
                (position.max - position.min) +
                position.min
            points[baseIndex * 3 + 2] = Math.random() *
                (position.maxZ - position.minZ) +
                position.minZ

            // メインパーティクルの色
            colors[baseIndex * 4] = 1
            colors[baseIndex * 4 + 1] = 1
            colors[baseIndex * 4 + 2] = 1
            colors[baseIndex * 4 + 3] = opacity

            // 軌跡ポイントの初期化
            for (let j = 1; j <= trailLength; j++) {
                const trailIndex = baseIndex + j
                // 初期位置はメインパーティクルと同じ
                points[trailIndex * 3] = points[baseIndex * 3]
                points[trailIndex * 3 + 1] = points[baseIndex * 3 + 1]
                points[trailIndex * 3 + 2] = points[baseIndex * 3 + 2]

                // 軌跡の色（徐々に透明に）
                colors[trailIndex * 4] = 1
                colors[trailIndex * 4 + 1] = 1
                colors[trailIndex * 4 + 2] = 1
                colors[trailIndex * 4 + 3] = opacity * (1 - j / trailLength)
            }
        }
        return { points, colors }
    }, [count, position.max, position.min, position.maxZ, position.minZ, opacity, trailLength])

    const getWindVelocity = (x, y) => {
        if (!windData) return [0, 0]

        const px = Math.floor((x + 1) * 0.5 * windDataDimensions.width)
        const py = Math.floor((-y + 1) * 0.5 * windDataDimensions.height)

        const wrappedPx = ((px % windDataDimensions.width) + windDataDimensions.width) % windDataDimensions.width
        const wrappedPy = ((py % windDataDimensions.height) + windDataDimensions.height) % windDataDimensions.height

        const index = (wrappedPy * windDataDimensions.width + wrappedPx) * 4
        const windRange = windDataDimensions.windSpeed.max - windDataDimensions.windSpeed.min

        const u = (windData.data[index] / 255) * windRange + windDataDimensions.windSpeed.min
        const v = (windData.data[index + 1] / 255) * windRange + windDataDimensions.windSpeed.min

        return [u * velocityScale, v * velocityScale]
    }

    const resetParticle = (positions, colors, index) => {
        const baseIndex = index * (trailLength + 1)

        // メインパーティクルのリセット
        positions[baseIndex * 3] = Math.random() *
            (position.max - position.min) +
            position.min
        positions[baseIndex * 3 + 1] = Math.random() *
            (position.max - position.min) +
            position.min
        positions[baseIndex * 3 + 2] = Math.random() *
            (position.maxZ - position.minZ) +
            position.minZ

        // 軌跡もリセット
        for (let j = 1; j <= trailLength; j++) {
            const trailIndex = baseIndex + j
            positions[trailIndex * 3] = positions[baseIndex * 3]
            positions[trailIndex * 3 + 1] = positions[baseIndex * 3 + 1]
            positions[trailIndex * 3 + 2] = positions[baseIndex * 3 + 2]
        }

        // 透明度もリセット
        colors[baseIndex * 4 + 3] = opacity
        for (let j = 1; j <= trailLength; j++) {
            const trailIndex = baseIndex + j
            colors[trailIndex * 4 + 3] = opacity * (1 - j / trailLength)
        }

        // 寿命もリセット
        if (lifetimes) {
            lifetimes[index] = Math.random() *
                (lifetime.max - lifetime.min) +
                lifetime.min
        }
    }

    useFrame(() => {
        if (!pointsRef.current || !windData || !lifetimes) return

        const positions = pointsRef.current.geometry.attributes.position.array
        const colors = pointsRef.current.geometry.attributes.color.array

        // trailDelayフレームごとに軌跡を更新
        setTrailCounter((prev) => (prev + 1) % trailDelay)
        const updateTrail = trailCounter === 0

        for (let i = 0; i < count; i++) {
            const baseIndex = i * (trailLength + 1)

            // 寿命を減少
            lifetimes[i] -= 1

            // 寿命が切れたか、範囲外に出たパーティクルをリセット
            if (lifetimes[i] <= 0 ||
                positions[baseIndex * 3] < position.min ||
                positions[baseIndex * 3] > position.max ||
                positions[baseIndex * 3 + 1] < position.min ||
                positions[baseIndex * 3 + 1] > position.max) {
                resetParticle(positions, colors, i)
                continue
            }

            // メインパーティクルを移動
            const x = positions[baseIndex * 3]
            const y = positions[baseIndex * 3 + 1]
            const [u, v] = getWindVelocity(x, y)
            positions[baseIndex * 3] += u
            positions[baseIndex * 3 + 1] += v

            if (updateTrail) {
                // 軌跡を更新
                for (let j = trailLength; j > 0; j--) {
                    const currentIndex = baseIndex + j
                    const previousIndex = baseIndex + j - 1

                    // 位置を更新
                    positions[currentIndex * 3] = positions[previousIndex * 3]
                    positions[currentIndex * 3 + 1] = positions[previousIndex * 3 + 1]
                    positions[currentIndex * 3 + 2] = positions[previousIndex * 3 + 2]
                }
            }

            // メインパーティクルの透明度を更新
            colors[baseIndex * 4 + 3] = (lifetimes[i] / lifetime.max) * opacity
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true
        pointsRef.current.geometry.attributes.color.needsUpdate = true
    })

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particles.points.length / 3}
                    array={particles.points}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={particles.colors.length / 4}
                    array={particles.colors}
                    itemSize={4}
                />
            </bufferGeometry>
            <pointsMaterial
                size={size}
                vertexColors
                transparent
                sizeAttenuation={false}
            />
        </points>
    )
}

export default ParticleTrail