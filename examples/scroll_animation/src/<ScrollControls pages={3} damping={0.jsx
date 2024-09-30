<ScrollControls pages={3} damping={0.1}>
  {/* ScrollControlsを使って、3ページ分のスクロール領域を作成し、dampingでスクロールの滑らかさを設定 */}

  {/* この領域内のCanvasコンテンツはスクロールされないが、useScrollフックを使用してスクロールの情報を受け取る */}
  <SomeModel />

  <Scroll>
    {/* この領域内のCanvasコンテンツはスクロールに沿って移動する */}
    <Foo position={[0, 0, 0]} />
    <Foo position={[0, viewport.height, 0]} />
    <Foo position={[0, viewport.height * 1, 0]} />
  </Scroll>

  <Scroll html>
    {/* この領域内のDOM要素もスクロールに沿って移動する */}
    <h1>ここにHTMLがスクロールと共に表示されます（オプション）</h1>
    <h1 style={{ top: '100vh' }}>2ページ目</h1>
    <h1 style={{ top: '200vh' }}>3ページ目</h1>
  </Scroll>
</ScrollControls>

function Foo(props) {
  const ref = useRef()
  const data = useScroll()
  useFrame(() => {
    // data.offsetは現在のスクロール位置（0〜1の間）、dampingにより滑らかに変化
    // data.deltaは現在のスクロール変化量（0〜1の間）、こちらも滑らかに変化

    // スクロールバーが最初の位置にあるときは0で、スクロール量が1/3に達すると1になる
    const a = data.range(0, 1 / 3)

    // スクロール量が1/3に達すると増加し始め、2/3に達すると1になる
    const b = data.range(1 / 3, 1 / 3)

    // 上記と同じだが、範囲の両端に0.1のマージンがある
    const c = data.range(1 / 3, 1 / 3, 0.1)

    // 指定した範囲内で0から1、そして再び0に変化する
    const d = data.curve(1 / 3, 1 / 3)

    // 上記と同じだが、範囲の両端に0.1のマージンがある
    const e = data.curve(1 / 3, 1 / 3, 0.1)

    // offsetが指定した範囲内にある場合はtrue、それ以外の場合はfalseを返す
    const f = data.visible(2 / 3, 1 / 3)

    // visible関数はマージンも受け取ることができる
    const g = data.visible(2 / 3, 1 / 3, 0.1)
  })

  return <mesh ref={ref} {...props} />
}
