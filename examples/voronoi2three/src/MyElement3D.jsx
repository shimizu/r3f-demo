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






function Shape() {
  const [svgData, setSvgData] = useState(null);


  const [airport, setAirport] = useState(null)



  const projection = d3.geoAlbers().scale(1300).translate([487.5, 305])


  useEffect(() => {


    const loadAirportData = async () => {
      const res = await d3.csv("./data/airports.csv");

      const geojson = res.map((d) => ({
        type: "Feature",
        properties: d,
        geometry: {
          type: "Point",
          coordinates: [+d.longitude, +d.latitude]
        }
      }))
      setAirport(geojson)
    }

    loadAirportData()

  }, []);

  useEffect(() => {
    if (!airport) return;

    const pathStrings = d3.geoVoronoi().polygons(airport).features.map(d3.geoPath(projection))

    const path = pathStrings.map(d => `<path d="${d}" stroke="red" stroke-width="1"/>`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
    ${path.join("\n")}
    </svg>
    `

    console.log(svg)

    // SVGLoaderを使用してpathデータをロードする
    const loader = new SVGLoader();
    const res = loader.parse(svg);
    setSvgData(res);


  }, [airport]);



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
                    const material = new THREE.MeshStandardMaterial({
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

        <group position={[400, 300, -300 ]}rotation={[0, THREE.MathUtils.degToRad(0), THREE.MathUtils.degToRad(180)]}>
            <Shape />
          </group>
 
                        
        </>
    )
}

export default MyElement3D