module.exports = {

	run: function (creep) {
	    if (creep.memory.claimRoom != undefined) {
			var target = creep.memory.claimRoom;
		} else if (creep.memory.targetRoom != undefined) {
			var target = creep.memory.targetRoom;
		}
		target = Game.rooms[target].controller
	    if (creep.memory.claimRoom != undefined) {
		    var err = creep.claimController(target);
		} else if (creep.memory.targetRoom != undefined) {
    		var err = creep.reserveController(target);
		}
		if (err===ERR_NOT_IN_RANGE) {
			creep.moveTo(target, {range: 1, maxOps:5000, swamp:1});
		}
	}
};
