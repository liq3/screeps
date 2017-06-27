module.exports = function (creep) {
    var energy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {filter:
        r => r.resourceType == RESOURCE_ENERGY});
    if (energy != null) {
        if (creep.pickup(energy) == ERR_NOT_IN_RANGE) {
            creep.moveTo(energy);
        }
    } else {
        if (creep.memory.role != 'transporter') {
            energy = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter:
                s => s.structureType == STRUCTURE_STORE &&
                    s.store[RESOURCE_ENERGY] > 0});
        }
        if (energy != null) {
            if (creep.withdraw(energy) == ERR_NOT_IN_RANGE) {
                creep.moveTo(energy);
            }
        } else {
            var source;
            if (creep.memory.sourceId != undefined) {
                source = Game.getObjectById(creep.memory.sourceId);
            } else {
                source = creep.pos.findClosestByPath(FIND_SOURCES);
            }
            if (source != null && creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
            }
        }
    }
    if (creep.carry.energy == creep.carryCapacity) {
        creep.memory.gathering = false;
    }
}
