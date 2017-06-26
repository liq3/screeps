module.exports = function (creep) {
	var source;
	if (creep.memory.room != undefined && creep.pos.roomName != creep.memory.room) {
		creep.moveTo(new RoomPosition(25,25, creep.memory.room), {range: 22});
		return;
	}
	if (creep.memory.sourceId != undefined) {
		source = Game.getObjectById(creep.memory.sourceId);
	} else {
		for (let s of creep.room.find(FIND_SOURCES)) {
			if (_.filter(Game.creeps, c => c.memory.sourceId == s.id && c.memory.role == 'miner').length == 0) {
				creep.memory.sourceId = s.id;
			}
		}
	}
    if(source != null && creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source);
	}
}
