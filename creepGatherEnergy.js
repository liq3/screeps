module.exports = function (creep) {
    var id = creep.memory.energyId;
    if (id) {
        var energy = Game.getObjectById(id);
    }
    if (!energy) {
        energy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {filter:
            r => r.resourceType == RESOURCE_ENERGY && r.amount > 200});
    }
    if (!energy && creep.memory.role != 'transporter') {
        energy = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter:
            s => s.structureType == STRUCTURE_STORAGE &&
                s.store[RESOURCE_ENERGY] > 200});
    }
    if (!energy) {
        if (creep.memory.sourceId != undefined) {
            energy = Game.getObjectById(creep.memory.sourceId);
        } else {
            energy = creep.pos.findClosestByPath(FIND_SOURCES);
        }
    }

    if (energy) {
        if (energy instanceof Resource) {
            if (creep.pickup(energy) == ERR_NOT_IN_RANGE) {
                creep.moveTo(energy);
            }
        } else if (energy instanceof StructureStorage) {
            if (creep.withdraw(energy, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(energy);
            }
        } else if (energy instanceof Source) {
            if (creep.harvest(energy) == ERR_NOT_IN_RANGE) {
                creep.moveTo(energy);
            }
        }
    }

    creep.memory.energyId = energy.id;

    if (creep.carry.energy == creep.carryCapacity) {
        creep.memory.gathering = false;
        delete creep.memory.energyId;
    }
}
