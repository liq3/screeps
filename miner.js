module.exports = {

    run: function (creep) {
		var mineral = creep.room.find(FIND_MINERALS)[0];
		if (creep.pos.inRangeTo(mineral, 1)) {
			if (Game.time % 6 === 0) {
				if (mineral.container && _.sum(creep.carry) + creep.getActiveBodyparts(WORK) <= creep.carryCapacity) {
					let err = creep.harvest(mineral)
					if (err == ERR_NOT_ENOUGH_RESOURCES) {
						creep.recycle();
					} else if (err != OK) {
						log(`${creep} Error harvesting mineral ${err}`);
					}
				}
			} else if (Game.time % 6 === 1) {
				let container = mineral.container
				if (container && _.sum(container.store) + _.sum(creep.carry) <= container.storeCapacity) {
					let err = creep.transfer(container, mineral.mineralType)
					if (err == ERR_NOT_IN_RANGE) {
                        creep.moveTo(container)
                    } else if (err != OK) {
						log(`${creep} Error transferring minerals to container ${err}`);
					}
				}
			}
		} else {
			creep.moveTo(mineral, {range:1})
		}
	}
};
