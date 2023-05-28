import React, {FC} from "react"
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
  border-radius: 16px;
`

type ShapeParams = {
  x: number,
  y: number,
  key: any
}

const Circle: FC<ShapeParams> = ({x, y, key}: ShapeParams) => (
  <KonvaCircle
    x={x + 15}
    y={y + 15}
    key={key}
    radius={7}
    stroke="rgb(96, 96, 255)"
    strokeWidth={4}
  />
)

const Cross: FC<ShapeParams> = ({x, y, key}: ShapeParams) => (
  <Shape
    x={x}
    y={y}
    key={key}
    sceneFunc={(context, shape) => {
      context.beginPath();
      context.moveTo(9, 9);
      context.lineCap = "round"
      context.lineTo(23, 23);
      context.moveTo(23, 9)
      context.lineTo(9, 23);
      context.fillStrokeShape(shape);
    }}
    stroke="rgb(255, 96, 96)"
    strokeWidth={4}
  />
)

const Board: FC<Props> = ({board, handleClick}: Props) => {
  const handleClickCell = (e: any) => {
    console.log(e)
    const i = Math.floor(e.evt.layerX / 30)
    const j = Math.floor(e.evt.layerY / 30)
    console.log(i, j)
    handleClick(i - 1, j - 1)
  }

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
        strokeWidth={2}
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
        strokeWidth={2}
      />
    )
  }

  for (let i = 1; i <= 15; i++) {
    decorations.push(
      <Text
        fontFamily="SB Sans Text"
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

  // decorations.push(
  //   <Rect
  //     key={`border`}
  //     x={1}
  //     y={1}
  //     width={488}
  //     height={488}
  //     stroke={"rgba(255,255,255,0.4)"}
  //     strokeWidth={1.5}
  //     cornerRadius={12}
  //   />
  // )

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

  return (
    <Container>
      <Stage width={490} height={490} onClick={handleClickCell}>
        <Layer>
          {decorations}
          {pieces}
        </Layer>
      </Stage>
    </Container>
  )
}

export default Board
