module.exports = {

	run: function (creep) {
		let target;
		if (creep.memory.claimRoom != undefined) {
			target = creep.memory.claimRoom;
		} else if (creep.memory.targetRoom != undefined) {
			target = creep.memory.targetRoom;
		}
		if (Game.rooms[target]) {
			target = Game.rooms[target].controller
			let err;
			if (creep.memory.claimRoom != undefined) {
				err = creep.claimController(target);
			} else if (creep.memory.targetRoom != undefined) {
				err = creep.reserveController(target);
			}
			if (err === ERR_NOT_IN_RANGE) {
				creep.moveTo(target, {range: 1, maxOps:5000, swamp:1});
			}
		} else {
			creep.moveTo(new RoomPosition(25,25, target), {range:22})
		}
	}
};
