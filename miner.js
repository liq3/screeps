module.exports = function (creep) {
	var source = creep.pos.findClosestByPath(FIND_SOURCES);
    if(source != null && creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source);
	}
    if (creep.carry.energy > 0) {
        var recievers = creep.pos.findInRange(FIND_MY_CREEPS, 1, {filter: c => c.memory.role != 'miner'});
        for (var c in recievers) {
            creep.transfer(c, RESOURCE_ENERGY);
            if (creep.carry.energy == 0) {
                break;
            }
        }
    }
}
