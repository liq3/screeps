module.exports = {

	run: function (creep) {

    var target = creep.memory.targetPos;
	if(target != null) {
		var error = creep.moveTo(new RoomPosition(target.x,target.y,target.roomName));
        if (error != 0 && error != -4) {
            console.log("Error moving decoy " + error);
        }
	}
}
};
