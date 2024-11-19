const { Client, GatewayIntentBits, WebhookClient, EmbedBuilder } = require('discord.js');
const { Client: WhatsAppClient, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000; // Render définit automatiquement la variable d'environnement PORT

// Route de vérification de santé
app.get('/', (req, res) => {
    res.send('Bot Discord est actif et fonctionne correctement !');
});

// Lancement du serveur HTTP
app.listen(PORT, () => {
    console.log(`Serveur HTTP en cours d'exécution sur le port ${PORT}`);
});

// Gestion des événements Discord
discordClient.once('ready', () => {
    console.log(`Bot connecté en tant que ${discordClient.user.tag}`);
});

// Exemple de réponse simple pour tester le bot
discordClient.on('messageCreate', (message) => {
    if (message.content === '!ping') {
        message.channel.send('Pong !');
    }
});

// Connexion au bot Discord
discordClient.login(process.env.DISCORD_TOKEN);


    const WHATSAPP_GROUP_ID = '120363295554842338@g.us';
    const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1307438621963456565/0_KvmaHHMMQjEeVBdIq9gpgMbFKORsqELLYbTLKktygqe9TbKK4glnNuvm4-3HWOZT1G';

    const discordClient = new Client({
        intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages]
    });

    const whatsappClient = new WhatsAppClient({
        authStrategy: new LocalAuth({ dataPath: './whatsapp_session' }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    const webhookClient = new WebhookClient({ url: DISCORD_WEBHOOK_URL });

    // Discord events
    discordClient.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        if (message.content.toLowerCase() === '!userinfo') {
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Informations utilisateur')
                .addFields(
                    { name: 'Nom d\'utilisateur', value: message.author.username },
                    { name: 'ID', value: message.author.id },
                    { name: 'Compte créé le', value: message.author.createdAt.toDateString() }
                )
                .setThumbnail(message.author.displayAvatarURL());
            message.channel.send({ embeds: [embed] });
        }

        if (message.content.toLowerCase() === '!serverinfo') {
            const server = message.guild;
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Informations du serveur')
                .addFields(
                    { name: 'Nom du serveur', value: server.name },
                    { name: 'Nombre de membres', value: server.memberCount.toString() },
                    { name: 'Créé le', value: server.createdAt.toDateString() },
                    { name: 'Nombre de canaux', value: server.channels.cache.size.toString() }
                )
                .setThumbnail(server.iconURL());
            message.channel.send({ embeds: [embed] });
        }

        if (message.content.toLowerCase() === '!help') {
            const helpMessage = `
        Voici les commandes disponibles :
        !ping - Vérifie si le bot répond
        !userinfo - Affiche vos informations utilisateur
        !serverinfo - Affiche les informations du serveur
        !help - Affiche ce message d'aide
        `;
            message.channel.send(helpMessage);
        }
    });

    discordClient.once('ready', () => {
        console.log(`Logged in as ${discordClient.user.tag}!`);
    });

    whatsappClient.on('qr', (qr) => {
        qrcode.generate(qr, { small: true });
        console.log('Scan this QR code to log in to WhatsApp:', qr);
    });

    whatsappClient.on('message', async (message) => {
        if (message.from === WHATSAPP_GROUP_ID) {
            let content = `**${message.from || 'Unknown'}**: ${message.body}`;

            if (message.hasMedia) {
                try {
                    const media = await message.downloadMedia();
                    content += '\n[Media attaché]';

                    await webhookClient.send({
                        content: content,
                        files: [{
                            attachment: Buffer.from(media.data, 'base64'),
                            name: media.filename || 'media.jpg'
                        }]
                    });
                } catch (error) {
                    console.error('Erreur lors du téléchargement du média:', error);
                }
            } else {
                await webhookClient.send({ content: content });
            }
        }
    });

    discordClient.on('error', (error) => {
        console.error('Erreur Discord :', error);
    });

    whatsappClient.on('error', (error) => {
        console.error('Erreur WhatsApp :', error);
    });

    process.on('uncaughtException', (error) => {
        console.error('Erreur non gérée :', error);
        // Ne pas utiliser process.exit(1) ici, cela pourrait causer des problèmes
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    whatsappClient.on('ready', () => {
        console.log('WhatsApp client is ready');
    });

    whatsappClient.initialize().catch(error => {
        console.error('Failed to initialize WhatsApp client:', error);
        if (error.message.includes('EBUSY: resource busy or locked')) {
            console.log('Attempting to clean up session...');
            try {
                whatsappClient.destroy();
                console.log('Session cleaned up. Please restart the application.');
            } catch (cleanupError) {
                console.error('Failed to clean up session:', cleanupError);
            }
            process.exit(1);
        }
    });
