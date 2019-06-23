console.log('process.env.NODE_ENV', process.env.NODE_ENV)

let ws
if (process.env.NODE_ENV === 'development') {
    ws = 'ws://localhost:1026/board'
} else {
    ws = 'wss://nodeapi.yunser.com/board'
}
export default {
    ws
}