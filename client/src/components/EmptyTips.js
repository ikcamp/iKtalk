import React, { Component } from 'react'
import { Link } from 'react-router-dom'

const styles = {
    emptyStyle: {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
    },
    emptyTxt: {
        fontSize: '24px',
        color: '#999',
        width: '200px',
        textAlign: 'center',
        lineHeight: '30px'
    },
    emptyImg: {
        width: '64px',
        height: '64px',
        display: 'block',
        margin: '0 auto',
        background: 'url(data:image/png;charset=utf-8;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAQAAAAAYLlVAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAAA4QAAAOEAHQCiXcAAAAHdElNRQfeBQEVESDm5l2pAAAIWElEQVRo3r3ZaXCV5RUH8N9NbsIWtrCr1RAIiIpSoLJKc4Nl6pQOTsc6KgxaK+C4oLVa+0GDpgpVrKMU6DAVO8MEi8t0mQJF6CQUgwUsiguroIZgBSEQkCQEktx+eG82yL0JGnzulzvv+3/O/3/Oed5nOU9IK1pe3Z+QNFlyfFeaTL11k4pqZY7a64QdCmx3Qm0Az22F7VCrydMN9VPDZOpX/7LaGYSl1D8ptddOb3jHl60TkVBAPXmmG91msDRUKnbQPrsc96UTotL01sUAl+stQxecss9fvOFD0ZZEhFokz3KL6Qai0hZFCuxU5lRguklrp7MsEeON1RVfWGG5rYkjEUdAjL6zqWYbgv1eUWCzEw2Y3HPxQWtvpGy3GYISS/wxSEfzEpoVEDM33FMmSVYiX74dzRHHjRv93eQug7DRk9bF6xmKYyTVrebor0K+F+xqOZfNyrjMLLOkO2K+xU42ZyPUbNc0j3lAezvM86oz50N+lqWQH3rcGLWW+bVD51pKbtotAj08a7YUK9ytUC25Cs+TnkKFgbW9VksxwghZNikj0sRaEwF5Af0Cd6ixyCM+/zq+NxYRgZPWqzLaUEO9pUwTAY1SkBcE/3kzVHrGsyq/CflZdpPdZZ7uVprhYGO7yU1gqea4X415nna6behjcYjaqlSOq/RVoKohDcmN6JnmKSkWebLt6BulYptq2YapVCRaJyEmIALDLdbLCo/4qi3pm0Shk7GG2263xgLyoLM/+J4d7vZ5W9PXS6j2rpGGGOyfTgQxSKpHTDVJhXn2XAh6YlaP+I1Dhru/7mlSzP8ssyXL9+oF4W7c1lsg6g4TAua6CNxiiBIvOHOh/K+PAUu9p5c7g11Ech4MMF+6xV67kPTERkK5Gj+W4d9KIrEI3GigEvnNrPEXpq2yRTe3CwcpSHcrlttxof0nxnDQckxySSBgqMEqFXxL3gdtnf0udT1JQm6WZovN34b/9THYY4OQKdqFpbkGRY03W2e3vHMNtAqZAFtrvWkG6ptkkEyV8Rf8vMBokk7Sgg8nT3wsSNZJmnB8bC4UKJbpuiQ5+iluYQBmWWSttZYZkVgCMi221roWsYeUSJUTNgwHlSXwKcufjRBVa4zRptmYADvIMqPUihrtWtO9HVdolc/RM0kaPnEqLjDJQ0bY5jZTrJHhlzok8H+mUd5xsxutN8CvpMZF1tiMQWGZ2JlgCurgalHPWIGjxhkv0/Y42HQRteb6Gw5501V6OxDX8i6n9U/SG8cTjICQkFpfgTNqJQfDK060wmqVg5NOS4mHzQ0QZ6SGdVPtcIKgVik2xr2OOuMeXRX4NC621GZX+4UKFR7Ux9pgIx6nHVWuU1iqU44ngJ3xnNFuMF6tro55McGMEfWS693gOtW6OWahygSWy1UFU3G0hUVoq2n+6pQaBe6wMiF2i+n+rkLUendalRAbhbAaYWnxMLnBx7XRuzKFfRp4n5sIW2Sr/lJ9kggLOkolSZkUveOjYgYqbfd+SybrsTtsa5Ge7joRVqqHruTFBZ/PEnVex9c0KWqS7EXmeXC0XeuvnZIkJ3C5dt86fcgo7Arbid46q2p93/iL0Xmkq71MHA4rMFuGLEfyWuzeiDiku+5666eHLxx02DEn6hCtkpGun1pvh2231yg5/tNKv8P6mWiCa/TRTQdJapQrc8D71ilSqjZPK7Yt42QqVhh23C6jjNM+wYrYsNUY7T4jDRBCheNKY+Hs41Jj/dxuRRbZHvRIGImJwvbZH8pjstdVmawoXpcY/RVmmaoH9vnIajscio2cNH2MMMmVLsJ+SywLVsHceNYyrDHYw34Xxhb7XClbUQLvw6Z7XAY2yLfW/4LKUX3bodBCmSab6mpP+4nHrEkwu2Qb7KBVJEco19f39bNaWeSczWEedPSouXrZ7Qm5ihwPqsG5CmO/CFQ7bKM1TrhclklKfdBQB2hir6snDbTan9QE6/Ub7jLETeY36326p82U5FVz7A6en+1XbgP6M3OsMVe2BXpa0OznPVFEpZdVkVwowpcuNsZl/uF4U8UReMIDqi30cF3RKt4Wuj4WBxTKcI1spbY0RudBF88baFVwFA7OhlHLlRhkllAz08whe+R6NNi4tvSNx97vN9PLTuvUDOQW45z0knJyJcdOrF/oKMeVPrC3cRktAv/1mrWqW1svjEWhQoE1Vqtq6JMHQy3S03IvqqUwKNFEYLexBsu02smGNBSKUOuk6PlMs7FUnHZAVYM7seH8nOt87H6HAouhRi9/4BU9LfCoU21/Toydrx42V417LK1jaFwl+0TIRCNUefvcz6cN6Jnut9pbYr4aTct0sbx94CIjjHbE1rNrum1AP9lC6dZ5SFlDhOsrpbGsbZJlqHFKbWurKNTT/97FNpuhuNlSbX39ZpOhrpCj2lbVkW8ch1jup1voYh+a4aOAqxkBsZFQ5i0DXCVbJ1tVfpNU5AUWO3rQb6XbZKZ3aTrAmwgorJNQqK9hxhqpWDFfJw4xcoZ6zmztrTMz8D7hhUV9hb9ApeGGuEGqPcrPT0Q9eRe3W+g61ZZ4SPG59IkurZL8yBOGi3rPYivrTnmt3rZ1NdG9xkv1sWfkB4vSub0TX9t9x31+ppeoLfL9y566S9mzjZ21flwm260iUp30uvl2xpfe8sXlBHeaohv226BQoUOq1DRrq73uxsuRbTAqrbHU2sSXXq25uk1xrdtNcqkQPnPAAZvt9pVjykV1kC5NhtH662eAMA7aYKkiFS2lrbWX12GXmGiKLJmxsstpZ4IDthRpUmJHm1rF9nrTSp/VbUUSj5oWBTRJRzt9TJCjpyz9m5ymauy3yxEbFSppqAq0vKT9H4zbyO7DxNPEAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE2LTA5LTE3VDE1OjIwOjMyKzA4OjAwqHx+JQAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxNC0wNS0wMVQyMToxNzozMiswODowMARpj+wAAABNdEVYdHNvZnR3YXJlAEltYWdlTWFnaWNrIDcuMC4xLTYgUTE2IHg4Nl82NCAyMDE2LTA5LTE3IGh0dHA6Ly93d3cuaW1hZ2VtYWdpY2sub3Jn3dmlTgAAAGN0RVh0c3ZnOmNvbW1lbnQAIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTcuMC4yLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgvAeeWwAAABh0RVh0VGh1bWI6OkRvY3VtZW50OjpQYWdlcwAxp/+7LwAAABh0RVh0VGh1bWI6OkltYWdlOjpIZWlnaHQANDAweVpp2wAAABd0RVh0VGh1bWI6OkltYWdlOjpXaWR0aAA0MDDqqzmGAAAAGXRFWHRUaHVtYjo6TWltZXR5cGUAaW1hZ2UvcG5nP7JWTgAAABd0RVh0VGh1bWI6Ok1UaW1lADEzOTg5NTAyNTIbKvDfAAAAEHRFWHRUaHVtYjo6U2l6ZQAxM0tC37UdFwAAAF90RVh0VGh1bWI6OlVSSQBmaWxlOi8vL2hvbWUvd3d3cm9vdC9zaXRlL3d3dy5lYXN5aWNvbi5uZXQvY2RuLWltZy5lYXN5aWNvbi5jbi9zcmMvMTE1ODQvMTE1ODQ0MC5wbmf8I8H1AAAAAElFTkSuQmCC)'
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
            <div style={styles.emptyStyle}>
                <div style={styles.emptyImg}></div>
                <p style={styles.emptyTxt}>还没有直播,赶紧创建一个吧!</p>
            </div>
        )
    }
}
