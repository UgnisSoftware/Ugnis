import * as React from 'react'
import styled from 'styled-components'

import TopBar from './TopBar/TopBar'
import Preview from './Preview/Preview'
import Zoom from './Zoom/Zoom'
import state from '@state'

const Center = styled.div`
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
`

const zoom = e => {
  if (e.deltaY < 0 && state.ui.zoom + 10 < 210) {
    state.ui.zoom += 10
  }
  if (e.deltaY > 0 && state.ui.zoom - 10 > 20) {
    state.ui.zoom -= 10
  }
}
const deleteComponent = e => {
  const del = e.keyCode === 46
  const backspace = e.keyCode === 8
  const component = state.components[state.ui.router.componentId]

  if (
    (del || backspace) &&
    state.ui.selectedNode &&
    !state.ui.editingTextNode &&
    component.root !== state.ui.selectedNode
  ) {
    const nodeIndex = component.root.children.indexOf(state.ui.selectedNode)
    component.root.children.splice(nodeIndex, 1)
  }
}

class CenterColumn extends React.Component {
  componentDidMount() {
    window.addEventListener('keydown', deleteComponent)
  }
  componentWillUnmount() {
    window.removeEventListener('keydown', deleteComponent)
  }

  render() {
    return (
      <Center onWheel={zoom}>
        <TopBar />
        <Preview />
        <Zoom />
      </Center>
    )
  }
}
export default CenterColumn
