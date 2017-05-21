import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import fetch from '../fetch'
import '../style/home.css'
import CreateLiving from '../components/CreateLiving'
import EmptyTips from '../components/EmptyTips'

class Home extends Component {

    constructor(props) {
        super(props)
        this.state = {
            channelList: []
        }
    }

    componentDidMount() {
        fetch('/channel', {
            mode: 'cors'
        })
            .then(res=>res.json())
            .then(({ data })=> {
                this.setState({channelList: data})
            })
    }

    render() {
        const { channelList } = this.state
        return (
            <div>
                {
                    channelList.length > 0 ?
                        <ul className="living-list">
                            {
                                channelList.map(({ id, name})=>(
                                    <li key={id}>
                                        <Link className="living-link" to={`/room/${id}`}>
                                            <div className="living-img"></div>
                                            <div className="living-info">
                                                <div className="living-name">{name}</div>
                                                <div className="living-time">2017-01-01 00:00:00</div>
                                                <div className="people-num">在线人数:128人</div>
                                            </div>
                                        </Link>
                                    </li>
                                ))
                            }
                        </ul>
                        :
                        <EmptyTips />
                }
                <CreateLiving />
            </div>
        )
    }
}

export default connect(state=>({
    user: state.user
}))(Home)
