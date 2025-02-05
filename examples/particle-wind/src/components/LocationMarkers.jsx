//LocationMarkers.jsx
import React from 'react';
import { Text, Billboard } from '@react-three/drei';

const LocationLabel = ({ point }) => {

    console.log(point)

    const labelHeight = 0.3; // ラベルの高さ
    return (
        <group position={[point.position[0], 0, point.position[1]]}>
            {/* 赤い円 */}
            <mesh position={[0, 0.01, 0]}rotation={[-Math.PI / 2, 0, 0]}>  
                <circleGeometry args={[0.025, 32]} />  
                <meshBasicMaterial color={0xffffff} />
            </mesh>


            {/* ラベルとボックスを結ぶライン */}
            <line>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={2}
                        array={new Float32Array([
                            0, 0, 0,        // ボックスの位置
                            0, labelHeight , 0       // テキストの位置
                        ])}
                        itemSize={3}
                    />
                </bufferGeometry>
                <lineBasicMaterial color={0xffffff} />
            </line>            

            {/* ラベル */}
            <Billboard follow={true} lockX={true} lockY={true} lockZ={true}>
                <Text position={[0, 0.35, 0]} fontSize={0.1} color="white" anchorX="center" anchorY="middle">{point.name}</Text>
            </Billboard>
        </group>
    );
};

const LocationMarkers = ({ points }) => {
    return points
        .filter(d => d.position != null)
        .map((p, i) => (
            <LocationLabel key={i} point={p} />
        ));
};

export default LocationMarkers;