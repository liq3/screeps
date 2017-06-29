module.exports = {

	run: function (creep) {
		var error = creep.transfer(creep.room.controller,RESOURCE_ENERGY);
		if(error == ERR_NOT_IN_RANGE || error == ERR_NOT_ENOUGH_ENERGY) {
			creep.moveTo(creep.room.controller, {range: 2});
		}
		if (creep.carry.energy < 10) {
			let target = creep.pos.findInRange(FIND_STRUCTURES, 1, {filter: s=>s.structureType==STRUCTURE_CONTAINER});
			if (target.length > 0) {
				creep.withdraw(target[0], RESOURCE_ENERGY); 
			}
		}
	}
};
