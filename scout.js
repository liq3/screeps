module.exports = {

	run: function (creep) {
	    var target = creep.memory.targetPos;
		if(target != null) {
			creep.moveTo(new RoomPosition(target.x,target.y,target.roomName), {range: 22});
		}		
	}
};
