module.exports = {

 	run: function (creep) {
		var mineral = creep.room.find(FIND_MINERALS)[0];
        if (creep.pos.inRangeTo(mineral, 1)) {
            if (Game.time % 5 == 0) {
                let err = creep.harvest(mineral)
                if (err != OK) {
                    console.log(`${creep.name} Error harvesting mineral ${err}`);
                }
            } else if (Game.time % 5 == 1) {
                let container = mineral.pos.findInRange(FIND_STRUCTURES, 1, {filter: {structureType:STRUCTURE_CONTAINER}})[0]
                if (container) {
                    creep.transfer(container, mineral.mineralType)
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
