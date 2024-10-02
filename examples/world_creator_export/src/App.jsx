import { useState } from 'react'
import { Canvas } from '@react-three/fiber'

import Scene from './Scene'


import './App.css'

function App() {

  return (
    <>
     <Canvas 
      shadows
      camera={{
        position:[0, 1, 20]
      }
    }>
        <Scene />
     </Canvas>
    </>
  )
}

export default App
