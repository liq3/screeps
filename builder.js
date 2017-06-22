module.exports = function (creep) {
    if(creep.memory.gathering && creep.carry.energy < creep.carryCapacity) {
        var sources = creep.room.find(FIND_SOURCES);
        if(creep.harvest(sources[1]) == ERR_NOT_IN_RANGE) {
            creep.moveTo(sources[1]);
        } else if (creep.carry.energy == creep.carryCapacity) {
            creep.memory.gathering = false;
        }
    } else if (creep.carry.energy == 0) {
        creep.memory.gathering = true;
    } else {
        var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
        if(targets.length) {
            if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0]);
            }
        }
    }
}
