// LocationMarkers.jsx - 3D空間上に位置マーカーとラベルを表示するコンポーネント

import React from 'react';
import { Text, Billboard } from '@react-three/drei';  // 3D空間でのテキスト表示とビルボード機能

// 個々のロケーションマーカーを表示するコンポーネント
const LocationLabel = ({ point }) => {

    // ラベルを地点から浮かせる高さを定義
    const labelHeight = 0.3;

    return (
        // マーカーのグループ（位置はX,Y,Z座標で、Y=0（地表面）に配置）
        <group position={[point.position[0], 0, point.position[1]]}>
            {/* 地点を示す白い円を表示 */}
            <mesh 
                position={[0, 0.01, 0]}           
                rotation={[-Math.PI / 2, 0, 0]}>  
                <circleGeometry args={[0.025, 32]} />  
                <meshBasicMaterial color={0xffffff} /> 
            </mesh>

            {/* 地点とラベルを結ぶ垂直な線 */}
            <line>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={2}                           
                        array={new Float32Array([
                            0, 0, 0,                       
                            0, labelHeight, 0              
                        ])}
                        itemSize={3}                       
                    />
                </bufferGeometry>
                <lineBasicMaterial color={0xffffff} />     
            </line>            

            {/* 地名ラベル */}
            <Billboard
                follow={true}
                position={[0, 0.35, 0]}
                axisAlignment="y"      // Y軸に沿って整列
                fixedAxis={[0, 1, 0]}  // Y軸を固定軸として使用
            >
                <Text
                    fontSize={0.05}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                >
                    {point.name}
                </Text>
            </Billboard>
        </group>
    );
};

// 複数のロケーションマーカーを管理するコンポーネント
const LocationMarkers = ({ points }) => {
    return points
        .filter(d => d.position != null)  // 位置情報が設定されているポイントのみ表示
        .map((p, i) => (
            <LocationLabel key={i} point={p} />  
        ));
};

export default LocationMarkers;