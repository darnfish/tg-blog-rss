const express = require('express')

const morgan = require('morgan')
const helmet = require('helmet')

const createRSS = require('./rss')

const app = express()

app.use(helmet())
app.use(morgan())

app.get('/feed.xml', async (req, res) => {
	const rss = await createRSS()
	const xml = rss.xml({ indent: true })

	res.send(xml)
})

app.listen(4000, () => {
	console.log('Listening on :4000')
})
