import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'


function BackgroundModel(props) {
    const { nodes, materials } = useGLTF('./gltf/japan.glb')
    return (
        <group {...props} dispose={null}>
            <group rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.japan_1.geometry}
                    material={materials.ray_surface}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.japan_2.geometry}
                    material={materials.ray_soil_base1}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.japan_3.geometry}
                    material={materials.ray_soil_base2}
                />
            </group>
        </group>
    )
}


export default BackgroundModel