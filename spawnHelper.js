module.exports = {

	run: function (creep) {
		if (creep.memory.gathering) {
            if (creep.room.storage && creep.withdraw(creep.room.storage, RESOURCE_ENERGY)===ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.storage);
            }
            if (creep.carry.energy===creep.carryCapacity) {
                creep.memory.gathering = false;
            }
	    } else if (!creep.memory.gathering && creep.carry.energy===0) {
	        creep.memory.gathering = true;
	    } else {
			var target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter:
				s => s.structureType===STRUCTURE_TOWER && s.energy < s.energyCapacity});
	        if (target===null) {
				target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter:
	            	s => (s.structureType===STRUCTURE_EXTENSION || s.structureType===STRUCTURE_SPAWN) && s.energy < s.energyCapacity});
			}
	        if (creep.transfer(target, RESOURCE_ENERGY)===ERR_NOT_IN_RANGE) {
	            creep.moveTo(target);
	        }
		}
	}
};
