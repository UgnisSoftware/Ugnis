import h from 'snabbdom/h'

export const boxIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'layers')
export const ifIcon = () =>h('i', {attrs: { class: 'material-icons' }, style: { transform: 'rotate(90deg)' },}, 'call_split')
export const moreIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'more_horiz')
export const linkIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'link')
export const numberIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'looks_one')
export const listIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'view_list')
export const inputIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'input')
export const textIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'title')
export const textReverseIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'format_size')
export const deleteIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'delete_forever')
export const clearIcon = () => h('i', { attrs: { class: 'material-icons', 'data-trashcan': true } }, 'clear')
export const closeIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'close')
export const addCircleIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'add_circle')
export const folderIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'folder')
export const repeatIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'loop')
export const historyIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'history')
export const pauseIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'pause')
export const playIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'play_arrow')
export const fullscreenIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'fullscreen')
export const fullscreenExitIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'fullscreen_exit')
export const saveIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'check')
export const dotIcon = () =>h('img', {attrs: { src: '/images/ugn.png', width: '18', height: '18' },})
export const storageIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'storage')
export const eventListIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'event_note')
export const imageIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'crop_original')
export const warningIcon = () =>h('i',{ attrs: { class: 'material-icons' },style: { cursor: 'default' },}, 'whatshot') // priority_high
export const appIcon = () => h('i', { attrs: { class: 'material-icons' }, style: { fontSize: '18px' } }, 'description')
export const arrowRightIcon = () => h('i', { attrs: { class: 'material-icons' } }, 'arrow_forward')
export const arrowIcon = rotate =>
    h(
        'i',
        {
            attrs: { class: 'material-icons', 'data-closearrow': true },
            style: {
                transition: 'all 0.2s',
                transform: rotate ? 'rotate(-90deg)' : 'rotate(0deg)',
                cursor: 'pointer',
            },
        },
        'arrow_drop_down'
    )

// export default {
//     boxIcon,
//     ifIcon,
//     moreIcon,
//     linkIcon,
//     numberIcon, 
//     listIcon,  
//     inputIcon, 
//     textIcon, 
//     textReverseIcon,
//     deleteIcon, 
//     clearIcon, 
//     closeIcon,  
//     addCircleIcon,
//     folderIcon, 
//     repeatIcon, 
//     historyIcon,
//     pauseIcon, 
//     playIcon, 
//     fullscreenIcon, 
//     fullscreenExitIcon,
//     saveIcon, 
//     dotIcon, 
//     storageIcon, 
//     eventListIcon, 
//     imageIcon, 
//     warningIcon, 
//     appIcon, 
//     arrowRightIcon, 
//     arrowIcon,
// }