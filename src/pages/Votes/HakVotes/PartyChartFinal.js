import React, { useState, useEffect } from 'react'

import "react-vis/dist/style.css"
import {Treemap} from 'react-vis'
import {makeStyles, withStyles} from '@material-ui/core/styles'
import Tooltip from '@material-ui/core/Tooltip'
import "../index.css"

import { sleep, imageOrDefault } from '../../../utils'
import config from '../../../config'
import { createMuiTheme } from '@material-ui/core/styles';

const theme = createMuiTheme();

theme.typography.h3 = {
    fontSize: '15px',
    fontFamily:'Helvetica Neue, Varela Round, sans-serif',
    align: 'center'

};

const useStyles = makeStyles({
    root: {
        flexGrow: 1,
        maxWidth: 600,
        position: 'absolute',
        right: '25%'

    },
});


const PartyTooltip = withStyles((theme) => ({
    tooltip: {
        boxShadow: theme.shadows[1],
        backgroundColor: 'rgba(24,24,53,0.8)',
        minWidth: '30vw',
        maxWidth: '30vw',
        minHeight: '35vh',
        maxHeight: '50vh',
        overflowY:'auto',

    },
}))(Tooltip);

const MIN_RATIO_FOR_IMAGE = 0


const PartyChartFinal = React.memo(function ({setLoading, queryString}) {
    const [data, setData] = useState([])

    useEffect(() => {
        (async () => {
            if (!queryString.length)
                return
            setLoading(true)
            try {
                // handle hebrew quotes (״)
                const res = await (await fetch(`${config.server}/Votes/PartyVotes?votesHistory=${queryString}`)).json()
                const total = queryString.split(',').length  // TODO: Change number
                setData(res.filter(r => r.party_logo_link !== null).map(r => ({
                    result: r,
                    element: <PartyName key={r.final_party} name={r.final_party} query={queryString} ratio={r.count_agreed / total}
                                              agreed_laws={r.agreed_laws} disagreed_laws={r.disagreed_laws} diff={r.agreed_laws === "" || r.agreed_laws=== null ? 0 : r.agreed_laws.split('#').length - r.disagreed_laws === "" || r.disagreed_laws=== null ? 0 : r.disagreed_laws.split('#').length}/>,
                    size: Math.max(Math.abs((r.agreed_laws === "" || r.agreed_laws=== null ? 0 : r.agreed_laws.split('#').length) - (r.disagreed_laws === "" || r.disagreed_laws=== null ? 0 : r.disagreed_laws.split('#').length)), 0.5),
                    color: (r.count_agreed-r.count_disagreed),
                    style: {
                        background: `url(${imageOrDefault(r.party_logo_link, r.final_party.toString(), 256)}) no-repeat center center`,
                        backgroundSize: 'contain',
                        color: '#ddd',
                        cursor: 'pointer',
                        border: ((r.agreed_laws === "" || r.agreed_laws=== null ? 0 : r.agreed_laws.split('#').length) - (r.disagreed_laws === "" || r.disagreed_laws=== null ? 0 : r.disagreed_laws.split('#').length)>0) ? `${Math.abs((r.agreed_laws === "" || r.agreed_laws=== null ? 0 : r.agreed_laws.split('#').length) - (r.disagreed_laws === "" || r.disagreed_laws=== null ? 0 : r.disagreed_laws.split('#').length))/1.3}px solid rgba(72,169,61,0.7)`: `${Math.abs((r.agreed_laws === "" || r.agreed_laws=== null ? 0 : r.agreed_laws.split('#').length) - (r.disagreed_laws === "" || r.disagreed_laws=== null ? 0 : r.disagreed_laws.split('#').length))/1.3}px solid rgba(223,36,36,0.7)`,
                        animation: `pulse ${4 + Math.random() * 10}s ease-in-out infinite`,
                        animationDelay: `-${Math.random() * 10}s`,
                        animationDirection: 'alternate',
                    }
                }
                )))

            } catch(e) {
                // TODO handle errors
                console.error(e)
                setData([])
            } finally {
                await sleep();
                setLoading(false)
            }

        })()
    }, [queryString, setLoading])
    const classes = useStyles();


    const a = data.filter(d => d.color < 0);
    a.push({
        title: 'against',
        children: data.filter(d => d.color > 0),
        style: {backgroundColor: 'transparent',},

    })
    a.push({
        title: 'neutral',
        children: data.filter(d => d.color == 0),
        style: {backgroundColor: 'transparent',},

    })
    return (
        <>
            <div  style={{maxWidth:'100vw', maxHeight: '100vh', placeItems: 'center', float:'left',textAlign:'center'}} className={classes.root}>
                <div style={{position:"relative", left:'0px', top:'-15px', zIndex:'5'}}>
                        <Treemap
                            padding={5}
                            animation={true}
                            data={{
                                title: '',
                                color: 1,
                                style: {
                                    backgroundColor: 'transparent',
                                },
                                children: a,
                            }}
                            mode="circlePack"
                            height={650}
                            width={1000}
                            getLabel={x => x.element}
                        />
                    </div>

            </div>
        </>
    );
})
export default PartyChartFinal

const PartyName = React.memo(function ({...props}) {
    const {agreed_laws, disagreed_laws } = props
    var diff = ((agreed_laws === "" || agreed_laws=== null ? 0 : agreed_laws.split('#').length) - (disagreed_laws === "" || disagreed_laws=== null ? 0 : disagreed_laws.split('#').length) )

    return (
        <PartyTooltip
            title={<PartyCard {...props}/>}
            placement='left'
            arrow
            interactive
            enterNextDelay={200}
        >
            <div
                className={(diff > 0) ? 'green-bubble-party':(diff < 0)?'red-bubble-party':'gray-bubble-party'}
                style={{
                    display: 'flex',
                    justifyItems: 'stretch',
                    alignItems: 'flex-end',
                    width: '100%',
                }}
            >
            </div>
        </PartyTooltip>
    )
})

const PartyCard = React.memo(function({name,agreed_laws, disagreed_laws}) {

    return (

        <div style={{maxHeight: '100%'}}>
            <h1 style={{color: '#eceff1', fontSize: '34px'}}>{name}</h1>
            <div style={{background: 'linear-gradient(45deg, #c5cae9 30%, #e8eaf6 70%)'}}>

                    <table style={{minWidth: '100%'}}>
                        <tr>
                            { agreed_laws === "" || agreed_laws === null ?
                                <th  style={{background: 'transparent' ,color: 'rgba(24,24,53,0.8)', fontSize: '14px', padding: '9px 12px'}}>
                                     אנחנו מסכימים על (0):
                                    <br/>
                                    <p8 style={{fontWeight: 'normal', fontSize: '14px'}}>
                                        אני ואתה לא באותו ראש
                                        <span style={{fontSize: '20px'}} aria-label="sad" role="img"> 😕 </span>

                                    </p8>
                                < /th>

                                    :
                            <th  style={{background: 'transparent' ,color: 'rgba(24,24,53,0.8)', fontSize: '14px', padding: '9px 12px'}}>
                                     אנחנו מסכימים על ({agreed_laws === "" ? 0 : agreed_laws.split('#').length}):
                                <th style={{width: '70%'}}>חוק</th>
                                <th style={{width: '15%',background: 'linear-gradient(45deg,green 20%, #daded8 90%)', color: 'rgba(24,24,53,0.8)'}}>הסכמנו איתך</th>
                                <th style={{width: '15%',background: 'linear-gradient(45deg, red 20%, #cfb1b9 90%)', color: 'rgba(24,24,53,0.8)'}}>לא הסכמנו איתך</th>

                            {agreed_laws.split('#').map((law)=> <React.Fragment><tr style={{fontWeight: 'normal'}}>
                                {law.split('@').map((law_info)=> <React.Fragment><td>{law_info}</td></React.Fragment>)}
                            </tr></React.Fragment>) }
                            < /th> }
                        </tr>
                    </table>
            </div >
            <div style={{background: 'linear-gradient(45deg, #c5cae9 30%, #e8eaf6 70%)',textAlign: 'center' }}>

                    <table style={{minWidth: '100%', textAlign: 'center'}}>
                            { disagreed_laws === "" || disagreed_laws=== null ?
                                <th  style={{minWidth: '100%',textAlign: 'center', background: 'transparent' ,color: 'rgba(24,24,53,0.8)', fontSize: '14px', padding: '9px 12px'}}>
                                     אנחנו לא מסכימים על (0):
                                <br/>
                                <p8 style={{fontWeight: 'normal', fontSize: '14px'}}>
                                שתי טיפות מים אנחנו
                                    <span style={{fontSize: '20px'}} aria-label="blush" role="img"> 😊 </span>
                                </p8>

                                < /th>

                                :
                                <th style={{background: 'transparent' ,color: 'rgba(24,24,53,0.8)', fontSize: '14px', padding: '9px 12px'}}>
                                     אנחנו לא מסכימים על ({disagreed_laws === "" ? 0 : disagreed_laws.split('#').length}):
                                <th style={{width: '70%'}}>חוק</th>
                                <th style={{width: '15%', background: 'linear-gradient(45deg,green 20%, #daded8 90%)', color: 'rgba(24,24,53,0.8)'}}>הסכמנו איתך</th>
                                <th style={{width: '15%',background: 'linear-gradient(45deg, red 20%, #cfb1b9 90%)', color: 'rgba(24,24,53,0.8)'}}>לא הסכמנו איתך</th>

                            {disagreed_laws.split('#').map((law)=> <React.Fragment><tr style={{fontWeight: 'normal'}}>
                                {law.split('@').map((law_info)=> <React.Fragment><td>{law_info}</td></React.Fragment>)}
                            </tr></React.Fragment>) }
                        </th>}
                </table>

            </div>
        </div>
    )
})