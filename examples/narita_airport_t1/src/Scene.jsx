import { useEffect, useState, useRef } from "react"
import { MapControls ,ScrollControls, useScroll } from "@react-three/drei"
import * as THREE from "three"
import { useControls } from "leva"
import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useSpring, a } from '@react-spring/three';



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

            // フィーチャのプロパティをメッシュに紐付け
            mesh.userData = { properties: f.properties };

            // 外枠のエッジ用のジオメトリを生成
            const edgesGeometry = new THREE.EdgesGeometry(geometry);
            const lineMaterial = new THREE.LineBasicMaterial({ color: stroke }); // 外枠の色
            const edges = new THREE.LineSegments(edgesGeometry, lineMaterial);

            // 作成したメッシュを配列に追加
            meshes.push({ mesh, edges, properties: f.properties });
        })


    return meshes

}


// 各階層ごとのグループを作成するコンポーネント
const FloorGroup = ({ name, position, floorData, visible, edgesOnly }) =>{ 
    const [isVisible, setIsVisible] = useState(true); // visibleの状態管理
    
    // アニメーションを設定するuseSpring
    const { positionSpring } = useSpring({
        positionSpring: visible ? position : [position[0], position[1] + 2, position[2]],
        config: { mass: 1, tension: 170, friction: 26 },
        onStart:()=>{
            setIsVisible(true)
        },
        onRest: () => {
            // アニメーション終了後にvisibleをfalseにする
            setIsVisible(visible);
        },
    });
    
    return (
        <a.group name={name} position={positionSpring} visible={isVisible} >
            {floorData.map((group, i) => (
                <group key={i} name={`${name}_${group.name}`} position-y={group.positionY}>
                    {group.meshes.map(({ mesh, edges, properties }, index) => (
                        <group key={index}>
                            {!edgesOnly && <primitive object={mesh} 
                                onClick={(e) => {
                                    if(!visible) return

                                    const tooltip = document.querySelector("#tooltip")
                                    const w = tooltip.clientWidth

                                    tooltip.style.visibility = "visible"

                                    //console.log("e", e)
                                    //console.log("p", properties)

                                    tooltip.style.top = `${e.layerY}px`
                                    tooltip.style.left = `${e.layerX- (w/2)}px`


                                    const tbody = Object.keys(properties).map(key=>{
                                        return `<tr><th>${key}</th><td>${properties[key]}</td></tr>`
                                    }).join("")

                                    const table = "<table>" + tbody + "</table>"

                                    tooltip.innerHTML = table

                                    e.stopPropagation()
                            }}
                            onPointerOut={()=>{
                                console.log("pointout")
                            }} />}
                            <primitive object={edges} />
                        </group>
                    ))}
                </group>
            ))}
        </a.group>
    )
};


function Tarminal() {
    //フロアメッシュ
    const [floors, setFloors] = useState({});

    const scroll = useScroll()

    const [visibleFloors, setVisibleFloors] = useState({
        NRT2_4out: true,
        NRT2_4: true,
        NRT2_3out: true,
        NRT2_3: true,
        NRT2_2: true,
        NRT2_1: true,
        NRT2_B1: true,
        NRT2_B1out: true,
        NRT2_B2: true,
    })



    const state = useControls("ワイヤーフレーム", {
        edgesOnly: { value: false, label: "on" }
    })


    useFrame(() => {
        // scroll.offset = current scroll position, between 0 and 1, dampened
        // scroll.delta = current delta, between 0 and 1, dampened

        // スクロールバーが開始位置にあるときは0になり、その後、スクロール距離の1/3に達するまで1に増加する。
        const a = scroll.range(0, 1)

        if (a > 0.1) {
            setVisibleFloors((v)=>{
                return {
                    ...v,
                    NRT2_4out:false
                }
            })
        } else {
            setVisibleFloors((v) => {
                return {
                    ...v,
                    NRT2_4out: true
                }
            })
        }


        if (a > 0.2) {
            setVisibleFloors((v) => {
                return {
                    ...v,
                    NRT2_4: false
                }
            })
        } else {
            setVisibleFloors((v) => {
                return {
                    ...v,
                    NRT2_4: true
                }
            })
        }


        if (a > 0.3) {
            setVisibleFloors((v) => {
                return {
                    ...v,
                    NRT2_3out: false
                }
            })
        } else {
            setVisibleFloors((v) => {
                return {
                    ...v,
                    NRT2_3out: true
                }
            })
        }


        if (a > 0.4) {
            setVisibleFloors((v) => {
                return {
                    ...v,
                    NRT2_3: false
                }
            })
        } else {
            setVisibleFloors((v) => {
                return {
                    ...v,
                    NRT2_3: true
                }
            })
        }

        if (a > 0.5) {
            setVisibleFloors((v) => {
                return {
                    ...v,
                    NRT2_2: false
                }
            })
        } else {
            setVisibleFloors((v) => {
                return {
                    ...v,
                    NRT2_2: true
                }
            })
        }

        if (a > 0.6) {
            setVisibleFloors((v) => {
                return {
                    ...v,
                    NRT2_1: false
                }
            })
        } else {
            setVisibleFloors((v) => {
                return {
                    ...v,
                    NRT2_1: true
                }
            })
        }


        if (a > 0.7) {
            setVisibleFloors((v) => {
                return {
                    ...v,
                    NRT2_B1: false
                }
            })
        } else {
            setVisibleFloors((v) => {
                return {
                    ...v,
                    NRT2_B1: true
                }
            })
        }


        if (a > 0.8) {
            setVisibleFloors((v) => {
                return {
                    ...v,
                    NRT2_B1out: false
                }
            })
        } else {
            setVisibleFloors((v) => {
                return {
                    ...v,
                    NRT2_B1out: true
                }
            })
        }


        if (a > 0.9) {
            setVisibleFloors((v) => {
                return {
                    ...v,
                    NRT2_B2: false
                }
            })
        } else {
            setVisibleFloors((v) => {
                return {
                    ...v,
                    NRT2_B2: true
                }
            })
        }


    })


    //geojson読み込み
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
        <group>
        {
            Object.entries(floors).map(([floor, { position, floorData }]) => (
                <FloorGroup key={floor} name={floor} position={position} floorData={floorData} visible={visibleFloors[floor]} edgesOnly={state.edgesOnly} />
            ))
        } 
        </group>
    )

}


function Scene(){

    //カメラ設定
    const controls = useRef()
    const {camera, gl } = useThree()
    useFrame(()=>{
        controls.current.update()
    })


    //カメライベント設定
    useEffect(()=>{

        if (controls.current) {
            // カメラが移動または回転したときに発火するイベント
            const handleChange = () => {
                const tooltip = document.querySelector("#tooltip")
                tooltip.style.visibility = "hidden"
                tooltip.innerHTML = ""
            };

            // `change`イベントを監視
            controls.current.addEventListener('change', handleChange);

            // コンポーネントがアンマウントされる際にイベントリスナーを削除
            return () => {
                controls.current.removeEventListener('change', handleChange);
            };
        }

    }, [controls])






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
                enableZoom={false}
            />

            <ambientLight intensity={10} />

            <ScrollControls pages={9*1.5} damping={0}>

            <Tarminal/>

            </ScrollControls>


        </>
    )
}

export default Scene