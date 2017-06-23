module.exports = function (creep) {
	var source = creep.pos.findClosestByPath(FIND_SOURCES);
    if(source != null && creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source);
	}
}
