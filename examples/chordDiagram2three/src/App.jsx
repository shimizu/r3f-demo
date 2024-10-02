import { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'

import MyElement3D from './MyElement3D'




import './App.css'



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


function Svg() {
  // SVGエレメントをレンダリングするDOMノードを参照
  const svgRef = useRef(null);


  const [root, setRoot] = useState(null)

  const width = 954;
  const radius = width / 2;


  useEffect(()=>{
    const loadFlare = async ()=>{
      const res = await d3.json("./data/flare.json")
      const data = hierarchy(res)


      const tree = d3.cluster()
        .size([2 * Math.PI, radius - 100]);

      const root = tree(bilink(d3.hierarchy(data)
        .sort((a, b) => d3.ascending(a.height, b.height) || d3.ascending(a.data.name, b.data.name))));

      setRoot(root)
    }

    loadFlare()
    
  }, [])


  useEffect(() => {
    if (!root) return

    // D3を使ってSVGを作成
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", width)
      .attr("viewBox", [-width / 2, -width / 2, width, width])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

    const node = svg.append("g")
      .selectAll()
      .data(root.leaves())
      .join("g")
      .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
      .append("text")
      .attr("dy", "0.31em")
      .attr("x", d => d.x < Math.PI ? 6 : -6)
      .attr("text-anchor", d => d.x < Math.PI ? "start" : "end")
      .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
      .text(d => d.data.name)
      .each(function (d) { d.text = this; })

    const line = d3.lineRadial()
      .curve(d3.curveBundle.beta(0.85))
      .radius(d => d.y)
      .angle(d => d.x);

    const link = svg.append("g")
      .attr("stroke", "#ccc")
      .attr("fill", "none")
      .selectAll()
      .data(root.leaves().flatMap(leaf => leaf.outgoing))
      .join("path")
      .style("mix-blend-mode", "multiply")
      .attr("d", ([i, o]) => line(i.path(o)))
      .each(function (d) { d.path = this; });


  }, [root]);

  return (
    // refを使用してDOMにSVGを挿入
    <svg ref={svgRef}></svg>
  );
}

/*
function App() {
  return (
    <div>
      <Svg />
    </div>
  );
}
*/


function App() {

  return (
    <>
     <Canvas
        camera={{ fov: 75, far: 5000, near: 1, position: [0, 0, -800]}}
     >
        <MyElement3D />
     </Canvas>

    </>
  )
}


export default App
