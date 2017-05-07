var _ = require('lodash');

function emptyStoreStructure(creep, structure_array) {
    // spawn and extensions first
    if (structure_array.includes(STRUCTURE_SPAWN) || structure_array.includes(STRUCTURE_SPAWN)) {
        const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.energy < structure.energyCapacity && (structure.structureType == STRUCTURE_SPAWN || 
                    (structure.structureType == STRUCTURE_EXTENSION && creep.carry.energy >= (structure.energyCapacity - structure.energy))));
                }});
        if (target) {
            return target; 
        }
    }
    // then check if tower is not full
    if (structure_array.includes(STRUCTURE_TOWER)) {
        const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => { return (structure.energy < structure.energyCapacity && structure.structureType == STRUCTURE_TOWER)}});
        if (target) { return target; }
    }
    // store the rest to storage
    if (structure_array.includes(STRUCTURE_STORAGE)) {
        const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => { return (structure.energy < structure.energyCapacity && structure.structureType == STRUCTURE_STORAGE)}});
        if (target) { return target; }
    }
    return null;
}

function fetchEnergyInOrderOf(creep, eneryTypeArr) {
    //['droppedEnergy', 'container', 'storage']
    // pick up energy first
    if (eneryTypeArr.includes('droppedEnergy')) {
        const chosenDropSpot = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY, {
            filter: (d) => {return (d.resourceType == RESOURCE_ENERGY)}
        });
        if(chosenDropSpot && creep.pickup(chosenDropSpot) == ERR_NOT_IN_RANGE) {
            creep.moveTo(chosenDropSpot, {visualizePathStyle: {stroke: '#ffaa00'}});
            return;
        }
    }
    
    if (eneryTypeArr.includes('container')) {
        const chosenContainer = creep.pos.findClosestByPath(FIND_STRUCTURES, { 
            filter: (structure) => { 
                if (creep.memory.role == 'hauler' && !spawnEnergyFull(creep)) {
                    const res = structure.structureType == STRUCTURE_CONTAINER && structure.store.energy > 0.5 * creep.carryCapacity;
                    return res;
                } else {
                    const res = (structure.structureType == STRUCTURE_CONTAINER && structure.store.energy >= creep.carryCapacity);
                    return res;
                }}});

        if(chosenContainer && creep.withdraw(chosenContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(chosenContainer, {visualizePathStyle: {stroke: '#ffaa00'}});
            return;
        }
    }

    if (eneryTypeArr.includes('storage') && 
        (creep.memory.role == 'hauler' && !spawnEnergyFull(creep) || creep.memory.role != 'hauler') ) {
        const storage = creep.pos.findClosestByPath(FIND_STRUCTURES, { 
            filter: (structure) => { 
                return (structure.structureType == STRUCTURE_STORAGE && structure.store.energy >= creep.carryCapacity);
            }});
        if(creep.withdraw(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
    }
}

function spawnEnergyFull(creep) {
    const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (structure) => {
            return (structure.energy < structure.energyCapacity && 
                (structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_EXTENSION));
        }});
    if (target) {
        return false;
    } else {
        return true;
    }
}

function findStaticMineSpot(creep) {
    const containers = creep.room.find(FIND_STRUCTURES, { 
        filter: (structure) => { return structure.structureType == STRUCTURE_CONTAINER; }});
    for (var i in containers) {
        const container = containers[i];
        const creepsOnContainer = container.room.find(FIND_MY_CREEPS, {
            filter: (creep) => { 
                const res = _.isEqual(creep.memory.targetContainerId, container.id) && creep.memory.role == 'staticMiner'; 
                return res;
        }});
        if (creepsOnContainer.length == 0) {
            console.log('not taken yet');
            console.log(container)
            return container;
        }
    }
    return null;
}

// all functions return {subject: creep, action: '', target: [...], ...}
module.exports = {
    exec: function(task) {
        if (!task) { return; }
        const creep = task.subject;
        switch(task.action) {
        case 'harvest': 
            const sources = creep.room.find(FIND_SOURCES);
            if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
            }
            break;
        case 'transfer':
            if(creep.transfer(task.target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(task.target, {visualizePathStyle: {stroke: '#ffffff'}});
            }
            break;
        case 'build':
            const target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
            if(target) {
                if(creep.build(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
                creep.memory.role = 'upgrader';
            }
            break;
        case 'mine': 
            // console.log(Object.keys(task));
            // console.log('mine')
            if(_.isEqual(creep.pos, task.target.pos)) {
                const sources = task.target.pos.findInRange(FIND_SOURCES, 1)
                // console.log(sources);
                creep.harvest(sources[0]);
            } else {
                creep.moveTo(task.target, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
            break;
        case 'fetch':
            fetchEnergyInOrderOf(creep, task.target);
            break;
        case 'moveTo':
            creep.moveTo(task.target);
            break;
        case 'nop': 
        case 'default': break;
        }
    },


	/** @param {Creep} creep **/
	harvest: function(creep) {
        if (creep.carry.energy < creep.carryCapacity) {
            return {subject: creep, action: 'harvest'};
        } else {
            const targetStructure = emptyStoreStructure(creep, [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_STORAGE]);
            if (targetStructure) {
                return {subject: creep, action: 'transfer', target: targetStructure};
            } else {
                return {subject: creep, action: 'nop'};
            }
        }
	},

	/** @param {Creep} creep **/
    staticMine: function(creep) {
        var targetContainer = Game.getObjectById(creep.memory.targetContainerId);
        // var targetSource = Game.getObjectById(creep.memory.targetSourceId);
        // console.log(creep.name + targetContainer + targetSource);
        if (!targetContainer) {
        	// TODO: add function to find the container and/or source automatically
            // Game.getObjectById('58fa340e502ef9d26f51310c').pos.findInRange(FIND_SOURCES, 1)
            console.log('container not provided');
            const mineSpot = findStaticMineSpot(creep);
            console.log(mineSpot);
            if (mineSpot) {
                targetContainer = mineSpot;
                creep.memory.targetContainerId = mineSpot.id;
                console.log('new targetContainer ' + targetContainer);
            } else {
                console.log('nop, cant find a container');
                return {subject: creep, action: 'nop'};
            }
        }
        return {subject: creep, action: 'mine', target: targetContainer};
	},

	/** @param {Creep} creep **/
	build: function(creep) {
	    if(creep.carry.energy == 0) {
            creep.memory.building = false;
            creep.say('🔄 harvest');
	    }
	    if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.building = true;
	        creep.say('🚧 build');
	    }

	    if(creep.memory.building) {
            return {subject: creep, action: 'build', target: [FIND_CONSTRUCTION_SITES]};
	    } else {
            return {subject: creep, action: 'fetch', target: ['droppedEnergy', 'container', 'storage']}
	    }
	},

	/** @param {Creep} creep **/
    upgrade: function(creep) {
        if(creep.memory.upgrading && creep.carry.energy == 0) {
            creep.memory.upgrading = false;
            creep.say('🔄 harvest');
	    }
	    if(!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.upgrading = true;
	        creep.say('⚡ upgrade');
	    }

	    if(creep.memory.upgrading) {
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
        else {
            return {subject: creep, action: 'fetch', target: ['droppedEnergy', 'container', 'storage']}
        }
	},

	/** @param {Creep} creep **/
    haul: function(creep) {
        var energyNeeded = creep.carryCapacity - creep.carry.energy;
        if (creep.carry.energy == 0) {
            creep.memory.hauling = false;
        } else if(energyNeeded == 0) {
            creep.memory.hauling = true;
        }

        if (creep.memory.hauling) {
            // if collect enough energy, it should empty itself untill collect another time
            var target = creep.pos.findClosestByPath(FIND_STRUCTURES, { 
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_TOWER) &&
                            structure.energy < structure.energyCapacity;
                    }});

            if(target) {
                if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
            	var storage = creep.pos.findClosestByPath(FIND_STRUCTURES, { 
                    filter: (structure) => { return (structure.structureType == STRUCTURE_STORAGE)}});
            	if(creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        } else {
        	return {subject: creep, action: 'fetch', target: ['droppedEnergy', 'container', 'storage']}
        }
    },

    fix: function(creep) {
    	if(creep.memory.fixing && creep.carry.energy == 0) {
            creep.memory.fixing = false;
            creep.say('🔄 harvest');
	    }
	    if(!creep.memory.fixing && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.fixing = true;
	        creep.say('👷 fix');
	    }

	    if(creep.memory.fixing) {
	    	var structresNeedFix = Game.rooms[creep.room.name].find(FIND_STRUCTURES, { 
                filter: (structure) => { return (structure.hits < 0.8 * structure.hitsMax && structure.isActive()
                	&& (structure.structureType == STRUCTURE_CONTAINER || 
                		structure.structureType == STRUCTURE_ROAD || 
                		structure.structureType == STRUCTURE_WALL))}});
	    	var order = [STRUCTURE_CONTAINER, STRUCTURE_ROAD, STRUCTURE_RAMPART, STRUCTURE_WALL];
	    	orderedFixList = _.sortBy(structresNeedFix, 
	    		function(structure){ return _.indexOf(order, structure.structureType); }
	    		);
            if(creep.repair(orderedFixList[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(orderedFixList[0], {visualizePathStyle: {stroke: '#ffffff'}});
            }
        } else {
            return {subject: creep, action: 'fetch', target: ['droppedEnergy', 'container', 'storage']}
        }
    },

    scout: function(creep) {
        return {subject: creep, action: 'moveTo', target: Game.flags.colony2}
    },

    tower: function() {
    	const towers = Game.spawns.Spawn1.room.find(FIND_MY_STRUCTURES, {
                    filter: { structureType: STRUCTURE_TOWER }
                })
        _.forEach(towers, function(tower){
            // var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
            //     filter: (structure) => structure.hits < structure.hitsMax
            // });
            // if(closestDamagedStructure) {
            //     tower.repair(closestDamagedStructure);
            // }
            var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(closestHostile) {
                tower.attack(closestHostile);
            }
        })
    }
};