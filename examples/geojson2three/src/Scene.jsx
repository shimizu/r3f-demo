import { useEffect, useState } from "react"
import { OrbitControls, RandomizedLight } from "@react-three/drei"
import * as THREE from "three"
import { useControls } from "leva"
import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import chroma from 'chroma-js';


import { geoMercator } from "d3-geo";
import convertGeoJSONToScreenCoordinates from "./convertGeoJSONToScreenCoordinates"


// ポリゴンからExtrudeGeometryを返す関数
const createExtrudedGeometry = (coordinates, depth) => {
    const shape = new THREE.Shape();

    // ポリゴンの座標からShapeを作成
    coordinates[0].forEach((point, index) => {
        const [x, y] = point.map((coord, idx) => coord );
        if (index === 0) {
            // 最初の点のみmoveTo
            shape.moveTo(x, y);
        } else if (index + 1 === coordinates[0].length) {
            // 最後の点のみclosePathで閉じる
            shape.closePath();
        } else {
            // それ以外はlineTo
            shape.lineTo(x, y);
        }
    });
    return new THREE.ExtrudeGeometry(shape, {
        steps: 1,
        depth: depth,
        bevelEnabled: false,
    });
};


function Scene(){
    const [meshes, setMeshes] = useState([]);

    useEffect(()=>{

        const loadGeoJSON = async ()=>{
            const res = await fetch("./data/pref-single.geojson").then((res)=> res.json())
            
            //geojsonが右回りになっているので左回りに修正
            //res.features[0].geometry.coordinates[0].reverse()

            //d3-projectionの設定
            const projection = geoMercator().fitExtent([[0,0],[30,30]], res)

            console.log("res", res)

            //geojsonの座標を画面座標に変換
            const data = convertGeoJSONToScreenCoordinates(res, projection)

            const loadedMeshes = []
            
            data.features
                .filter(f=>f.geometry)
                .forEach((f)=>{

                    //ExtrudeGeometryをdataを元に生成
                    const geometry = createExtrudedGeometry(f.geometry);

                    // 90度回転させる
                    const matrix = new THREE.Matrix4().makeRotationX(Math.PI / -2);
                    geometry.applyMatrix4(matrix)

                    // 4. マテリアルとメッシュの作成
                    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00});
                    const mesh = new THREE.Mesh(geometry, material);

                    // 外枠のエッジ用のジオメトリを生成
                    const edgesGeometry = new THREE.EdgesGeometry(geometry);
                    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff }); // 外枠の色
                    const edges = new THREE.LineSegments(edgesGeometry, lineMaterial);

                    // 作成したメッシュを配列に追加
                    loadedMeshes.push(mesh);
                    loadedMeshes.push(edges);
                })

            // 状態に作成したメッシュを設定
            setMeshes(loadedMeshes);
            
        }


        loadGeoJSON()

    },[])


    return (
        <>

            <OrbitControls />

            <ambientLight intensity={10} />


            <group>
                <mesh>
                    <boxGeometry args={[0.1, 0.1, 0.1]} />
                    <meshStandardMaterial color="red"/>
                </mesh>
            </group>

            <group name="geojson_mesh" position={[-15, 15, 0]} rotation={[-90*Math.PI/180, 0, 0]}>
                {/* メッシュを表示 */}
                {meshes.map((mesh, index) => (
                    <primitive object={mesh} key={index} />
                ))}
            </group>
                        
        </>
    )
}

export default Scene