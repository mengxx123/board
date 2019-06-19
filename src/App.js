import React from 'react'
import classnames from 'classnames'
import { BrowserRouter, Switch, Route, Link} from 'react-router-dom'
import Editor from './Editor'
import Home from './Home'

import './App.css'

class Test extends React.Component {
    render(){
        return (
            <div className="test">
                测试
            </div>
        )
    }
}

class App extends React.Component {

    state = {
        mode: 'pen'
    }

    componentDidMount() {
    }

    render() {
        return (
            <BrowserRouter>
                <Switch>
                    <Route exact path="/" component={Home} />
                    <Route exact path="/test" component={Test} />
                    <Route exact path="/editor/:code" component={Editor} />
                </Switch>
            </BrowserRouter>
        )
    }
}

export default App
