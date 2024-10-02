import { useEffect, useMemo } from "react"
import { OrbitControls, RandomizedLight, useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { useControls } from "leva"
import { useFrame, extend, useLoader } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import chroma from 'chroma-js';



function Terrain() {

    const { scene } = useGLTF('./terrain/Terrain_Mesh_0_0.glb');
    const colorMap = useLoader(THREE.TextureLoader, './terrain/Terrain_Colormap_0_0.png');
    const normalMap = useLoader(THREE.TextureLoader, './terrain/Terrain_Normal Map_0_0.png');
    const roughnessMap = useLoader(THREE.TextureLoader, './terrain/Terrain_Roughness Map_0_0.png');
    const metalnessMap = useLoader(THREE.TextureLoader, './terrain/Terrain_Metalness Map_0_0.png');


    // テクスチャの読み込み
    const splatMap = useLoader(THREE.TextureLoader, './terrain/Terrain_Splat Map_2_0_0.png');
    const grassTexture = useLoader(THREE.TextureLoader, './texture/grass.png');

    // テクスチャの繰り返し設定
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(4, 4); // 4x4繰り返し適用


    const rockTexture = useLoader(THREE.TextureLoader, './texture/Stone 4.jpg');

    // 使用するテクスチャをメモ化
    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                colorMap: { value: colorMap },
                splatMap: { value: splatMap },
                rockTexture: { value: rockTexture },
                grassTexture: { value: grassTexture },
                normalMap: { value: normalMap },
                roughnessMap: { value: roughnessMap },
                metalnessMap: { value: metalnessMap },
            },
            vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
            fragmentShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            uniform sampler2D colorMap;
            uniform sampler2D splatMap;
            uniform sampler2D normalMap;
            uniform sampler2D roughnessMap;
            uniform sampler2D metalnessMap;

            uniform sampler2D rockTexture;
            uniform sampler2D grassTexture;

            void main() {
            // ベースカラーの取得
            vec4 baseColor = texture2D(colorMap, vUv);

            // スプラットマップの取得
            vec4 splat = texture2D(splatMap, vUv);
             float splatValue = texture2D(splatMap, vUv).r;

            // 各テクスチャの取得
            vec4 rockColor = texture2D(rockTexture, vUv);
            vec4 grassColor = texture2D(grassTexture, vUv);

            // Splat Mapに基づいたブレンド (0: baseColor1: rockColor)
       
            vec4 blendedColor = mix(grassColor, baseColor, splatValue);

            // 正規化（ブレンド係数の合計が1になるように調整） 
            float total = splat.r + splat.g + splat.b + splat.a;
            blendedColor /= total;
                

            // 最終カラーの設定
            gl_FragColor = vec4(blendedColor.rgb, 1.0);
            }

        `,
            transparent: false,
        });
    }, [colorMap, splatMap, normalMap, roughnessMap, metalnessMap]);


    scene.traverse((child) => {
        if (child.isMesh) {
            child.material = material; // カスタムマテリアルを適用
        }
    });


    /*
    scene.traverse((child) => {
        if (child.isMesh) {
            child.material.map = colorMap;
            child.material.normalMap = normalMap;
            child.material.roughnessMap = roughnessMap;
            child.material.metalnessMap = metalnessMap;
        }
    });
    */

    return <primitive object={scene} />;
}


function Scene(){



    return (
        <>

            <OrbitControls />

            <RandomizedLight />


            <mesh>
                <boxGeometry args={[1,1,1]} />
                <meshBasicMaterial color={0xff0000} />
            </mesh>

            <group scale={0.01}>
                <Terrain />
            </group>
                        
        </>
    )
}

export default Scene