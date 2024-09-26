import { useState, useMemo, useRef, useEffect } from "react"
import { OrbitControls, RandomizedLight } from "@react-three/drei"
import * as THREE from "three"
import {  useLoader } from "@react-three/fiber";
import { useControls } from 'leva'

import * as d3 from "d3-tile";
import * as d3Geo from "d3-geo";

// OpenStreetMapのタイルを表示するPlaneコンポーネント
function MapTile({ x, y, z, margin ,index, length}) {
    // タイル画像のURLを生成
    const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    const texture = useLoader(THREE.TextureLoader, url);


    // グリッド上のXとYの位置を計算
    const gridSize = Math.sqrt(length); // タイルの数に基づいてグリッドサイズを決定
    const positionX = (index % gridSize) * (1 + margin); // X軸は余りを使って計算
    const positionY = -Math.floor(index / gridSize) * (1 + margin); // Y軸は整数除算を使って計算

    // ランダムな色を生成
    const color = new THREE.Color(Math.random(), Math.random(), Math.random());

    //位置はとりあえず、xyの座標にそれぞれずらして表示する
    return (
        <mesh position={[positionX - (gridSize / 2), positionY + (gridSize / 2), 0]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
        </mesh>
    );
}


function TileMap({ longitude, latitude,  zoom}) {
    const zoomLevel = zoom;
    const width = 1024;
    const height = 1024;
    const center = [longitude, latitude]; // サンフランシスコの座標 (緯度, 経度)
    const margin = 0; // タイル間のマージン

    // d3.geoMercatorを使って投影を設定
    const projection = useMemo(() => {
        return d3Geo
            .geoMercator()
            .center(center) // 地図の中心をサンフランシスコに設定
            .scale(Math.pow(2, zoomLevel + 8) / (2 * Math.PI)) // スケールをズームレベルに基づいて設定
            .translate([width / 2, height / 2]); // 画面の中心に投影
    }, [width, height, zoomLevel, center]);


    // d3-tileを使用してタイル情報を生成
    const tiles = useMemo(() => {
        const tile = d3
            .tile()
            .size([width, height]) // ビューポートのサイズを指定
            .scale(projection.scale() * 2 * Math.PI) // 投影のスケールを使用
            .translate(projection([0, 0])); // 投影の中心位置を使用

        console.log("タイル数: ", tile().length); // タイルの数をログ出力

        return tile();
    }, [width, height, projection]);

    return (
        <>
            {tiles.map(([x, y, z], index) => (
                <MapTile key={index} x={x} y={y} z={z} margin={margin} index={index} length={tiles.length} />
            ))}
        </>
    );
}


function CameraMovement() {
    const controlsRef = useRef();

    useEffect(() => {
        const controls = controlsRef.current;

        if (controls) {
            // カメラが移動または回転したときに発火するイベント
            const handleChange = () => {
                //以下を修正
                //console.log("カメラの位置", controls.object.position)
            };


            // `change`イベントを監視
            controls.addEventListener('change', handleChange);

            // コンポーネントがアンマウントされる際にイベントリスナーを削除
            return () => {
                controls.removeEventListener('change', handleChange);
            };
        }
    }, []);

    return <OrbitControls ref={controlsRef} />;
}

function Scene(){

    const { latitude, longitude, zoom } = useControls(
            {
                longitude: {value:-122.4183, min:-180, max:180, step:0.01}, 
                latitude: {value:37.7750, min: -90, max:90, step:0.01 },
                zoom:{value:12, min:0, max:19, step:1}
            })

    return (
        <>

            <CameraMovement />


            <RandomizedLight />


            <group>

                <TileMap latitude={latitude} longitude={longitude} zoom={zoom}/>

            </group>
                        
        </>
    )
}

export default Scene