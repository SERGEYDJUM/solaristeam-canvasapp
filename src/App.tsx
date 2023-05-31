import React from "react"
import styled from "styled-components"
import {createAssistant, createSmartappDebugger} from "@salutejs/client"
import {AssistantClient} from "@salutejs/client"
import {Board} from "./components"
import {Button, TextL} from "@salutejs/plasma-ui"
import _ from "lodash"

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

const ModalContent = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
`

const MenuContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(255,255,255,0.06);
  border-radius: 16px;
  width: 100%;
  padding: 24px;
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
  playerSide: number,
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
      playerSide: _.sample([-1, 1]) as number,
    }

    this.handleClick.bind(this)
  }

  getStateForAssistant(): object {
    return {}
  }

  handleClick(i, j) {
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
        <Layout>
          <Container>
            <MenuContainer>
              <TextL>
                {this.state.playerSide === 1 ? "Вы играете за крестики" : "Вы играете за нолики"}
              </TextL>
              <Button text="Новая игра" size="s" view="overlay" />
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
