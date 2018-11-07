module.exports = {

	run: function (creep) {

		var target = creep.memory.targetRoom;
		if (target) {
			var error = creep.moveTo(new RoomPosition(25,25,target), {range:24});
			if (error != 0 && error != -4) {
				log("Error moving decoy " + error);
			}
		}
	}
};
