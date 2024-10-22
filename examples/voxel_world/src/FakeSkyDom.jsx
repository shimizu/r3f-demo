import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three"


const FakeSkyDom = () => {
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
        <primitive object={mesh} />
    )
}

export default FakeSkyDom
