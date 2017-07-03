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
            var target = creep.room.controller.pos.findInRange(FIND_STRUCTURES, 2, {filter: s=>s.structureType == STRUCTURE_CONTAINER});
            var err;
            if (target.length > 0) {
                err = creep.transfer(target[0], RESOURCE_ENERGY);
                if (err == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target[0]);
                }
            }
        }
    }
};
