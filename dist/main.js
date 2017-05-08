const task = require('task');
const profiler = require('screeps-profiler');

function repeatArray(arr, count) {
  var ln = arr.length;
  var b = [];
  for(var i = 0; i<count; i++) {
    b.push(arr[i%ln]);
  }      
  return b;   
}

function generateBody(composite) {
  var res = [];
  res.push(repeatArray([WORK], composite.work));
  res.push(repeatArray([CARRY], composite.carry));
  res.push(repeatArray([MOVE], composite.move));
  return res;
}

function cleanMemory() {
    for (let i in Memory.creeps) {
        if (!Game.creeps[i]) delete Memory.creeps[i];
    }
}

profiler.enable();
module.exports.loop = function () {
    profiler.wrap(function() {
        if (Memory.spawnQueue === undefined || Memory.spawnQueue === null) {
            Memory.spawnQueue = [];
        }

        cleanMemory();

        // sort spawnQueue
        var order = ['harvester', 'hauler', 'staticMiner', 'upgrader', 'builder', 'fixer', 'scout'];
        _.forEach(Game.creeps, function (creep) {
            if (creep.hasOwnProperty('memory') && creep.memory.role == 'hauler') {
                order = ['staticMiner', 'upgrader', 'builder', 'fixer', 'scout', 'hauler', 'harvester'];
                return;
            }
        });
        Memory.spawnQueue = _.sortBy(Memory.spawnQueue, function (creepInfo) {
            return _.indexOf(order, creepInfo.role);
        });
        //_.forEach(Memory.spawnQueue, function(creepInfo){ console.log(creepInfo.role); });

        // spawn when needed
        if (Memory.spawnQueue.length > 0 && Memory.spawnQueue[0] &&
            ( Memory.spawnQueue[0].role == 'scout' && Game.spawns['Spawn1'].room.energyAvailable >= 50 ||
            Memory.spawnQueue[0].role == 'staticMiner' && Game.spawns['Spawn1'].room.energyAvailable >= 800 ||
            Game.spawns['Spawn1'].room.energyAvailable >= 1300)) {
            const creepInfo = Memory.spawnQueue[0];
            var bodyComposite = {};
            switch (creepInfo.role) {
                // case 'scout': bodyComposite = {move: 1}; break;
                // case 'staticMiner': bodyComposite = {work: 5, carry: 1, move: 5}; break;
                // case 'harvester':
                // case 'builder':
                // case 'fixer': bodyComposite = {work: 4, carry: 7, move: 11}; break;
                // case 'upgrader': bodyComposite = {work: 5, carry: 5, move: 10}; break;
                // case 'hauler': bodyComposite = {carry: 13, move: 13}; break;
                case 'scout':
                    body = [MOVE];
                    break;
                case 'staticMiner':
                    body = [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
                    break;
                case 'harvester':
                case 'builder':
                case 'fixer':
                    body = [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
                    break;
                case 'upgrader':
                    body = [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
                    break;
                case 'hauler':
                    body = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
                    break;
                default:
                    break;
            }
            if (body.length > 0 && _.isEqual(Game.spawns['Spawn1'].canCreateCreep(body), OK)) {
                console.log('Spawning ' + creepInfo.role);
                // do some cleaning to the creepInfo
                delete creepInfo.isSpawnQueued;
                console.log('with memory' + JSON.stringify(creepInfo));
                Game.spawns['Spawn1'].createCreep(body, creepInfo.role + Game.time.toString(), creepInfo);
                Memory.spawnQueue.shift();
            }
        }

        if (Game.spawns['Spawn1'].spawning) {
            var spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
            Game.spawns['Spawn1'].room.visual.text(
                '🛠️' + spawningCreep.memory.role,
                Game.spawns['Spawn1'].pos.x + 1,
                Game.spawns['Spawn1'].pos.y,
                {align: 'left', opacity: 0.8});
        }

        // var order = [STRUCTURE_CONTAINER, STRUCTURE_ROAD, STRUCTURE_RAMPART, STRUCTURE_WALL];
        //         orderedFixList = _.sortBy(structresNeedFix,
        //             function(structure){ return _.indexOf(order, structure.structureType); }
        //             );
        // const order = ['harvester', 'staticMiner', 'hauler', 'fixer', 'upgrader', 'builder'];
        // const orderedCreep = _.sortBy(Game.creeps,
        //             function(creep){ return _.indexOf(order, creep.structureType); }
        //             );
        var taskList = [];
        for (var name in Game.creeps) {
            var creep = Game.creeps[name];
            if (creep.ticksToLive <= 100 && !creep.memory.isSpawnQueued) {
                console.log('Unit deathChecker: Found dying creep ' + creep.name + '. Copying...');
                console.log(JSON.stringify(creep.memory));
                Memory.spawnQueue.push(creep.memory);
                creep.memory.isSpawnQueued = true
            }

            // if (creep.memory.room != creep.room.name) {
            //     console.log('not in the correct room, creep: ' + creep.name);
            //     creep.moveTo(creep.memory.room);
            //     continue;
            // }

            var currentTask = {action: 'nop'};
            // console.log(creep.memory.role)
            switch (creep.memory.role) {
                case 'scout':
                    currentTask = task.scout(creep);
                    break;
                case 'harvester':
                    currentTask = task.harvest(creep);
                    break;
                case 'staticMiner':
                    currentTask = task.staticMine(creep);
                    break;
                case 'upgrader':
                    currentTask = task.upgrade(creep);
                    break;
                case 'builder':
                    currentTask = task.build(creep);
                    break;
                case 'hauler':
                    currentTask = task.haul(creep);
                    break;
                case 'fixer':
                    currentTask = task.fix(creep);
                    break;
            }
            taskList.push(currentTask);
        }

        task.tower();
        for (var index in taskList) {
            task.exec(taskList[index]);
        }
    });
}