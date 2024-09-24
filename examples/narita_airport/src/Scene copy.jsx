import { useEffect, useState, useRef } from "react"
import { OrbitControls, MapControls, RandomizedLight } from "@react-three/drei"
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


function generateMesh({data, fill, stroke} = props){
    const meshes = []

    data.features
        .filter(f => f.geometry)
        .forEach((f) => {

            //ExtrudeGeometryをdataを元に生成
            const geometry = createExtrudedGeometry(f.geometry, 0.01);

            // 90度回転させる
            const matrix = new THREE.Matrix4().makeRotationX(Math.PI / -2);
            geometry.applyMatrix4(matrix)

            // 4. マテリアルとメッシュの作成
            const material = new THREE.MeshBasicMaterial({ color: fill });
            const mesh = new THREE.Mesh(geometry, material);

            // 外枠のエッジ用のジオメトリを生成
            const edgesGeometry = new THREE.EdgesGeometry(geometry);
            const lineMaterial = new THREE.LineBasicMaterial({ color: stroke }); // 外枠の色
            const edges = new THREE.LineSegments(edgesGeometry, lineMaterial);

            // 作成したメッシュを配列に追加
            meshes.push(mesh);
            meshes.push(edges);
        })


    return meshes

}


function Scene(){
    const controls = useRef()
    const {camera, gl } = useThree()
    useFrame(()=>{
        controls.current.update()
    })


    //１階
    const [NRT2_1_Fixture, setNRT2_1_Fixture] = useState([]);
    const [NRT2_1_Space, setNRT2_1_Space] = useState([]);
    const [NRT2_1_Floor, setNRT2_1_Floor] = useState([]);

    //2階
    const [NRT2_2_Fixture, setNRT2_2_Fixture] = useState([]);
    const [NRT2_2_Space, setNRT2_2_Space] = useState([]);
    const [NRT2_2_Floor, setNRT2_2_Floor] = useState([]);



    useEffect(()=>{

        const loadGeoJSON = async (url, callback, style)=>{
            const res = await fetch(url).then((res)=> res.json())
            //d3-projectionの設定
            const projection = geoMercator().fitExtent([[0,0],[30,30]], res)
            //geojsonの座標を画面座標に変換
            const data = convertGeoJSONToScreenCoordinates(res, projection)
            //meshを生成
            const loadedMeshes = generateMesh({ data, fill: style.fill, stroke: style.stroke})

            // stateに作成したメッシュを設定
            callback(loadedMeshes);
            
        }


        loadGeoJSON("./data/NRT2_1/NRT2_1_Space.geojson", setNRT2_1_Space, {fill:0x00ff00, stroke:0x0000ff})
        loadGeoJSON("./data/NRT2_1/NRT2_1_Fixture.geojson", setNRT2_1_Fixture, { fill: 0xff0000, stroke: 0x0000ff })
        loadGeoJSON("./data/NRT2_1/NRT2_1_Floor.geojson", setNRT2_1_Floor, { fill: 0xffa500, stroke: 0x0000ff })


        loadGeoJSON("./data/NRT2_2/NRT2_2_Space.geojson", setNRT2_2_Space, { fill: 0x00ff00, stroke: 0x0000ff })
        loadGeoJSON("./data/NRT2_2/NRT2_2_Fixture.geojson", setNRT2_2_Fixture, { fill: 0xff0000, stroke: 0x0000ff })
        loadGeoJSON("./data/NRT2_2/NRT2_2_Floor.geojson", setNRT2_2_Floor, { fill: 0xffa500, stroke: 0x0000ff })



    },[])


    return (
        <>

            <MapControls 
                ref={controls}
                args={[camera, gl.domElement]}
                enableDamping={true}
                dampingFactor={0.05}
                minDistance={1}
                maxAzimuthAngle={500}
                maxPolarAngle={Math.PI / 2}
            />

            <ambientLight intensity={10} />


            <group name="NRT2_1" position={[-15, 0, 15]}>
                <group name="NRT2_1_Fixture" position-y={0.05}>
                    {NRT2_1_Fixture.map((mesh, index) => (
                        <primitive object={mesh} key={index} />
                    ))}
                </group>


                <group name="nrt2_1_Space" position-y={0}>
                    {NRT2_1_Space.map((mesh, index) => (
                        <primitive object={mesh} key={index} />
                    ))}
                </group>


                <group name="NRT2_1_Floor" position-y={-0.05}>
                    {NRT2_1_Floor.map((mesh, index) => (
                        <primitive object={mesh} key={index} />
                    ))}
                </group>
            </group>


            <group name="NRT2_2" position={[-15, 2, 15]}>
                <group name="NRT2_2_Fixture" position-y={0.05}>
                    {NRT2_2_Fixture.map((mesh, index) => (
                        <primitive object={mesh} key={index} />
                    ))}
                </group>


                <group name="nrt2_2_Space" position-y={0}>
                    {NRT2_2_Space.map((mesh, index) => (
                        <primitive object={mesh} key={index} />
                    ))}
                </group>


                <group name="NRT2_2_Floor" position-y={-0.05}>
                    {NRT2_2_Floor.map((mesh, index) => (
                        <primitive object={mesh} key={index} />
                    ))}
                </group>
            </group>

        </>
    )
}

export default Scene