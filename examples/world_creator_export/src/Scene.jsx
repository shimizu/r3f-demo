import { useEffect, useMemo } from "react"
import { OrbitControls, RandomizedLight, useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { useControls } from "leva"
import { useFrame, extend, useLoader } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import chroma from 'chroma-js';

import { vertexShader, fragmentShader } from "./shader.js"

function Terrain() {

    // PlaneGeometryを生成
    const planeGeometry = useMemo(() => new THREE.PlaneGeometry(10, 10, 1024, 1024), []);


    const heightMap = useLoader(THREE.TextureLoader, './terrain/Terrain_Height Map_1024x1024_0_0.png');
    const colorMap = useLoader(THREE.TextureLoader, './terrain/Terrain_Colormap_0_0.jpg');
    const normalMap = useLoader(THREE.TextureLoader, './terrain/Terrain_Normal Map_0_0.png');

    const splatMap0 = useLoader(THREE.TextureLoader, './terrain/Terrain_Splat Map_0_0_0.png');
    const splatMap1 = useLoader(THREE.TextureLoader, './terrain/Terrain_Splat Map_1_0_0.png');
    const splatMap2 = useLoader(THREE.TextureLoader, './terrain/Terrain_Splat Map_2_0_0.png');
    const splatMap3 = useLoader(THREE.TextureLoader, './terrain/Terrain_Splat Map_3_0_0.png');
    const splatMap4 = useLoader(THREE.TextureLoader, './terrain/Terrain_Splat Map_4_0_0.png');

    const grassTexture = useLoader(THREE.TextureLoader, './texture/grass.png');
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;

    const rockTexture = useLoader(THREE.TextureLoader, './texture/texture512.jpg');
    rockTexture.wrapS = THREE.RepeatWrapping;
    rockTexture.wrapT = THREE.RepeatWrapping;


    // ShaderMaterialをメモ化
    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                heightMap: { value: heightMap },
                colorMap: { value: colorMap },
                splatMap0: { value: splatMap0 },
                splatMap1: { value: splatMap1 },
                splatMap2: { value: splatMap2 },
                splatMap3: { value: splatMap3 },
                splatMap4: { value: splatMap4 },
                rockTexture: { value: rockTexture },
                grassTexture: { value: grassTexture },
                normalMap: { value: normalMap },

                normalScale: { value: 2.0 }, // 法線マップの強度を調整

                textureRepeat: { value: new THREE.Vector2(24, 24) }, // リピート係数

                displacementScale: { value: 5.0 }, // 高さのスケール

                // ライト関連のuniformを追加
                lightPosition: { value: new THREE.Vector3(0, 0, 0) },  // ライトの位置
                lightColor: { value: new THREE.Color(1, 1, 1) },          // ライトの色
                ambientColor: { value: new THREE.Color(0.1, 0.1, 0.1) },  // 環境光の色
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: false,
        });
    }, [colorMap, splatMap0, splatMap1, splatMap2, splatMap3, splatMap4, normalMap]);

    // フレームごとにtimeを更新する
    useFrame((state) => {
        material.uniforms.time.value = state.clock.getElapsedTime();
        material.uniforms.lightPosition.value = new THREE.Vector3(10, 10, 0); // ライトの位置
        material.uniforms.lightColor.value = new THREE.Color(1, 1, 1);          // ライトの色
        material.uniforms.ambientColor.value = new THREE.Color(0.5, 0.5, 0.5);  // 環境光
    });

    const mesh = new THREE.Mesh(planeGeometry, material);

    return <primitive object={mesh} />;
}


function Terrain2(){

    // PlaneGeometryを生成
    const planeGeometry = useMemo(() => new THREE.PlaneGeometry(10, 10, 1024, 1024), []);

    const material = new THREE.MeshBasicMaterial()
    material.color = new THREE.Color(0x1188ff)

    const mesh = new THREE.Mesh(planeGeometry, material);


    return <primitive object={mesh}  />;
}


function Scene(){



    return (
        <>

            <OrbitControls />

            <Terrain />
                        
        </>
    )
}

export default Scene


