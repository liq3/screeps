module.exports = {

	run: function (creep) {
		if (creep.memory.claimRoom != undefined) {
			var target = creep.memory.claimRoom;
			var action = creep.claimController;
		} else if (creep.memory.targetRoom != undefined) {
			var target = creep.memory.targetRoom;
			var action = creep.reserveController;
		}
		if (creep.pos.roomName != target) {
			creep.moveTo(new RoomPosition(25,25,target), {range: 22});
			if (action(creep.room.controller) == ERR_NOT_IN_RANGE) {
				creep.moveTo(creep.room.controller);
			}
		}
	}
};
