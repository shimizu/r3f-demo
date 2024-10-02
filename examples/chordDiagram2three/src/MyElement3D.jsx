import { useEffect, useState, useRef } from "react"
import { OrbitControls, RandomizedLight } from "@react-three/drei"
import * as THREE from "three"
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader'
import { useFrame, useThree } from "@react-three/fiber";

import { Bloom, EffectComposer, DepthOfField } from "@react-three/postprocessing";

// SVG pathのデータを読み込む
const svgPathData = `
  <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
    <path d="M 50 100 C 50 50 100 50 100 100 S 150 150 150 100" stroke="blue" stroke-width="8"/>
    <circle cx="-100" cy="100" r="15" fill="green" stroke="white" />
    <line x1="0" y1="0" x2="100" y2="100" stroke="yellow" stroke-width="4" />
    <rect x="0" y="-100" width="300" height="100" fill="red" stroke="green" />
  </svg>
`;


function color(t){
  return d3.interpolateRdBu(Math.tan(t))
}



function id(node) {
  return `${node.parent ? id(node.parent) + "." : ""}${node.data.name}`;
}

function bilink(root) {
  const map = new Map(root.leaves().map(d => [id(d), d]));
  for (const d of root.leaves()) d.incoming = [], d.outgoing = d.data.imports.map(i => [d, map.get(i)]);
  for (const d of root.leaves()) for (const o of d.outgoing) o[1].incoming.push(o);
  return root;
}

function hierarchy(data, delimiter = ".") {
  let root;
  const map = new Map;
  data.forEach(function find(data) {
    const { name } = data;
    if (map.has(name)) return map.get(name);
    const i = name.lastIndexOf(delimiter);
    map.set(name, data);
    if (i >= 0) {
      find({ name: name.substring(0, i), children: [] }).children.push(data);
      data.name = name.substring(i + 1);
    } else {
      root = data;
    }
    return data;
  });
  return root;
}

function Shape() {
  const [svgData, setSvgData] = useState(null);

  const [root, setRoot] = useState(null)

  const svgRef = useRef(null);



  const width = 954;
  const radius = width / 2;


  useEffect(() => {

    const loadFlare = async () => {
      const res = await d3.json("./data/flare.json")
      const data = hierarchy(res)


      const tree = d3.cluster()
        .size([2 * Math.PI, radius - 100]);

      const root = tree(bilink(d3.hierarchy(data)
        .sort((a, b) => d3.ascending(a.height, b.height) || d3.ascending(a.data.name, b.data.name))));

      setRoot(root)
    }

    loadFlare()

  }, []);



  useEffect(() => {
    if (!root) return;


    const line = d3.lineRadial()
      .curve(d3.curveBundle.beta(0.85))
      .radius(d => d.y)
      .angle(d => d.x);

    //          stroke="${ color(d3.easeQuad(i / ((1 << 6) - 1))) }"



    const link = root.leaves().flatMap(leaf => leaf.outgoing).map((d, i)=>{
      return `
        <path stroke="${color(i) }" style="mix-blend-mode:multiply" 
          d="${line(d[0].path(d[1])) }
        ">
      `
    })

    const svgText = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
    ${link}
    </svg>
    `

    //console.log(svgText)

    // SVGLoaderを使用してpathデータをロードする
    const loader = new SVGLoader();
    const res = loader.parse(svgText);
    setSvgData(res);


  }, [root]);



  return (
    <group>
      {
        svgData && svgData.paths.map((path, pathIndex) => {

            // Ensure style is not null and provide default values
            const style = path.userData.style || {};
            const fillColor = style.fill || path.color || '#000000';
            const strokeColor = style.stroke || '#000000';
            const strokeWidth = style.strokeWidth !== undefined ? parseFloat(style.strokeWidth) : 1;

            /*
            // Fill shapes
            const shapes = path.toShapes(true);
            const fillShapes = shapes.map((shape, shapeIndex) => {
                const geometry = new THREE.ShapeGeometry(shape);
                const material = new THREE.MeshBasicMaterial({
                    color: fillColor,
                    side: THREE.DoubleSide,
                });
                return (
                    <mesh
                        key={`shape-${pathIndex}-${shapeIndex}`}
                        geometry={geometry}
                        material={material}
                    />
                );
            });
            */

            // Stroke shapes
            const strokeMeshes = path.subPaths.flatMap((subPath, subPathIndex) => {
                const points = subPath.getPoints();

                // Define stroke options
                const strokeOptions = {
                    strokeWidth: strokeWidth,
                    strokeColor: new THREE.Color().setStyle(strokeColor),
                    strokeLineJoin: style.strokeLinejoin || 'miter',
                    strokeLineCap: style.strokeLinecap || 'butt',
                    strokeMiterLimit: style.strokeMiterLimit || 4,
                };

                const geometry = SVGLoader.pointsToStroke(points, strokeOptions);

                if (geometry) {
                  const material = new THREE.MeshBasicMaterial({
                        color: strokeColor,
                        side: THREE.DoubleSide,
                    });
                    return (
                        <mesh
                            key={`stroke-${pathIndex}-${subPathIndex}`}
                            geometry={geometry}
                            material={material}
                        />
                    );
                } else {
                    return []; // Return an empty array if geometry is null
                }
            });

    

          // 塗りつぶし部分とストローク部分を返す
            return [/*...fillShapes*/, ...strokeMeshes];
        })
      }
    </group>
  );
}





function MyElement3D(){
  const { camera } = useThree()

  //カメラ位置取得
  const handleCamera = () => {
    console.log(camera.position)
  }

    return (
        <>

            <OrbitControls
            onChange={handleCamera}
           />


        <EffectComposer>
          <Bloom
            intensity={2}
            mipmapBlur={false}
            luminanceThreshold={0.0}
            luminanceSmoothing={0.025}
          />
        </EffectComposer>



            <ambientLight intensity={3} />

            <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshBasicMaterial color={0xff0000} />
            </mesh>

        <group position={[0, 0, 0 ]}rotation={[0, THREE.MathUtils.degToRad(0), THREE.MathUtils.degToRad(180)]}>
            <Shape />
          </group>
 
                        
        </>
    )
}

export default MyElement3D