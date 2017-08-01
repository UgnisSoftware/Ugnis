/*
 Ugnis React Native Compiler
 Copyright (C) 2017  Karolis Masiulis

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published
 by the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
React exporter:
import React from 'react';

class App extends Component {
  constructor(){
    super();
    this.state = {
        DEFAULT STATE
    }
  }

  EVENT() {
    setState
  }

  render() {
    return (
      <div style={STYLE} onClick={EVENT.bind(this)>
         COMPONENT TREE
      </div>
    );
  }
}

 */

function flatten(arr) {
    return arr.join('')
}

module.exports = definition => {
    function createDefaultState() {
        return Object.keys(definition.state)
            .map(key => definition.state[key])
            .reduce((acc, def) => {
                acc[def.ref] = def.defaultValue
                return acc
            }, {})
    }

    let styles = {}

    const state = JSON.stringify(createDefaultState())

    function resolve(ref) {
        // static value (string/number)
        if (ref.ref === undefined) {
            return ref
        }
        const def = definition[ref.ref][ref.id]
        if (ref.ref === 'pipe') {
            return pipe(ref)
        }
        if (ref.ref === 'conditional') {
            return resolve(def.predicate)
                ? resolve(def.then)
                : resolve(def.else)
        }
        if (ref.ref === 'state') {
            return currentState[ref.id]
        }
        if (ref.ref === 'vNodeBox') {
            return boxNode(ref)
        }
        if (ref.ref === 'vNodeText') {
            return textNode(ref)
        }
        if (ref.ref === 'vNodeInput') {
            return inputNode(ref)
        }
        if (ref.ref === 'vNodeList') {
            return listNode(ref)
        }
        if (ref.ref === 'vNodeIf') {
            return ifNode(ref)
        }
        if (ref.ref === 'vNodeImage') {
            return imageNode(ref)
        }
        if (ref.ref === 'style') {
            return Object.keys(def).reduce((acc, val) => {
                acc[val] = resolve(def[val])
                return acc
            }, {})
        }
        if (ref.ref === 'eventData') {
            return eventData[ref.id]
        }
        if (ref.ref === 'listValue') {
            return currentMapValue[def.list.id][def.property]
        }
        throw Error(ref)
    }

    function transformValue(value, transformations) {
        for (let i = 0; i < transformations.length; i++) {
            const ref = transformations[i]
            const transformer = definition[ref.ref][ref.id]
            if (ref.ref === 'equal') {
                value = value === resolve(transformer.value)
            }
            if (ref.ref === 'add') {
                value = value + resolve(transformer.value)
            }
            if (ref.ref === 'subtract') {
                value = value - resolve(transformer.value)
            }
            if (ref.ref === 'multiply') {
                value = value * resolve(transformer.value)
            }
            if (ref.ref === 'divide') {
                value = value / resolve(transformer.value)
            }
            if (ref.ref === 'remainder') {
                value = value % resolve(transformer.value)
            }
            if (ref.ref === 'join') {
                value = value.toString().concat(resolve(transformer.value))
            }
            if (ref.ref === 'toUpperCase') {
                value = value.toUpperCase()
            }
            if (ref.ref === 'toLowerCase') {
                value = value.toLowerCase()
            }
            if (ref.ref === 'length') {
                value = value.length
            }
            if (ref.ref === 'and') {
                value = value && resolve(transformer.value)
            }
            if (ref.ref === 'or') {
                value = value || resolve(transformer.value)
            }
            if (ref.ref === 'not') {
                value = !value
            }
        }
        return value
    }

    function pipe(ref) {
        return definition[ref.ref][ref.id].value

        //const def = definition[ref.ref][ref.id]
        //return transformValue(resolve(def.value), def.transformations)
    }

    const frozenShadow = 'inset 0 0 0 3px #53d486'

    function boxNode(ref) {
        const node = definition[ref.ref][ref.id]
        styles[ref.id] = resolve(node.style)
        // const events = '' +
        //         node.click ? `onClick={click-${node.click.ref}.bind(this)}` : '' +
        //         node.dblclick ? `onDoubleClick={dblclick-${node.dblclick.ref}.bind(this)}` : '' +
        //         node.mouseover ? `mouseOver={mouseover-${node.mouseover.ref}.bind(this)}` : '' +
        //         node.mouseout ? `mouseOut={mouseout-${node.mouseout.ref}.bind(this)}` : ''
        return `<View style={styles["${ref.id}"]}>${resolve(
            flatten(node.children.map(resolve))
        )}</View>`
    }

    function ifNode(ref) {
        const node = definition[ref.ref][ref.id]
        return resolve(node.value) ? node.children.map(resolve) : []
    }

    function textNode(ref) {
        const node = definition[ref.ref][ref.id]
        styles[ref.id] = resolve(node.style)
        return `<Text style={styles["${ref.id}"]} >${resolve(
            node.value
        )}</Text>`
    }

    function imageNode(ref) {
        const node = definition[ref.ref][ref.id]
        styles[ref.id] = resolve(node.style)

        return `<Image style={styles["${ref.id}"]} source={require(".${resolve(
            node.src
        )}")} />`
    }

    function inputNode(ref) {
        const node = definition[ref.ref][ref.id]
        const style = JSON.stringify(resolve(node.style))

        return h('input', data)
    }

    function listNode(ref) {
        const node = definition[ref.ref][ref.id]
        const list = resolve(node.value)

        const children = Object.keys(list)
            .map(key => list[key])
            .map((value, index) => {
                currentMapValue[ref.id] = value
                currentMapIndex[ref.id] = index

                return node.children.map(resolve)
            })
        delete currentMapValue[ref.id]
        delete currentMapIndex[ref.id]

        return children
    }

    const events = ''

    const components = resolve({ ref: 'vNodeBox', id: '_rootNode' })

    const cleaneUpStyle = Object.keys(styles).reduce((acc, id) => {
        const fixedStyle = Object.keys(styles[id]).reduce((acc, style) => {
            if (
                styles[id][style] === '' ||
                styles[id][style] === 'none' ||
                style === 'boxShadow' ||
                style === 'cursor' ||
                style === 'fontFamily'
            ) {
                return acc
            }
            if (style === 'fontWeight') {
                acc[style] = styles[id][style]
                return acc
            }
            if (style === 'flex') {
                acc[style] = parseInt(styles[id][style][0])
                return acc
            }
            acc[style] = parseInt(styles[id][style])
                ? parseInt(styles[id][style])
                : parseInt(styles[id][style].slice(0, -2))
                  ? parseInt(styles[id][style].slice(0, -2))
                  : styles[id][style]
            return acc
        }, {})
        acc[id] = fixedStyle
        return acc
    }, {})
    return `
    
import React from 'react'
import {StyleSheet, View, Text, Image} from 'react-native'

class App extends React.Component {
  constructor(){
    super();
    this.state = {
       
    }
  }
  
  ${events}

  render() {
    return (
      ${components}
    );
  }
}

const styles = StyleSheet.create(
    ${JSON.stringify(cleaneUpStyle, undefined, 4)}
);

export default App;
    `
}
