const RSS = require('rss')
const axios = require('axios')
const cheerio = require('cheerio')

const BASE_URL = 'https://telegram.org'
const BASE_BLOG_URL = 'https://telegram.org/blog'

function getData($, selector, url) {
	const node = $(selector)[0]
	if(!node)
		return null

	switch(node.name) {
	case 'img':
		return `${BASE_URL}${node.attribs.src}`
	case 'meta':
		return node.attribs.content
	default:
		return node.children[0].data
	}
}

async function addItemFromPost(url, rss) {
	const { data: html } = await axios(url)
	const $ = cheerio.load(html)

	const title = getData($, 'h1#dev_page_title', url)
	const imageUrl = getData($, 'div.blog_wide_image a img', url)

	const date = getData($, 'meta[property=\'article:published_time\']', url)

	let content
	content = $('div#dev_page_content')
	content.find('div.blog_side_image_wrap').remove()

	const item = {
		title,
		description: content.html(),
		url,
		date,
		author: 'The Telegram Team'
	}

	if(imageUrl)
		item.enclosure = {
			url: imageUrl,
			type: 'image/jpeg'
		}

	rss.item(item)
}

module.exports = async () => {
	const rss = new RSS({
		title: 'Telegram Blog',
		site_url: BASE_BLOG_URL,
		image_url: 'https://telegram.org/favicon.ico',
		copyright: '',
		language: 'en',
		ttl: 60	
	})

	const links = []

	let offset = 0

	for(let i = 0; i < Infinity; i++) {
		const { data: html } = await axios.get(BASE_BLOG_URL, { params: { offset }})
		const $ = cheerio.load(html)

		const hasNextTag = $('li.next').hasNextTag === 0
		if(hasNextTag)
			break

		const linkTags = Array.from($('a.dev_blog_card_link_wrap'))
		const localLinks = linkTags.map(linkTag => `${BASE_URL}${linkTag.attribs.href}`)

		if(links[0] === localLinks[0])
			break

		links.push(...localLinks)

		console.log(`offset#${offset} links#${links.length}`)

		offset += 20
	}

	const promises = links.map(link => addItemFromPost(link, rss))
	await Promise.all(promises)

	return rss
}
