require('dotenv').config()
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js')
const { google } = require('googleapis')
const AsciiTable = require('ascii-table')

const discordClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
})

const jwtClient = new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/gm, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
)
jwtClient.authorize((err, tokens) => {
    if (err) {
        console.error(err)
        return
    }
})
const sheets = google.sheets({ version: 'v4', auth: jwtClient })

discordClient.on('ready', () => {
    console.log(`Logged in as ${discordClient.user.tag}!`)
})
discordClient.on('messageCreate', async message => {
    if (message.content === '!jontikka') {
        const spreadsheetId = process.env.SPREADSHEET_ID
        const range = 'Leaderboards!A2:G'
        try {
            const res = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range,
            })
            
            const rows = res.data.values
            if (rows.length) {
                let table = new AsciiTable()
                table
                    .removeBorder()
                    .setHeading('Player', 'Wi', 'Le', 'HCo', 'BL')
                    .setAlign(0, AsciiTable.LEFT)
                    .setAlign(1, AsciiTable.CENTER)
                    .setAlign(2, AsciiTable.CENTER)
                    .setAlign(3, AsciiTable.CENTER)
                    .setAlign(4, AsciiTable.CENTER)
            
                rows.forEach((row) => {
                    table.addRow(
                        row[0].length > 15 ? `${row[0].substring(0, 12)}...` : row[0],
                        row[3], row[4], row[5], row[6]
                    )
                })        

                const embed = new EmbedBuilder()
                    .setTitle('Leaderboard')
                    .setColor('#FF0004')
                    .setDescription(`\`\`\`${table.toString()}\`\`\``)

                await message.channel.send({ embeds: [embed] })
            } else {
                await message.channel.send('No data found in the leaderboard.')
            }
        } catch (err) {
            console.error('The API returned an error: ', err)
            await message.channel.send('Failed to retrieve the leaderboard.')
        }
    }
})

discordClient.login(process.env.DISCORD_BOT_TOKEN)
