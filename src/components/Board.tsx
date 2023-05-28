import React, {FC} from "react"
import styled from "styled-components"
import {accent, backgroundPrimary, backgroundSecondary} from "@salutejs/plasma-tokens"

type Props = {
  board: Array<Array<number>>,
  handleClick: (i: number, j: number) => void
}

const Container = styled.section`
  margin: 32px;
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  grid-template-rows: repeat(15, 1fr);
  padding: 14px;
  border-radius: 8px;
`

const Cell = styled.div`
  width: 40px;
  height: 40px;
  border: 1px solid ${accent};
  // background: ${backgroundPrimary};
  
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${accent};

  &:nth-child(1) {
    border-radius: 6px 0 0 0;
  }
  
  &:nth-child(15) {
    border-radius: 0 6px 0 0;
  }

  &:nth-child(211) {
    border-radius: 0 0 0 6px;
  }
  
  &:nth-child(225) {
    border-radius: 0 0 6px 0;
  }
  
  &:nth-child(15+n) {
    border-top: none;
  }
`

const Circle: FC<never> = () => (
  <svg width="32px" height="32px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <circle
      cx="16px"
      cy="16px"
      r="8px"
      strokeWidth="3px"
      stroke={accent}
      fill="none"
    />
  </svg>
)

const Cross: FC<never> = () => (
  <svg width="800px" height="800px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M18.8,16l5.5-5.5c0.8-0.8,0.8-2,0-2.8l0,0C24,7.3,23.5,7,23,7c-0.5,0-1,0.2-1.4,0.6L16,13.2l-5.5-5.5  c-0.8-0.8-2.1-0.8-2.8,0C7.3,8,7,8.5,7,9.1s0.2,1,0.6,1.4l5.5,5.5l-5.5,5.5C7.3,21.9,7,22.4,7,23c0,0.5,0.2,1,0.6,1.4  C8,24.8,8.5,25,9,25c0.5,0,1-0.2,1.4-0.6l5.5-5.5l5.5,5.5c0.8,0.8,2.1,0.8,2.8,0c0.8-0.8,0.8-2.1,0-2.8L18.8,16z"
      fill={accent}
    />
  </svg>
)

const Board: FC<Props> = ({board, handleClick}: Props) => {
  return (
    <Container>
      {
        board.map((row, i) => (
          row.map((cell, j) => (
            <Cell key={`${i}-${j}`} onClick={() => handleClick(i, j)}>
              {cell !== 0 && (cell == 1 ? <Cross/> : <Circle/>)}
            </Cell>
          )
          )
        ))
      }
    </Container>
  )
}

export default Board
