module.exports = function (creep) {

	if(!creep.memory.delivering && creep.carry.energy < creep.carryCapacity) {
		var sources = creep.room.find(FIND_SOURCES);
		if(creep.harvest(sources[1]) == ERR_NOT_IN_RANGE) {
			creep.moveTo(sources[1]);
		}
        if (creep.carry.energy == creep.carryCapacity) {
            creep.memory.delivering = true;
        }
	} else {
		if(creep.transfer(creep.room.controller,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
			creep.moveTo(creep.room.controller);
		} else if (creep.carry.energy == 0) {
            creep.memory.delivering = false;
        }
	}
}
