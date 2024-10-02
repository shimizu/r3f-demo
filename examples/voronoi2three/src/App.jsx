import { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'

import MyElement3D from './MyElement3D'




import './App.css'


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
