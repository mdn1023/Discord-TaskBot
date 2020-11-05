const Discord = require("discord.js");
const moment = require('moment-timezone');
const uuid = require('uuid');
const validator = require("validator");
const utils = require("./utils");

function newTask(message, args) {
    if (args.length == 0) {
        message.reply(`no arguments given with the new task command!`);
    }
    else if (args.length == 1 && message.mentions.users.size == 0) {
        const taskName = args.shift();
        const embed = new Discord.MessageEmbed()
            .setTitle(`Task created!`)
            .setColor(0x9797FF);

        let taskID = uuid.v4();
        embed.addField(`Task: *${taskName}*`, `\`\`\`ID: ${taskID}\`\`\``);
        
        message.channel.send(embed);
        utils.saveNewTask(taskName, [], taskID);
    }
    else {
        const taskName = args.shift();
        if (args.length !== message.mentions.users.size) {
            message.reply(`invalid command format!`);
        }
        else {
            let assignees = "";
            let arr = [];
            message.mentions.users.map(user => {
                arr.push(user.id);
                assignees = assignees.concat(`\n- ${user.tag}`);
            });

            const embed = new Discord.MessageEmbed()
                .setTitle(`Task created!`)
                .setColor(0x9797FF);
            
            let taskID = uuid.v4();
            embed.addField(`Task: *${taskName}*`, `\`\`\`Assignees: ${assignees}\nID: ${taskID}\`\`\``);

            message.channel.send(embed);
            utils.saveNewTask(taskName, arr, taskID);
        }
    }
}

async function listAllTasks(message, args, self) {
    tasks = utils.loadTasks();

    if (args.length > 1) {
        message.reply(`invalid command format!`);
        return;
    }

    const embeds = [];

    if (args.length == 0) {
        if (tasks.unassigned.length == 0 && tasks.assigned.length == 0 && tasks.completed.length == 0) {
            taskList = "No tasks have been created."
            let embed = new Discord.MessageEmbed()
                .setTitle(`__NO TASKS__`)
                .setColor(0x9797FF);
            embed.setDescription(taskList);
            message.channel.send(embed);
        } else {
            if (tasks.unassigned.length != 0 && !self) {
                let embed = new Discord.MessageEmbed()
                    .setTitle(`__Unassigned Tasks__`)
                    .setColor(0x9797FF);
                embed = unassignedTaskArrayToEmbedFields(tasks.unassigned, embed);
                embeds.push(embed);
            }
            if (tasks.assigned.length != 0) {
                let embed = new Discord.MessageEmbed()
                    .setTitle(`__Assigned Tasks__`)
                    .setColor(0x9797FF);
                embed = await assignedTaskArrayToEmbedFields(tasks.assigned, embed, message, self);
                embeds.push(embed);
            }
            if (tasks.completed.length != 0) {
                let embed = new Discord.MessageEmbed()
                    .setTitle(`__Completed Tasks__`)
                    .setColor(0x9797FF);
                embed = await completedTaskArrayToEmbedFields(tasks.completed, embed, message, self);
                embeds.push(embed);
            }

            embeds.forEach((e) => {
                message.channel.send(e);
            });
        }
    }
    else {
        let list = args[0].toLowerCase();
        if (list !== "unassigned" && list !== "assigned" && list !== "completed") {
            message.reply(` that's not a valid task status! You must use \`unassigned\`, \`assigned\`, or \`completed\``);
        } else {
            if (list == "unassigned") {
                let embed = new Discord.MessageEmbed()
                    .setTitle(`__Unassigned Tasks__`)
                    .setColor(0x9797FF);
                embed = unassignedTaskArrayToEmbedFields(tasks.unassigned, embed);
                message.channel.send(embed);
            } else if (list == "assigned") {
                let embed = new Discord.MessageEmbed()
                    .setTitle(`__Assigned Tasks__`)
                    .setColor(0x9797FF);
                embed = await assignedTaskArrayToEmbedFields(tasks.assigned, embed, message, self);
                message.channel.send(embed);
            } else {
                let embed = new Discord.MessageEmbed()
                    .setTitle(`__Completed Tasks__`)
                    .setColor(0x9797FF);
                embed = await completedTaskArrayToEmbedFields(tasks.completed, embed, message, self);
                message.channel.send(embed);
            }
        }
    }
}

// TODO: ADD COMPLETE MESSAGE TO EMBED
function completeTask(message, args) {
    tasks = utils.loadTasks();
    if (args.length < 1) {
        message.reply(`no task IDs given!`);
    } else if (args.length > 1) {
        message.reply(`you can only compelete one task at a time!`);
    } else {
        const taskID = args.shift();
        let completed = tasks.completed;
        let assigned = tasks.assigned;
        let unassigned = tasks.unassigned;
        for (i = 0; i < assigned.length; i++) {
            if (assigned[i].taskID === taskID) {
                const embed = new Discord.MessageEmbed()
                    .setTitle(`Task completed!`)
                    .setColor(0x9797FF);
                embed.addField(`Task: *${assigned[i].name}*`, `\`\`\`ID: ${taskID}\`\`\``);
                message.channel.send(embed);

                completedTask = assigned.splice(i, 1)[0];
                completedTask.completedOn = Date.now();
                completedTask.completed = true;
                completedTask.closedBy = message.author.id;

                completed.push(completedTask);
                return utils.saveTasks({unassigned, assigned, completed});
            }
        }

        for (i = 0; i < unassigned.length; i++) {
            if (unassigned[i].taskID === taskID) {
                const embed = new Discord.MessageEmbed()
                    .setTitle(`Task completed!`)
                    .setColor(0x9797FF);
                embed.addField(`Task: *${unassigned[i].name}*`, `\`\`\`ID: ${taskID}\`\`\``);
                message.channel.send(embed);

                completedTask = unassigned.splice(i, 1)[0];
                completedTask.completedOn = Date.now();
                completedTask.completed = true;
                completedTask.closedBy = message.author.id;

                completed.push(completedTask);
                return utils.saveTasks({unassigned, assigned, completed});
            }
        }

        message.reply(`could not locate task with ID: \`${taskID}\`!`);
    }
}

function claimTask(message, args) {
    tasks = utils.loadTasks();
    if (args.length < 1) {
        message.reply(`no task IDs given!`);
    } else if (args.length > 1) {
        message.reply(`you can only claim one task at a time!`);
    } else {
        const taskID = args.shift();
        let completed = tasks.completed;
        let assigned = tasks.assigned;
        let unassigned = tasks.unassigned;
        for (i = 0; i < assigned.length; i++) {
            if (assigned[i].taskID === taskID) {
                if (assigned[i].assignees.includes(message.author.id)) {
                    return message.reply("you are already assigned to this task!")
                }

                const embed = new Discord.MessageEmbed()
                    .setTitle(`Task claimed!`)
                    .setColor(0x9797FF);
                embed.addField(`Task: *${assigned[i].name}*`, `\`\`\`ID: ${taskID}\`\`\``);
                message.channel.send(embed);

                assigned[i].assignees = [message.author.id];
                return utils.saveTasks({unassigned, assigned, completed});
            }
        }

        for (i = 0; i < unassigned.length; i++) {
            if (unassigned[i].taskID === taskID) {
                const embed = new Discord.MessageEmbed()
                    .setTitle(`Task claimed!`)
                    .setColor(0x9797FF);
                embed.addField(`Task: *${unassigned[i].name}*`, `\`\`\`ID: ${taskID}\`\`\``);
                message.channel.send(embed);

                unassigned[i].assignees = [message.author.id];
                assignedTask = unassigned.splice(i, 1)[0];
                assigned.push(assignedTask);
                return utils.saveTasks({unassigned, assigned, completed});
            }
        }

        message.reply(`could not locate task with ID: \`${taskID}\`!`);
    }
}

function assignTask(message, args) {
    tasks = utils.loadTasks();

    if (args.length < 2) {
        return message.reply(`not enough arguments for the assign task command!`);
    }
    const taskID = args.shift();
    if (!validator.isUUID(taskID)) {
        return message.reply(`that is not a valid taskID!`);
    }
    if (args.length !== message.mentions.users.size) {
        return message.reply(`invalid command format!`);
    }

    let arr = [];
    let assignees = "";
    message.mentions.users.map(user => {
        arr.push(user.id);
        assignees = assignees.concat(`\n- ${user.tag}`);
    });

    let completed = tasks.completed;
    let assigned = tasks.assigned;
    let unassigned = tasks.unassigned;
    for (i = 0; i < assigned.length; i++) {
        if (assigned[i].taskID === taskID) {
            assigned[i].assignees = arr;

            const embed = new Discord.MessageEmbed()
                .setTitle(`Task assigned!`)
                .setColor(0x9797FF);
            embed.addField(`Task: *${assigned[i].name}*`, `\`\`\`Assignees: ${assignees}\nID: ${taskID}\`\`\``);
            message.channel.send(embed);

            return utils.saveTasks({unassigned, assigned, completed});
        }
    }
    for (i = 0; i < unassigned.length; i++) {
        if (unassigned[i].taskID === taskID) {
            const embed = new Discord.MessageEmbed()
                .setTitle(`Task assigned!`)
                .setColor(0x9797FF);
            embed.addField(`Task: *${unassigned[i].name}*`, `\`\`\`Assignees: ${assignees}\nID: ${taskID}\`\`\``);
            message.channel.send(embed);
            
            unassigned[i].assignees = arr;
            assignedTask = unassigned.splice(i, 1)[0];
            assigned.push(assignedTask);
            return utils.saveTasks({unassigned, assigned, completed});
        }
    }
    for (i = 0; i < completed.length; i++) {
        if (completed[i].taskID === taskID) {
            return message.reply(`that task is already completed!`);
        }
    }

    message.reply(`could not locate task with ID: \`${taskID}\`!`);
}

function deleteTask(message, args) {
    tasks = utils.loadTasks();
    if (args.length < 1) {
        return message.reply(`no task IDs given!`);
    }
    if (args.length > 1) {
        return message.reply("you can only delete one task at a time!");
    }
    
    let taskID = args[0];
    if (!validator.isUUID(taskID)) {
        return message.reply(`that is not a valid taskID!`);
    }

    let completed = tasks.completed;
    let assigned = tasks.assigned;
    let unassigned = tasks.unassigned;

    for (i = 0; i < assigned.length; i++) {
        if (assigned[i].taskID === taskID) {
            const embed = new Discord.MessageEmbed()
                .setTitle(`Task deleted!`)
                .setColor(0x9797FF);
            embed.addField(`Task: *${assigned[i].name}*`, `\`\`\`ID: ${taskID}\`\`\``);
            message.channel.send(embed);

            assigned.splice(i, 1)[0];
            return utils.saveTasks({unassigned, assigned, completed});
        }
    }
    for (i = 0; i < unassigned.length; i++) {
        if (unassigned[i].taskID === taskID) {
            const embed = new Discord.MessageEmbed()
                .setTitle(`Task deleted!`)
                .setColor(0x9797FF);
            embed.addField(`Task: *${unassigned[i].name}*`, `\`\`\`ID: ${taskID}\`\`\``);
            message.channel.send(embed);

            unassigned.splice(i, 1)[0];
            return utils.saveTasks({unassigned, assigned, completed});
        }
    }
    for (i = 0; i < completed.length; i++) {
        if (completed[i].taskID === taskID) {
            const embed = new Discord.MessageEmbed()
                .setTitle(`Task deleted!`)
                .setColor(0x9797FF);
            embed.addField(`Task: *${completed[i].name}*`, `\`\`\`ID: ${taskID}\`\`\``);
            message.channel.send(embed);

            completed.splice(i, 1)[0];
            return utils.saveTasks({unassigned, assigned, completed});
        }
    }
}

function unassignTask(message, args) {
    tasks = utils.loadTasks();
    if (args.length < 1) {
        return message.reply(`no task IDs given!`);
    } else if (args.length > 1) {
        return message.reply(`you can only unassign one task at a time!`);
    }

    const taskID = args.shift();
    if (!validator.isUUID(taskID)) {
        return message.reply(`that is not a valid taskID!`);
    }

    let completed = tasks.completed;
    let assigned = tasks.assigned;
    let unassigned = tasks.unassigned;
    for (i = 0; i < assigned.length; i++) {
        if (assigned[i].taskID === taskID) {
            const embed = new Discord.MessageEmbed()
                .setTitle(`Task unassigned!`)
                .setColor(0x9797FF);
            embed.addField(`Task: *${assigned[i].name}*`, `\`\`\`ID: ${taskID}\`\`\``);
            message.channel.send(embed);

            unassignedTask = assigned.splice(i, 1)[0];
            unassignedTask.assignees = [];
            unassigned.push(unassignedTask);           
            return utils.saveTasks({unassigned, assigned, completed});
        }
    }
    
    message.reply(`could not locate task with ID: \`${taskID}\`!`);

}

function unassignedTaskArrayToEmbedFields(tasks, embed) {
    let e = embed;
    tasks.forEach((t) => {
        e.addField(`Task: *${t.name}*`, `\`\`\`ID: ${t.taskID}\`\`\``);
    });
    return e;
}

async function assignedTaskArrayToEmbedFields(tasks, embed, message, self) {
    let e = embed;

    for (const t of tasks) {
        if (self && !t.assignees.includes(message.author.id)) {
            continue;
        }
        let assignees = await retrieveDiscordTags(t.assignees, message);
        e.addField(`Task: *${t.name}*`, `\`\`\`Assignees: ${assignees.join(", ")}\nID: ${t.taskID}\`\`\``);
    };

    return e;
}

async function completedTaskArrayToEmbedFields(tasks, embed, message, self) {
    let e = embed;

    for (const t of tasks) {
        if (self && !t.assignees.includes(message.author.id)) {
            continue;
        }
        let assignees = await retrieveDiscordTags(t.assignees, message);
        let closedBy = await retrieveDiscordTags([t.closedBy], message);
        e.addField(`Task: *${t.name}*`,
            `\`\`\`Assignees: ${assignees.join(", ")}\nID: ${t.taskID}\nCompleted On: ${moment(t.completedOn).tz("America/New_York").format("MM-DD-YYYY h:mm:ss")} EST\nClosed By: ${closedBy[0]}\`\`\``
        );
    };

    return e;
}

async function retrieveDiscordTags(ids, message) {
    let a = [];

    if (ids.length != 0) {
        for (const id of ids) {
            await message.client.users.fetch(id).then((user) => {
                a.push(user.tag);
            });
        };    
    }
    
    return a;
}

module.exports = {
    newTask,
    listAllTasks,
    completeTask,
    claimTask,
    assignTask,
    deleteTask,
    unassignTask
}