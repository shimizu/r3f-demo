import { useEffect } from "react"
import { OrbitControls, RandomizedLight } from "@react-three/drei"
import * as THREE from "three"
import { useControls } from "leva"
import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import chroma from 'chroma-js';




const vertexShader = `
  varying vec3 vPosition;
  
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec3 vPosition;

  void main() {
    gl_FragColor = vec4(abs(vPosition), 1.0); // シンプルな色の変化
  }
`;


function Scene(){


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


            <mesh position={[-1.5, 0, 0]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial emissive="yellow" emissiveIntensity={2} toneMapped={false} />
            </mesh>

            <mesh position={[1.5, 0, 0]}>
                <boxGeometry args={[1, 1, 1]} />
            </mesh>


        </>
    )
}

export default Scene