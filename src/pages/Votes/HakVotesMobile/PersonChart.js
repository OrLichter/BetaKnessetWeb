import React, { useState, useEffect } from 'react'

import "react-vis/dist/style.css"
import {Treemap} from 'react-vis'
import {makeStyles, withStyles} from '@material-ui/core/styles'
import Tooltip from '@material-ui/core/Tooltip'
import "../index.css"

import { useQuery, toNiceDate, cleanTextFromDB, imageOrDefault } from '../../../utils'
import config from '../../../config'
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Typography from "@material-ui/core/Typography";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import DiscreteSlider from './Slider'



const useStyles = makeStyles({
    root: {
        flexGrow: 1,
        maxWidth: 600,
        position: 'absolute',
        left:'80%'
    },
});


const PersonTooltip = withStyles((theme) => ({
    tooltip: {
        backgroundColor: 'rgba(24,24,53,0.8)',
        boxShadow: theme.shadows[1],
        width: '55vw',
        height: '60vh',
        overflow:'auto',


    },
}))(Tooltip);



const MIN_RATIO_FOR_IMAGE = 0.4


const PersonChart = React.memo(function ({setLoading, queryString, minDifference, setMaxDifference, setWorstParty, setBestParty, setBestPartyImg, setWorstPartyImg}) {
    const [data, setData] = useState([])
    const urlQuery = useQuery()
    const [query, setQuery] = useState("")
    const [total, setTotal] = useState(0)

    console.log(minDifference)
    useEffect(() => {
        (async () => {
            if (!queryString.length)
                return
            setLoading(true)
            try {
                // handle hebrew quotes (״)
                // handle hebrew quotes (״)
                const res = await (await fetch(`${config.server}/Votes/PersonVotes?votesHistory=${queryString}`)).json()
                setTotal(queryString.split(',').length)
                const temp_data = res.map(r => ({
                    result: r,
                    element: <PersonShortName key={r.PersonID} name={r.Name} query={queryString} votes_agreed={r.votes_agreed}
                                              agreed_laws={r.agreed_laws} disagreed_laws={r.disagreed_laws} CurrentFaction={r.CurrentFaction}
                                              PlaceInList={r.PlaceInList}  votes_disagreed={r.votes_disagreed} />,
                    size: Math.abs(r.votes_agreed-r.votes_disagreed),
                    color: r.votes_agreed-r.votes_disagreed,
                    faction: r.CurrentFaction,
                    faction_picture: r.faction_picture,
                    style: {
                        background: `url(${imageOrDefault(r.mk_imgPath, r.PersonID.toString(), 256)}) no-repeat center center`,
                        backgroundSize: 'cover',
                        color: '#ddd',
                        cursor: 'pointer',
                        border: (r.votes_agreed-r.votes_disagreed>0) ? `${Math.abs(r.votes_agreed-r.votes_disagreed)/1.3}px solid rgba(72,169,61,0.7)`: `${Math.abs(r.votes_agreed-r.votes_disagreed)/1.3}px solid rgba(223,36,36,0.7)`,
                        animation: `pulse ${4 + Math.random() * 10}s ease-in-out infinite`,
                        animationDelay: `-${Math.random() * 10}s`,
                        animationDirection: 'alternate',
                    }
                }))
                setData(temp_data)
                const parties = temp_data.reduce((partiesSoFar, {result, faction, size, color, style, element,faction_picture}) => {
                    if (!partiesSoFar[faction]) partiesSoFar[faction] = [];
                    partiesSoFar[faction].push({
                        result: result,
                        element:element,
                        faction_picture:faction_picture,
                        size: size,
                        color: color,
                        title: faction,
                        style: style});

                    return partiesSoFar;
                }, {});
                const final_children_for_tree = []
                var counter = 0
                var max_difference = 0
                var worst_party = ''
                var worst_party_value = 0
                var best_party = ''
                var best_party_value = 0
                var best_party_img = ''
                var worst_party_img = ''
                for (const key in parties){
                    console.log(`Key: ${key}`)
                    console.log(`Value: ${parties[key]}`)
                    var color = 0
                    var counter = 0
                    for (var faction of parties[key]){
                        color = color + faction.color
                        counter ++
                        if (faction.size> max_difference){
                            max_difference = faction.size
                        }
                    }
                    var mean_score = color/counter
                    if (mean_score > best_party_value){
                        best_party_value = mean_score
                        best_party = key
                        best_party_img=  parties[key][0].faction_picture
                    }
                    if (mean_score < worst_party_value){
                        worst_party_value = mean_score
                        worst_party = key
                        worst_party_img=parties[key][0].faction_picture
                    }

                    final_children_for_tree.push({
                        title: key,
                        children: parties[key].filter(r => r.size >= minDifference && r.mk_imgPath !== null),
                        style: {
                            opacity:0.4,
                            background: `url(${imageOrDefault(parties[key][0].faction_picture,'1', 256)}) no-repeat center center`,
                            backgroundSize: 'contain',
                            border: 'thin solid #ddd',
                        },
                        color:mean_score,
                    })
                }
                console.log(worst_party_img)
                setWorstParty(worst_party)
                setBestParty(best_party)
                setMaxDifference(max_difference);
                setData(final_children_for_tree)
                setWorstPartyImg(worst_party_img)
                setBestPartyImg(best_party_img)

            } catch(e) {
                // TODO handle errors
                console.error(e)
                setData([])
            } finally {
                setLoading(false)
            }
        })()
    }, [queryString, setLoading, minDifference])
    const classes = useStyles();

    return (
        <>
            <div  style={{width:'100vw', maxHeight: '100vh', placeItems: 'center', float:'left', textAlign:'center'}} className="dynamic-treemap-example" className={classes.root}>
                {/*<DiscreteSlider max={total} minDifference={minDifference} setMinDifference={setMinDifference} />*/}

                <div style={{position:'relative'}}>
                    <div style={{position:"absolute", left:'33vw', top:'0vh', zIndex:'5'}}>
                                <Treemap
                            padding={10}
                            animation={true}
                            data={{
                                title: '',
                                color: 1,
                                style: {
                                    backgroundColor: 'transparent',
                                    titleColor: "black"
                                },
                                children: data.filter(d => d.color > 0),
                            }}
                            mode="circlePack"
                            height={350}
                            width={350}
                            getLabel={x => x.element}
                            // onLeafClick={n => n.data.result && viewPersonQuotes(n.data.result.PersonID)}
                        />
                    </div>
                    <div style={{position:"absolute", left:'33vw', top:'40vh', zIndex:'4'}}>
                        <Treemap
                            padding={10}
                            animation={true}
                            data={{
                                title: '',
                                color: 1,
                                style: {
                                    backgroundColor: 'transparent',
                                    titleColor: "black"
                                },
                                children: data.filter(d => d.color <= 0),
                            }}
                            mode="circlePack"
                            height={350}
                            width={350}
                            getLabel={x => x.element}
                            // onLeafClick={n => n.data.result && viewPersonQuotes(n.data.result.PersonID)}
                        />
                    </div>
                </div>
            </div>
        </>
    );
})
export default PersonChart;

const PersonShortName = React.memo(function ({...props}) {
    const [open, setOpen] = useState(false)
    const {name, agreed_laws_sum, agreed_laws} = props

    return (
        <PersonTooltip
            title={ <PersonCard {...props} />}
            placement='left'
            arrow
            interactive
            enterNextDelay={200}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}


        >
            <div
                style={{
                    display: 'flex',
                    justifyItems: 'stretch',
                    alignItems: 'flex-end',
                    width: '55vw',

                }}
            >
            </div>
        </PersonTooltip>
    )
})

const PersonCard = React.memo(function({name,agreed_laws, CurrentFaction, PlaceInList, disagreed_laws}) {

    return (
        <div style={{width:'55vw', maxHeight: '60vh',textAlign:'center'}}>
            <h1 style={{fontSize: '25px', color: '#eceff1'}}>{name}</h1>
            <h2 style={{fontSize: '15px', color: '#eceff1'}} >{CurrentFaction}</h2>
            <h2 style={{fontSize:'12px'}}> מקום {PlaceInList} ברשימה </h2>
            <div style={{background: 'linear-gradient(45deg, #c5cae9 30%, #e8eaf6 70%)',  overflow:'auto'}}>

                <table style={{ width:'100%', marginBottom:'1em',  maxHeight:'60vh'}}>
                    <th style={{ fontSize:'12px', background: 'linear-gradient(45deg,green 20%, #daded8 90%)', color: 'rgba(24,24,53,0.8)'}}> אנחנו מסכימים ({agreed_laws == "" || agreed_laws== undefined ? 0 : agreed_laws.split('#').length}):</th>
                    { agreed_laws == "" || agreed_laws== undefined ? <tr><td>אני ואתה לא באותו ראש                                         <span aria-label="sad" role="img"> 😕 </span>
                    </td></tr> :agreed_laws.split('#').map((item)=> <React.Fragment><tr><td>{item} </td></tr></React.Fragment>) }</table>

                <table style={{width:'100%', maxHeight:'60vh', marginBottom:'1em'}}>
                    <th style={{ maxWidth: '50vw' , background: 'linear-gradient(45deg, red 20%, #cfb1b9 90%)', color: 'rgba(24,24,53,0.8)'}}>  אנחנו לא מסכימים ({disagreed_laws == "" || disagreed_laws== undefined ? 0 : disagreed_laws.split('#').length}): </th>
                    {disagreed_laws == "" || disagreed_laws== undefined ? <tr><td>שתי טיפות מים אנחנו                                     <span aria-label="blush" role="img"> 😊 </span>
                    </td></tr> : disagreed_laws.split('#').map((item)=> <React.Fragment><tr><td>{item} </td></tr></React.Fragment>) }</table>
            </div>
        </div>
    )
})