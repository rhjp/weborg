const parser = require('../../src/parser/parser')

const generateHeadline = level => ({
  level,
  state: 'TODO',
  priority: undefined,
  content: [{ text: 'this is a test', type: 'text' }],
  children: [],
  tags: undefined,
  type: 'headline'
})

const generateSection = () => ({
  content: [
    { text: 'this is a ', type: 'text' },
    { text: '*bold text*', type: 'bold' },
    { text: ' test', type: 'text' }
  ],
  type: 'section'
})

const generateTask = () => ({
  content: [
    { type: 'DEADLINE:', timestamp: '<1995-01-01>' },
    { type: 'SCHEDULED:', timestamp: '<1994-02-02 Mon 01:03:PM>' }
  ],
  type: 'task'
})

const generatePropStart = () => ({
  content: [{ text: ':PROPERTIES:', type: 'propstart' }],
  type: 'property-start'
})

const generatePropEntry = () => ({
  content: [{ text: ':Composer:', type: 'propkey' }, { text: 'J.S. Bach', type: 'propval' }],
  type: 'property-entry'
})

const generatePropEnd = () => ({
  content: [{ text: ':END:', type: 'propend' }],
  type: 'property-end'
})

describe('parser tests', () => {
  it('test the a 3, 2, 1 headline sequence', () => {
    const text = [generateHeadline(3), generateHeadline(2), generateHeadline(1)]
    const response = parser(text)
    expect(response[0].level).toEqual(3)
    expect(response[1].level).toEqual(2)
    expect(response[2].level).toEqual(1)
  })

  it('parses a 1, 2, 3 headline sequence', () => {
    const text = [generateHeadline(1), generateHeadline(2), generateHeadline(3)]
    const response = parser(text)
    expect(response[0].level).toEqual(1)
    expect(response[0].children[0].level).toEqual(2)
    expect(response[0].children[0].children[0].level).toEqual(3)
  })

  it('parses a 1, 2, 2, 1, 3 headline sequence', () => {
    const text = [
      generateHeadline(1),
      generateHeadline(2),
      generateHeadline(2),
      generateHeadline(1),
      generateHeadline(3)
    ]
    const response = parser(text)
    expect(response[0].level).toEqual(1)
    expect(response[0].children[0].level).toEqual(2)
    expect(response[0].children[1].level).toEqual(2)
    expect(response[1].level).toEqual(1)
    expect(response[1].children[0].level).toEqual(3)
  })

  it('parses a 1, 2, 2 headline seq with sections inbetween', () => {
    const text = [
      generateHeadline(1),
      generateSection(),
      generateHeadline(2),
      generateSection(),
      generateHeadline(2),
      generateSection()
    ]

    const response = parser(text)
    expect(response[0].level).toEqual(1)

    expect(response[0].children[0].content).toEqual([
      { text: 'this is a ', type: 'text' },
      { text: '*bold text*', type: 'bold' },
      { text: ' test', type: 'text' }
    ])
    expect(response[0].children[1].level).toEqual(2)

    expect(response[0].children[1].content).toEqual([{ text: 'this is a test', type: 'text' }])

    expect(response[0].children[1].children[0]).toEqual({
      content: [
        { text: 'this is a ', type: 'text' },
        { text: '*bold text*', type: 'bold' },
        { text: ' test', type: 'text' }
      ],
      type: 'section'
    })

    expect(response[0].children[2].level).toEqual(2)

    expect(response[0].children[2].content).toEqual([{ text: 'this is a test', type: 'text' }])

    expect(response[0].children[2].children[0]).toEqual({
      content: [
        { text: 'this is a ', type: 'text' },
        { text: '*bold text*', type: 'bold' },
        { text: ' test', type: 'text' }
      ],
      type: 'section'
    })
  })

  it('parses 1 headline with a deadline and schedule', () => {
    const text = [generateHeadline(1), generateTask()]
    const response = parser(text)

    expect(response[0].children[0]).toEqual({
      content: [
        { type: 'DEADLINE:', timestamp: '<1995-01-01>' },
        { type: 'SCHEDULED:', timestamp: '<1994-02-02 Mon 01:03:PM>' }
      ],
      type: 'task'
    })
  })

  it('parses 1 headline with a downgraded deadline and schedule', () => {
    const text = [generateHeadline(1), generateSection(), generateTask()]
    const response = parser(text)

    expect(response[0].children[1]).toEqual({
      content: [
        { type: 'DEADLINE:', timestamp: '<1995-01-01>' },
        { type: 'SCHEDULED:', timestamp: '<1994-02-02 Mon 01:03:PM>' }
      ],
      type: 'section'
    })
  })

  it('parses a level 1 headline with a deadline and schedule and a level 2 headline with a schedule', () => {
    const text = [
      generateHeadline(1),
      generateTask(),
      generateSection(),
      generateHeadline(2),
      generateTask()
    ]
    const response = parser(text)

    expect(response[0].children[0]).toEqual({
      content: [
        { type: 'DEADLINE:', timestamp: '<1995-01-01>' },
        { type: 'SCHEDULED:', timestamp: '<1994-02-02 Mon 01:03:PM>' }
      ],
      type: 'task'
    })

    expect(response[0].children[1]).toEqual({
      content: [
        { type: 'text', text: 'this is a ' },
        { type: 'bold', text: '*bold text*' },
        { type: 'text', text: ' test' }
      ],
      type: 'section'
    })

    expect(response[0].children[2].children[0]).toEqual({
      content: [
        { type: 'DEADLINE:', timestamp: '<1995-01-01>' },
        { type: 'SCHEDULED:', timestamp: '<1994-02-02 Mon 01:03:PM>' }
      ],
      type: 'task'
    })
  })

  it('parses a level 1 headline with some properties', () => {
    const text = [generateHeadline(1), generatePropStart(), generatePropEntry(), generatePropEnd()]
    const response = parser(text)

    expect(response).toEqual([
      {
        children: [
          { content: [{ text: ':PROPERTIES:', type: 'propstart' }], type: 'property-start' },
          {
            content: [
              { text: ':Composer:', type: 'propkey' },
              { text: 'J.S. Bach', type: 'propval' }
            ],
            type: 'property-entry'
          },
          { content: [{ text: ':END:', type: 'propend' }], type: 'property-end' }
        ],
        content: [{ text: 'this is a test', type: 'text' }],
        level: 1,
        state: 'TODO',
        type: 'headline'
      }
    ])
  })
})
