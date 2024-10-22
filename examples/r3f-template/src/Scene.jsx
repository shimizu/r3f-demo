import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame,  } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

function HelmetInstance() {
    // GLBファイルの読み込み
    const gltf = useGLTF('./gltf/tree_small_dark.glb');

    return <primitive object={gltf.scene} />;
}

function Scene(){

    const controlsRef = useRef();

    useFrame(() => controlsRef.current.update());

    return (
        <>

            <OrbitControls />

            <directionalLight position={[20, 20 ,5]} intensity={10} />

            <HelmetInstance />
            
        </>
    )
}

export default Scene