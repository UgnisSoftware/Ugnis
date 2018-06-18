import { listen } from 'lape'
import { render } from 'react-dom'
import * as React from 'react'
import './state'
import './shortcuts'
import './server'
import Root from './components/root'
let node = document.getElementById('editor')
function renderer() {
    render(<Root />, node)
}
listen(renderer)
window.addEventListener('resize', renderer, false)
window.addEventListener('orientationchange', renderer, false)
