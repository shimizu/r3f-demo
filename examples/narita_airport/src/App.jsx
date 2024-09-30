import { useState } from 'react'
import { Canvas } from '@react-three/fiber'

import Scene from './Scene'

import './App.css'

function App() {

  return (
    <>
    <div id="title">成田空港ターミナル２</div>
     <Canvas 
      shadows
      camera={{
        position:[-15, 10, -5]
      }
    }>
        <Scene />
     </Canvas>
     <div id='tooltip' />
      <div className="attribution">
        <a
          href="https://www.geospatial.jp/ckan/dataset/mlit-indoor-narita-airport-r2"
          target="_blank"
          rel="noopener noreferrer"
        >
          © G空間センター
        </a>
      </div>
    </>
  )
}

export default App
