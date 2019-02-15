const { writeFile } = require('fs')
const { promisify } = require('util')
const url = require('url')

const ora = require('ora')
const _ = require('lodash/fp')
const Debug = require('debug')

const { pmap: mapLimit } = require('asyncp')
const { makeSession, makePanelSession, userauth, page } = require('@pdk/client')

const writeFileAsync = promisify(writeFile)

let debug = Debug('pdk:dump')
const issuer = process.env.IDP_URI || 'https://accounts.pdk.io/'
const client_id = '5c6742579f685fd5f427197a'
const client_secret = '6wzNTNmaNjhSZRnYFZVhGks2SfyAsl74'

// Connect to the panel and grab the interesting data
const dumpPanel = async (authsession, { id, name, uri }) => {
  // Create an authentication session to the panel's API
  const panelsession = await makePanelSession(authsession, { id, uri })

  // Get the list of configured devices
  let connected = false
  let people = []
  try {
    let pager = { page: 0, per_page: 100 }

    // Get all persons
    do {
      people = [...people, ...await page(panelsession, 'persons', {page: pager.page, per_page: pager.per_page})]
    } while(pager.more)

    // Enrich each person
    people = await pmap(people, 10, person => panelsession(`persons/${person.id}`))

    connected = true
  } catch(err) {
    console.log('Unable to negotiate session with panel', err);
  }

  // Return what we found of the panel inventory
  return {
    id,
    name,
    connected,
    people,
  }
}

const spinner = ora({ text: 'Dumping', spinner: 'toggle' })
try {
  // Get the panel ID off of the command line
  let panelid = process.argv[2]
  if(!panelid)
    throw new Error(`The system serial number must be provided as the first argument ${panelid}`)

  panelid = panelid.toUpperCase()

  // Authenticate with the pdk auth API
  const authsession = await makeSession(
    userauth({
      client_id,
      client_secret,
      issuer,
    })
  )

  // Get the panel entity
  const panel = await authsession(`panels/${panelid}`)
  if(!panel)
    throw new Error('The requested panel could not be found, you may not have the required access')

  spinner.start()

  // Dump the panel's data
  const data = await dumpPanel(authsession, panel)

  spinner.succeed('Dumped!')

  console.log(`${data.id}: online ${data.connected}, ${data.people.length} people dumped`)

  // Write the data out to a file
  await writeFileAsync('./data.json', JSON.stringify(data, null, 2), 'utf-8')
} catch(err) {
  spinner.fail(`Error retrieving data: ${err.message}`)
  debug(err)
}
