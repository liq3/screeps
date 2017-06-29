module.exports = {

 	run: function (creep) {
		var source = Game.getObjectById(creep.memory.sourceId);
        if(source != null) {
            var error = creep.harvest(source);
            if (error == ERR_NOT_IN_RANGE || creep.pos.getRangeTo(source) > 1) {
                creep.moveTo(source);
            }
        }
        var dropOff = creep.pos.findClosestByRange(FIND_MY_CREEPS, 1, {filter: c => c.carry.energy < creep.carryCapacity});
        if (dropOff) {
            creep.transfer(dropOff, RESOURCE_ENERGY);
        }
	}
};
