module.exports = {

	run: function (creep) {
		var target;
		var error = creep.transfer(creep.room.controller,RESOURCE_ENERGY);
		if(error == ERR_NOT_IN_RANGE || error == ERR_NOT_ENOUGH_ENERGY) {
			target = creep.room.controller.pos.findInRange(FIND_STRUCTURES, 2, {filter: s=>s.structureType==STRUCTURE_CONTAINER});
			if (target.length > 0) {
				creep.moveTo(target[0], {range: 1});
				creep.withdraw(target[0], RESOURCE_ENERGY);
			} else {
				creep.moveTo(creep.room.controller, {range: 2});
			}
		}
		if (creep.carry.energy < 20) {
			if (!target) {
				target = creep.pos.findInRange(FIND_STRUCTURES, 1, {filter: s=>s.structureType==STRUCTURE_CONTAINER});
			}
			if (target.length > 0) {
				creep.withdraw(target[0], RESOURCE_ENERGY);
			}
		}
	}
};
