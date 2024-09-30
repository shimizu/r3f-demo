import { useState, useEffect, useRef } from "react"
import { RandomizedLight, ScrollControls, Scroll, useScroll } from "@react-three/drei"
import { useSpring, a } from '@react-spring/three';
import { useFrame } from "@react-three/fiber";





function Boxs(){
    const [animationFlag, setAnimationFlag] = useState(false); // フラグの状態を管理
    const scroll = useScroll()


    // react-springのuseSpringを使ってアニメーション設定を定義
    const { position } = useSpring({
        to: {
            position: animationFlag ? [0, 1.5, 0] : [0, 0, 0], // フラグに基づいて最終状態と初期状態を切り替える
        },
        config: { mass: 1, tension: 170, friction: 26 }, // スプリングの物理特性を指定
    });


    useFrame(() => {
        // scroll.offset = current scroll position, between 0 and 1, dampened
        // scroll.delta = current delta, between 0 and 1, dampened

        // スクロールバーが開始位置にあるときは0になり、その後、スクロール距離の1/3に達するまで1に増加する。
        const a = scroll.range(0, 1)

        if(a > 0.5){
            setAnimationFlag(true)
        }else{
            setAnimationFlag(false)
        }

        // スクロール距離の1/3に達すると増加し始め、2/3に達すると1に達する。
        const b = scroll.range(1 / 3, 1 / 3)
        // 上記と同じだが、両端のマージンを0.1とする。
        const c = scroll.range(1 / 3, 1 / 3, 0.1)
        // 選択された範囲の0-1-0の間を移動する。
        const d = scroll.curve(1 / 3, 1 / 3)
        // 上記と同じだが、両端のマージンを0.1とする。
        const e = scroll.curve(1 / 3, 1 / 3, 0.1)
        // オフセットが範囲内であれば真を、範囲外であれば偽を返す。
        const f = scroll.visible(2 / 3, 1 / 3)
        // 可視関数はマージンを受け取ることもできる
        const g = scroll.visible(2 / 3, 1 / 3, 0.1)
    })
    

    return (
        <group>
        
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

            {/* 固定されたオブジェクトグループ */}
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

        
        </group>
    )
}


function Scene() {

    return (
        <>
            <RandomizedLight />

            {/* ScrollControlsの中でスクロールを制御 */}
            <ScrollControls pages={3} damping={0}>

                <Boxs />

                {/* アニメーションするオブジェクトグループ */}
            </ScrollControls>
        </>
    )
}

export default Scene;
