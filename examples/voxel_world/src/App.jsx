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
      <div id="title">DEM Voxel World Map</div>
    </>
  )
}

export default App
