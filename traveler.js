module.exports = function (creep) {

    var target = creep.memory.target;
	if(target != null) {
		creep.moveTo(new RoomPosition(target.x,target.y,target.roomName));
	}
}