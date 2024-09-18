import { useState } from 'react'
import { Canvas } from '@react-three/fiber'

import MyElement3D from './MyElement3D'


import './App.css'

function App() {

  return (
    <>
     <Canvas 
      shadows
      camera={{
        position: [364.51314993145655, 124.77501890816784, 105.57549068241515]
      }
    }>
        <MyElement3D />
     </Canvas>
    </>
  )
}

export default App
