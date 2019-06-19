import React from 'react'
import classnames from 'classnames'
import { BrowserRouter, Switch, Route, Link} from 'react-router-dom'
import Button from '@material-ui/core/Button'
import './Home.scss'
import {withRouter} from "react-router-dom";
// import { browserHistory } from 'react-router-dom'
// import { createBrowserHistory } from 'history'

// console.log('styles', styles)

class Home extends React.Component {

    render() {
        let create = () => {
            let code = Math.ceil(1000000 * Math.random())
            this.props.history.push(`/editor/${code}`)
        }

        return (
            <div className="box">
                <Button variant="contained" color="primary" onClick={create}>创建新画板</Button>
                <div></div>
                {/* 你可以 */}
                {/* <Link to='/test'>创建新画板</Link> */}
                {/* 或者 */}
                {/* <Link to='/editor'>编辑器</Link> */}
            </div>
        )
    }
}

export default Home
