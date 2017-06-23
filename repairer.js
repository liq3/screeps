var gatherEnergy = require("creepGatherEnergy");
module.exports = function (creep) {

	if(creep.memory.gathering && creep.carry.energy < creep.carryCapacity) {
		gatherEnergy(creep);
    } else if (creep.memory.gathering && creep.carry.energy == creep.carryCapacity) {
        creep.memory.gathering = false;
    } else if (!creep.memory.gathering && creep.carry.energy == 0) {
        creep.memory.gathering = true;
    } else {
        var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter:
            s => s.hits < s.hitsMax && s.structureType != STRUCTURE_WALL});
        if(target != null && creep.repair(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
    }
}
