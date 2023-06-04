import React from "react"
import styled, { createGlobalStyle } from "styled-components"
import { text, background, gradient } from "@salutejs/plasma-tokens"
import { createAssistant, createSmartappDebugger } from "@salutejs/client"
import { AssistantClient } from "@salutejs/client"
import { Board } from "./components"
import makeMove from "./ai_gomoku_negascout.tsx"

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
  winner: number,
  last_move_valid: boolean,
  can_move: boolean,
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
      last_move_valid: true,
      winner: 0,
      can_move: true,
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
    // Коды game_status
    // игра продолжается == 0
    // последний ход игрока был невалидным == 1
    // победил игрок == 2
    // победил ИИ == 3
    let game_status = 0;
    if (this.state.last_move_valid) {
      if (this.state.winner == 1) {
        game_status = 2;
      } else if (this.state.winner == -1) {
        game_status = 3
      }
    } else {
      game_status = 1;
    }

    const state = {
      game_state: {
        game_status: game_status,
      }
    }
    return state
  }

  dispatchAssistantAction(action: Action) {
    console.log("Action dispatching: ", action)
    if (action) {
      switch (action.type) {
        case 'player_move':
          return this.handleClick(action.move.x - 1, action.move.y - 1)
        case 'reset_game':
          return this.resetGame()
        default:
          throw new Error()
      }
    }
  }

  resetGame() {
    this.setState({
      board: Array(15)
        .fill(null)
        .map(() => Array(15).fill(0)),
      last_move_valid: true,
      winner: 0,
      can_move: true,
    });
  }

  handleClick(i: number, j: number) {
    console.log("Attempted click: ", i, j);
    if (this.state.can_move) {
      this.state.can_move = false;
      console.log("Click processing: ", i, j);
      const movedata = makeMove(this.state.board.slice(), i, j, 1)
      this.setState({
        ...this.state,
        board: movedata.new_board || this.state.board,
        last_move_valid: movedata.move_valid,
        winner: movedata.winner,
        can_move: true,
      });
      this._send_action("registered_move", null)
    }
  }

  _send_action(action_id: string, value: any) {
    const data = {
      action: {
        action_id: action_id,
        parameters: {
          value: value
        }
      }
    };

    const unsubscribe = this.assistant.sendData(
      data, 
      (data: any) => {
        const {type, payload} = data;
        console.log("sendData onData:", type, payload);
        unsubscribe();
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
        <MainStyles />
      </>
    )
  }
}

export default App
