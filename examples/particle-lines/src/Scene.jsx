import { useEffect, useRef } from "react"
import { OrbitControls, RandomizedLight } from "@react-three/drei"
import * as THREE from "three"
import { useControls } from "leva"
import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import chroma from 'chroma-js';


import ArchParicle from "./components/ArchParticle"

//import CurvePathParticle from "./components/CurvePathParticle";

import PathParticle from "./components/PathParticle";

function Scene(){

    // A地点とB地点、およびアーチの高さを指定
    const start = [-2, -2]; // A地点 (x, z)
    const end = [2, 2]; // B地点 (x, z)
    const height = 4; // アーチの高さ


    const points = useRef();

    const { camera, gl } = useThree();


    return (
        <>

            <OrbitControls />

            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={2} />

            <EffectComposer>
                <Bloom
                    intensity={1}
                    mipmapBlur={false}
                    luminanceThreshold={1}
                    luminanceSmoothing={0.025}
                />
            </EffectComposer>


            <mesh position={[start[0], -1, start[1]]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={"white"} emissiveIntensity={2} toneMapped={false}  />
            </mesh>

            <mesh position={[end[0], -1, end[1]]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={"red"} />
            </mesh>

            <group position={[0, -1, 0]}>
                <ArchParicle count={5000} start={start} end={end} height={height} />
            </group>



            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={"green"} emissiveIntensity={2} toneMapped={false} />
            </mesh>

            <mesh position={[-3, 3, -2]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={"red"} roughness={0.5} />
            </mesh>

            <PathParticle pathPointList={[[0, 0, 0], [3, 0, 0], [3, 0, -2], [3, 3, -2], [-3, 3, -2]]} count={3000} />

                        
        </>
    )
}

export default Scene