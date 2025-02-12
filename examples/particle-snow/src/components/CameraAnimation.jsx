// CameraAnimation.jsx - カメラのアニメーションと制御を管理するコンポーネント

import { useState, useEffect, useMemo, useRef, memo } from 'react';
import { useThree } from '@react-three/fiber';  // Three.jsのカメラ制御用フック
import { useGLTF, OrbitControls } from '@react-three/drei'  // カメラ軌道制御用コンポーネント
import { useSpring, a, config } from "@react-spring/three";  // アニメーション制御用ライブラリ

import { Vector3 } from "three";

// 一時的なVector3オブジェクトを作成（メモリ効率化のため再利用）
const t = new Vector3();

// カメラの位置と注視点を制御するヘルパーコンポーネント
const CameraWrapper = ({ cameraPosition, target }) => {
    // Three.jsのカメラオブジェクトを取得
    const { camera } = useThree();

    // カメラの位置を設定（配列を座標として展開）
    camera.position.set(...cameraPosition);

    // カメラの注視点を設定（一時Vector3オブジェクトを使用）
    camera.lookAt(t.set(...target));

    return null;  // 表示要素なし（制御のみ）
};

// メインのカメラアニメーションコンポーネント
function CameraAnimation({ preset = 0, cameraPositions }) {
    // OrbitControlsへの参照を保持
    const orbitRef = useRef();
    const { camera } = useThree();

    // 現在のカメラ設定を状態として保持
    const [cameraSettings, setCameraSettings] = useState(cameraPositions[0]);


    // プリセットが変更されたときの処理
    useEffect(() => {
        // プリセット番号に対応するカメラ設定を取得（無効な場合はデフォルト使用）
        const newSettings = cameraPositions[preset] || cameraPositions[0];
        setCameraSettings(newSettings);
    }, [preset]);  // プリセットが変更されたときのみ実行

    // useSpringをコントロールするAPIを取得するための記述
    const [springs, api] = useSpring(() => ({
        // 初期値は現在のカメラ位置とOrbitControlsのtarget（なければ[0, 0, 0]）から設定
        position: camera.position.toArray(),
        target: orbitRef.current ? orbitRef.current.target.toArray() : [0, 0, 0],
        config: {
            mass: 2,
            tension: 150,
            friction: 30,
            clamp: true,
        }
    }));


    // プリセット変更時にアニメーションを実行する
    useEffect(() => {
        // 現在の状態から新しい設定へアニメーションする
        api.start({
            // fromを明示的に指定しないと、現在の状態が自動的に利用される
            to: {
                position: cameraSettings.position,
                target: cameraSettings.target,
            },
            // 必要に応じてリセットしない設定を付ける
            reset: false,
        });
    }, [cameraSettings, api]);


    // アニメーション可能なCameraWrapperコンポーネントを生成（メモ化）
    const AnimatedNavigation = useMemo(() => a(CameraWrapper), []);

    return (
        <>
            {/* カメラの軌道制御設定 */}
            <OrbitControls
                ref={orbitRef}
                minPolarAngle={Math.PI / 5}  // 垂直回転の最小角度（真上からの視点を許可）
                maxPolarAngle={Math.PI / 2}  // 垂直回転の最大角度（地面と水平な視点まで）
                makeDefault                   // デフォルトコントロールとして設定
                enableDamping={true}         // カメラ移動の減衰を有効化
                dampingFactor={0.05}         // 減衰の強さ
                target={new Vector3(...cameraSettings.target)}  // 注視点の設定
            />

            {/* アニメーション付きカメラ制御コンポーネント */}
            <AnimatedNavigation cameraPosition={springs.position} target={springs.target} />
        </>
    );
}

export default memo(CameraAnimation)