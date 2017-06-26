module.exports = {

	run: function (creep) {
	if(creep.transfer(creep.room.controller,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
		creep.moveTo(creep.room.controller);
	}
}
};
