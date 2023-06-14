import React, {FC, useEffect, useRef, useState} from "react"
import styled from "styled-components"
import {Layer, Line, Circle as KonvaCircle, Shape, Stage, Text} from "react-konva"

type Props = {
  board: Array<Array<number>>,
  handleClick: (i: number, j: number) => void
}

const Container = styled.section`
  margin-top: 24px;
  background-color: rgba(255,255,255,0.06);
  
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  border-radius: 16px;
  max-width: calc(100vw - 48px);
  width: 538px;
`

type ShapeParams = {
  x: number,
  y: number,
  key: any
}

const Circle: FC<ShapeParams> = ({x, y}: ShapeParams) => (
  <KonvaCircle
    x={x + 15}
    y={y + 15}
    radius={8}
    stroke="rgb(96, 96, 255)"
    strokeWidth={4}
  />
)

const Cross: FC<ShapeParams> = ({x, y}: ShapeParams) => (
  <Shape
    x={x}
    y={y}
    sceneFunc={(context, shape) => {
      context.beginPath();
      context.moveTo(8, 8);
      context.lineCap = "round"
      context.lineTo(22, 22);
      context.moveTo(22, 8)
      context.lineTo(8, 22);
      context.fillStrokeShape(shape);
    }}
    stroke="rgb(255, 96, 96)"
    strokeWidth={4}
  />
)

const Board: FC<Props> = ({board, handleClick}: Props) => {
  const handleClickCell = (e: any) => {
    console.log(e.evt)

    const i = Math.floor( e.evt.layerX / 30 / scale)
    const j = Math.floor(e.evt.layerY / 30 / scale)
    handleClick(i - 1, j - 1)
  }

  const [scale, setScale] = useState<number>(1)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const pieces = []
  const decorations = []

  for (let i = 1; i < 15; i++) {
    decorations.push(
      <Line
        key={`line-v-${i}`}
        x={30 + i * 30}
        lineCap={"round"}
        y={30}
        points={[0, 0, 0, 450]}
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={1}
      />
    )
  }

  for (let i = 1; i < 15; i++) {
    decorations.push(
      <Line
        key={`line-h-${i}`}
        x={30}
        lineCap={"round"}
        y={30 + i * 30}
        points={[0, 0, 450, 0]}
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={1}
      />
    )
  }

  for (let i = 1; i <= 15; i++) {
    decorations.push(
      <Text
        fontFamily="SB Sans Display"
        key={`text-v-${i}`}
        y={0}
        x={i * 30}
        width={30}
        height={30}
        align="center"
        verticalAlign="middle"
        fill={"rgba(255,255,255,0.4)"}
        text={`${i}`}
      />
    )
  }

  for (let i = 1; i <= 15; i++) {
    decorations.push(
      <Text
        fontFamily="SB Sans Text"
        key={`text-h-${i}`}
        y={i * 30}
        x={0}
        width={30}
        height={30}
        align="center"
        verticalAlign="middle"
        fill={"rgba(255,255,255,0.4)"}
        text={`${i}`}
      />
    )
  }

  for (let i = 0; i < 15; i++) {
    for (let j = 0; j < 15; j++) {
      if (board[i][j] === 1) {
        pieces.push(
          <Cross
            x={30 + i * 30}
            key={`cell-${i}-${j}`}
            y={30 + j * 30}
          />
        )
      } else if (board[i][j] === -1) {
        pieces.push(
          <Circle
            x={30 + i * 30}
            key={`cell-${i}-${j}`}
            y={30 + j * 30}
          />
        )
      }
    }
  }

  useEffect(() => {
    let timeoutId = null
    setScale((containerRef.current?.offsetWidth / 548) || 1)
    const resizeListener = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (!containerRef.current?.offsetWidth)
          return
        setScale((containerRef.current?.offsetWidth / 548) || 1)
      }, 100)
    };
    window.addEventListener('resize', resizeListener)

    return () => {
      window.removeEventListener('resize', resizeListener);
    }
  }, [])


  return (
    <Container ref={containerRef}>
      <Stage
        width={490 * scale}
        height={490 * scale}
        scale={{x: scale, y: scale}}
        onClick={handleClickCell}
      >
        <Layer>
          {decorations}
          {pieces}
        </Layer>
      </Stage>
    </Container>
  )
}

export default Board
