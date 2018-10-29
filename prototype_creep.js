Creep.prototype.gatherEnergy = function () {
    var id = this.memory.energyId;
    if (id) {
        var energy = Game.getObjectById(id);
    }
    function getNewEnergy(room, creep) {
        let energy = undefined;
        if (!energy) {
            if (room.storage && room.storage.store[RESOURCE_ENERGY] > creep.carryCapacity) {
                energy = room.storage;
            }
        }
        if (!energy) {
            if (room.container && room.container.store[RESOURCE_ENERGY] > creep.carryCapacity) {
                energy = room.container;
            }
        }
        if (!energy) {
            energy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {filter:
                r => r.resourceType == RESOURCE_ENERGY && r.amount > 0, range:1});
        }
        if (!energy) {
            energy = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter:
                s => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 50
                    && s.pos.findInRange(FIND_SOURCES, 1).length >= 1})
        }
        if (!energy) {
            if (creep.memory.sourceId != undefined) {
                energy = Game.getObjectById(creep.memory.sourceId);
            } else {
                energy = creep.pos.findClosestByPath(FIND_SOURCES);
            }
        }
        return energy
    }
    if (!energy) {
        energy = getNewEnergy(this.room)
        if (energy instanceof Source && this.memory.bossRoom) {
            var energy2 = getNewEnergy(Game.rooms[this.memory.bossRoom])
            if (energy2 && !(energy2 instanceof Source)) {
                energy = energy2
            }
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
   if (this.memory.bossRoom == undefined) {
       return true
   } else if (this.memory.bossRoom != this.room.name) {
       let err = this.moveTo(new RoomPosition(25,25,this.memory.bossRoom), {range:22});
       return true
   }
   return false
};
