const createError = require('http-errors')
const axios = require('axios')

const KikoAnswerService = require('./services/kiko-answer-service')
const glossaryBaseUrl = 'https://webservice.kiko.bot/glossary'
const glossaryProfileName = '1000grad-cms-assistent-v1'

async function getGlossaryTermDescription (options) {
  const { term } = options
  const response = await axios({ 
    url: glossaryBaseUrl + '/v1/item/text?term=' + term + '&bot=' + glossaryProfileName, 
    method: 'get',     
  }).catch((error) => { throw createError(500, error.message) })
  console.log('getlinks - response.data:', response.data)
  return response.status !== 200 ? null : response.data.text
}

/**
 * 
 *
 * @param {*} options
 */
async function ContinueConversation (options) {
  const { endpointBaseUrl, conversationId, messages } = options
  const kikoBotService = new KikoAnswerService({ endpointBaseUrl, conversationId })
  const metadata = messages[0].metaData
  // ---

  // search term from the user
  let term
  // check if this is the first forwarding from intent
  if (metadata) {
    // the intent has forwarded the user request to the subbot for the first time. 
    // the original user input can now be used to extract the search term, or the bot can ask the user for the search term.    

    // try to extract
    // const userInputText = messages[0].data.content
    // term = someTermExtractionFunction(userInputText)

    if (!term) {
      // or ask
      await kikoBotService.sendMessage('Ich kann Dir einen Begriff erklären. Für welchen Begriff benötigst Du die Beschreibung?', false) // no end of conv. 
    }
  } else {
    // we have no "metadata" in the request - so this is the user answer text
    term = messages[0].data.content 
  }

  if (term) {
    const description = await getGlossaryTermDescription({ term } )
    if (description !== null) {
      await kikoBotService.sendMessage('Ok. Hier die Beschreibung dazu. ' + description, true)  // end of conversation! 
    } else {
      await kikoBotService.sendMessage('Hm. Dazu habe ich leider keine Beschreibung gefunden. Bitte gib einen anderen Begriff ein.', false) // no end of conv.
    }
  }
}

/**
 * Kiko subbot action router for import actions
 *
 * @param {*} req
 * @param {*} res
 */
async function postWebhookMessageSent (req, res) {
  const { conversationId, messages } = req.body
  const referer = req.get('referer') || req.query.referer
  if (!referer) throw createError(400, 'Missing referer.')
  const endpointBaseUrl = referer.replace(/\/\//g, 'https://')
  await ContinueConversation({ endpointBaseUrl, conversationId, messages })
  res.status(200).json({ success: true })
}

module.exports = {
  postWebhookMessageSent
}
