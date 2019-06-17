import React from 'react'
import ArrowUpward from '@material-ui/icons/ArrowUpward'
import ArrowDownward from '@material-ui/icons/ArrowDownward'

export const moveNodeUp = ({ mode, setMode, text, setText }) => {
  if (mode.type === 'Move' && mode.range) {
    const splitText = text.split('\n')
    const range = mode.range

    if (range.start === 0) return

    setText(
      [
        ...splitText.slice(0, range.start - 1),
        ...splitText.slice(range.start, range.end + 1),
        splitText[range.start - 1],
        ...splitText.slice(range.end + 1, splitText.length),
      ].join('\n')
    )

    setMode({
      type: 'Move',
      range: {
        start: range.start - 1,
        end: range.end - 1,
      },
    })
  }
}

export const moveNodeDown = ({ mode, setMode, text, setText }) => {
  if (mode.type === 'Move' && mode.range) {
    const splitText = text.split('\n')
    const range = mode.range

    if (range.end === splitText.length - 1) return

    setText(
      [
        ...splitText.slice(0, range.start),
        splitText[range.end + 1],
        ...splitText.slice(range.start, range.end + 1),
        ...splitText.slice(range.end + 2, splitText.length),
      ].join('\n')
    )

    setMode({
      type: 'Move',
      range: {
        start: range.start + 1,
        end: range.end + 1,
      },
    })
  }
}

export const MoveNode = ({ mode, setMode, text, setText }) => (
  <React.Fragment>
    <ArrowUpward
      style={{ marginRight: '1rem' }}
      color="inherit"
      onClick={() => moveNodeUp({ mode, setMode, text, setText })}
    />
    <ArrowDownward
      style={{ marginRight: '1rem' }}
      color="inherit"
      onClick={() => moveNodeDown({ mode, setMode, text, setText })}
    />
  </React.Fragment>
)
