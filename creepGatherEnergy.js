module.exports = function (creep) {
    var energy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {filter:
        r => r.resourceType == RESOURCE_ENERGY});
    if (energy != null) {
        if (creep.pickup(energy) == ERR_NOT_IN_RANGE) {
            creep.moveTo(energy);
        }
    } else {
        var source = creep.pos.findClosestByPath(FIND_SOURCES);
        if(source != null && creep.harvest(source) == ERR_NOT_IN_RANGE) {
            creep.moveTo(source);
        }
    }
    if (creep.carry.energy == creep.carryCapacity) {
        creep.memory.gathering = false;
    }
}
