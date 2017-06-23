module.exports = function (creep) {
    if(creep.memory.gathering && creep.carry.energy < creep.carryCapacity) {
		var energy = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY);
		if (energy != null) {
			if (creep.pickup(energy) == ERR_NOT_IN_RANGE) {
				creep.moveTo(energy);
			}
		} else {
	        var source = creep.pos.findClosestByPath(FIND_SOURCES);
	        if(source != null && creep.harvest(source) == ERR_NOT_IN_RANGE) {
	            creep.moveTo(source);
	        }
		}
	} else if (creep.memory.gathering && creep.carry.energy == creep.carryCapacity) {
        creep.memory.gathering = false;
    } else if (!creep.memory.gathering && creep.carry.energy == 0) {
        creep.memory.gathering = true;
    } else {
		if(creep.transfer(creep.room.controller,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
			creep.moveTo(creep.room.controller);
		}
    }
}
