import { useEffect } from "react"
import { OrbitControls, RandomizedLight } from "@react-three/drei"
import { useControls } from "leva"
import { useSpring, a } from '@react-spring/three';



function Scene(){

    //チェックボックス(true/false)の表示
    const {animationFlag} = useControls({
        animationFlag:false
    })

    //アニメーションのオンオフ
    console.log("animationFlag", animationFlag)


    // react-springのuseSpringを使ってアニメーション設定を定義
    const { position } = useSpring({
        to: {
            position: animationFlag ? [0, 1.5, 0] : [0, 0, 0], // フラグに基づいて最終状態と初期状態を切り替える
        },
        config: { mass: 1, tension: 170, friction: 26 }, // スプリングの物理特性を指定
    });

    return (
        <>

            <OrbitControls />

            <RandomizedLight />

            <a.group name="boxGroup1" position={position}>
                <mesh position={[-1.5, 0, 0]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshBasicMaterial color={0xff0000} />
                </mesh>


                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshBasicMaterial color={0x00ff00} />
                </mesh>

                <mesh position={[1.5, 0, 0]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshBasicMaterial color={0x0000ff} />
                </mesh>

            </a.group>


            <group name="boxGroup2" position={[0, -1.5, 0]}>
                <mesh position={[-1.5, 0, 0]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshBasicMaterial color={0x00ffff} />
                </mesh>


                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshBasicMaterial color={0xffff00} />
                </mesh>

                <mesh position={[1.5, 0, 0]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshBasicMaterial color={0xff00ff} />
                </mesh>
            </group>


        </>
    )
}

export default Scene