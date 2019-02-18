import { writeFile } from 'fs'
import { promisify } from 'util'
import url from 'url'

import ora from 'ora'
import _ from 'lodash/fp'
import Debug from 'debug'
import { mapLimit as pmap } from 'asyncp'

import { makeSession, makePanelSession, userauth, page } from '@pdk/client'

const issuer = process.env.IDP_URI || 'https://accounts.pdk.io/'
const client_id = '5c6742579f685fd5f427197a'
const client_secret = '6wzNTNmaNjhSZRnYFZVhGks2SfyAsl74'
const dumping_active = 'Dumping'

const writeFileAsync = promisify(writeFile)
const debug = Debug('pdk:dump')
const spinner = ora({ text: dumping_active, spinner: 'toggle' })

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
    spinner.text = `${dumping_active} list`
    do {
      delete pager.more
      people = [...people, ...await page(panelsession, 'persons', pager)]
    } while(pager.more)

    // Enrich each person
    let i = people.length
    people = await pmap(people, 10, person => (spinner.text = `${dumping_active} ${i--}`, panelsession(`persons/${person.id}`)))

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
  await writeFileAsync('./data.json', JSON.stringify(data, null, 2).replace(/\n/g, '\r\n'), 'utf-8')
} catch(err) {
  spinner.fail(`Error retrieving data: ${err.message}`)
  debug(err)
}
