var gatherEnergy = require("creepGatherEnergy");
module.exports = {

	run: function (creep) {

	if(creep.memory.gathering && creep.carry.energy < creep.carryCapacity) {
		gatherEnergy(creep);
	} else if (creep.memory.gathering && creep.carry.energy == creep.carryCapacity) {
        creep.memory.gathering = false;
    } else if (!creep.memory.gathering && creep.carry.energy == 0) {
        creep.memory.gathering = true;
    } else {
		let target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: s => s.structureType == STRUCTURE_TOWER && s.energy < s.energyCapacity});
		if (!target) {
			target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: s => s.structureType == STRUCTURE_EXTENSION && s.energy < s.energyCapacity})
		}
        if (!target) {
            target = creep.pos.findClosestByPath(FIND_MY_SPAWNS, {filter: s => s.energy < s.energyCapacity });
        }
		if (!target) {
			target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
		}
        if (!target || creep.room.controller.level < 2) {
            target = creep.room.controller;
        }

        var error;
        if (target instanceof StructureController) {
            error = creep.upgradeController(target);
        } else {
            error = creep.transfer(target, RESOURCE_ENERGY);
        }
        if (error == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
	}
}
};
