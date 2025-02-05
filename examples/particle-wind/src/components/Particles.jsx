// Particles.jsx
import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * パーティクルシステムのメインコンポーネント
 * @param {Object} props
 * - count: パーティクルの総数
 * - size: パーティクルの大きさ
 * - opacity: パーティクルの透明度
 * - velocityScale: 風速の影響度
 * - position: パーティクルの配置可能範囲
 * - lifetime: パーティクルの寿命範囲
 * - windData: 風速データ
 * - windDataDimensions: 風速データの次元情報
 */
const Particles = ({
    count = 2000,
    size = 4,
    opacity = 0.8,
    velocityScale = 0.001,
    position = {
        min: -1,
        max: 1,
        minZ: 0,  // z座標（高さ）の最小値
        maxZ: 1   // z座標（高さ）の最大値
    },
    lifetime = { min: 100, max: 200 },
    windData,
    windDataDimensions,
}) => {
    // Three.jsのポイントオブジェクトへの参照
    const pointsRef = useRef()
    // 各パーティクルの残存寿命を管理
    const [lifetimes, setLifetimes] = useState(null)


    // コンポーネントマウント時に各パーティクルの初期寿命を設定
    useEffect(() => {
        const initialLifetimes = new Float32Array(count)
        for (let i = 0; i < count; i++) {
            // min-maxの範囲でランダムな寿命を設定
            initialLifetimes[i] = Math.random() *
                (lifetime.max - lifetime.min) +
                lifetime.min
        }
        setLifetimes(initialLifetimes)
    }, [count, lifetime.max, lifetime.min])

    // パーティクルの初期位置と色を生成
    // useMemoで再計算を最適化
    const particles = useMemo(() => {
        // パーティクルの位置（x,y,z）を保持する配列
        const points = new Float32Array(count * 3)
        // パーティクルの色（r,g,b,a）を保持する配列
        const colors = new Float32Array(count * 4)

        //アスペクト比を考慮
        const aspectRatio = windDataDimensions?.width / windDataDimensions?.height || 2;
        const xRange = aspectRatio;
        const yRange = 1;

        for (let i = 0; i < count; i++) {
            // x, y座標をランダムに初期化
            points[i * 3] = (Math.random() * 2 - 1) * xRange;
            points[i * 3 + 1] = (Math.random() * 2 - 1) * yRange;
            // z座標（高さ）を指定範囲内でランダムに設定
            points[i * 3 + 2] = Math.random() *
                (position.maxZ - position.minZ) +
                position.minZ

            // パーティクルの色を初期化（白色）
            colors[i * 4] = 1     // R
            colors[i * 4 + 1] = 0.5 // G
            colors[i * 4 + 2] = 0.1 // B
            colors[i * 4 + 3] = opacity // 透明度
        }
        return { points, colors }
    }, [count, position.max, position.min, position.maxZ, position.minZ, opacity])

    /**
     * 指定された位置の風速を計算
     * @param {number} x - x座標
     * @param {number} y - y座標
     * @returns {[number, number]} - [u方向の風速, v方向の風速]
     */
    const getWindVelocity = (x, y) => {
        if (!windData) return [0, 0]

        // 座標を風速データの配列インデックスに変換
        const px = Math.floor((x + 1) * 0.5 * windDataDimensions.width)
        const py = Math.floor((-y + 1) * 0.5 * windDataDimensions.height)

        // 座標が範囲外の場合、適切にラップアラウンド
        const wrappedPx = ((px % windDataDimensions.width) + windDataDimensions.width) % windDataDimensions.width
        const wrappedPy = ((py % windDataDimensions.height) + windDataDimensions.height) % windDataDimensions.height

        // 風速データから値を取得
        const index = (wrappedPy * windDataDimensions.width + wrappedPx) * 4
        const windRange = windDataDimensions.windSpeed.max - windDataDimensions.windSpeed.min

        // 風速をデータから計算
        const u = (windData.data[index] / 255) * windRange + windDataDimensions.windSpeed.min
        const v = (windData.data[index + 1] / 255) * windRange + windDataDimensions.windSpeed.min

        // 風速の強さに基づいて移動量を強調
        const speed = Math.sqrt(u * u + v * v)
        const maxPossibleSpeed = Math.sqrt(
            Math.pow(windDataDimensions.windSpeed.max, 2) +
            Math.pow(windDataDimensions.windSpeed.max, 2)
        )

        // 風速が強いほど移動量を大きくする（1.0～3.0倍）
        const emphasisFactor = 1.0 + (speed / maxPossibleSpeed) * 2.0

        return [
            u * velocityScale * emphasisFactor,
            v * velocityScale * emphasisFactor
        ]
    }

    /**
     * パーティクルを初期状態にリセット
     */
    const resetParticle = (positions, colors, index) => {

        // アスペクト比を考慮して位置の範囲を計算
        const aspectRatio = windDataDimensions.width / windDataDimensions.height;
        const xRange = aspectRatio;  // 横幅をアスペクト比に合わせる
        const yRange = 1;  // 縦はそのまま1を使用

        // 位置をランダムに再設定
        // x座標はアスペクト比を考慮した範囲内に収める
        positions[index * 3] = (Math.random() * 2 - 1) * xRange;
        positions[index * 3 + 1] = (Math.random() * 2 - 1) * yRange;
        positions[index * 3 + 2] = Math.random() *
            (position.maxZ - position.minZ) +
            position.minZ

        // 透明度をリセット
        colors[index * 4 + 3] = opacity

        // 寿命をリセット
        if (lifetimes) {
            lifetimes[index] = Math.random() *
                (lifetime.max - lifetime.min) +
                lifetime.min
        }
    }

    // 毎フレーム実行される更新処理
    useFrame(() => {
        if (!pointsRef.current || !windData || !lifetimes) return

        const positions = pointsRef.current.geometry.attributes.position.array
        const colors = pointsRef.current.geometry.attributes.color.array

        const aspectRatio = windDataDimensions.width / windDataDimensions.height;
        const xRange = aspectRatio;  // 横幅をアスペクト比に合わせる
        const yRange = 1;  // 縦はそのまま1を使用

        for (let i = 0; i < count; i++) {
            // パーティクルの寿命を減少
            lifetimes[i] -= 1

            // 寿命切れまたは画面外に出た場合はリセット
            if (lifetimes[i] <= 0 ||
                Math.abs(positions[i * 3]) > xRange ||
                Math.abs(positions[i * 3 + 1]) > yRange) {
                resetParticle(positions, colors, i);
                continue;
            }


            // 風速に基づいてパーティクルを移動
            const x = positions[i * 3]
            const y = positions[i * 3 + 1]
            const [u, v] = getWindVelocity(x, y)
            positions[i * 3] += u
            positions[i * 3 + 1] += v

            // 残存寿命に応じて透明度を更新
            colors[i * 4 + 3] = (lifetimes[i] / lifetime.max) * opacity
        }

        // Three.jsに変更を通知
        pointsRef.current.geometry.attributes.position.needsUpdate = true
        pointsRef.current.geometry.attributes.color.needsUpdate = true
    })

    // パーティクルシステムのレンダリング
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

export default Particles