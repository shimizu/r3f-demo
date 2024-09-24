import { useEffect, useState, useRef } from "react"
import { OrbitControls, MapControls } from "@react-three/drei"
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


// GeoJSONデータを読み込み、メッシュを生成する関数
const loadGeoJSON = async (url, style, callback) => {
    const res = await fetch(url).then((res) => res.json());
    const projection = geoMercator().fitExtent([[0, 0], [30, 30]], res);
    const data = convertGeoJSONToScreenCoordinates(res, projection);
    const meshes = generateMesh({ data, fill: style.fill, stroke: style.stroke });
    callback(meshes);
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
            //meshes.push(mesh);
            //meshes.push(edges);
            meshes.push({ mesh, edges });
        })


    return meshes

}


// 各階層ごとのグループを作成するコンポーネント
const FloorGroup = ({ name, position, floorData, visible, edgesOnly }) => (
    <group name={name} position={position} visible={visible}>
        {floorData.map((group, i) => (
            <group key={i} name={`${name}_${group.name}`} position-y={group.positionY}>
                {group.meshes.map(( {mesh, edges  }, index) => (
                    <group key={index}>
                        {!edgesOnly && <primitive object={mesh} />}
                        <primitive object={edges} />
                    </group>
                ))}
            </group>
        ))}
    </group>
);

function Scene(){
    const controls = useRef()
    const {camera, gl } = useThree()
    useFrame(()=>{
        controls.current.update()
    })

    //フロアメッシュ
    const [floors, setFloors] = useState({});

    const state = useControls("ワイヤーフレーム", {
        edgesOnly: {value:false, label:"on"}
    })

    //フロア表示非表示切り替え
    const visibleFloors = useControls("フロア表示",
        {
            NRT2_4out: { value: true, label: "4階(外)" },
            NRT2_4: { value: true, label: "4階" },
            NRT2_3out: { value: true, label: "3階(外)" },
            NRT2_3: { value: true, label: "3階" },
            NRT2_2: { value: true, label: "2階" },
            NRT2_1: { value: true, label: "1階"},
            NRT2_B1: { value: true, label: "地下1階" },
            NRT2_B1out: { value: true, label: "地下1階(駐車場)" },
            NRT2_B2: { value: true, label: "地下2階(駐車場)" },
        })



    useEffect(() => {
        const floorConfigs = [
            { floor: 'NRT2_B2', position: [-15, -4, 15], files: ['Space', 'Fixture', 'Floor'], colors: [0x00ff00, 0xff0000, 0xffa500] },
            { floor: 'NRT2_B1out', position: [-15, -2, 15], files: ['Space', 'Fixture', 'Floor'], colors: [0x00ff00, 0xff0000, 0xffa500] },
            { floor: 'NRT2_B1', position: [-15, -2, 15], files: ['Space', 'Fixture', 'Floor'], colors: [0x00ff00, 0xff0000, 0xffa500] },
            { floor: 'NRT2_1', position: [-15, 0, 15], files: ['Space', 'Fixture', 'Floor'], colors: [0x00ff00, 0xff0000, 0xffa500] },
            { floor: 'NRT2_2', position: [-15, 2, 15], files: ['Space', 'Fixture', 'Floor'], colors: [0x00ff00, 0xff0000, 0xffa500] },
            { floor: 'NRT2_3', position: [-15, 4, 15], files: ['Space', 'Fixture', 'Floor'], colors: [0x00ff00, 0xff0000, 0xffa500] },
            { floor: 'NRT2_3out', position: [-15, 4, 15], files: ['Space', 'Fixture', 'Floor'], colors: [0x00ff00, 0xff0000, 0xffa500] },
            { floor: 'NRT2_4', position: [-15, 6, 15], files: ['Space', 'Fixture', 'Floor'], colors: [0x00ff00, 0xff0000, 0xffa500] },
            { floor: 'NRT2_4out', position: [-15, 6, 15], files: ['Space', 'Fixture', 'Floor'], colors: [0x00ff00, 0xff0000, 0xffa500] },
        ];

        floorConfigs.forEach(async ({ floor, position, files, colors }) => {
            const floorData = [];
            for (let i = 0; i < files.length; i++) {
                const [file, color] = [files[i], colors[i]];
                await loadGeoJSON(`./data/${floor}/${floor}_${file}.geojson`, { fill: color, stroke: 0x0000ff }, (meshes) => {
                    floorData.push({ name: file, positionY: i === 0 ? 0 : (i === 1 ? 0.05 : -0.05), meshes });
                });
            }
            setFloors(prev => ({ ...prev, [floor]: { position, floorData } }));
        });
    }, []);



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

            {Object.entries(floors).map(([floor, { position, floorData }]) => (
                <FloorGroup key={floor} name={floor} position={position} floorData={floorData} visible={visibleFloors[floor]} edgesOnly={state.edgesOnly} />
            ))}

        </>
    )
}

export default Scene