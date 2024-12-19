import { useState } from 'react'
import { Canvas } from '@react-three/fiber'

import MyElement3D from './MyElement3D'


import './App.css'

function App() {

  return (
    <>
     <Canvas 
        camera={{ fov: 75,  near: 1, far: 5000, position: [0, 200, 300] }
    }>
        <MyElement3D />
     </Canvas>
      <div id="title">2014年から2024年の夏の気温 年間変化率 (°C/年)</div>

      <div className="legend-container">
        <div className="legend"></div>
        <div className="legend-labels">
          <span>-0.5</span>
          <span>0</span> 
          <span>0.5</span> 
        </div>
      </div>

    </>
  )
}

export default App
