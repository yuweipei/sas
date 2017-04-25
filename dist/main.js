var role = require('role');

function repeatArray(arr, count) {
  var ln = arr.length;
  var b = new Array();
  for(i=0; i<count; i++) {
    b.push(arr[i%ln]);
  }      
  return b;   
}

function generateBody(composite) {
  var res = new Array();
  res.push(repeatArray([WORK], composite.work));
  res.push(repeatArray([CARRY], composite.carry));
  res.push(repeatArray([MOVE], composite.move));
  return res;
}

module.exports.loop = function () {

    var removeQueue = [];
    if (Memory.spawnQueue === undefined || Memory.spawnQueue === null) {
        Memory.spawnQueue = [];
    }

    // clean memory of dead creeps
    for (var i in Memory.creeps) {
        if (Game.creeps[i]) {
            continue; // Ignore when creep is found alive
        }
        removeQueue.push(i);
    }
    
    for (var i = 0; i < removeQueue.length; i++) {
        delete Memory.creeps[removeQueue[i]];
    }

    // spawn when needed
    if ( Memory.spawnQueue.length > 0 && Memory.spawnQueue[0] &&
        ( Memory.spawnQueue[0].role == 'scout' && Game.spawns['Spawn1'].room.energyAvailable >= 50 ||
          Memory.spawnQueue[0].role == 'staticMiner' && Game.spawns['Spawn1'].room.energyAvailable >= 800 ||
          Game.spawns['Spawn1'].room.energyAvailable >= 1300) ) {
        var creepInfo = Memory.spawnQueue.shift();
        var bodyComposite = {};
        switch (creepInfo.role) {
            // case 'scout': bodyComposite = {move: 1}; break;
            // case 'staticMiner': bodyComposite = {work: 5, carry: 1, move: 5}; break;
            // case 'harvester':
            // case 'builder': 
            // case 'fixer': bodyComposite = {work: 4, carry: 7, move: 11}; break;
            // case 'upgrader': bodyComposite = {work: 5, carry: 5, move: 10}; break;
            // case 'hauler': bodyComposite = {carry: 13, move: 13}; break;
            case 'scout': body = [MOVE]; break;
            case 'staticMiner': body = [WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE]; break;
            case 'harvester':
            case 'builder': 
            case 'fixer': body = [WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE]; break;
            case 'upgrader': body = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE]; break;
            case 'hauler': body = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE]; break;
            default: break;
        }
        // const body = generateBody(bodyComposite);
        if (body.length > 0) {
            // console.log(body);
            // console.log(creepInfo.role + Game.time.toString());
            // console.log(creepInfo)
            console.log(Game.spawns['Spawn1'].createCreep(body, creepInfo.role + Game.time.toString(), creepInfo));
        }
    }

    if(Game.spawns['Spawn1'].spawning) { 
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
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.ticksToLive <= 100 && !creep.memory.isSpawnQueued) {
            console.log('Unit deathChecker: Found dying creep ' + creep.name + '. Copying...');
            console.log(JSON.stringify(creep.memory));
            Memory.spawnQueue.push(creep.memory);
            creep.memory.isSpawnQueued = true
        }

        // role.harvest(creep);
        switch (creep.memory.role) {
            case 'harvester': role.harvest(creep); break;
            case 'staticMiner': role.staticMine(creep); break;
            case 'upgrader': role.upgrade(creep); break;
            case 'builder': role.build(creep); break;
            case 'hauler': role.haul(creep); break;
            case 'fixer': role.fix(creep); break;
        }
    }

    role.tower();
}