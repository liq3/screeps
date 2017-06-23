module.exports = function (creep) {
	var source = creep.pos.findClosestByPath(FIND_SOURCES);
    if(source != null && creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source);
	}
    if (creep.carry.energy > 0) {
        var recievers = creep.pos.findInRange(Game.creeps, 1, (c) => c.memory.role != miner);
        for (var c in recievers) {
            if (creep.carry.energy == 0) {
                break;
            }
            creep.transfer(c, RESOURCE_ENERGY);
        }
    }
}
