import { useEffect, useMemo } from "react"
import { OrbitControls, RandomizedLight, useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { useControls } from "leva"
import { useFrame, extend, useLoader} from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import chroma from 'chroma-js';

import { vertexShader, fragmentShader } from "./shader-base.js"


import FakeSkyDom from "./FakeSkyDom.jsx";


function Terrain() {

    // PlaneGeometryを生成
    const { scene } = useGLTF('/model/takasaki-vcolor.glb');

    
    const colorMap = useLoader(THREE.TextureLoader, './texture/takasaki_vcolor.png');
    const normalMap = useLoader(THREE.TextureLoader, './terrain-img/Terrain_Normal Map_0_0.png');

    const splatMap = useLoader(THREE.TextureLoader, './terrain-img/water_takasaki.png');
    
    // ShaderMaterialをメモ化
    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                normalMap: { value: normalMap },
                colorMap: { value: colorMap },
                splatMap: { value: splatMap },

                normalScale: { value: 1.0 }, // 法線マップの強度を調整

                displacementScale: { value: 0.0 }, // 高さのスケール

                // ライト関連のuniformを追加
                lightPosition: { value: new THREE.Vector3(0, 0, 0) },  // ライトの位置
                lightColor: { value: new THREE.Color(1, 1, 1) },          // ライトの色
                ambientColor: { value: new THREE.Color(0.1, 0.1, 0.1) },  // 環境光の色
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: false,
        });
    }, [colorMap, normalMap, splatMap]);

    // フレームごとにtimeを更新する
    useFrame((state) => {
        material.uniforms.time.value = state.clock.getElapsedTime();
        material.uniforms.lightPosition.value = new THREE.Vector3(10, 10, 0); // ライトの位置
        material.uniforms.lightColor.value = new THREE.Color(1, 1, 1);          // ライトの色
        material.uniforms.ambientColor.value = new THREE.Color(0.9, 0.9, 0.9);  // 環境光
    });

    //読み込んだglbに作成したカスタムシェーダーを適用する
    scene.traverse((child) => {
        if (child.isMesh) {
            child.material = material;
        }
    });



    return <primitive object={scene} />;
}

function Terrain2(){
    // PlaneGeometryを生成
    const { scene } = useGLTF('/model/takasaki-vcolor.glb');

    return <primitive object={scene} />;
}


function Scene(){



    return (
        <>

            <OrbitControls />

            <ambientLight/>

            <FakeSkyDom />

            <group>
                <Terrain2 />
            </group>

                        
        </>
    )
}

export default Scene


