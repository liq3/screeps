module.exports = function (creep) {
    var id = creep.memory.energyId;
    if (id) {
        var energy = Game.getObjectById(id);
    }
    if (!energy) {
        if (creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > 0) {
            energy = creep.room.storage;
        }
    }
    if (!energy) {
        energy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {filter:
            r => r.resourceType == RESOURCE_ENERGY && r.amount > 0, range:1});
    }
    if (!energy && creep.memory.role != 'transporter') {
        if (creep.memory.sourceId != undefined) {
            energy = Game.getObjectById(creep.memory.sourceId);
        } else {
            energy = creep.pos.findClosestByPath(FIND_SOURCES);
        }
    }

    if (energy) {
        let error;
        if (energy instanceof Resource) {
            error = creep.pickup(energy);
        } else if (energy instanceof StructureStorage) {
            error = creep.withdraw(energy, RESOURCE_ENERGY);
        } else if (energy instanceof Source) {
            error = creep.harvest(energy)
        }

        if (error == ERR_NOT_IN_RANGE) {
            creep.moveTo(energy);
        } else if (error == ERR_NOT_ENOUGH_RESOURCES) {
            energy = null;
            delete creep.memory.energyId;
        }
    }

    if (energy) {
        creep.memory.energyId = energy.id;
    }

    if (creep.carry.energy == creep.carryCapacity) {
        creep.memory.gathering = false;
        delete creep.memory.energyId;
    }
}
