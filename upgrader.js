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
		if(creep.transfer(creep.room.controller,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
			creep.moveTo(creep.room.controller);
		}
    }
}
};
