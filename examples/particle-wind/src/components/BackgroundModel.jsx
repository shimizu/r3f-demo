import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'


function BackgroundModel(props) {
    const { nodes, materials } = useGLTF('./gltf/america.glb')
    return (
        <group {...props} dispose={null}>
            <group rotation={[Math.PI / 2, 0, 0]} scale={0.0215}>
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.test_n_1.geometry}
                    material={materials.ray_surface}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.test_n_2.geometry}
                    material={materials.ray_base}
                />
            </group>
        </group>
    )
}


export default BackgroundModel