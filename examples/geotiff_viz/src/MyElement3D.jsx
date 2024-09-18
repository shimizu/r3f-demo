import { useRef, useEffect, useState } from "react"
import { OrbitControls, RandomizedLight} from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three"
import { useControls } from "leva"
import { Bloom, EffectComposer, DepthOfField } from "@react-three/postprocessing";

import { fromUrl } from 'geotiff';

import chroma from 'chroma-js';



const colorScale = chroma
.scale("RdYlGn")
.domain([400, 0]);


const col = 389;
const row = 489;



const Boxes = () => {
 
    const meshRef = useRef();
    const count = col * row; // 配列の要素数に基づくインスタンスの数

    // Boxの初期化
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ 
        vertexColors: true ,
        emissive:0x000000,
        specular:0xffffff,
        shininess:0.1

    });


    const [tiff, setTiff] = useState(null)

    useEffect(() => {
        const loadGeoTiff = async () => {
            const res = await fromUrl("./geotif/gaza_pop.tif");
            const img = await res.getImage()
            const [r,g,b] = await img.readRasters();
            console.log(img)
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
                const h = value * 0.1


                //値がNaNのときはスキップ
                if(isNaN(value)) continue;
                

                const matrix = new THREE.Matrix4();

                // スケールと位置の行列を設定
                matrix.compose(
                    new THREE.Vector3(
                        (i * margin) - (row / 2 * margin),
                        h/2,
                        (-j * margin) + (col / 2 * margin)
                    ), // 位置
                    new THREE.Quaternion(), // 回転（今回は不要なのでデフォルト）
                    new THREE.Vector3(1, h, 1) // スケール（Y軸方向に高さを反映）
                );
                meshRef.current.setMatrixAt(index, matrix);

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
        <instancedMesh  ref={meshRef} args={[geometry, material, count]} />
    );
};



function MyElement3D(){

    const {camera } = useThree()

    //カメラ位置取得
    const handleCamera = ()=>{
        console.log(camera.position)
    }


    useFrame((state) => {
        //const object = state.scene.getObjectByName("example")
    })


    return (
        <>

            <hemisphereLight
                intensity={2}
            />

            <RandomizedLight />

            <ambientLight intensity={0.5} />

            <OrbitControls
                autoRotate={false}
                //onChange={handleCamera}
                />

            <EffectComposer>
                <Bloom
                    intensity={1}
                    mipmapBlur={false}
                    luminanceThreshold={0.9}
                    luminanceSmoothing={0.025}
                />
                <DepthOfField
                    focusDistance={0} // where to focus
                    focalLength={0.5} // focal length
                    bokehScale={2} // bokeh size
                />
            </EffectComposer>



            <Boxes />



            
        </>
    )
}

export default MyElement3D