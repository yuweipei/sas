var roleHauler = {

    /** @param {Creep} creep **/
    run: function(creep) {
        var energyNeeded = creep.carryCapacity - creep.carry.energy;
        if (creep.carry.energy == 0) {
            creep.memory.hauling = false;
        }
        if(energyNeeded > 0 && !creep.memory.hauling) {
            var roomContainers = Game.rooms[creep.room.name].find(FIND_STRUCTURES, { 
                filter: (structure) => { return ((structure.structureType == STRUCTURE_CONTAINER))}});
            if(creep.withdraw(roomContainers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(roomContainers[0], {visualizePathStyle: {stroke: '#ffaa00'}});
            }
            creep.memory.hauling = true;
        }
        else {
            // if collect enough energy, it should empty itself untill collect another time
            var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                            structure.energy < structure.energyCapacity;
                    }});
            if(targets.length > 0) {
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
    }
};

module.exports = roleHauler;