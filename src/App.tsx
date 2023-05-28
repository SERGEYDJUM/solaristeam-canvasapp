import React from "react"
import styled from "styled-components"
import {createAssistant, createSmartappDebugger} from "@salutejs/client"
import {AssistantClient} from "@salutejs/client"
import {Board} from "./components"

const Container = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
`

const initializeAssistant = (getState: () => object): AssistantClient => {
  if (import.meta.env.DEV) {
    return createSmartappDebugger({
      token: import.meta.env.VITE_REACT_APP_TOKEN as string ?? "",
      initPhrase: `Запусти ${import.meta.env.VITE_REACT_APP_SMARTAPP}`,
      getState,
    }) as AssistantClient
  }
  return createAssistant({ getState }) as AssistantClient
}

type State = {
  board: Array<Array<number>>,
  playerTurn: boolean,
}

class App extends React.Component<never, State> {
  assistant: AssistantClient
  state: State

  constructor(props: never) {
    super(props);

    this.assistant = initializeAssistant(() => this.getStateForAssistant())
    this.state = {
      board: Array(15)
        .fill(null)
        .map(() => Array(15).fill(0)),
      playerTurn: true,
    }

    this.handleClick.bind(this)
  }

  getStateForAssistant(): object {
    return {}
  }

  handleClick(i, j) {
    console.log(i, j);
    const board = this.state.board.slice();
    board[i][j] = this.state.playerTurn ? 1 : -1;
    this.setState({
      ...this.state,
      playerTurn: !this.state.playerTurn,
      board: board
    });
  }

  render() {

    return (
      <>
        <Container>
          <Board
            board={this.state.board}
            handleClick={(i, j) => this.handleClick(i, j)}
          />
        </Container>
      </>
    )
  }
}

export default App
