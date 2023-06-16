import React from "react"
import styled from "styled-components"
import { AssistantAppState, createAssistant, createSmartappDebugger } from "@salutejs/client"
import { AssistantClient } from "@salutejs/client"
import { Board } from "./components"
import { Button, TextM } from "@salutejs/plasma-ui"
import _ from "lodash"
import makeMove from "./ai_gomoku_negascout"


const Layout = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
`

const Container = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  margin-top: 24px;
`

const MenuText = styled(TextM)`
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 50%;
  white-space: nowrap;
`

const MenuContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(255,255,255,0.06);
  border-radius: 16px;
  width: 100%;
  padding: 16px;
`

interface Action {
  type: string,
  move: { x: number, y: number }
}

const initializeAssistant = (getState: () => AssistantAppState): AssistantClient => {
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
  playerSide: number,
  last_ai_move: { x: number, y: number }
}

class App extends React.Component<never, State> {
  assistant: AssistantClient
  state: State

  _test_board(): number[][] {
    return [
      [1, 1, 1, -1, -1, -1, 1, 1, 1, -1, -1, -1, 1, 1, 1],
      [-1, -1, -1, 1, 1, 1, -1, -1, -1, 1, 1, 1, -1, -1, -1],
      [1, 1, 1, -1, -1, -1, 1, 1, 1, -1, -1, -1, 1, 1, 1],
      [-1, -1, -1, 1, 1, 1, -1, -1, -1, 1, 1, 1, -1, -1, -1],
      [1, 1, 1, -1, -1, -1, 1, 1, 1, -1, -1, -1, 1, 1, 1],
      [-1, -1, -1, 1, 1, 1, -1, -1, -1, 1, 1, 1, -1, -1, -1],
      [1, 1, 1, -1, -1, -1, 1, 1, 1, -1, -1, -1, 1, 1, 1],
      [-1, -1, -1, 1, 1, 1, -1, -1, -1, 1, 1, 1, -1, -1, -1],
      [1, 1, 1, -1, -1, -1, 1, 1, 1, -1, -1, -1, 1, 1, 1],
      [-1, -1, -1, 1, 1, 1, -1, -1, -1, 1, 1, 1, -1, -1, -1],
      [1, 1, 1, -1, -1, -1, 1, 1, 1, -1, -1, -1, 1, 1, 1],
      [-1, -1, -1, 1, 1, 1, -1, -1, -1, 1, 1, 1, -1, -1, -1],
      [1, 1, 1, -1, -1, -1, 1, 1, 1, -1, -1, -1, 1, 1, 1],
      [-1, -1, -1, 1, 1, 1, -1, -1, -1, 1, 1, 1, -1, 0, 0],
      [1, 1, 1, -1, -1, -1, 1, 1, 1, -1, -1, -1, 1, 0, 0]
    ]
  }

  constructor(props: never) {
    super(props);
    this.state = {
      board: Array(15)
        .fill(null)
        .map(() => Array(15).fill(0)),
      last_move_valid: true,
      winner: 0,
      can_move: true,
      playerSide: _.sample([-1, 1]) as number,
      last_ai_move: { x: 0, y: 0 }
    }

    this.assistant = initializeAssistant(() => this.getStateForAssistant())
    this.assistant.on("data", (event: any) => {
      console.log(`assistant.on(data)`, event);
      const { action } = event
      this.dispatchAssistantAction(action);
    });

    this.handleClick.bind(this)
  }

  getStateForAssistant(): AssistantAppState {
    // Коды game_status
    // игра продолжается == 0
    // последний ход игрока был невалидным == 1
    // победил игрок == 2
    // победил ИИ == 3
    let game_status = 0;
    if (this.state.last_move_valid) {
      if (this.state.winner == this.state.playerSide) {
        game_status = 2;
      } else if (this.state.winner == -this.state.playerSide) {
        game_status = 3
      } else if (this.state.winner == 2) {
        game_status = 4
      }
    } else {
      game_status = 1;
    }

    const state = {
      game_state: {
        game_status: game_status,
        ai_move: this.state.last_ai_move
      }
    }

    console.log("State sending: ", state)
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
      // board: this._test_board(),
      last_move_valid: true,
      winner: 0,
      can_move: true,
      playerSide: -this.state.playerSide,
      last_ai_move: { x: 0, y: 0 }
    });
  }

  handleClick(i: number, j: number) {
    console.log("Attempted click: ", i, j);
    if (this.state.can_move) {
      this.state.can_move = false;
      console.log("Click processing: ", i, j);
      const movedata = makeMove(this.state.board.slice(), i, j, this.state.playerSide)
      console.log("AI Move Calculated: ", movedata.ai_move)
      this.state.board = movedata.new_board || this.state.board;
      this.state.last_ai_move = movedata.ai_move
      this.state.can_move = (movedata.winner == 0)
      this.state.winner = movedata.winner
      this.state.last_move_valid = movedata.move_valid

      this.setState({ ...this.state });
      console.log("AI Moved: ", this.state.last_ai_move)
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
        const { type, payload } = data;
        console.log("sendData onData:", type, payload);
        unsubscribe();
      });
  }

  get_label_text(): string {
    if (this.state.winner == this.state.playerSide) {
      return "Вы победили";
    }
    else if (this.state.winner == -this.state.playerSide) {
      return "Вы проиграли"
    }
    else if (this.state.winner == 2) {
      return "Ничья"
    }
    else {
      return this.state.playerSide === 1 ? "Вы играете за ⨉" : "Вы играете за ◯"
    }
  }

  render() {
    return (
      <>
        <Layout>
          <Container>
            <MenuContainer>
              <MenuText>
                {this.get_label_text()}
              </MenuText>
              <Button
                text="Новая игра"
                size="s"
                view="overlay"
                onClick={() => this._send_action("reset_game", null)}
              />
            </MenuContainer>
            <Board
              board={this.state.board}
              handleClick={(i, j) => this.handleClick(i, j)}
            />
          </Container>
        </Layout>
      </>
    )
  }
}

export default App
