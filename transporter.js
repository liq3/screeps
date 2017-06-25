var gatherEnergy = require("creepGatherEnergy");
module.exports = function (creep) {

	if(creep.memory.gathering && creep.carry.energy < creep.carryCapacity) {
		gatherEnergy(creep);
	} else if (creep.memory.gathering && creep.carry.energy == creep.carryCapacity) {
        creep.memory.gathering = false;
    } else if (!creep.memory.gathering && creep.carry.energy == 0) {
        creep.memory.gathering = true;
    } else {
		var target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter:
			s => s.structureType == STRUCTURE_TOWER && s.energy < s.energyCapacity});
        if (target == null) {
			target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter:
            	s => s.structureType == STRUCTURE_EXTENSION && s.energy < s.energyCapacity});
		}
		if (target == null && Game.spawns.Spawn1.energy < Game.spawns.Spawn1.energyCapacity) {
            target = Game.spawns.Spawn1;
        } else if (target == null) {
			target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter:
	            s => s.structureType == STRUCTURE_CONTAINER &&
	                _.sum(s.store) < s.storeCapacity});
		}
        if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
	}
}
