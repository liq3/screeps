module.exports = {

	run: function (creep) {
		if (creep.memory.targetRoom != undefined) {
		    var target = creep.memory.targetRoom;
			if (creep.pos.roomName != target) {
				creep.moveTo(new RoomPosition(25,25,target), {range: 22});
			} else {
	            if (creep.reserveController(creep.room.controller) == ERR_NOT_IN_RANGE) {
	                creep.moveTo(creep.room.controller);
	            }
	        }
		}
		if (creep.memory.claimRoom != undefined) {
			var target = creep.memory.claimRoom;
			if (creep.pos.roomName != target) {
				creep.moveTo(new RoomPosition(25,25,target), {range: 22});
			} else {
				if (creep.claimController(creep.room.controller) == ERR_NOT_IN_RANGE) {
					creep.moveTo(creep.room.controller);
				}
			}
		}
 	}
};
