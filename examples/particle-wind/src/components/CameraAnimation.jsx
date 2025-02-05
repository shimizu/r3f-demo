import { useState, useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei'
import { useSpring, a, config } from "@react-spring/three";

import { Vector3 } from "three";

const t = new Vector3();



// カメララッパーコンポーネント
const CameraWrapper = ({ cameraPosition, target }) => {
    const { camera } = useThree();
    camera.position.set(...cameraPosition);
    camera.lookAt(t.set(...target));
    return null;
};



function CameraAnimation({ preset = 0, cameraPositions }) {
    const orbitRef = useRef();
    const [cameraSettings, setCameraSettings] = useState(cameraPositions[0]);
    const { camera } = useThree();

    useEffect(() => {
        // プリセット番号に対応するカメラ設定を取得
        const newSettings = cameraPositions[preset] || cameraPositions[0];
        setCameraSettings(newSettings);
    }, [preset]);


    const s = useSpring({
        from: cameraPositions[0],
        //config: config.wobbly,
        config: {
            mass: 2,
            tension: 150,
            friction: 30,
            clamp: true
        }
    });

    s.position.start({ from: camera.position.toArray(), to: cameraSettings.position });
    s.target.start({
        from: orbitRef.current ? orbitRef.current.target.toArray() : [0, 0, 0],
        to: cameraSettings.target
    });

    const AnimatedNavigation = useMemo(() => a(CameraWrapper), []);

    return (
        <>
            <OrbitControls
                ref={orbitRef}
                minPolarAngle={Math.PI / 5} // 垂直回転の最小角度（真上からの視点を許可）
                maxPolarAngle={Math.PI / 2} // 垂直回転の最大角度（地面と水平な視点まで）
                makeDefault
                enableDamping={true}
                dampingFactor={0.05}
                target={new Vector3(...cameraSettings.target)}
            />
            <AnimatedNavigation cameraPosition={s.position} target={s.target} />
        </>
    );
}

export default CameraAnimation