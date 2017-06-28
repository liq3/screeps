module.exports = {

	run: function (creep) {
		var error = creep.transfer(creep.room.controller,RESOURCE_ENERGY);
		if(error == ERR_NOT_IN_RANGE || error == ERR_NOT_ENOUGH_ENERGY) {
			creep.moveTo(creep.room.controller, {range: 2});
		}
	}
};
