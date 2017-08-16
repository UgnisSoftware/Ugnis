import h from 'snabbdom/h'
import {state} from '../../state'
import {
    CHANGE_STATIC_VALUE,
} from '../../events'
import {
    arrowIcon
} from '../icons'
import emberEditor from './ember/ember'

export default () => {
    const selectedNode = state.definitionList[state.currentDefinitionId][state.selectedViewNode.ref][state.selectedViewNode.id]
    const selectedStyle = state.definitionList[state.currentDefinitionId].style[selectedNode.style.id]
    return h(
        'div',
        {
            attrs: {class: 'better-scrollbar'},
            style: {overflow: 'auto'},
        },
        [
            h(
                'div',
                {
                    style: {
                        padding: '15px 15px 5px',
                        borderBottom: '2px solid #888',
                        letterSpacing: '1px',
                        cursor: 'pointer',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                    },
                    on: {
                        //click: [SELECT_VIEW_SUBMENU, 'events']
                    },
                },
                [arrowIcon(), 'Layout']
            ),
            h(
                'div',
                [
                    h('div', {
                        style: {
                            display: 'flex',
                        }
                    },[
                        h(
                            'div',
                            [
                                h(
                                    'div',
                                    {
                                        style: {
                                            padding: '20px 20px 5px 20px',
                                            fontSize: '12px',
                                            textTransform: 'uppercase',
                                            fontWeight: 'bold',
                                            letterSpacing: '1px',
                                            color: '#8e8e8e',
                                        },
                                    },
                                    'Class'
                                ),
                                // TODO make into ember
                                h('div', {style: {padding: '0px 20px'}}, [
                                    h('input', {
                                        style: {
                                            color: 'white',
                                            background: 'none',
                                            outline: 'none',
                                            border: 'none',
                                            boxShadow: 'inset 0 -2px 0 0 #ccc',
                                            width: '100px',
                                        },
                                        on: {
                                            input: [CHANGE_STATIC_VALUE, state.selectedViewNode, 'class', 'text'],
                                        },
                                        liveProps: {
                                            value: selectedNode.class === undefined ? '' :selectedNode.class,
                                        },
                                    }),
                                ]),
                            ]
                        ),
                        h(
                            'div',
                            [
                                h(
                                    'div',
                                    {
                                        style: {
                                            padding: '20px 20px 5px 10px',
                                            fontSize: '12px',
                                            textTransform: 'uppercase',
                                            fontWeight: 'bold',
                                            letterSpacing: '1px',
                                            color: '#8e8e8e',
                                        },
                                    },
                                    'ID'
                                ),
                                // TODO make into ember
                                h('div', {style: {padding: '0 0 0 10px'}}, [
                                    h('input', {
                                        style: {
                                            color: 'white',
                                            background: 'none',
                                            outline: 'none',
                                            border: 'none',
                                            boxShadow: 'inset 0 -2px 0 0 #ccc',
                                            width: '100px',
                                        },
                                        on: {
                                            input: [CHANGE_STATIC_VALUE, state.selectedViewNode, 'id', 'text'],
                                        },
                                        liveProps: {
                                            value: selectedNode.id === undefined ? '' :selectedNode.id,
                                        },
                                    }),
                                ]),
                            ]
                        ),
                    ]),
                    h('div', {
                        style: {
                            display: 'flex',
                        }
                    },[
                        h(
                            'div',
                            [
                                h(
                                    'div',
                                    {
                                        style: {
                                            padding: '20px 20px 5px 20px',
                                            fontSize: '12px',
                                            textTransform: 'uppercase',
                                            fontWeight: 'bold',
                                            letterSpacing: '1px',
                                            color: '#8e8e8e',
                                        },
                                    },
                                    'Flex'
                                ),
                                h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['flex'], 'text')]),
                            ]
                        ),
                        h(
                            'div',
                            [
                                h(
                                    'div',
                                    {
                                        style: {
                                            padding: '20px 20px 5px 20px',
                                            fontSize: '12px',
                                            textTransform: 'uppercase',
                                            fontWeight: 'bold',
                                            letterSpacing: '1px',
                                            color: '#8e8e8e',
                                        },
                                    },
                                    'Width'
                                ),
                                h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['width'], 'text')]),
                            ]
                        ),
                        h(
                            'div',
                            [
                                h(
                                    'div',
                                    {
                                        style: {
                                            padding: '20px 20px 5px 20px',
                                            fontSize: '12px',
                                            textTransform: 'uppercase',
                                            fontWeight: 'bold',
                                            letterSpacing: '1px',
                                            color: '#8e8e8e',
                                        },
                                    },
                                    'Height'
                                ),
                                h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['height'], 'text')]),
                            ]
                        ),
                    ]),
                    h('div', {
                        style: {
                            display: 'flex',
                        }
                    },[
                        h(
                            'div',
                            [
                                h(
                                    'div',
                                    {
                                        style: {
                                            padding: '20px 20px 5px 20px',
                                            fontSize: '12px',
                                            textTransform: 'uppercase',
                                            fontWeight: 'bold',
                                            letterSpacing: '1px',
                                            color: '#8e8e8e',
                                        },
                                    },
                                    'Margin'
                                ),
                                h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['margin'], 'text')]),
                            ]
                        ),
                        h(
                            'div',
                            [
                                h(
                                    'div',
                                    {
                                        style: {
                                            padding: '20px 20px 5px 20px',
                                            fontSize: '12px',
                                            textTransform: 'uppercase',
                                            fontWeight: 'bold',
                                            letterSpacing: '1px',
                                            color: '#8e8e8e',
                                        },
                                    },
                                    'Padding'
                                ),
                                h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['padding'], 'text')]),
                            ]
                        ),
                    ]),
                    h(
                        'div',
                        {
                            style: {
                                padding: '20px 20px 5px 20px',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '1px',
                                color: '#8e8e8e',
                            },
                        },
                        'Position'
                    ),
                    h(
                        'div',
                        {
                            style: {
                                padding: '0px 20px',
                                display: 'flex',
                                justifyContent: 'space-between',
                            },
                        },
                        [emberEditor(selectedStyle['position'], {type: 'variant', values: ['relative', 'absolute']})]
                    ),
                    h(
                        'div',
                        {
                            style: {
                                display: 'flex'
                            }
                        },
                        [
                            h(
                                'div',
                                [
                                    h(
                                        'div',
                                        {
                                            style: {
                                                padding: '20px 20px 5px 20px',
                                                fontSize: '12px',
                                                textTransform: 'uppercase',
                                                fontWeight: 'bold',
                                                letterSpacing: '1px',
                                                color: '#8e8e8e',
                                            },
                                        },
                                        'Top'
                                    ),
                                    h(
                                        'div',
                                        {
                                            style: {
                                                padding: '0px 20px',
                                                display: 'flex',
                                            },
                                        },
                                        [emberEditor(selectedStyle['top'], 'text')]
                                    ),
                                ]
                            ),
                            h(
                                'div',
                                [
                                    h(
                                        'div',
                                        {
                                            style: {
                                                padding: '20px 20px 5px 20px',
                                                fontSize: '12px',
                                                textTransform: 'uppercase',
                                                fontWeight: 'bold',
                                                letterSpacing: '1px',
                                                color: '#8e8e8e',
                                            },
                                        },
                                        'Right'
                                    ),
                                    h(
                                        'div',
                                        {
                                            style: {
                                                padding: '0px 20px',
                                                display: 'flex',
                                            },
                                        },
                                        [emberEditor(selectedStyle['right'], 'text')]
                                    ),
                                ]
                            ),
                            h(
                                'div',
                                [
                                    h(
                                        'div',
                                        {
                                            style: {
                                                padding: '20px 20px 5px 20px',
                                                fontSize: '12px',
                                                textTransform: 'uppercase',
                                                fontWeight: 'bold',
                                                letterSpacing: '1px',
                                                color: '#8e8e8e',
                                            },
                                        },
                                        'Bottom'
                                    ),
                                    h(
                                        'div',
                                        {
                                            style: {
                                                padding: '0px 20px',
                                                display: 'flex',
                                            },
                                        },
                                        [emberEditor(selectedStyle['bottom'], 'text')]
                                    ),
                                ]
                            ),
                            h(
                                'div',
                                [
                                    h(
                                        'div',
                                        {
                                            style: {
                                                padding: '20px 20px 5px 20px',
                                                fontSize: '12px',
                                                textTransform: 'uppercase',
                                                fontWeight: 'bold',
                                                letterSpacing: '1px',
                                                color: '#8e8e8e',
                                            },
                                        },
                                        'Left'
                                    ),
                                    h(
                                        'div',
                                        {
                                            style: {
                                                padding: '0px 20px',
                                                display: 'flex',
                                            },
                                        },
                                        [emberEditor(selectedStyle['left'], 'text')]
                                    ),
                                ]
                            ),
                        ]
                    ),
                ]
            ),
            h(
                'div',
                {
                    style: {
                        padding: '15px 15px 5px',
                        borderBottom: '2px solid #888',
                        letterSpacing: '1px',
                        cursor: 'pointer',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                    },
                    on: {
                        //click: [SELECT_VIEW_SUBMENU, 'events']
                    },
                },
                [arrowIcon(), 'Children Layout']
            ),
            h(
                'div',
                {
                    style: {},
                },
                [
                    h(
                        'div',
                        {
                            style: {
                                padding: '20px 20px 5px 20px',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '1px',
                                color: '#8e8e8e',
                            },
                        },
                        'Horizontal Align'
                    ),
                    h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['justifyContent'], {type: 'variant', values: ['flex-start', 'flex-end',  'center', 'stretch','space-between', 'space-around']})]),
                    h(
                        'div',
                        {
                            style: {
                                padding: '20px 20px 5px 20px',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '1px',
                                color: '#8e8e8e',
                            },
                        },
                        'Vertical Align'
                    ),
                    h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['alignItems'], {type: 'variant', values: ['flex-start', 'flex-end', 'center', 'stretch']})]),
                    h(
                        'div',
                        {
                            style: {
                                padding: '20px 20px 5px 20px',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '1px',
                                color: '#8e8e8e',
                            },
                        },
                        'Direction'
                    ),
                    h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['flexDirection'], {type: 'variant', values: ['row', 'column']})]),
                    h(
                        'div',
                        {
                            style: {
                                padding: '20px 20px 5px 20px',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '1px',
                                color: '#8e8e8e',
                            },
                        },
                        'Wrap'
                    ),
                    h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['flexWrap'], {type: 'variant', values: ['wrap', 'nowrap']})]),
                ]
            ),
            h(
                'div',
                {
                    style: {
                        padding: '15px 15px 5px',
                        borderBottom: '2px solid #888',
                        letterSpacing: '1px',
                        cursor: 'pointer',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                    },
                    on: {
                        //click: [SELECT_VIEW_SUBMENU, 'events']
                    },
                },
                [arrowIcon(), 'Design']
            ),
            h(
                'div',
                {
                    style: {},
                },
                [
                    h(
                        'div',
                        {
                            style: {
                                padding: '20px 20px 5px 20px',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '1px',
                                color: '#8e8e8e',
                            },
                        },
                        'Background Color'
                    ),
                    h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['background'], 'text')]),
                    h(
                        'div',
                        {
                            style: {
                                padding: '20px 20px 5px 20px',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '1px',
                                color: '#8e8e8e',
                            },
                        },
                        'Opacity'
                    ),
                    h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['opacity'], 'number')]),
                    h(
                        'div',
                        {
                            style: {
                                padding: '20px 20px 5px 20px',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '1px',
                                color: '#8e8e8e',
                            },
                        },
                        'Borders'
                    ),
                    h(
                        'div',
                        {
                            style: {
                                padding: '0px 20px',
                                display: 'flex',
                                justifyContent: 'space-between',
                            },
                        },
                        [emberEditor(selectedStyle['border'], 'text')]
                    ),
                    h(
                        'div',
                        {
                            style: {
                                padding: '20px 20px 5px 20px',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '1px',
                                color: '#8e8e8e',
                            },
                        },
                        'Border Radius'
                    ),
                    h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['borderRadius'], 'text')]),
                    h(
                        'div',
                        {
                            style: {
                                padding: '20px 20px 5px 20px',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '1px',
                                color: '#8e8e8e',
                            },
                        },
                        'Box Shadow'
                    ),
                    h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['boxShadow'], 'text')]),
                    h(
                        'div',
                        {
                            style: {
                                padding: '20px 20px 5px 20px',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '1px',
                                color: '#8e8e8e',
                            },
                        },
                        'Cursor'
                    ),
                    h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['cursor'], 'text')]),
                    h(
                        'div',
                        {
                            style: {
                                padding: '20px 20px 5px 20px',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '1px',
                                color: '#8e8e8e',
                            },
                        },
                        'Transition'
                    ),
                    h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['transition'], 'text')]),
                ]
            ),
            state.selectedViewNode.ref === 'vNodeText' || state.selectedViewNode.ref === 'vNodeInput' ?
                h(
                    'div',
                    {
                        style: {
                            padding: '15px 15px 5px',
                            borderBottom: '2px solid #888',
                            letterSpacing: '1px',
                            cursor: 'pointer',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                        },
                        on: {
                            //click: [SELECT_VIEW_SUBMENU, 'events']
                        },
                    },
                    [arrowIcon(), 'Text']
                ) : h('div'),
            state.selectedViewNode.ref === 'vNodeText' || state.selectedViewNode.ref === 'vNodeInput'
                ? h(
                'div',
                {
                    style: {},
                },
                [
                    h(
                        'div',
                        {
                            style: {
                                padding: '20px 20px 5px 20px',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '1px',
                                color: '#8e8e8e',
                            },
                        },
                        'Font Color'
                    ),
                    h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['color'], 'text')]),
                    h(
                        'div',
                        {
                            style: {
                                padding: '20px 20px 5px 20px',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '1px',
                                color: '#8e8e8e',
                            },
                        },
                        'Font size'
                    ),
                    h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['fontSize'], 'text')]),
                    h(
                        'div',
                        {
                            style: {
                                padding: '20px 20px 5px 20px',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '1px',
                                color: '#8e8e8e',
                            },
                        },
                        'Font Family'
                    ),
                    h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['fontFamily'], 'text')]),
                    h(
                        'div',
                        {
                            style: {
                                padding: '20px 20px 5px 20px',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '1px',
                                color: '#8e8e8e',
                            },
                        },
                        'Font Weight'
                    ),
                    h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['fontWeight'], 'text')]),
                    h(
                        'div',
                        {
                            style: {
                                padding: '20px 20px 5px 20px',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '1px',
                                color: '#8e8e8e',
                            },
                        },
                        'Font Style'
                    ),
                    h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['fontStyle'], 'text')]),
                    h(
                        'div',
                        {
                            style: {
                                padding: '20px 20px 5px 20px',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '1px',
                                color: '#8e8e8e',
                            },
                        },
                        'Line Height'
                    ),
                    h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['lineHeight'], 'text')]),
                    h(
                        'div',
                        {
                            style: {
                                padding: '20px 20px 5px 20px',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '1px',
                                color: '#8e8e8e',
                            },
                        },
                        'Text decoration line'
                    ),
                    h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['textDecorationLine'], 'text')]),
                    h(
                        'div',
                        {
                            style: {
                                padding: '20px 20px 5px 20px',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '1px',
                                color: '#8e8e8e',
                            },
                        },
                        'Letter spacing'
                    ),
                    h('div', {style: {padding: '0px 20px'}}, [emberEditor(selectedStyle['letterSpacing'], 'text')]),
                ]
            )
                : h('div'),
        ]
    )
}