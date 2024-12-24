import { useState } from 'react'
import { Canvas } from '@react-three/fiber'

import Scene from './Scene'


import './App.css'

function App() {

  return (
    <>
    <Canvas camera={{ position: [-1, 3, -7], fov: 75 }}>
        <Scene />
     </Canvas>
    </>
  )
}

export default App
