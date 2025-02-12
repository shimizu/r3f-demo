//Scene.jsx
import { useEffect, useState } from 'react'
import { useThree, useLoader } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useControls } from "leva";


import CameraAnimation from './components/CameraAnimation';
import BackgroundModel  from './components/BackgroundModel';
import SnowParticles from './components/SnowParticles';
import LocationMarkers from './components/LocationMarkers'; 
import FireMarkers from './components/FireMarkers';

import { geoEquirectangular } from "d3-geo"

//関心領域設定
const aoi_geojson = {
    "type": "FeatureCollection",
    "features": [
        { "type": "Feature", "properties": {}, "geometry": { "type": "LineString", "coordinates": [[-119.793996106775367, 34.430588301473669], [-116.985832943544864, 33.273186839849281]] } }
    ]
}

//風速の最小最大値(正規化前)
const SNOW_DATA = {
    amaunt: {
        min: 0,
        max: 3.2998
    }
}

//風速データpng
const WIND_DATA_OPTIONS = {
    '01/14 14:00': './data/snow_data.png',
    '01/08 12:00': './data/wind_data.png',
};


const PARTICLE_CONFIG = {
    count: 2000,
    size: 2.5,
    opacity: 0.8,
    velocityScale: 0.0005,
    position: {
        min: -1,
        max: 1,
        minZ: 0,   // 最小高さ
        maxZ: 1.5    // 最大高さ
    },
    lifetime: {
        min: 100,
        max: 200
    }
}


// カメラポジションのプリセット
// カメラポジションのプリセットを配列として定義
export const cameraPositions = [
    {
        id: 'default',
        label: 'デフォルト視点',
        position: [0, 1, 2],
        target: [0, 0, 0]
    },
    {
        id: 'position1',
        label: 'ロングビーチ',
        position: [0, 0.5, 0.75],
        target: [0.207118200343956, 0, 0.207118200343956]
    },
    {
        id: 'position2',
        label: 'マリブ',
        position: [-0.5, 0.25, 0.3],
        target: [-0.4300178547923963, 0, -0.3419753274768027]
    },
    {
        id: 'position2',
        label: 'ロサンゼルス',
        position: [0.1, 0.5, -0.75],
        target: [0.207118200343956, 0, -0.2888043429859337]
    }
];

// Levaで使用するための選択肢を生成
export const cameraOptions = cameraPositions.reduce((acc, pos, index) => {
    acc[pos.label] = index;
    return acc;
}, {});




function Scene() {
    const [particleData, setParticleData] = useState(null)
    const [dimensions, setDimensions] = useState(null)


    // pngSize の状態
    const [pngSize, setPngSize] = useState({
        width: 2,
        height: 2
    })

    //ポイントロケーション
    const [points, setPoints] = useState([
        { name: "ロサンゼルス", lnglat: [-118.2445091, 34.05464], position: null },
        { name: "ロングビーチ", lnglat: [-118.1949714, 33.7700331], position:null},
        { name: "マリブ", lnglat: [-118.6918046, 34.0919682], position: null },
    ])


    // UI、設定
    const { preset } = useControls("camera", {
        preset: {
            options: cameraOptions,  // 選択肢をオブジェクトとして渡す
            value: 0,               // デフォルト値
            label: "カメラ位置"
        },   
    });

    const { selectedWindData } = useControls("snow",{
        selectedWindData: {
            options: Object.keys(WIND_DATA_OPTIONS),
            value: Object.keys(WIND_DATA_OPTIONS)[0],
            label: "雪データ"
        }
    });
    


    //データテクスチャの読み込み
    const dataTexture = useLoader(
        THREE.TextureLoader,
        WIND_DATA_OPTIONS[selectedWindData]
    );
    dataTexture.minFilter = THREE.NearestFilter
    dataTexture.magFilter = THREE.NearestFilter

    useEffect(() => {
        const canvas = document.createElement('canvas')
        const img = dataTexture.image
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')


        // アスペクト比を維持しながら、最大幅を2に制限
        const aspectRatio = canvas.width / canvas.height
        setPngSize({
            width: 2,  // 基準となる幅を2に固定
            height: (2 / aspectRatio)  // アスペクト比に応じて高さを調整
        })

        //AOIデータから座標変換関数を生成
        const projection = geoEquirectangular()
            .fitExtent([[-pngSize.width, -pngSize.height], [pngSize.width, pngSize.height]], aoi_geojson);

        //ポイントデータの座標を変換
        setPoints(p => p.map(d => ({
            ...d,
            position: projection(d.lnglat)
        })))

        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        setParticleData(imageData)
        setDimensions({
            width: img.width,
            height: img.height,
            amaunt: SNOW_DATA.amaunt
        })
    }, [dataTexture])


    return (
        <>
            <ambientLight intensity={2} />

            <EffectComposer>
                <Bloom
                    intensity={1}
                    mipmapBlur={false}
                    luminanceThreshold={0.5}
                    luminanceSmoothing={0.025}
                />
            </EffectComposer>


            <group rotation={[THREE.MathUtils.degToRad(270), 0, 0]}>

                {/*背景モデルの表示*/}
                <BackgroundModel rotation={[THREE.MathUtils.degToRad(90), 0, 0]} scale={0.75} />


                {/* パーティクル */}
                {particleData && dimensions && (
                    <SnowParticles
                        {...PARTICLE_CONFIG}
                        snowData={particleData}
                        snowDataDimensions={dimensions}
                    />
                )}

            </group>



            <CameraAnimation preset={preset} cameraPositions={cameraPositions}/>

        </>
    )
    
    return (
        <>


            <group rotation={[THREE.MathUtils.degToRad(270), 0, 0]}>

                {/*背景モデルの表示*/}
                <BackgroundModel rotation={[THREE.MathUtils.degToRad(90), 0, 0]} scale={0.54} />


                {/* データテクスチャ表示 */}
                <mesh position={[0, 0, 0]}>
                    <planeGeometry args={[pngSize.width * 2, pngSize.height * 2]} />
                    <meshBasicMaterial
                        map={dataTexture}
                        side={THREE.DoubleSide}
                        opacity={0.5}
                        transparent
                    />
                </mesh>

                {/*ロケーションマーカー表示 /*}
                <LocationMarkers points={points} />


                {/* パーティクル */}
                {windData && dimensions && (
                    <SnowParticles
                        {...PARTICLE_CONFIG}
                        windData={windData}
                        snowDataDimensions={dimensions}
                    />
                )}
            </group>

        </>
    )
}

export default Scene