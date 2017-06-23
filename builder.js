module.exports = function (creep) {
    if(creep.memory.gathering && creep.carry.energy < creep.carryCapacity) {
        var source = creep.pos.findClosestByPath(FIND_SOURCES);
        if(source != null && creep.harvest(source) == ERR_NOT_IN_RANGE) {
            creep.moveTo(source);
        } 
    } else if (creep.memory.gathering && creep.carry.energy == creep.carryCapacity) {
        creep.memory.gathering = false;
    } else if (creep.carry.energy == 0) {
        creep.memory.gathering = true;
    } else {
        var target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
        if(target != null && creep.build(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
    }
}
