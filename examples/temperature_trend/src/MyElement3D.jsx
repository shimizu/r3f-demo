import { useRef, useEffect, useState, forwardRef } from "react"
import { MapControls, OrbitControls, ContactShadows } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three"
import { useControls } from "leva"
import { EffectComposer, Autofocus, DepthOfField } from "@react-three/postprocessing";

import { fromUrl } from 'geotiff';

import chroma from 'chroma-js';


import FakeSkyDom from "./FakeSkyDom";





const colorScale = chroma
.scale(["blue", "#cccccc", "red"])
.domain([-0.5, 0, 0.5]);

const col = 1604;
const row = 660;

const Boxes = () => {
 
    const meshRef = useRef();
    const count = col * row; // 配列の要素数に基づくインスタンスの数

    // Boxの初期化
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    
    
    const material = new THREE.MeshPhongMaterial({ 
        vertexColors: true ,
        emissive:0x000000,
        specular:0xffffff,
        shininess:0.1,

    });
    

    const [tiff, setTiff] = useState(null)

    useEffect(() => {
        const loadGeoTiff = async () => {
            const res = await fromUrl("./geotif/Temperature_Trend_2014_2024_Summer_Celsius2.tif");
            console.log("res", res)
            const img = await res.getImage()
            console.log("img", img)
            const [r,g,b] = await img.readRasters();
            console.log("r", r)
            setTiff(r)
        }

        loadGeoTiff();
    }, [])


    useEffect(() => {

        if (!tiff) return;

        let index = 0;
        const margin = 1
        const colors = new Float32Array(count * 3); // カラーバッファの作成


        // 2次元配列をループして位置を設定
        for (let i = 0; i < row; i++) {
            for (let j = 0; j < col; j++) {

                const k = i * col + j;
                const value = tiff[k];
                const h = Math.abs(value) * 20


                //値がNaNのときはスキップ
                if(isNaN(value))  continue;
                if (value === 0) continue;
                

                const matrix = new THREE.Matrix4();

                // スケールと位置の行列を設定
                matrix.compose(
                    new THREE.Vector3(
                        (i * margin) - (row / 2 * margin),
                        h+1,
                        (-j * margin) + (col / 2 * margin)
                    ), // 位置
                    new THREE.Quaternion(), // 回転（今回は不要なのでデフォルト）
                    new THREE.Vector3(1, h, 1) // スケール（Y軸方向に高さを反映）
                );
                meshRef.current.setMatrixAt(index, matrix);
                // frustumCulledを無効化
                meshRef.current.frustumCulled = false;

                // 色の設定: grid[i][j] の値に基づく色を設定
                const color = new THREE.Color(colorScale(value).hex());
                colors.set(color.toArray(), index * 3);

                index++;
            }
        }

        // カラーバッファをインスタンスメッシュに適用
        meshRef.current.instanceMatrix.needsUpdate = true;
        geometry.setAttribute('color', new THREE.InstancedBufferAttribute(colors, 3));
    }, [tiff]);

    return (
        <instancedMesh ref={meshRef} args={[geometry, material, count]} />
    );
};


function MyElement3D(){
    const autofocusRef = useRef();

    //カメラ設定
    const controls = useRef()
    const { camera, gl } = useThree()



    useFrame(() => {
        controls.current.update()
    }) 


    return (
        <>
            <hemisphereLight />

            <ambientLight />

            <directionalLight
                castShadow
                position={[10, 20, 0]}
                intensity={1}
            />


            <MapControls
                ref={controls}
                args={[camera, gl.domElement]}
                enableDamping={true}
                dampingFactor={0.1}
                maxAzimuthAngle={500}
                maxDistance={400}

            />   


            <FakeSkyDom/>

            <group rotation-y={-90 * Math.PI / 180} position={[0,0, -100]} >
                <Boxes />
            </group>        

  
        </>
    )
}

export default MyElement3D