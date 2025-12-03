import { useRef, useState, useCallback, forwardRef } from 'react'
import { useFrame, useThree, createPortal } from '@react-three/fiber'
import { useFBO, OrthographicCamera } from '@react-three/drei'
import * as THREE from 'three'
import { OffScreenMaterial } from './OffScreenMaterial'


// オフスクリーンシーンコンポーネント
const OffScreenScene = forwardRef(function OffScreenScene(props, ref) {
    const { size } = useThree()

    return (
        <group>
            <mesh ref={ref}>
                <planeGeometry args={[size.width, size.height]} />
                <offScreenMaterial
                    bufferTexture={props.map}
                    res={new THREE.Vector2(1024, 1024)}
                    smokeSource={new THREE.Vector3(0, 0, 0)}
                />
            </mesh>
        </group>
    )
})


function Scene() {
    const { size, scene } = useThree()
    const onScreen = useRef()
    const offScreen = useRef()
    const offScreenCameraRef = useRef()


    // FBOの作成
    const offScreenFBOTexture = useFBO(1024, 1024, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter
    })
    const onScreenFBOTexture = useFBO(1024, 1024, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter
    })

    // オフスクリーンシーンの作成
    const [offScreenScene] = useState(() => new THREE.Scene())

    // テクスチャの初期設定
    let textureA = offScreenFBOTexture
    let textureB = onScreenFBOTexture

    // マウスイベントハンドラ
    const onPointerMove = useCallback((e) => {
        const { uv } = e
        offScreen.current.material.uniforms.smokeSource.value.x = uv.x
        offScreen.current.material.uniforms.smokeSource.value.y = uv.y
    }, [])

    const onMouseUp = useCallback(() => {
        offScreen.current.material.uniforms.smokeSource.value.z = 0.0
    }, [])

    const onMouseDown = useCallback(() => {
        offScreen.current.material.uniforms.smokeSource.value.z = 0.1
    }, [])


    // レンダリングループ
    useFrame(({ gl, camera }) => {
        // オフスクリーンレンダリング
        gl.setRenderTarget(textureB)
        gl.render(offScreenScene, offScreenCameraRef.current)

        // テクスチャのスワップ
        const t = textureA
        textureA = textureB
        textureB = t

        // テクスチャの更新
        onScreen.current.material.map = textureB.texture
        offScreen.current.material.uniforms.bufferTexture.value = textureA.texture

        // メインシーンのレンダリング
        gl.setRenderTarget(null)
        gl.render(scene, camera)
    })


    return (
        <>
            {createPortal(
                <>
                    <OffScreenScene ref={offScreen} map={offScreenFBOTexture.texture} />
                    <OrthographicCamera
                        makeDefault
                        position={[0, 0, 2]}
                        args={[-1, 1, 1, -1, 1, 1000]}
                        aspect={size.width / size.height}
                        ref={offScreenCameraRef}
                    />
                </>,
                offScreenScene
            )}
            <mesh
                ref={onScreen}
                onPointerMove={onPointerMove}
                onPointerDown={onMouseDown}
                onPointerUp={onMouseUp}
            >
                <planeGeometry args={[20, 20]} />
                <meshBasicMaterial
                    side={THREE.DoubleSide}
                    map={onScreenFBOTexture.texture}
                />
            </mesh>
        </>
    )
}

export default Scene