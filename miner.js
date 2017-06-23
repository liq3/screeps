module.exports = function (creep) {
	var source;
	if (creep.memory.sourceId != undefined) {
		source = Game.getObjectById(creep.memory.sourceId);
	} else {
		source = creep.pos.findClosestByPath(FIND_SOURCES);
	}
    if(source != null && creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source);
	}
}
