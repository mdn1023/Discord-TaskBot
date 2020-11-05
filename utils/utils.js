const fs = require('fs');

const fileName = './test.json';
const baseTemplate = {
    assigned: [],
    unassigned: [],
    completed: []
}

function loadTasks() {
    try {
        let tasks = fs.readFileSync(fileName).toString();
        tasks = JSON.parse(tasks);
        return tasks;
    } catch {
        fs.writeFile(fileName, JSON.stringify(baseTemplate), function(err) {
            if (err) {
                return console.error(err);
            }
        });
        return baseTemplate;
    }
}

function saveNewTask(name, assignees, taskID) {
    tasks = loadTasks();
    newTask = {
        taskID,
        assignees,
        name,
        completed: false,
        createdAt: Date.now(),
        assignees: assignees
    }

    if (assignees.length == 0) {
        tasks.unassigned.push(newTask);
    } else {
        tasks.assigned.push(newTask);
    }
    fs.writeFile(fileName, JSON.stringify(tasks), function(err) {
        if (err) {
            return console.error(err);
        }
    });
}

function saveTasks(tasks) {
    fs.writeFile(fileName, JSON.stringify(tasks), function(err) {
        if (err) {
            return console.error(err);
        }
    });
}

module.exports = {
    loadTasks,
    saveNewTask,
    saveTasks
}