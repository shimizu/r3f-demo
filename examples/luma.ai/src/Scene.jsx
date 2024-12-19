import { useEffect } from "react"
import { OrbitControls, RandomizedLight } from "@react-three/drei"
import * as THREE from "three"
import { useControls } from "leva"
import { useFrame, useThree, extend } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { LumaSplatsThree, LumaSplatsSemantics } from '@lumaai/luma-web';


const SPLT_URL = "https://lumalabs.ai/capture/3de7cf80-67f7-457d-8a4b-123cbd7d5ad4"

// Make LumaSplatsThree available to R3F
extend({ LumaSplats: LumaSplatsThree });

function Scene(){


    return (
        <>

            <OrbitControls enableDamping={false} />


            <mesh position={[0, 1, 0]}>
                <boxGeometry args={[1,1,1]} />
                <meshMatcapMaterial color={0xff0000} />
            </mesh>
                        
            <lumaSplats
                semanticsMask={LumaSplatsSemantics.FOREGROUND}
                source={SPLT_URL}
                position={[0, 0, 0]}
                scale={1}
            />

        </>
    )
}

export default Scene