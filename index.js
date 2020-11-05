const Discord = require("discord.js");
const config = require("./config.json");
const constants = require("./utils/constants");
const commands = require("./utils/commands");

const client = new Discord.Client();

// TODO: Reactions to close out tickets?

client.on("message", function(message) { 
    // Filters out any messages sent by another bot or any messages that do not start with the prefix
    if (message.author.bot) return;
    if (!message.content.startsWith(constants.prefix)) return;

    // Parse the command
    const commandBody = message.content.slice(constants.prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();

    // Handler for commands
    switch (command) {
        case "ping":
            const timeTaken = Date.now() - message.createdTimestamp;
            message.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
            break;
        case constants.newTask:
            commands.newTask(message, args);
            break;
        case constants.listAllTasks:
            commands.listAllTasks(message, args, false);
            break;
        case constants.listTasks:
            commands.listAllTasks(message, args, true);
            break;
        case constants.completeTask:
            commands.completeTask(message, args);
            break;
        case constants.claimTask:
            commands.claimTask(message, args);
            break;
        case constants.assignTask:
            commands.assignTask(message, args);
            break;
        case constants.deleteTask:
            commands.deleteTask(message, args);
            break;     
        case constants.unassignTask:
            commands.unassignTask(message, args);
            break;      
        default:
            message.reply(`Unrecognized command.`);
    }
});

client.login(config.BOT_TOKEN);