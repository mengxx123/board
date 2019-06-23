import React from 'react'
import classnames from 'classnames'
import { BrowserRouter, Switch, Route, Link} from 'react-router-dom'
import config from './config'
import './App.css'
import './Editor.scss'

class Plugin {

}

class RectPlugin extends Plugin {

    onMouseDown(pt) {
        this.isDown = true
        this.downX = pt.x
        this.downY = pt.y
    }

    onMouseMove(pt) {
        if (this.isDown) {
            console.log('move', pt)
            this.moveX = pt.x
            this.moveY = pt.y
        }
    }

    onMouseUp(pt, board) {
        this.isDown = false
        let width = Math.abs(this.moveX - this.downX)
        let x = Math.min(this.moveX, this.downX)
        let height = Math.abs(this.moveY - this.downY)
        let y = Math.min(this.moveY, this.downY)
        let rect = {
            type: 'rect',
            x,
            y,
            width,
            height
        }
        board.addElem(rect)
    }

    draw(ctx) {
        if (!this.isDown) {
            return
        }
        ctx.beginPath()
        let width = Math.abs(this.moveX - this.downX)
        let x = Math.min(this.moveX, this.downX)
        let height = Math.abs(this.moveY - this.downY)
        let y = Math.min(this.moveY, this.downY)
        ctx.rect(x, y, width, height)
        // ctx.lineTo(this.moveX, this.moveY)
        ctx.stroke()
    }

}

class CirclePlugin extends Plugin {

    onMouseDown(pt) {
        this.isDown = true
        this.downX = pt.x
        this.downY = pt.y
    }

    onMouseMove(pt) {
        if (!this.isDown) {
            return
        }
        this.moveX = pt.x
        this.moveY = pt.y
    }

    onMouseUp(pt, board) {
        this.isDown = false
        let radius = Math.sqrt(Math.pow(this.moveX - this.downX, 2) + Math.pow(this.moveY - this.downY, 2))
        let circle = {
            type: 'circle',
            x: this.downX,
            y: this.downY,
            radius,
        }
        board.addElem(circle)
    }

    draw(ctx) {
        if (!this.isDown) {
            return
        }
        ctx.beginPath()
        let radius = Math.sqrt(Math.pow(this.moveX - this.downX, 2) + Math.pow(this.moveY - this.downY, 2))
        ctx.arc(this.downX, this.downY, radius, 0, Math.PI * 2)
        ctx.stroke()
    }

}

class LinePlugin {

    onMouseDown(pt) {
        this.isDown = true
        this.downX = pt.x
        this.downY = pt.y
    }

    onMouseMove(pt) {
        if (this.isDown) {
            console.log('move', pt)
            this.moveX = pt.x
            this.moveY = pt.y
        }
    }

    onMouseUp(pt, board) {
        this.isDown = false
        let line = {
            type: 'line',
            x: this.downX,
            y: this.downY,
            x2: this.moveX,
            y2: this.moveY
        }
        board.addElem(line)
    }

    draw(ctx) {
        if (!this.isDown) {
            return
        }
        ctx.beginPath()
        ctx.moveTo(this.downX, this.downY)
        ctx.lineTo(this.moveX, this.moveY)
        ctx.stroke()
    }
}

class PenPlugin extends Plugin {

    constructor() {
        super()
        this.paths = []
    }

    onMouseDown(pt) {
        this.isDown = true
        this.downX = pt.x
        this.downY = pt.y
        this.paths = []
    }

    onMouseMove(pt) {
        if (this.isDown) {
            console.log('move', pt)
            this.moveX = pt.x
            this.moveY = pt.y
            this.paths.push({
                x: pt.x,
                y: pt.y
            })
        }
    }

    onMouseUp(pt, board) {
        this.isDown = false
        let path = {
            type: 'pen',
            paths: this.paths
        }
        board.addElem(path)
    }

    draw(ctx) {
        if (!this.isDown) {
            return
        }
        console.log('this.paths', this.paths)
        if (this.paths.length > 1) {
            ctx.beginPath()
            ctx.moveTo(this.paths[0].x, this.paths[0].y)
            for (let i = 1; i < this.paths.length; i++) {
                ctx.lineTo(this.paths[i].x, this.paths[i].y)
            }
            ctx.stroke()
        }
    }
}

let rectPlugin = new RectPlugin()
let linePlugin = new LinePlugin()
let penPlugin = new PenPlugin()
let circlePlugin = new CirclePlugin()

class Board {

    constructor(canvas, socket, code) {
        this.socket = socket
        this.code = code
        socket.on('connect',  () => {
            console.log('client connect server');
            socket.on('shape', line => {
                // alert(1)
                console.log('on shape', line)
                this.elems.push(line)
                this.draw()
            })
            socket.on('cursor', cursor => {
                console.log('on cursor')
                this.cursors = [
                    cursor
                ]
                this.draw()
            })
            socket.on('getDataCallback', data => {
                console.log('全部数据', data)
                this.elems = data.elems
                this.draw()
            })
            socket.on('undo', line => {
                this.undo(false)
            })
            socket.on('clear', line => {
                this.clear(false)
            })
        })


        this.mode = 'pen'
        // this.mode = 'rect'
        this.cursor = {
            x: 0,
            y: 0
        }

        let ratio = window.devicePixelRatio

        this.canvasWidth = (window.innerWidth - 48)
        this.canvasHeight = window.innerHeight

        this.canvas = canvas
        this.canvas.width = this.canvasWidth * ratio
        this.canvas.height = this.canvasHeight * ratio
        this.canvas.style.width = this.canvasWidth + 'px'
        this.canvas.style.height = this.canvasHeight + 'px'

        this.ctx = this.canvas.getContext('2d')
        this.ctx.width = this.canvasWidth * ratio
        this.ctx.height = this.canvasHeight * ratio

        this.ctx.scale(ratio, ratio)

        this.elems = [
            // {
            //     type: 'rect',
            //     x: 10,
            //     y: 10,
            //     width: 200,
            //     height: 200
            // }
        ]
        this.histories = []

        this.draw()

        this.socket.emit('getData', {
            code: this.code
        })
    }

    getXY(e) {
        let rect = document.getElementById('canvas').getBoundingClientRect()
        let x = e.pageX - rect.left
        let y = e.pageY - rect.top
        return {
            x,
            y
        }
    }
    down(e) {
        let plugin = this.getPlugin()
        plugin.onMouseDown(this.getXY(e))
    }

    getPlugin() {
        switch (this.mode) {
            case 'rect':
                return rectPlugin
            case 'line':
                return linePlugin
            case 'pen':
                return penPlugin
            case 'circle':
                return circlePlugin
        }
    }

    up(e) {
        console.log('up', e)
        let plugin = this.getPlugin()
        plugin.onMouseUp(this.getXY(e), this)
    }

    addElem(elem) {
        this.socket.emit('shape', {
            code: this.code,
            elem
        })
        this.elems.push(elem)
    }

    move(e) {
        let plugin = this.getPlugin()
        let pt = this.getXY(e)
        plugin.onMouseMove(pt)
        this.cursor = pt
        // this.emitCursor(this.cursor)

        this.draw()
    }

    emitCursor(cursor) {
        if (new Date().getTime() - (this.lastCursorTime || 0) > 100) {
            this.lastCursorTime = new Date().getTime()
            this.socket.emit('cursor', this.cursor)
        }
    }

    draw() {
        let ctx = this.ctx
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)

        ctx.lineWidth = 0.5
        let gridSize = 64 / 4
        let num = this.canvasWidth / gridSize
        for (let i = 0; i < num; i ++) {
            let x = i * gridSize
            ctx.strokeStyle = (i % 4 === 0) ? '#ccc' : '#eee'
            ctx.beginPath()
            ctx.moveTo(x + 0.5, 0)
            ctx.lineTo(x + 0.5, this.canvasHeight)
            ctx.stroke()
        }
        num = this.canvasHeight / gridSize
        for (let i = 0; i < num; i ++) {
            let y = i * gridSize
            ctx.strokeStyle = (i % 4 === 0) ? '#ccc' : '#eee'
            ctx.beginPath()
            ctx.moveTo(0, y + 0.5)
            ctx.lineTo(this.canvasWidth, y + 0.5)
            ctx.stroke()
        }

        ctx.fillStyle = '#333'
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 1
        for (let elem of this.elems) {
            if (elem.type === 'line') {
                ctx.beginPath()
                ctx.moveTo(elem.x, elem.y)
                ctx.lineTo(elem.x2, elem.y2)
                ctx.stroke()
            }
            if (elem.type === 'rect') {
                ctx.beginPath()
                ctx.rect(elem.x, elem.y, elem.width, elem.height)
                // ctx.lineTo(elem.x2, elem.y2)
                ctx.stroke()
            }
            if (elem.type === 'pen') {
                let paths = elem.paths
                if (paths.length > 1) {
                    ctx.beginPath()
                    ctx.moveTo(paths[0].x, paths[0].y)
                    for (let i = 1; i < paths.length; i++) {
                        ctx.lineTo(paths[i].x, paths[i].y)
                    }
                    ctx.stroke()
                }
            }
            if (elem.type === 'circle') {
                ctx.beginPath()
                ctx.arc(elem.x, elem.y, elem.radius, 0, Math.PI * 2)
                ctx.stroke()
            }
        }
        let plugin = this.getPlugin()
        plugin.draw(ctx)

        // if (this.downX) {
        //     if (this.mode === 'line') {

        //     }
        // }
        if (!('ontouchend' in document)) {
            this.drawCursor(ctx, this.cursor)
        }

        if (this.cursors && this.cursors.length) {
            this.drawCursor(ctx, this.cursors[0])
        }
    }

    drawCursor(ctx, cursor) {
        let cursorSize = 16
        ctx.beginPath()
        ctx.moveTo(cursor.x - cursorSize / 2, cursor.y)
        ctx.lineTo(cursor.x + cursorSize / 2, cursor.y)
        ctx.moveTo(cursor.x, cursor.y - cursorSize / 2)
        ctx.lineTo(cursor.x, cursor.y + cursorSize / 2)
        ctx.stroke()
    }

    setMode(name) {
        console.log('mode', name)
        this.mode = name
    }

    clear(emit = true) {
        this.elems = []
        this.draw()
        if (emit) {
            this.socket.emit('clear', {
                code: this.code
            })
        }
    }

    undo(emit = true) {
        if (this.elems.length) {
            this.elems = this.elems.slice(0, this.elems.length - 1)
            this.histories.push(this.elems[this.elems.length - 1])
            this.draw()
            if (emit) {
                this.socket.emit('undo', {
                    code: this.code
                })
            }
        }
    }

    redo() {
        console.log('this.histories', this.histories)
        if (this.histories.length) {
            this.elems.push(this.histories[this.histories.length - 1])
            this.draw()
        }
    }
}

class Test extends React.Component {
    constructor(...args){
        super(...args)
    }
    render(){
        return (
            <div className="test">
                test123
            </div>
        )
    }
}

class Editor extends React.Component {

    state = {
        mode: 'pen',
        users: [
            {
                id: '1',
                name: '',
                avatar: 'https://img1.yunser.com/avatar/avatar_${random}.jpg'
            },
            {
                id: '1',
                name: '',
                avatar: 'https://img1.yunser.com/avatar/avatar_${random}.jpg'
            }
        ]
    }

    componentDidMount() {
        //config.domain.ws

        let { code } = this.props.match.params
        console.log('this.props', code)

        let socket = window.io.connect(config.ws, {
            // path: '/board',
            transports: ['websocket', 'xhr-polling', 'jsonp-polling']
        })

        this.canvas = document.getElementById('canvas')
        this.board = new Board(this.canvas, socket, code)

        // let random = window.Math.ceil(Math.random() * 10)
        // `https://img1.yunser.com/avatar/avatar_${random}.jpg`
    }

    render() {
        let _this = this
        let { mode, users } = this.state

        function onMouseDown(e) {
            _this.board.down(e)
        }
        function onMouseUp(e) {
            _this.board.up(e)
        }
        function onMouseMove(e) {
            _this.board.move(e)
        }
        function onTouchStart(e) {
            _this.board.down(e.targetTouches[0])
        }
        function onTouchMove(e) {
            _this.board.move(e.targetTouches[0])
        }
        function onTouchEnd(e) {
            _this.board.up({})
        }
        function clear(e) {
            _this.board.clear()
        }
        function undo(e) {
            _this.board.undo()
        }
        function redo(e) {
            _this.board.redo()
        }

        let types = [
            {
                name: '画笔',
                value: 'pen',
                icon: '/static/pen.png'
            },
            {
                name: '直线',
                value: 'line',
                icon: '/static/line.png'
            },
            {
                name: '矩形',
                value: 'rect',
                icon: '/static/rect.png'
            },
            {
                name: '圆形',
                value: 'circle',
                icon: '/static/circle.png'
            }
        ]

        function setMode(name) {
            _this.board.setMode(name)
            _this.setState({
                mode: name
            })
        }

        function help() {
            window.open('https://project.yunser.com/products/46a6ee9095c211e9ad7037051ae8dece', '_blank')
        }

        // if (!_this.board) {
        //     return <div></div>
        // }
        const TypeItem = (item, index) => {
            return (
                <div className={classnames('type-item', {active: mode === item.value})} key={index} onClick={e => setMode(item.value)}>
                    <img className="icon" src={item.icon} />
                    {/* <button type="button">{item.name}</button> */}
                </div>
            )
        }

        const UserItem = (item, index) => {
            return (
                <div>

                </div>
            )
        }

        return (
            <div className="App">
                <div className="editor-box">
                    <div className="editor">
                        <canvas className="canvas" id="canvas"
                            onMouseDown={onMouseDown}
                            onMouseMove={onMouseMove}
                            onMouseUp={onMouseUp}
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        ></canvas>
                    </div>
                </div>
                <div className="tool">
                    {types.map(TypeItem)}
                    <hr />
                    <div className="btns">
                        <button className="btn" type="button" onClick={undo}>撤销</button>
                        {/* <button className="btn" type="button" onClick={redo}>重做</button> */}
                        <button className="btn" type="button" onClick={clear}>清空</button>
                        <button className="btn" type="button" onClick={help}>帮助</button>
                    </div>
                </div>
                {/* <div className="user-list">
                    {
                        users.map(UserItem)
                    }
                </div> */}

            </div>
        )
    }
}

export default Editor
