var gatherEnergy = require("creepGatherEnergy");
module.exports = function (creep) {

	if(creep.memory.gathering && creep.carry.energy < creep.carryCapacity) {
		gatherEnergy(creep);
    } else if (creep.memory.gathering && creep.carry.energy == creep.carryCapacity) {
        creep.memory.gathering = false;
    } else if (!creep.memory.gathering && creep.carry.energy == 0) {
        creep.memory.gathering = true;
    } else {
        var target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
        if(target != null) {
			if (creep.build(target) == ERR_NOT_IN_RANGE) {
            	creep.moveTo(target);
			}
		} else {
		    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter:
			    w => ( w.structureType == STRUCTURE_WALL 
				    || w.structureType == STRUCTURE_RAMPART)
					&& w.hits < 10000});
		}
		if(target != null) {
			if (creep.repair(target) == ERR_NOT_IN_RANGE) {
				creep.moveTo(target);
			}
		}
    }
}
