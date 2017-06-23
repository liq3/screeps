module.exports = function (creep) {

	if(creep.memory.gathering && creep.carry.energy < creep.carryCapacity) {
		var source = creep.pos.findClosestByPath(FIND_MY_CREEPS, (c) => c.memory.role == 'miner');
        if(source != null && creep.harvest(source) == ERR_NOT_IN_RANGE) {
            creep.moveTo(source);
		}
	} else if (creep.memory.gathering && creep.carry.energy == creep.carryCapacity) {
        creep.memory.gathering = false;
    } else if (!creep.memory.gathering && creep.carry.energy == 0) {
        creep.memory.gathering = true;
    } else {
        var target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES,
            s => s.structureType == STRUCTURE_EXTENSION && s.energy < s.energyCapacity)
        if (target == null) {
            target = Game.spawns.Spawn1;
        }
        if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
	}
}
