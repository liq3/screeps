module.exports = function (creep) {

	if(gathering && creep.carry.energy < creep.carryCapacity) {
		var source = creep.pos.findClosestByPath(FIND_SOURCES);
        if(source != null && creep.harvest(source) == ERR_NOT_IN_RANGE) {
            creep.moveTo(source);
		} else if (creep.carry.energy == creep.carryCapacity) {
			gathering = false;
		}
	} else {
		if(creep.transfer(Game.spawns.Spawn1,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
			creep.moveTo(Game.spawns.Spawn1);
		} else if (creep.energy.carry == 0) {
			gathering = true;
		}
	}
}
