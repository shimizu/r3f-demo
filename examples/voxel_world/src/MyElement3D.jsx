import { useRef, useEffect, useState, forwardRef } from "react"
import { MapControls, OrbitControls } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three"
import { useControls } from "leva"
import { EffectComposer, Autofocus, DepthOfField } from "@react-three/postprocessing";

import { fromUrl } from 'geotiff';

import chroma from 'chroma-js';





const SkyDom = ()=>{
    const vertexShader = `
        varying vec3 vWorldPosition;

        void main() {

            vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
            vWorldPosition = worldPosition.xyz;

            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

        }
    ` 
    const fragmentShader = `

        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;

        varying vec3 vWorldPosition;

        void main() {

            float h = normalize( vWorldPosition + offset ).y;
            gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );

        }
    `

    var uniforms = {
        topColor: { value: new THREE.Color(0x0077ff) },
        bottomColor: { value: new THREE.Color(0xeeeeee) },
        offset: { value: 33 },
        exponent: { value: 0.6 },
    }

    var geometry = new THREE.BoxGeometry(5000, 5000, 5000)
    var material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.BackSide,
    })

    var mesh = new THREE.Mesh(geometry, material);
    return (
        <primitive object={mesh}  />
    )
}








const colorScale = chroma
.scale("RdYlGn")
.domain([400, 0]);

const col = 1254;
const row = 1070;

const Boxes = () => {
 
    const meshRef = useRef();
    const count = col * row; // 配列の要素数に基づくインスタンスの数

    // Boxの初期化
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    /*
    const material = new THREE.MeshPhongMaterial({ 
        vertexColors: true ,
        emissive:0x000000,
        specular:0xffffff,
        shininess:0.1,

    });
    */

const material = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec3 vColor;
    varying vec3 vPosition;
    attribute vec3 color; // インスタンスごとのカラーを受け取る

    void main() {
      // モデル行列を適用して、インスタンスごとの変換を反映
      vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position, 1.0);
      vPosition = worldPosition.xyz;

      // カラーを頂点シェーダーからフラグメントシェーダーに渡す
      vColor = color;

      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying vec3 vPosition;

    void main() {
      // インスタンスごとのカラーを反映
      gl_FragColor = vec4(vColor, 1.0);
    }
  `,
  wireframe: false,
});



    const [tiff, setTiff] = useState(null)

    useEffect(() => {
        const loadGeoTiff = async () => {
            const res = await fromUrl("./geotif/dem_export32.tif");
            const img = await res.getImage()
            const [r,g,b] = await img.readRasters();
            setTiff(r)
        }

        loadGeoTiff();
    }, [])


    useEffect(() => {

        if (!tiff) return;

        let index = 0;
        const margin = 1
        const colors = new Float32Array(count * 3); // カラーバッファの作成


        // 2次元配列をループして位置を設定
        for (let i = 0; i < row; i++) {
            for (let j = 0; j < col; j++) {

                const k = i * col + j;
                const value = tiff[k];
                const h = value * 0.075


                //値がNaNのときはスキップ
                if(isNaN(value))  continue;
                if (value === 0) continue;
                

                const matrix = new THREE.Matrix4();

                // スケールと位置の行列を設定
                matrix.compose(
                    new THREE.Vector3(
                        (i * margin) - (row / 2 * margin),
                        h+1,
                        (-j * margin) + (col / 2 * margin)
                    ), // 位置
                    new THREE.Quaternion(), // 回転（今回は不要なのでデフォルト）
                    new THREE.Vector3(1, h, 1) // スケール（Y軸方向に高さを反映）
                );
                meshRef.current.setMatrixAt(index, matrix);
                // frustumCulledを無効化
                meshRef.current.frustumCulled = false;

                // 色の設定: grid[i][j] の値に基づく色を設定
                const color = new THREE.Color(colorScale(value).hex());
                colors.set(color.toArray(), index * 3);

                index++;
            }
        }

        // カラーバッファをインスタンスメッシュに適用
        meshRef.current.instanceMatrix.needsUpdate = true;
        geometry.setAttribute('color', new THREE.InstancedBufferAttribute(colors, 3));
    }, [tiff]);

    return (
        <instancedMesh ref={meshRef} args={[geometry, material, count]} />
    );
};



function Effect(){
    const [material, set] = useState()

    return (
        <EffectComposer>

        </EffectComposer>
    )
}


function MyElement3D(){
    const autofocusRef = useRef();

    //カメラ設定
    const controls = useRef()
    const { camera, gl } = useThree()



    useFrame(() => {
        controls.current.update()
    }) 


    return (
        <>
            <hemisphereLight />

            <ambientLight />

            <directionalLight
                castShadow
                position={[10, 20, 0]}
                intensity={1}
            />

            <Effect />

            <SkyDom />

            <MapControls
                ref={controls}
                args={[camera, gl.domElement]}
                enableDamping={true}
                dampingFactor={0.1}
                maxAzimuthAngle={500}
                minDistance={50}
                maxDistance={400}

            />   


            <group rotation-y={-90 * Math.PI / 180} position={[0,0, -100]} >
                <Boxes />
            </group>        

  
        </>
    )
}

export default MyElement3D