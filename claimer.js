module.exports = {

	run: function (creep) {
	    if (creep.memory.claimRoom != undefined) {
			var target = creep.memory.claimRoom;
		} else if (creep.memory.targetRoom != undefined) {
			var target = creep.memory.targetRoom;
		}
		if (creep.pos.roomName != target) {
			creep.moveTo(new RoomPosition(25,25,target), {range: 22});
		} else {
    	    if (creep.memory.claimRoom != undefined) {
    		    var err = creep.claimController(creep.room.controller);
    		} else if (creep.memory.targetRoom != undefined) {
        		var err = creep.reserveController(creep.room.controller);
    		}
			if (err == ERR_NOT_IN_RANGE) {
				creep.moveTo(creep.room.controller);
			}
		}
	}
};
