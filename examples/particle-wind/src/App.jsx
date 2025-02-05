// App.jsx
import { Canvas } from '@react-three/fiber'
import Scene from './Scene'

import "./App.css"

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas
      shadows
      >
        <Scene />
      </Canvas>
    </div>
  )
}

export default App