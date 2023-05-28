import React from "react"
import styled, { createGlobalStyle } from "styled-components"
import { text, background, gradient } from "@salutejs/plasma-tokens"
import { createAssistant, createSmartappDebugger } from "@salutejs/client"
import { AssistantClient } from "@salutejs/client"
import { Board } from "./components"

const MainStyles = createGlobalStyle`
  body {
    color: ${text};
    background-color: ${background};
    background-image: ${gradient};
    margin: 0;
  }
`

const Container = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
`

interface Action {
  type: string,
  move: { x: number, y: number }
}

const initializeAssistant = (getState: () => object): AssistantClient => {
  if (import.meta.env.DEV) {
    return createSmartappDebugger({
      token: import.meta.env.VITE_APP_TOKEN as string ?? "",
      initPhrase: `Запусти ${import.meta.env.VITE_APP_SMARTAPP}`,
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
    this.state = {
      board: Array(15)
        .fill(null)
        .map(() => Array(15).fill(0)),
      playerTurn: true,
    }

    this.assistant = initializeAssistant(() => this.getStateForAssistant())
    this.assistant.on("data", (event) => {
      console.log(`assistant.on(data)`, event);
      const { action } = event
      this.dispatchAssistantAction(action);
    });

    this.handleClick.bind(this)
  }

  getStateForAssistant(): object {
    const state = {
      game_state: {
        playerTurn: this.state
      }
    }
    return state
  }

  dispatchAssistantAction(action: Action) {
    console.log("Action dispatching: ", action)
    if (action) {
      switch (action.type) {
        case 'player_move':
          return this.handleClick(action.move.x, action.move.y, true)
        case 'reset_game':
          return this.resetGame()
        default:
          throw new Error()
      }
    }
  }

  resetGame() {
    this.state = {
      board: Array(15)
        .fill(null)
        .map(() => Array(15).fill(0)),
      playerTurn: true,
    }
  }

  handleClick(i: number, j: number, player: boolean) {
    console.log("Attempted click: ", i, j);
    if (player == this.state.playerTurn) {
      const board = this.state.board.slice();
      board[i][j] = this.state.playerTurn ? 1 : -1;
      this.setState({
        ...this.state,
        playerTurn: !this.state.playerTurn,
        board: board
      });
    }
  }

  render() {

    return (
      <>
        <Container>
          <Board
            board={this.state.board}
            handleClick={(i, j) => this.handleClick(i, j, true)}
          />
        </Container>
        <MainStyles />
      </>
    )
  }
}

export default App
