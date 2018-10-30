module.exports = {

 	run: function (creep) {
		var mineral = creep.room.find(FIND_MINERALS)[0];
        if (creep.pos.inRangeTo(mineral, 1)) {
            if (Game.time % 6 === 0) {
                let container = mineral.pos.findInRange(FIND_STRUCTURES, 1, {filter: {structureType:STRUCTURE_CONTAINER}})[0]
                if (container && _.sum(creep.carry) + creep.getActiveBodyparts(WORK) <= creep.carryCapacity) {
                    let err = creep.harvest(mineral)
                    if (err != OK) {
                        console.log(`${creep.name} Error harvesting mineral ${err}`);
                    } else if (err == ERR_NOT_ENOUGH_RESOURCES) {
                        creep.memory.role = 'recycle'
                    }
                }
            } else if (Game.time % 6 === 1) {
                let container = mineral.pos.findInRange(FIND_STRUCTURES, 1, {filter: {structureType:STRUCTURE_CONTAINER}})[0]
                if (container && _.sum(container.store) + _.sum(creep.carry) <= container.storeCapacity) {
                    let err = creep.transfer(container, mineral.mineralType)
                    if (err != OK) {
                        console.log(`${creep.name} Error transferring minerals to container ${err}`);
                    }
                }
            }
        } else {
            creep.moveTo(mineral, {range:1})
        }
	}
};
