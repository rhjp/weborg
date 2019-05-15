import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import renderNode from '../utils/renderNode'
import TextContent from './textContent'
import Dot from '../icons/dot'

import styled from 'styled-components'

const headlineFont = '16'

const Row = styled.div`
    display: flex;
    align-items: 'baseline';
    flex-flow: column;
    font-size: ${headlineFont}px;
    line-height: ${headlineFont}px;
    margin-top: 10px;
`

const RowItems = styled.div`
    display: flex;
    alignItems: 'baseline';
    justify-content: 'flex-start';
`

const SmallColumn = styled.div`
    flex-grow: 0;
`

const LargeColumn = styled.div`
    flex-grow: 2;
`

const DashPlus = styled.div`
    display: block;
    position: absolute;
    right: 5px;
`

const Stars = ({ showChildren }) => <div style={{ marginRight: '5px'}}><Dot size={`${headlineFont}`} outerVisible={!showChildren} /></div>
const State = ({ state }) => <span style={{ color: state === 'TODO' ? 'red' : 'green', fontWeight: '600' }}> {state} </span>
const ChildNodes = ({ children }) => children.length !== 0 &&  children.map((node, idx) => renderNode({ node, idx }))
const Elipses = ({ show }) => show ? <span>...</span> : <span></span>

    export default ({node}) => {
        const [showChildren, setShowChildren] = useState(true)
        return <Row level={node.level}>
            <RowItems>
                <SmallColumn> 
                    <Stars showChildren={showChildren}/>
                </SmallColumn>
                <LargeColumn>
                    <div>
                        <State state={node.State} />
                        <TextContent content={node.content} />
                        { showChildren && <ChildNodes children={node.children} /> }
                    </div>
                </LargeColumn>
                <DashPlus> 
                    { showChildren ? <div onClick={() => setShowChildren(!showChildren)}>-</div> :
                            <div onClick={() => setShowChildren(!showChildren)}>+</div> }
                </DashPlus>
            </RowItems>
        </Row> 
    }

