var roleStaticMiner = {

    /** @param {Creep} creep **/
    run: function(creep) {
        var targetContainer = Game.getObjectById(creep.memory.targetContainerId);
        var targetSource = Game.getObjectById(creep.memory.targetSourceId);
        if(creep.harvest(targetSource) == ERR_NOT_IN_RANGE && creep.pos != targetContainer.pos) {
            creep.moveTo(targetContainer, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
	}
};

module.exports = roleStaticMiner;