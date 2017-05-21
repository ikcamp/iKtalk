import React, { Component } from 'react'
import { Link } from 'react-router-dom'

const styles = {
    footer: {
        height: '50px',
        width: '100%',
        position: 'fixed',
        bottom: '0',
        left: 'auto',
        backgroundColor: '#fff',
        borderTop: '1px solid #ccc'
    },
    btnLayout: {
        display: 'block',
        width: '82px',
        height: '82px',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: '-18px',
        borderRadius: '50%'
    },
    createBtn: {
        display: 'block',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        lineHeight: '72px',
        backgroundColor: '#198be5',
        color: '#fff',
        textDecoration: 'none',
        textAlign: 'center',
        border: '2px solid #fff'
    }
}

export default class HostRoom extends Component {

    constructor(props) {
        super(props)
    }

    componentDidMount() {

    }

    render() {
        return (
            <div style={styles.footer}>
                <div style={styles.btnLayout}>
                    <Link to="/room/host" style={styles.createBtn}>创建直播</Link>
                </div>
            </div>
        )
    }
}
