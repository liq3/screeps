Creep.prototype.gatherEnergy = function () {
    var id = this.memory.energyId;
    if (id) {
        var energy = Game.getObjectById(id);
    }
    if (!energy) {
        if (this.room.storage && this.room.storage.store[RESOURCE_ENERGY] > this.carryCapacity) {
            energy = this.room.storage;
        }
    }
    if (!energy) {
        energy = this.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {filter:
            r => r.resourceType == RESOURCE_ENERGY && r.amount > 0, range:1});
    }
    if (!energy) {
        energy = this.pos.findClosestByPath(FIND_STRUCTURES, {filter:
            s => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 50
                && s.pos.findInRange(FIND_SOURCES, 1).length >= 1})
    }
    if (!energy) {
        if (this.memory.sourceId != undefined) {
            energy = Game.getObjectById(this.memory.sourceId);
        } else {
            energy = this.pos.findClosestByPath(FIND_SOURCES);
        }
    }

    if (energy) {
        let error;
        if (energy instanceof Resource) {
            error = this.pickup(energy);
            if (error == OK) {
                let container = this.pos.findClosestByRange(FIND_STRUCTURES, {filter:
                            s => s.structureType == STRUCTURE_CONTAINER && s.pos.findInRange(FIND_SOURCES, 1).length >= 1})
                this.withdraw(container, RESOURCE_ENERGY);
            }
        } else if (energy instanceof Structure) {
            error = this.withdraw(energy, RESOURCE_ENERGY);
        } else if (energy instanceof Source) {
            error = this.harvest(energy)
        }

        if (error == ERR_NOT_IN_RANGE) {
            this.moveTo(energy);
        } else if (error == ERR_NOT_ENOUGH_RESOURCES) {
            energy = null;
            delete this.memory.energyId;
        }
    }

    if (energy) {
        this.memory.energyId = energy.id;
    }

    if (this.carry.energy == this.carryCapacity) {
        this.memory.gathering = false;
        delete this.memory.energyId;
    }
}


Creep.prototype.makeSureInBossRoom = function () {
   if (this.memory.bossRoom != this.room.name) {
       let err = this.moveTo(new RoomPosition(25,25,this.memory.bossRoom), {range:22});
       return true
   }
   return false
};
