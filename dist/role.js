var _ = require('lodash');

module.exports = {
	/** @param {Creep} creep **/
	harvest: function(creep) {
	    if(creep.carry.energy < creep.carryCapacity) {
            var sources = creep.room.find(FIND_SOURCES);
            if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
        else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                            structure.energy < structure.energyCapacity;
                    }
            });
            if(targets.length > 0) {
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
	},

	/** @param {Creep} creep **/
    staticMine: function(creep) {
        var targetContainer = Game.getObjectById(creep.memory.targetContainerId);
        var targetSource = Game.getObjectById(creep.memory.targetSourceId);
        // console.log(creep.name + targetContainer + targetSource);
        //Game.getObjectById('58fa340e502ef9d26f51310c').pos.findInRange(FIND_SOURCES, 1)
        if(_.isEqual(creep.pos, targetContainer.pos)) {
            creep.harvest(targetSource)
        } else {
        	creep.moveTo(targetContainer, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
	},

	/** @param {Creep} creep **/
	build: function(creep) {
	    if(creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
            creep.say('🔄 harvest');
	    }
	    if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.building = true;
	        creep.say('🚧 build');
	    }

	    if(creep.memory.building) {
	        var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if(targets.length) {
                if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
	    }
	    else {
	        this.harvestOnlyWithdraw(creep);
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
            this.harvestOnlyWithdraw(creep);
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
        	this.harvestOnlyWithdraw(creep);
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
                filter: (structure) => { return (structure.hits < structure.hitsMax && structure.isActive()
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
            this.harvestOnlyWithdraw(creep);
        }
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
    },

	harvestOnlyWithdraw: function(creep) {
		// pick up energy first
		const chosenDropSpot = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY);
        if(chosenDropSpot && creep.pickup(chosenDropSpot) == ERR_NOT_IN_RANGE) {
			creep.moveTo(chosenDropSpot, {visualizePathStyle: {stroke: '#ffaa00'}});
			return;
		}
		
		const chosenContainer = creep.pos.findClosestByPath(FIND_STRUCTURES, { 
                filter: (structure) => { 
                	if (creep.memory.role == 'hauler') {
                		const res = structure.structureType == STRUCTURE_CONTAINER && structure.store.energy > 0;
                		return res;
                	} else {
                		const res = (structure.structureType == STRUCTURE_CONTAINER && structure.store.energy >= creep.carryCapacity);
                		return res;
                	}}});
		// console.log(creep.name + ' chosenContainer ' + chosenContainer);
        if(creep.withdraw(chosenContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
			creep.moveTo(chosenContainer, {visualizePathStyle: {stroke: '#ffaa00'}});
			return;
		}

		const storage = creep.pos.findClosestByPath(FIND_STRUCTURES, { 
                filter: (structure) => { 
                	if (creep.memory.role != 'hauler') {
                		const res = (structure.structureType == STRUCTURE_STORAGE && structure.store.energy >= creep.carryCapacity);
                		return res;
                	}}});
		// console.log(creep.name + ' chosenContainer ' + chosenContainer);
        if(creep.withdraw(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
			creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffaa00'}});
		}
	}
};